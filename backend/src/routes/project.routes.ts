import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { AuthRequest, authenticateToken } from "../middleware/auth";
import { requireSystemRole, requireProjectAccess, requireProjectManager } from "../middleware/rbac";
import { logActivity } from "../services/activity.service";
import { createNotification } from "../services/notification.service";
import { emitToProject, emitToUser, emitBroadcast } from "../socket";
import { sendProjectInviteEmail } from "../services/mail.service";

const router = Router();

const createProjectSchema = z.object({
  name: z.string().min(2),
  key: z.string().min(2).max(10).toUpperCase(),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  managerId: z.string().optional(),
  organizationId: z.string().optional(),
  memberIds: z.array(z.string()).optional(),
  inviteEmails: z.array(z.string()).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const inviteMemberSchema = z.object({
  email: z.string().optional(),
  emails: z.array(z.string()).optional(),
  role: z.enum(["PROJECT_MANAGER", "TEAM_MEMBER", "VIEWER"]).default("TEAM_MEMBER"),
});

const updateProjectSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "ARCHIVED"]).optional(),
  managerId: z.string().optional(),
  organizationId: z.string().optional(),
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

// List projects (Admin sees all; others see only projects they created or are assigned to)
router.get("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  const { status, search, organizationId } = req.query;

  const whereClause: any = {};

  if (req.user?.role !== "ADMIN") {
    whereClause.OR = [
      { creatorId: req.user?.id },
      { managerId: req.user?.id },
      { members: { some: { userId: req.user?.id } } },
      { tasks: { some: { assigneeId: req.user?.id } } },
    ];
  }

  if (organizationId === "personal") {
    whereClause.organizationId = null;
  } else if (organizationId && typeof organizationId === "string") {
    whereClause.organizationId = organizationId;
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
      creator: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      manager: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      organization: {
        select: { id: true, name: true, slug: true },
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

// Create project (Any authenticated user can create a project and becomes its Project Owner)
router.post("/", authenticateToken, async (req: AuthRequest, res: Response) => {
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
  const memberIds = parse.data.memberIds || [];

  const initialMembers: { userId: string; role: string }[] = [
    { userId: req.user!.id, role: "PROJECT_MANAGER" },
  ];
  if (managerId && managerId !== req.user?.id) {
    initialMembers.push({ userId: managerId, role: "PROJECT_MANAGER" });
  }
  for (const mId of memberIds) {
    if (mId !== req.user?.id && mId !== managerId) {
      initialMembers.push({ userId: mId, role: "TEAM_MEMBER" });
    }
  }

  const project = await prisma.project.create({
    data: {
      name: parse.data.name,
      key: parse.data.key,
      description: parse.data.description,
      priority: parse.data.priority,
      status: "ACTIVE",
      creatorId: req.user!.id,
      managerId,
      organizationId: parse.data.organizationId || null,
      startDate: parse.data.startDate ? new Date(parse.data.startDate) : null,
      endDate: parse.data.endDate ? new Date(parse.data.endDate) : null,
      members: {
        create: initialMembers,
      },
    },
    include: {
      creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
      manager: { select: { id: true, name: true, email: true, avatarUrl: true } },
      organization: { select: { id: true, name: true, slug: true } },
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

  // Handle optional initial email invitations
  if (parse.data.inviteEmails && parse.data.inviteEmails.length > 0) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    for (const email of parse.data.inviteEmails) {
      const normalizedEmail = email.toLowerCase().trim();
      if (!normalizedEmail || normalizedEmail === req.user?.email.toLowerCase()) continue;

      const invitation = await prisma.projectInvitation.upsert({
        where: { projectId_email: { projectId: project.id, email: normalizedEmail } },
        update: { status: "PENDING", role: "TEAM_MEMBER", inviterId: req.user!.id, expiresAt },
        create: {
          projectId: project.id,
          email: normalizedEmail,
          role: "TEAM_MEMBER",
          inviterId: req.user!.id,
          expiresAt,
        },
      });

      const targetUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (targetUser) {
        const notif = await createNotification({
          userId: targetUser.id,
          actorId: req.user!.id,
          type: "PROJECT_INVITE",
          title: "Project Collaboration Invitation",
          message: `${req.user!.name} invited you to collaborate on project "${project.name}" as Team Member`,
          entityType: "PROJECT",
          entityId: project.id,
        });
        emitToUser(targetUser.id, "notification:new", notif);
        emitToUser(targetUser.id, "project:invitation_received", {
          invitation,
          project: { id: project.id, name: project.name, key: project.key },
        });
      }

      // Send project invitation email asynchronously
      sendProjectInviteEmail({
        to: normalizedEmail,
        inviterName: req.user!.name,
        projectName: project.name,
        projectKey: project.key,
        role: "TEAM_MEMBER",
        token: invitation.token,
        expiresAt: invitation.expiresAt,
      }).catch((err) => console.error("[Projects] Initial invite email error:", err));
    }
  }

  emitBroadcast("project:created", project);

  return res.status(201).json({ project });
});

// =================== INVITATION MANAGEMENT ===================

// Get pending invitations for logged-in user
router.get("/my-invitations", authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user?.email) return res.status(401).json({ error: "Unauthorized" });

  const invitations = await prisma.projectInvitation.findMany({
    where: {
      email: req.user.email.toLowerCase(),
      status: "PENDING",
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          key: true,
          description: true,
          priority: true,
          organization: { select: { name: true } },
        },
      },
      inviter: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return res.json({ invitations });
});

// Accept project invitation
router.post("/invitations/:invitationId/accept", authenticateToken, async (req: AuthRequest, res: Response) => {
  const { invitationId } = req.params;
  const invitation = await prisma.projectInvitation.findUnique({
    where: { id: invitationId },
    include: { project: true },
  });

  if (!invitation || invitation.status !== "PENDING") {
    return res.status(404).json({ error: "Pending invitation not found" });
  }

  if (invitation.email.toLowerCase() !== req.user?.email.toLowerCase()) {
    return res.status(403).json({ error: "This invitation was sent to a different email address" });
  }

  // Check if user is already a member
  const existingMember = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: invitation.projectId, userId: req.user.id } },
  });

  let member = existingMember;
  if (!existingMember) {
    member = await prisma.projectMember.create({
      data: {
        projectId: invitation.projectId,
        userId: req.user.id,
        role: invitation.role,
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
      },
    });
  }

  await prisma.projectInvitation.update({
    where: { id: invitationId },
    data: { status: "ACCEPTED" },
  });

  // Notify inviter that invitation was accepted
  await createNotification({
    userId: invitation.inviterId,
    actorId: req.user.id,
    type: "PROJECT_INVITE",
    title: "Invitation Accepted",
    message: `${req.user.name} accepted your invitation to collaborate on "${invitation.project.name}"`,
    entityType: "PROJECT",
    entityId: invitation.projectId,
  });

  await logActivity({
    userId: req.user.id,
    projectId: invitation.projectId,
    action: "MEMBER_JOINED",
    entityType: "PROJECT",
    entityId: invitation.projectId,
    metadata: { email: req.user.email, role: invitation.role },
  });

  emitToProject(invitation.projectId, "member:added", member);
  emitToProject(invitation.projectId, "project:updated", invitation.project);

  return res.json({
    success: true,
    message: `Invitation accepted! Welcome to ${invitation.project.name}.`,
    project: invitation.project,
    member,
  });
});

