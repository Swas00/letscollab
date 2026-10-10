import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
import { prisma } from "../prisma";

/**
 * Enforce system-level roles (e.g. only ADMIN can manage users)
 */
export function requireSystemRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized: not authenticated" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: requires system role '${allowedRoles.join(" or ")}', your role is '${req.user.role}'`,
      });
    }

    next();
  };
}

/**
 * Check if the user is a member of the project or an Admin
 */
export async function checkProjectMembership(userId: string, userRole: string, projectId: string) {
  if (userRole === "ADMIN") {
    return { hasAccess: true, projectRole: "ADMIN", isManager: true };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        where: { userId },
      },
    },
  });

  if (!project) {
    return { hasAccess: false, notFound: true };
  }

  const member = project.members[0];
  const isManager = project.managerId === userId || userRole === "PROJECT_MANAGER" || member?.role === "PROJECT_MANAGER";

  if (!isManager && !member) {
    return { hasAccess: false, notFound: false };
  }

  const effectiveRole = isManager ? "PROJECT_MANAGER" : member ? member.role : "VIEWER";
  return {
    hasAccess: true,
    projectRole: effectiveRole,
    isManager: isManager || effectiveRole === "PROJECT_MANAGER",
  };
}

/**
 * Require at least read-access to a project
 */
export function requireProjectAccess() {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const projectId = req.params.projectId || req.params.id || req.body.projectId;
    if (!projectId) return res.status(400).json({ error: "Project ID missing" });

    const access = await checkProjectMembership(req.user.id, req.user.role, projectId);

    if (access.notFound) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (!access.hasAccess) {
      return res.status(403).json({ error: "Forbidden: You are not a member of this project" });
    }

    (req as any).projectAccess = access;
    next();
  };
}

/**
 * Require Project Manager or Admin permissions for project-level modifications
 */
export function requireProjectManager() {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const projectId = req.params.projectId || req.params.id || req.body.projectId;
    if (!projectId) return res.status(400).json({ error: "Project ID missing" });

    const access = await checkProjectMembership(req.user.id, req.user.role, projectId);

    if (access.notFound) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (!access.hasAccess || !access.isManager) {
      return res.status(403).json({
        error: "Forbidden: Only Project Managers or Admins can perform this action",
      });
    }

    (req as any).projectAccess = access;
    next();
  };
}
