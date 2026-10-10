import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { AuthRequest, authenticateToken } from "../middleware/auth";
import { checkProjectMembership } from "../middleware/rbac";
import { logActivity } from "../services/activity.service";
import { createNotification } from "../services/notification.service";
import { emitToProject } from "../socket";

const router = Router();

const createTaskSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).default("TODO"),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  tags: z.string().optional().nullable(),
  estimatedHours: z.number().optional().nullable(),
});

const updateTaskSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).optional(),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  tags: z.string().optional().nullable(),
  estimatedHours: z.number().optional().nullable(),
  version: z.number().int().optional(), // Optimistic Concurrency Control
  forceOverwrite: z.boolean().optional(), // When resolving 409 conflict
});

const updateStatusSchema = z.object({
  status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]),
  version: z.number().int().optional(),
});

// List tasks for a project
router.get("/project/:projectId", authenticateToken, async (req: AuthRequest, res: Response) => {
  const { projectId } = req.params;
  const { search, status, priority, assigneeId } = req.query;

  const access = await checkProjectMembership(req.user!.id, req.user!.role, projectId);
  if (access.notFound) return res.status(404).json({ error: "Project not found" });
  if (!access.hasAccess) return res.status(403).json({ error: "Forbidden: Not a member of this project" });

  const whereClause: any = { projectId };

  if (status && typeof status === "string") {
    whereClause.status = status;
  }

  if (priority && typeof priority === "string") {
    whereClause.priority = priority;
  }

  if (assigneeId && typeof assigneeId === "string") {
    whereClause.assigneeId = assigneeId;
  }

  if (search && typeof search === "string") {
    whereClause.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
      { tags: { contains: search } },
    ];
  }

  const tasks = await prisma.task.findMany({
    where: whereClause,
    include: {
      assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
      creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
      _count: { select: { comments: true } },
    },
    orderBy: [{ status: "asc" }, { taskNumber: "asc" }],
  });

  return res.json({ tasks });
});