// Decline project invitation
router.post("/invitations/:invitationId/decline", authenticateToken, async (req: AuthRequest, res: Response) => {
  const { invitationId } = req.params;
  const invitation = await prisma.projectInvitation.findUnique({ where: { id: invitationId } });
  if (!invitation || invitation.status !== "PENDING") {
    return res.status(404).json({ error: "Pending invitation not found" });
  }

  if (invitation.email.toLowerCase() !== req.user?.email.toLowerCase()) {
    return res.status(403).json({ error: "Forbidden" });
  }

  await prisma.projectInvitation.update({
    where: { id: invitationId },
    data: { status: "DECLINED" },
  });

  return res.json({ success: true, message: "Invitation declined" });
});

// =================== TOKEN-BASED INVITATION ACCEPTANCE ===================

// Get invitation details by secure token (publicly viewable by invitee)
router.get("/invitations/token/:token", async (req, res: Response) => {
  const { token } = req.params;
  const invitation = await prisma.projectInvitation.findUnique({
    where: { token },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          key: true,
          description: true,
          priority: true,
          organization: { select: { name: true, slug: true } },
        },
      },
      inviter: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

  if (!invitation) {
    return res.status(404).json({ error: "Invitation not found or link is invalid" });
  }

  const isExpired = invitation.expiresAt ? invitation.expiresAt < new Date() : false;
  if (isExpired && invitation.status === "PENDING") {
    await prisma.projectInvitation.update({
      where: { id: invitation.id },
      data: { status: "EXPIRED" },
    });
  }

  return res.json({
    invitation: {
      id: invitation.id,
      token: invitation.token,
      email: invitation.email,
      role: invitation.role,
      status: isExpired && invitation.status === "PENDING" ? "EXPIRED" : invitation.status,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
      isExpired,
      project: invitation.project,
      inviter: invitation.inviter,
    },
  });
});

