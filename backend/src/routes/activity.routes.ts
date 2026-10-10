import { Router, Response } from "express";
import { prisma } from "../prisma";
import { AuthRequest, authenticateToken } from "../middleware/auth";
import { checkProjectMembership } from "../middleware/rbac";

const router = Router();

// Get system / user-visible activity logs
router.get("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  const { limit = "30", entityType, action } = req.query;
  const take = Math.min(parseInt(limit as string, 10) || 30, 100);

  const whereClause: any = {};

  if (req.user?.role !== "ADMIN") {
    // Non-admins see activities for projects they are members of
    const userMemberships = await prisma.projectMember.findMany({
      where: { userId: req.user!.id },
      select: { projectId: true },
    });
    const projectIds = userMemberships.map((m) => m.projectId);

    whereClause.OR = [
      { projectId: { in: projectIds } },
      { userId: req.user!.id },
    ];
  }

  if (entityType && typeof entityType === "string") {
    whereClause.entityType = entityType;
  }

  if (action && typeof action === "string") {
    whereClause.action = action;
  }

  const activities = await prisma.activityLog.findMany({
    where: whereClause,
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true, role: true },
      },
      project: {
        select: { id: true, name: true, key: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take,
  });

  return res.json({ activities });
});

// Get project-specific activity logs
router.get("/project/:projectId", authenticateToken, async (req: AuthRequest, res: Response) => {
  const { projectId } = req.params;
  const { limit = "50" } = req.query;
  const take = Math.min(parseInt(limit as string, 10) || 50, 100);

  const access = await checkProjectMembership(req.user!.id, req.user!.role, projectId);
  if (!access.hasAccess) return res.status(403).json({ error: "Forbidden: Not a member of this project" });

  const activities = await prisma.activityLog.findMany({
    where: { projectId },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true, role: true },
      },
      project: {
        select: { id: true, name: true, key: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take,
  });

  return res.json({ activities });
});

export default router;
