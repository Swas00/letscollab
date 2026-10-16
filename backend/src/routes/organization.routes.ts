import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { AuthRequest, authenticateToken } from "../middleware/auth";
import { logActivity } from "../services/activity.service";

const router = Router();

const createOrgSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters"),
  description: z.string().optional(),
});

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

// List user's organizations
router.get("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  const memberships = await prisma.organizationMember.findMany({
    where: { userId: req.user!.id },
    include: {
      organization: {
        include: {
          _count: {
            select: {
              members: true,
              projects: true,
            },
          },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  const organizations = memberships.map((m) => ({
    ...m.organization,
    userRole: m.role,
  }));

  return res.json({ organizations });
});

// Create new organization
router.post("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  const parse = createOrgSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Validation failed", details: parse.error.issues });
  }

  const { name, description } = parse.data;
  let baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "org";
  let slug = baseSlug;
  let counter = 1;

  while (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  const organization = await prisma.organization.create({
    data: {
      name,
      slug,
      description,
      members: {
        create: {
          userId: req.user!.id,
          role: "OWNER",
        },
      },
    },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
        },
      },
    },
  });

  await logActivity({
    userId: req.user?.id,
    action: "ORGANIZATION_CREATED",
    entityType: "ORGANIZATION",
    entityId: organization.id,
    metadata: { name: organization.name, slug: organization.slug },
  });

  return res.status(201).json({ organization: { ...organization, userRole: "OWNER" } });
});

// Get organization details by ID
router.get("/:id", authenticateToken, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // Check membership or system admin
  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: id,
        userId: req.user!.id,
      },
    },
  });

  if (!membership && req.user?.role !== "ADMIN") {
    return res.status(403).json({ error: "You are not a member of this organization" });
  }

  const organization = await prisma.organization.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
      projects: {
        select: {
          id: true,
          name: true,
          key: true,
          status: true,
          priority: true,
          createdAt: true,
          _count: { select: { tasks: true, members: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!organization) {
    return res.status(404).json({ error: "Organization not found" });
  }

  return res.json({
    organization: {
      ...organization,
      userRole: membership?.role || "ADMIN",
    },
  });
});

// Add member to organization by email
router.post("/:id/members", authenticateToken, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const parse = addMemberSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Validation failed", details: parse.error.issues });
  }

  // Check if requester is OWNER or ADMIN in the org
  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: id,
        userId: req.user!.id,
      },
    },
  });

  if ((!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) && req.user?.role !== "ADMIN") {
    return res.status(403).json({ error: "Only organization owners or admins can invite members" });
  }

  const targetUser = await prisma.user.findUnique({
    where: { email: parse.data.email.toLowerCase() },
  });

  if (!targetUser) {
    return res.status(404).json({ error: "No user found with that email. Please ask them to register first." });
  }

  const existingMember = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: id,
        userId: targetUser.id,
      },
    },
  });

  if (existingMember) {
    return res.status(400).json({ error: "User is already a member of this organization" });
  }

  const newMember = await prisma.organizationMember.create({
    data: {
      organizationId: id,
      userId: targetUser.id,
      role: parse.data.role,
    },
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
    },
  });

  await logActivity({
    userId: req.user?.id,
    action: "ORGANIZATION_MEMBER_ADDED",
    entityType: "ORGANIZATION",
    entityId: id,
    metadata: { addedUserId: targetUser.id, role: parse.data.role },
  });

  return res.status(201).json({ member: newMember });
});

// Remove member from organization
router.delete("/:id/members/:userId", authenticateToken, async (req: AuthRequest, res: Response) => {
  const { id, userId } = req.params;

  const requesterMembership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: id,
        userId: req.user!.id,
      },
    },
  });

  const isSelf = req.user!.id === userId;
  const isOwnerOrAdmin = requesterMembership?.role === "OWNER" || requesterMembership?.role === "ADMIN" || req.user?.role === "ADMIN";

  if (!isSelf && !isOwnerOrAdmin) {
    return res.status(403).json({ error: "Unauthorized to remove member from organization" });
  }

  await prisma.organizationMember.delete({
    where: {
      organizationId_userId: {
        organizationId: id,
        userId,
      },
    },
  });

  return res.json({ message: "Member removed from organization successfully" });
});

export default router;
