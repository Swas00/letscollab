import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../prisma";
import { AuthRequest, authenticateToken } from "../middleware/auth";
import { requireSystemRole } from "../middleware/rbac";
import { logActivity } from "../services/activity.service";

const router = Router();

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "VIEWER"]),
  avatarUrl: z.string().optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "VIEWER"]).optional(),
  avatarUrl: z.string().optional(),
});

// List users
router.get("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  const { search, role, includeInactive } = req.query;

  const whereClause: any = {};
  if (req.user?.role !== "ADMIN" || includeInactive !== "true") {
    whereClause.isActive = true;
  }

  if (role && typeof role === "string") {
    whereClause.role = role;
  }

  if (search && typeof search === "string") {
    whereClause.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
    ];
  }

  const users = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatarUrl: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          assignedTasks: true,
          memberships: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return res.json({ users });
});

// Get user by ID
router.get("/:id", authenticateToken, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatarUrl: true,
      isActive: true,
      createdAt: true,
      memberships: {
        include: {
          project: {
            select: { id: true, name: true, key: true, status: true },
          },
        },
      },
      assignedTasks: {
        where: { status: { not: "DONE" } },
        select: { id: true, title: true, priority: true, status: true, dueDate: true, projectId: true },
      },
    },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.json({ user });
});

// Create user (Admin only)
router.post("/", authenticateToken, requireSystemRole("ADMIN"), async (req: AuthRequest, res: Response) => {
  const parse = createUserSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Validation failed", details: parse.error.issues });
  }

  const existing = await prisma.user.findUnique({
    where: { email: parse.data.email.toLowerCase() },
  });
  if (existing) {
    return res.status(400).json({ error: "Email already registered" });
  }

  const hashedPassword = await bcrypt.hash(parse.data.password, 10);
  const newUser = await prisma.user.create({
    data: {
      name: parse.data.name,
      email: parse.data.email.toLowerCase(),
      password: hashedPassword,
      role: parse.data.role,
      avatarUrl: parse.data.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(parse.data.name)}`,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      isActive: true,
      createdAt: true,
    },
  });

  await logActivity({
    userId: req.user?.id,
    action: "USER_CREATED",
    entityType: "USER",
    entityId: newUser.id,
    metadata: { name: newUser.name, email: newUser.email, role: newUser.role },
  });

  return res.status(201).json({ user: newUser });
});

// Update user (Admin only)
router.put("/:id", authenticateToken, requireSystemRole("ADMIN"), async (req: AuthRequest, res: Response) => {
  const parse = updateUserSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Validation failed", details: parse.error.issues });
  }

  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const updatedUser = await prisma.user.update({
    where: { id: req.params.id },
    data: {
      name: parse.data.name,
      email: parse.data.email ? parse.data.email.toLowerCase() : undefined,
      role: parse.data.role,
      avatarUrl: parse.data.avatarUrl,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      isActive: true,
    },
  });

  await logActivity({
    userId: req.user?.id,
    action: "USER_UPDATED",
    entityType: "USER",
    entityId: updatedUser.id,
    metadata: { changes: parse.data },
  });

  return res.json({ user: updatedUser });
});

// Deactivate / Activate user (Admin only)
router.patch("/:id/status", authenticateToken, requireSystemRole("ADMIN"), async (req: AuthRequest, res: Response) => {
  const { isActive } = req.body;
  if (typeof isActive !== "boolean") {
    return res.status(400).json({ error: "isActive boolean must be provided" });
  }

  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Prevent admin deactivating self
  if (user.id === req.user?.id && !isActive) {
    return res.status(400).json({ error: "Cannot deactivate your own account" });
  }

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: { isActive },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  await logActivity({
    userId: req.user?.id,
    action: isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
    entityType: "USER",
    entityId: updated.id,
    metadata: { name: updated.name, isActive },
  });

  return res.json({ user: updated, message: `User successfully ${isActive ? "activated" : "deactivated"}` });
});

// Delete user permanently (Admin only)
router.delete("/:id", authenticateToken, requireSystemRole("ADMIN"), async (req: AuthRequest, res: Response) => {
  const targetId = req.params.id;
  const user = await prisma.user.findUnique({ where: { id: targetId } });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (targetId === req.user?.id) {
    return res.status(400).json({ error: "Admins cannot delete their own account from the user directory. Use the profile account deletion flow instead." });
  }

  await prisma.passwordResetOtp.deleteMany({ where: { email: user.email } }).catch(() => {});
  await prisma.project.updateMany({ where: { managerId: targetId }, data: { managerId: null } }).catch(() => {});
  await prisma.project.updateMany({ where: { creatorId: targetId }, data: { creatorId: null } }).catch(() => {});
  await prisma.task.updateMany({ where: { assigneeId: targetId }, data: { assigneeId: null } }).catch(() => {});
  await prisma.task.updateMany({ where: { creatorId: targetId }, data: { creatorId: null } }).catch(() => {});

  await prisma.user.delete({ where: { id: targetId } });

  await logActivity({
    userId: req.user?.id,
    action: "USER_DELETED_PERMANENTLY",
    entityType: "USER",
    entityId: targetId,
    metadata: { email: user.email, name: user.name },
  });

  return res.json({ message: `User ${user.name} permanently deleted.` });
});

export default router;
