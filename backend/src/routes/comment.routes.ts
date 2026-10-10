import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { AuthRequest, authenticateToken } from "../middleware/auth";
import { checkProjectMembership } from "../middleware/rbac";
import { logActivity } from "../services/activity.service";
import { createNotification } from "../services/notification.service";
import { emitToProject } from "../socket";

const router = Router();

const createCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
});

// List comments for a task
router.get("/task/:taskId", authenticateToken, async (req: AuthRequest, res: Response) => {
  const { taskId } = req.params;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { projectId: true },
  });
  if (!task) return res.status(404).json({ error: "Task not found" });

  const access = await checkProjectMembership(req.user!.id, req.user!.role, task.projectId);
  if (!access.hasAccess) return res.status(403).json({ error: "Forbidden: Not a member of this project" });

  const comments = await prisma.comment.findMany({
    where: { taskId },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true, role: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return res.json({ comments });
});

// Add comment to task
router.post("/task/:taskId", authenticateToken, async (req: AuthRequest, res: Response) => {
  const { taskId } = req.params;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: {
        include: {
          members: { include: { user: true } },
        },
      },
      assignee: true,
    },
  });
  if (!task) return res.status(404).json({ error: "Task not found" });

  const access = await checkProjectMembership(req.user!.id, req.user!.role, task.projectId);
  if (!access.hasAccess) return res.status(403).json({ error: "Forbidden: Not a member of this project" });


  const parse = createCommentSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Validation failed", details: parse.error.issues });
  }

  const comment = await prisma.comment.create({
    data: {
      taskId,
      userId: req.user!.id,
      content: parse.data.content,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true, role: true },
      },
    },
  });

  // Log activity
  await logActivity({
    userId: req.user!.id,
    projectId: task.projectId,
    action: "COMMENT_ADDED",
    entityType: "COMMENT",
    entityId: comment.id,
    metadata: {
      taskTitle: task.title,
      taskNumber: task.taskNumber,
      snippet: comment.content.slice(0, 100),
    },
  });

  // Notify assignee if not the author
  if (task.assigneeId && task.assigneeId !== req.user!.id) {
    await createNotification({
      userId: task.assigneeId,
      actorId: req.user!.id,
      type: "COMMENT_ADDED",
      title: "New Comment on Your Task",
      message: `${req.user!.name} commented on '${task.title}': "${comment.content.slice(0, 80)}"`,
      entityType: "TASK",
      entityId: task.id,
    });
  }

  // Detect @mentions in content and notify mentioned users
  for (const member of task.project.members) {
    if (member.userId !== req.user!.id) {
      const mentionPattern = new RegExp(`@${member.user.name}|@${member.user.email.split("@")[0]}`, "i");
      if (mentionPattern.test(comment.content)) {
        await createNotification({
          userId: member.userId,
          actorId: req.user!.id,
          type: "MENTION",
          title: "Mentioned in Comment",
          message: `${req.user!.name} mentioned you on '${task.title}': "${comment.content.slice(0, 80)}"`,
          entityType: "TASK",
          entityId: task.id,
        });
      }
    }
  }

  emitToProject(task.projectId, "comment:created", { comment, taskId, projectId: task.projectId });

  return res.status(201).json({ comment });
});

// Delete comment (Author, PM, or Admin)
router.delete("/:id", authenticateToken, async (req: AuthRequest, res: Response) => {
  const comment = await prisma.comment.findUnique({
    where: { id: req.params.id },
    include: {
      task: { select: { projectId: true, title: true } },
    },
  });

  if (!comment) return res.status(404).json({ error: "Comment not found" });

  const access = await checkProjectMembership(req.user!.id, req.user!.role, comment.task.projectId);
  if (!access.hasAccess) return res.status(403).json({ error: "Forbidden: Not a member of this project" });

  const isAuthor = comment.userId === req.user!.id;
  const isManagerOrAdmin = access.isManager || req.user!.role === "ADMIN";

  if (!isAuthor && !isManagerOrAdmin) {
    return res.status(403).json({ error: "Forbidden: You cannot delete another user's comment" });
  }

  await prisma.comment.delete({ where: { id: req.params.id } });

  await logActivity({
    userId: req.user!.id,
    projectId: comment.task.projectId,
    action: "COMMENT_DELETED",
    entityType: "COMMENT",
    entityId: req.params.id,
    metadata: { taskTitle: comment.task.title },
  });

  emitToProject(comment.task.projectId, "comment:deleted", {
    commentId: req.params.id,
    taskId: comment.taskId,
    projectId: comment.task.projectId,
  });

  return res.json({ message: "Comment deleted successfully" });
});

export default router;
