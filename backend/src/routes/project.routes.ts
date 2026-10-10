import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { AuthRequest, authenticateToken } from "../middleware/auth";
import { requireSystemRole, requireProjectAccess, requireProjectManager } from "../middleware/rbac";
import { logActivity } from "../services/activity.service";
import { createNotification } from "../services/notification.service";
import { emitToProject, emitBroadcast } from "../socket";

const router = Router();

const createProjectSchema = z.object({
  name: z.string().min(2),
  key: z.string().min(2).max(10).toUpperCase(),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  managerId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "ARCHIVED"]).optional(),
  managerId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const addMemberSchema = z.object({
  userId: z.string(),
  role: z.enum(["PROJECT_MANAGER", "TEAM_MEMBER", "VIEWER"]).default("TEAM_MEMBER"),
});

const updateMemberRoleSchema = z.object({
  role: z.enum(["PROJECT_MANAGER", "TEAM_MEMBER", "VIEWER"]),
});

// List projects (Admin sees all; others see projects they are members of or manage)
router.get("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  const { status, search } = req.query;

  const whereClause: any = {};

  if (req.user?.role !== "ADMIN") {
    whereClause.OR = [
      { managerId: req.user?.id },
      { members: { some: { userId: req.user?.id } } },
    ];
  }

  if (status && typeof status === "string") {
    whereClause.status = status;
  }

  if (search && typeof search === "string") {
    whereClause.name = { contains: search };
  }

  const projects = await prisma.project.findMany({
    where: whereClause,
    include: {
      manager: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true, role: true },
          },
        },
      },
      _count: {
        select: {
          tasks: true,
          members: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return res.json({ projects });
});

// Create project (Admin, Project Manager, or any registered team member)
router.post("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  if (req.user?.role === "VIEWER") {
    return res.status(403).json({ error: "Forbidden: Viewers cannot create projects" });
  }
  const parse = createProjectSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Validation failed", details: parse.error.issues });
  }

  const existing = await prisma.project.findUnique({
    where: { key: parse.data.key },
  });
  if (existing) {
    return res.status(400).json({ error: "Project key already exists" });
  }

  const managerId = parse.data.managerId || req.user?.id;

  const project = await prisma.project.create({
    data: {
      name: parse.data.name,
      key: parse.data.key,
      description: parse.data.description,
      priority: parse.data.priority,
      status: "ACTIVE",
      managerId,
      startDate: parse.data.startDate ? new Date(parse.data.startDate) : null,
      endDate: parse.data.endDate ? new Date(parse.data.endDate) : null,
      members: {
        create: [
          { userId: req.user!.id, role: "PROJECT_MANAGER" },
          ...(managerId && managerId !== req.user?.id
            ? [{ userId: managerId, role: "PROJECT_MANAGER" }]
            : []),
        ],
      },
    },
    include: {
      manager: { select: { id: true, name: true, email: true, avatarUrl: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
        },
      },
    },
  });

  await logActivity({
    userId: req.user?.id,
    projectId: project.id,
    action: "PROJECT_CREATED",
    entityType: "PROJECT",
    entityId: project.id,
    metadata: { name: project.name, key: project.key },
  });

  if (managerId && managerId !== req.user?.id) {
    await createNotification({
      userId: managerId,
      actorId: req.user?.id,
      type: "PROJECT_INVITE",
      title: "Assigned as Project Manager",
      message: `${req.user?.name} assigned you as Project Manager for ${project.name}`,
      entityType: "PROJECT",
      entityId: project.id,
    });
  }

  emitBroadcast("project:created", project);

  return res.status(201).json({ project });
});

// Get project details
router.get("/:id", authenticateToken, requireProjectAccess(), async (req: AuthRequest, res: Response) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
    include: {
      manager: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true, role: true, isActive: true },
          },
        },
      },
      tasks: {
        include: {
          assignee: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          _count: {
            select: { comments: true },
          },
        },
        orderBy: { taskNumber: "asc" },
      },
    },
  });

  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }

  return res.json({ project, userAccess: (req as any).projectAccess });
});

// Update project (Admin or PM)
router.put("/:id", authenticateToken, requireProjectManager(), async (req: AuthRequest, res: Response) => {
  const parse = updateProjectSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Validation failed", details: parse.error.issues });
  }

  const updated = await prisma.project.update({
    where: { id: req.params.id },
    data: {
      name: parse.data.name,
      description: parse.data.description,
      priority: parse.data.priority,
      status: parse.data.status,
      managerId: parse.data.managerId,
      startDate: parse.data.startDate ? new Date(parse.data.startDate) : undefined,
      endDate: parse.data.endDate ? new Date(parse.data.endDate) : undefined,
    },
    include: {
      manager: { select: { id: true, name: true, email: true, avatarUrl: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
        },
      },
    },
  });

  await logActivity({
    userId: req.user?.id,
    projectId: updated.id,
    action: "PROJECT_UPDATED",
    entityType: "PROJECT",
    entityId: updated.id,
    metadata: { changes: parse.data },
  });

  emitToProject(updated.id, "project:updated", updated);

  return res.json({ project: updated });
});