// Get single task details
router.get("/:id", authenticateToken, async (req: AuthRequest, res: Response) => {
  const task = await prisma.task.findUnique({
    where: { id: req.params.id },
    include: {
      project: { select: { id: true, name: true, key: true, status: true, managerId: true } },
      assignee: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
      creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
      comments: {
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!task) return res.status(404).json({ error: "Task not found" });

  const access = await checkProjectMembership(req.user!.id, req.user!.role, task.projectId);
  if (!access.hasAccess) return res.status(403).json({ error: "Forbidden: Not a member of this project" });

  return res.json({ task, userAccess: access });
});

// Create task in a project (Admin or Project Manager)
router.post("/project/:projectId", authenticateToken, async (req: AuthRequest, res: Response) => {
  const { projectId } = req.params;
  const access = await checkProjectMembership(req.user!.id, req.user!.role, projectId);

  if (access.notFound) return res.status(404).json({ error: "Project not found" });
  if (!access.hasAccess) return res.status(403).json({ error: "Forbidden: Not a member of this project" });

  // Viewers cannot create tasks
  if (access.projectRole === "VIEWER" && req.user!.role !== "ADMIN") {
    return res.status(403).json({ error: "Forbidden: Viewers have read-only access" });
  }

  const parse = createTaskSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Validation failed", details: parse.error.issues });
  }

  // Determine next task number for the project
  const highestTask = await prisma.task.findFirst({
    where: { projectId },
    orderBy: { taskNumber: "desc" },
    select: { taskNumber: true },
  });
  const taskNumber = (highestTask?.taskNumber || 0) + 1;

  const task = await prisma.task.create({
    data: {
      projectId,
      taskNumber,
      title: parse.data.title,
      description: parse.data.description,
      priority: parse.data.priority,
      status: parse.data.status,
      version: 1,
      dueDate: parse.data.dueDate ? new Date(parse.data.dueDate) : null,
      tags: parse.data.tags,
      estimatedHours: parse.data.estimatedHours,
      assigneeId: parse.data.assigneeId || null,
      creatorId: req.user!.id,
    },
    include: {
      project: { select: { id: true, name: true, key: true } },
      assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
      creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
      _count: { select: { comments: true } },
    },
  });

  await logActivity({
    userId: req.user!.id,
    projectId,
    action: "TASK_CREATED",
    entityType: "TASK",
    entityId: task.id,
    metadata: {
      taskNumber: task.taskNumber,
      title: task.title,
      priority: task.priority,
      status: task.status,
    },
  });

  if (task.assigneeId && task.assigneeId !== req.user!.id) {
    await createNotification({
      userId: task.assigneeId,
      actorId: req.user!.id,
      type: "TASK_ASSIGNED",
      title: "Task Assigned to You",
      message: `${req.user!.name} assigned you to '${task.project.key}-${task.taskNumber}: ${task.title}'`,
      entityType: "TASK",
      entityId: task.id,
    });
  }

  emitToProject(projectId, "task:created", task);

  return res.status(201).json({ task });
});

// Update task with OPTIMISTIC CONCURRENCY CONTROL (OCC)
router.put("/:id", authenticateToken, async (req: AuthRequest, res: Response) => {
  const currentTask = await prisma.task.findUnique({
    where: { id: req.params.id },
    include: {
      project: { select: { id: true, name: true, key: true, managerId: true } },
      assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
      creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
  });

  if (!currentTask) return res.status(404).json({ error: "Task not found" });

  const access = await checkProjectMembership(req.user!.id, req.user!.role, currentTask.projectId);
  if (!access.hasAccess) return res.status(403).json({ error: "Forbidden: Not a member of this project" });

  // Viewers cannot edit tasks
  if (access.projectRole === "VIEWER" && req.user!.role !== "ADMIN") {
    return res.status(403).json({ error: "Forbidden: Viewers have read-only access" });
  }

  // All team members, assignees, project managers, and admins have full edit access to tasks

  const parse = updateTaskSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Validation failed", details: parse.error.issues });
  }

  const { version: clientVersion, forceOverwrite, ...updateData } = parse.data;

  // ================= CONCURRENT UPDATE CONFLICT DETECTION =================
  // If client provided a version and did not explicitly force overwrite, check OCC!
  if (clientVersion !== undefined && !forceOverwrite) {
    if (clientVersion !== currentTask.version) {
      return res.status(409).json({
        conflict: true,
        error: "Conflict: Task has been modified by another user",
        serverVersion: currentTask.version,
        clientVersion: clientVersion,
        currentTask: currentTask,
        message: `Task version conflict detected (server is at version ${currentTask.version}, your update was based on version ${clientVersion}). Please review recent changes before overwriting.`,
      });
    }
  }

  const oldAssigneeId = currentTask.assigneeId;
  const oldStatus = currentTask.status;

  const nextVersion = currentTask.version + 1;

  const updatedTask = await prisma.task.update({
    where: { id: req.params.id },
    data: {
      title: updateData.title,
      description: updateData.description !== undefined ? updateData.description : undefined,
      priority: updateData.priority,
      status: updateData.status,
      assigneeId: updateData.assigneeId !== undefined ? updateData.assigneeId : undefined,
      dueDate: updateData.dueDate !== undefined ? (updateData.dueDate ? new Date(updateData.dueDate) : null) : undefined,
      tags: updateData.tags !== undefined ? updateData.tags : undefined,
      estimatedHours: updateData.estimatedHours !== undefined ? updateData.estimatedHours : undefined,
      version: nextVersion,
    },
    include: {
      project: { select: { id: true, name: true, key: true } },
      assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
      creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
      _count: { select: { comments: true } },
    },
  });

  // Log activity
  await logActivity({
    userId: req.user!.id,
    projectId: updatedTask.projectId,
    action: "TASK_UPDATED",
    entityType: "TASK",
    entityId: updatedTask.id,
    metadata: {
      title: updatedTask.title,
      version: nextVersion,
      changes: updateData,
    },
  });

  // Assignee changed notification
  if (updateData.assigneeId && updateData.assigneeId !== oldAssigneeId && updateData.assigneeId !== req.user!.id) {
    await createNotification({
      userId: updateData.assigneeId,
      actorId: req.user!.id,
      type: "TASK_ASSIGNED",
      title: "Task Assigned to You",
      message: `${req.user!.name} assigned you to '${updatedTask.project.key}-${updatedTask.taskNumber}: ${updatedTask.title}'`,
      entityType: "TASK",
      entityId: updatedTask.id,
    });
  }

  // Status changed notification
  if (updateData.status && updateData.status !== oldStatus) {
    await logActivity({
      userId: req.user!.id,
      projectId: updatedTask.projectId,
      action: "TASK_STATUS_CHANGED",
      entityType: "TASK",
      entityId: updatedTask.id,
      metadata: { from: oldStatus, to: updateData.status, title: updatedTask.title },
    });

    if (updatedTask.assigneeId && updatedTask.assigneeId !== req.user!.id) {
      await createNotification({
        userId: updatedTask.assigneeId,
        actorId: req.user!.id,
        type: "TASK_STATUS_CHANGED",
        title: "Task Status Updated",
        message: `${req.user!.name} changed status of '${updatedTask.title}' to ${updateData.status}`,
        entityType: "TASK",
        entityId: updatedTask.id,
      });
    }
  }

  emitToProject(updatedTask.projectId, "task:updated", updatedTask);

  return res.json({ task: updatedTask });
});

// Quick status change (e.g. Kanban Drag & Drop)
router.patch("/:id/status", authenticateToken, async (req: AuthRequest, res: Response) => {
  const currentTask = await prisma.task.findUnique({
    where: { id: req.params.id },
    include: {
      project: { select: { id: true, name: true, key: true } },
    },
  });

  if (!currentTask) return res.status(404).json({ error: "Task not found" });

  const access = await checkProjectMembership(req.user!.id, req.user!.role, currentTask.projectId);
  if (!access.hasAccess) return res.status(403).json({ error: "Forbidden: Not a member of this project" });
  if (access.projectRole === "VIEWER" && req.user!.role !== "ADMIN") {
    return res.status(403).json({ error: "Forbidden: Viewers cannot change task status" });
  }

  const parse = updateStatusSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Validation failed", details: parse.error.issues });
  }

  const { status, version: clientVersion } = parse.data;

  // Concurrency check if version provided
  if (clientVersion !== undefined && clientVersion !== currentTask.version) {
    return res.status(409).json({
      conflict: true,
      error: "Conflict: Task has been modified by another user",
      serverVersion: currentTask.version,
      clientVersion,
      currentTask,
    });
  }

  const oldStatus = currentTask.status;
  const updatedTask = await prisma.task.update({
    where: { id: req.params.id },
    data: {
      status,
      version: currentTask.version + 1,
    },
    include: {
      project: { select: { id: true, name: true, key: true } },
      assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
      creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
      _count: { select: { comments: true } },
    },
  });

  await logActivity({
    userId: req.user!.id,
    projectId: updatedTask.projectId,
    action: "TASK_STATUS_CHANGED",
    entityType: "TASK",
    entityId: updatedTask.id,
    metadata: { from: oldStatus, to: status, title: updatedTask.title },
  });

  emitToProject(updatedTask.projectId, "task:updated", updatedTask);

  return res.json({ task: updatedTask });
});

// Delete task (Admin or Project Manager only)
router.delete("/:id", authenticateToken, async (req: AuthRequest, res: Response) => {
  const task = await prisma.task.findUnique({
    where: { id: req.params.id },
    include: { project: true },
  });

  if (!task) return res.status(404).json({ error: "Task not found" });

  const access = await checkProjectMembership(req.user!.id, req.user!.role, task.projectId);
  if (!access.hasAccess) return res.status(403).json({ error: "Forbidden: Not a member of this project" });

  // STRICT RBAC: Team Members and Viewers CANNOT delete tasks!
  if (!access.isManager && req.user!.role !== "ADMIN") {
    return res.status(403).json({
      error: "Forbidden: Only Project Managers or Admins have permission to delete tasks",
    });
  }

  await prisma.task.delete({ where: { id: req.params.id } });

  await logActivity({
    userId: req.user!.id,
    projectId: task.projectId,
    action: "TASK_DELETED",
    entityType: "TASK",
    entityId: req.params.id,
    metadata: { title: task.title, taskNumber: task.taskNumber },
  });

  emitToProject(task.projectId, "task:deleted", { taskId: req.params.id, projectId: task.projectId });

  return res.json({ message: "Task deleted successfully" });
});

export default router;