// Accept project invitation using secure token
router.post("/invitations/token/:token/accept", authenticateToken, async (req: AuthRequest, res: Response) => {
  const { token } = req.params;
  const invitation = await prisma.projectInvitation.findUnique({
    where: { token },
    include: {
      project: {
        select: { id: true, name: true, key: true },
      },
    },
  });

  if (!invitation) {
    return res.status(404).json({ error: "Invitation not found or link is invalid" });
  }

  if (invitation.status === "REVOKED") {
    return res.status(400).json({ error: "This invitation has been revoked by the project owner" });
  }

  if (invitation.status === "DECLINED") {
    return res.status(400).json({ error: "This invitation was previously declined" });
  }

  const isExpired = invitation.expiresAt ? invitation.expiresAt < new Date() : false;
  if (isExpired || invitation.status === "EXPIRED") {
    if (invitation.status !== "EXPIRED") {
      await prisma.projectInvitation.update({ where: { id: invitation.id }, data: { status: "EXPIRED" } });
    }
    return res.status(400).json({ error: "This invitation has expired. Please ask the project owner to resend it." });
  }

  if (invitation.email.toLowerCase() !== req.user?.email.toLowerCase()) {
    return res.status(403).json({
      error: `This invitation was issued to ${invitation.email}, but you are signed in as ${req.user?.email}. Please sign in with the invited email address.`,
    });
  }

  if (invitation.status === "ACCEPTED") {
    return res.json({
      success: true,
      message: "You have already accepted this invitation and are a member of the project.",
      project: invitation.project,
    });
  }

  // Atomically add member to project
  const member = await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: invitation.projectId, userId: req.user.id } },
    update: { role: invitation.role },
    create: {
      projectId: invitation.projectId,
      userId: req.user.id,
      role: invitation.role,
    },
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
    },
  });

  await prisma.projectInvitation.update({
    where: { id: invitation.id },
    data: { status: "ACCEPTED", acceptedAt: new Date() },
  });

  // Notify inviter that invitation was accepted
  await createNotification({
    userId: invitation.inviterId,
    actorId: req.user.id,
    type: "PROJECT_INVITE",
    title: "Invitation Accepted",
    message: `${req.user.name} accepted your invitation to collaborate on "${invitation.project.name}"`,
    entityType: "PROJECT",
    entityId: invitation.projectId,
  });

  await logActivity({
    userId: req.user.id,
    projectId: invitation.projectId,
    action: "MEMBER_JOINED",
    entityType: "PROJECT",
    entityId: invitation.projectId,
    metadata: { email: req.user.email, role: invitation.role },
  });

  emitToProject(invitation.projectId, "member:added", member);
  emitToProject(invitation.projectId, "project:updated", invitation.project);

  return res.json({
    success: true,
    message: `Invitation accepted! Welcome to ${invitation.project.name}.`,
    project: invitation.project,
    member,
  });
});