// Archive / Unarchive project (Admin or PM)
router.patch("/:id/archive", authenticateToken, requireProjectManager(), async (req: AuthRequest, res: Response) => {
  const project = await prisma.project.findUnique({ where: { id: req.params.id } });
  if (!project) return res.status(404).json({ error: "Project not found" });

  const newStatus = project.status === "ARCHIVED" ? "ACTIVE" : "ARCHIVED";

  const updated = await prisma.project.update({
    where: { id: req.params.id },
    data: { status: newStatus },
  });

  await logActivity({
    userId: req.user?.id,
    projectId: updated.id,
    action: newStatus === "ARCHIVED" ? "PROJECT_ARCHIVED" : "PROJECT_RESTORED",
    entityType: "PROJECT",
    entityId: updated.id,
    metadata: { status: newStatus },
  });

  emitToProject(updated.id, "project:updated", updated);

  return res.json({ project: updated, message: `Project ${newStatus.toLowerCase()}` });
});

// Delete project (Admin or Project Manager)
router.delete("/:id", authenticateToken, requireProjectManager(), async (req: AuthRequest, res: Response) => {
  const project = await prisma.project.findUnique({ where: { id: req.params.id } });
  if (!project) return res.status(404).json({ error: "Project not found" });

  await prisma.project.delete({ where: { id: req.params.id } });

  await logActivity({
    userId: req.user?.id,
    action: "PROJECT_DELETED",
    entityType: "PROJECT",
    entityId: req.params.id,
    metadata: { name: project.name, key: project.key },
  });

  emitBroadcast("project:deleted", { projectId: req.params.id });

  return res.json({ message: "Project deleted successfully" });
});

// =================== TEAM MEMBER MANAGEMENT ===================

// Add team member (Admin or PM)
router.post("/:id/members", authenticateToken, requireProjectManager(), async (req: AuthRequest, res: Response) => {
  const parse = addMemberSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Validation failed", details: parse.error.issues });
  }

  const { userId, role } = parse.data;
  const project = await prisma.project.findUnique({ where: { id: req.params.id } });
  if (!project) return res.status(404).json({ error: "Project not found" });

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) return res.status(404).json({ error: "User not found" });

  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: req.params.id, userId } },
  });
  if (existing) {
    return res.status(400).json({ error: "User is already a member of this project" });
  }

  const member = await prisma.projectMember.create({
    data: {
      projectId: req.params.id,
      userId,
      role,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true, role: true },
      },
    },
  });

  await logActivity({
    userId: req.user?.id,
    projectId: project.id,
    action: "MEMBER_ADDED",
    entityType: "MEMBER",
    entityId: userId,
    metadata: { memberName: targetUser.name, role },
  });

  await createNotification({
    userId,
    actorId: req.user?.id,
    type: "PROJECT_INVITE",
    title: "Added to Project",
    message: `${req.user?.name} added you to project '${project.name}' as ${role}`,
    entityType: "PROJECT",
    entityId: project.id,
  });

  emitToProject(project.id, "member:added", member);

  return res.status(201).json({ member });
});

// Update member role (Admin or PM)
router.put("/:id/members/:userId", authenticateToken, requireProjectManager(), async (req: AuthRequest, res: Response) => {
  const parse = updateMemberRoleSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Validation failed", details: parse.error.issues });
  }

  const { role } = parse.data;
  const { id: projectId, userId } = req.params;

  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    include: { user: true },
  });

  if (!existing) {
    return res.status(404).json({ error: "Member not found in project" });
  }

  const updated = await prisma.projectMember.update({
    where: { projectId_userId: { projectId, userId } },
    data: { role },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true, role: true },
      },
    },
  });

  await logActivity({
    userId: req.user?.id,
    projectId,
    action: "MEMBER_ROLE_CHANGED",
    entityType: "MEMBER",
    entityId: userId,
    metadata: { memberName: existing.user.name, oldRole: existing.role, newRole: role },
  });

  await createNotification({
    userId,
    actorId: req.user?.id,
    type: "PROJECT_ROLE_CHANGED",
    title: "Project Role Updated",
    message: `${req.user?.name} updated your role in project to ${role}`,
    entityType: "PROJECT",
    entityId: projectId,
  });

  emitToProject(projectId, "member:updated", updated);

  return res.json({ member: updated });
});

// Remove team member (Admin or PM)
router.delete("/:id/members/:userId", authenticateToken, requireProjectManager(), async (req: AuthRequest, res: Response) => {
  const { id: projectId, userId } = req.params;

  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    include: { user: true },
  });

  if (!existing) {
    return res.status(404).json({ error: "Member not found in project" });
  }

  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId, userId } },
  });

  await logActivity({
    userId: req.user?.id,
    projectId,
    action: "MEMBER_REMOVED",
    entityType: "MEMBER",
    entityId: userId,
    metadata: { memberName: existing.user.name },
  });

  emitToProject(projectId, "member:removed", { projectId, userId });

  return res.json({ message: "Member removed from project successfully" });
});

export default router;