// Decline project invitation using secure token
router.post("/invitations/token/:token/decline", authenticateToken, async (req: AuthRequest, res: Response) => {
  const { token } = req.params;
  const invitation = await prisma.projectInvitation.findUnique({
    where: { token },
  });

  if (!invitation) {
    return res.status(404).json({ error: "Invitation not found" });
  }

  if (invitation.email.toLowerCase() !== req.user?.email.toLowerCase()) {
    return res.status(403).json({ error: "Forbidden: You can only decline invitations sent to your email" });
  }

  await prisma.projectInvitation.update({
    where: { id: invitation.id },
    data: { status: "DECLINED" },
  });

  return res.json({ success: true, message: "Invitation declined successfully" });
});

// Get project details
router.get("/:id", authenticateToken, requireProjectAccess(), async (req: AuthRequest, res: Response) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
    include: {
      creator: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      manager: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      organization: {
        select: { id: true, name: true, slug: true },
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

// =================== PROJECT EMAIL INVITATIONS ===================

// Send invitation by email to join project (PM or Admin) - supports single or multiple emails
router.post("/:id/invitations", authenticateToken, requireProjectManager(), async (req: AuthRequest, res: Response) => {
  const parse = inviteMemberSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Validation failed", details: parse.error.issues });
  }

  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
    include: {
      members: {
        include: { user: true },
      },
    },
  });
  if (!project) return res.status(404).json({ error: "Project not found" });

  const role = parse.data.role || "TEAM_MEMBER";

  // Gather all input emails
  const rawEmails: string[] = [];
  if (Array.isArray(parse.data.emails)) {
    rawEmails.push(...parse.data.emails);
  }
  if (typeof parse.data.email === "string") {
    const split = parse.data.email.split(/[\s,;]+/).map((s: string) => s.trim()).filter(Boolean);
    rawEmails.push(...split);
  }

  // Deduplicate and validate
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const uniqueEmails = Array.from(new Set(rawEmails.map((e) => e.toLowerCase().trim()))).filter((e) =>
    emailRegex.test(e)
  );

  if (uniqueEmails.length === 0) {
    return res.status(400).json({ error: "Please provide at least one valid email address" });
  }

  const processedInvitations: any[] = [];
  const skipped: { email: string; reason: string }[] = [];
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  for (const normalizedEmail of uniqueEmails) {
    // Check if user is trying to invite themselves
    if (req.user?.email.toLowerCase() === normalizedEmail) {
      skipped.push({ email: normalizedEmail, reason: "Cannot invite yourself to your own project" });
      continue;
    }

    // Check if already an active member
    const alreadyMember = project.members.some((m) => m.user.email.toLowerCase() === normalizedEmail);
    if (alreadyMember) {
      skipped.push({ email: normalizedEmail, reason: "Already an active member of this project" });
      continue;
    }

    // Upsert pending invitation with 7-day expiry
    const invitation = await prisma.projectInvitation.upsert({
      where: { projectId_email: { projectId: project.id, email: normalizedEmail } },
      update: {
        status: "PENDING",
        role,
        inviterId: req.user!.id,
        expiresAt,
        acceptedAt: null,
      },
      create: {
        projectId: project.id,
        email: normalizedEmail,
        role,
        inviterId: req.user!.id,
        expiresAt,
      },
      include: {
        inviter: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    processedInvitations.push(invitation);

    // If the user has registered on the platform, send in-app notification + socket ping
    const targetUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (targetUser) {
      const notification = await createNotification({
        userId: targetUser.id,
        actorId: req.user!.id,
        type: "PROJECT_INVITE",
        title: "Project Collaboration Invitation",
        message: `${req.user!.name} invited you to join "${project.name}" as ${role.replace("_", " ")}`,
        entityType: "PROJECT",
        entityId: project.id,
      });
      emitToUser(targetUser.id, "notification:new", notification);
      emitToUser(targetUser.id, "project:invitation_received", {
        invitation,
        project: { id: project.id, name: project.name, key: project.key },
      });
    }

    // Send project invitation email asynchronously
    sendProjectInviteEmail({
      to: normalizedEmail,
      inviterName: req.user!.name,
      projectName: project.name,
      projectKey: project.key,
      role,
      token: invitation.token,
      expiresAt: invitation.expiresAt,
    }).catch((err) => console.error("[Projects] Invitation email send error:", err));

    await logActivity({
      userId: req.user?.id,
      projectId: project.id,
      action: "INVITATION_SENT",
      entityType: "PROJECT",
      entityId: project.id,
      metadata: { email: normalizedEmail, role, token: invitation.token },
    });
  }

  if (processedInvitations.length === 0 && skipped.length > 0) {
    return res.status(400).json({
      error: skipped[0].reason,
      skipped,
    });
  }

  return res.status(201).json({
    success: true,
    count: processedInvitations.length,
    invitation: processedInvitations[0],
    invitations: processedInvitations,
    skipped,
    message:
      processedInvitations.length === 1
        ? `Invitation successfully sent to ${processedInvitations[0].email}!`
        : `Successfully sent ${processedInvitations.length} project invitations!`,
  });
});

// List pending invitations for a project
router.get("/:id/invitations", authenticateToken, requireProjectManager(), async (req: AuthRequest, res: Response) => {
  const { status } = req.query;
  const whereClause: any = { projectId: req.params.id };

  if (status && typeof status === "string") {
    if (status !== "ALL") {
      whereClause.status = status;
    }
  } else {
    whereClause.status = "PENDING";
  }

  const invitations = await prisma.projectInvitation.findMany({
    where: whereClause,
    include: {
      inviter: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return res.json({ invitations });
});

// Resend a pending or expired invitation
router.post("/:id/invitations/:invitationId/resend", authenticateToken, requireProjectManager(), async (req: AuthRequest, res: Response) => {
  const invitation = await prisma.projectInvitation.findUnique({
    where: { id: req.params.invitationId },
    include: { project: true },
  });

  if (!invitation || invitation.projectId !== req.params.id) {
    return res.status(404).json({ error: "Invitation not found" });
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const updated = await prisma.projectInvitation.update({
    where: { id: req.params.invitationId },
    data: {
      status: "PENDING",
      expiresAt,
      inviterId: req.user!.id,
    },
    include: {
      inviter: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
  });

  // Re-send invitation email
  sendProjectInviteEmail({
    to: updated.email,
    inviterName: req.user!.name,
    projectName: invitation.project.name,
    projectKey: invitation.project.key,
    role: updated.role,
    token: updated.token,
    expiresAt,
  }).catch((err) => console.error("[Projects] Resend invitation email error:", err));

  return res.json({
    success: true,
    invitation: updated,
    message: `Invitation successfully resent to ${updated.email}`,
  });
});

// Revoke a pending invitation
router.delete("/:id/invitations/:invitationId", authenticateToken, requireProjectManager(), async (req: AuthRequest, res: Response) => {
  const invitation = await prisma.projectInvitation.findUnique({
    where: { id: req.params.invitationId },
  });

  if (!invitation || invitation.projectId !== req.params.id) {
    return res.status(404).json({ error: "Invitation not found" });
  }

  await prisma.projectInvitation.update({
    where: { id: req.params.invitationId },
    data: { status: "REVOKED" },
  });

  return res.json({ success: true, message: "Invitation revoked successfully" });
});

export default router;
