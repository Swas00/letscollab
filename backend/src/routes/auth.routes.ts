import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "../prisma";
import { AuthRequest, authenticateToken } from "../middleware/auth";
import { logActivity } from "../services/activity.service";
import { createNotification } from "../services/notification.service";
import { sendWelcomeEmail, sendPasswordResetOtpEmail } from "../services/mail.service";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-jwt-key-for-neostats-hackathon-2026";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "VIEWER"]).optional(),
  avatarUrl: z.string().optional(),
  organizationName: z.string().optional(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
});

const resetPasswordSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  otp: z.string().min(4, "OTP verification code is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  avatarUrl: z.string().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

const deleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required to confirm permanent account deletion"),
});

// User Registration
router.post("/register", async (req, res) => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Validation failed", details: parse.error.issues });
  }

  const { name, email, password, role, avatarUrl, organizationName } = parse.data;
  const normalizedEmail = email.toLowerCase().trim();
  const trimmedName = name.trim();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    return res.status(400).json({ error: "An account with this email already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const defaultAvatar =
    avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(trimmedName)}`;

  const userRole = role || "TEAM_MEMBER";

  const user = await prisma.user.create({
    data: {
      name: trimmedName,
      email: normalizedEmail,
      password: hashedPassword,
      role: userRole,
      avatarUrl: defaultAvatar,
      isActive: true,
    },
  });

  // Handle optional organization creation / joining
  let createdOrg = null;
  if (organizationName && organizationName.trim()) {
    const orgName = organizationName.trim();
    let baseSlug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "org";
    let slug = baseSlug;

    // Check if an organization with this slug already exists
    let org = await prisma.organization.findUnique({ where: { slug } });
    if (!org) {
      org = await prisma.organization.create({
        data: {
          name: orgName,
          slug,
          members: {
            create: {
              userId: user.id,
              role: "OWNER",
            },
          },
        },
      });
      createdOrg = org;
    } else {
      await prisma.organizationMember.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          role: "MEMBER",
        },
      });
      createdOrg = org;
    }
  }

  await logActivity({
    userId: user.id,
    action: "USER_REGISTERED",
    entityType: "USER",
    entityId: user.id,
    metadata: { name: user.name, email: user.email, role: user.role, organization: createdOrg?.name },
  });

  // 1. Send Welcome Email asynchronously
  sendWelcomeEmail({
    to: user.email,
    name: user.name,
    organizationName: createdOrg?.name,
  }).catch((err) => console.error("[Auth] Welcome email send error:", err));

  // 2. Create In-App Welcome Notification
  await createNotification({
    userId: user.id,
    type: "SYSTEM_ALERT",
    title: "Welcome to LetsCollab! 🚀",
    message: "Your collaborative workspace is ready. Create projects, invite your team by email, and build together in real-time.",
    entityType: "USER",
    entityId: user.id,
  });

  // 3. Link any pending invitations previously sent to this email address
  const pendingInvitations = await prisma.projectInvitation.findMany({
    where: { email: user.email, status: "PENDING" },
    include: { project: true, inviter: true },
  });

  for (const inv of pendingInvitations) {
    await createNotification({
      userId: user.id,
      actorId: inv.inviterId,
      type: "PROJECT_INVITE",
      title: "Project Collaboration Invitation",
      message: `${inv.inviter?.name || "A project manager"} invited you to join "${inv.project.name}" as ${inv.role.replace("_", " ")}`,
      entityType: "PROJECT",
      entityId: inv.projectId,
    });
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

  const memberships = await prisma.organizationMember.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      organizationId: true,
      role: true,
      organization: { select: { id: true, name: true, slug: true } },
    },
  });

  const safeUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl,
    isActive: user.isActive,
    organizationMemberships: memberships,
  };

  return res.status(201).json({ token, user: safeUser });
});

// User Login
router.post("/login", async (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid email or password format", details: parse.error.issues });
  }

  const { email, password } = parse.data;
  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: {
      organizationMemberships: {
        select: {
          id: true,
          organizationId: true,
          role: true,
          organization: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  });

  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  if (!user.isActive) {
    return res.status(403).json({ error: "Your account is deactivated. Please contact an administrator." });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

  const safeUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl,
    isActive: user.isActive,
    organizationMemberships: user.organizationMemberships,
  };

  return res.json({ token, user: safeUser });
});

// Current User Profile
router.get("/me", authenticateToken, (req: AuthRequest, res: Response) => {
  return res.json({ user: req.user });
});

// Update Profile
router.put("/profile", authenticateToken, async (req: AuthRequest, res: Response) => {
  const parse = updateProfileSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Validation failed", details: parse.error.issues });
  }

  const updated = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      name: parse.data.name,
      avatarUrl: parse.data.avatarUrl,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatarUrl: true,
      isActive: true,
    },
  });

  return res.json({ user: updated });
});

// Change Password
router.put("/change-password", authenticateToken, async (req: AuthRequest, res: Response) => {
  const parse = changePasswordSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Validation failed", details: parse.error.issues });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
  });

  if (!user) return res.status(404).json({ error: "User not found" });

  const isMatch = await bcrypt.compare(parse.data.currentPassword, user.password);
  if (!isMatch) {
    return res.status(400).json({ error: "Incorrect current password" });
  }

  const newHashed = await bcrypt.hash(parse.data.newPassword, 10);
  await prisma.user.update({
    where: { id: req.user!.id },
    data: { password: newHashed },
  });

  return res.json({ message: "Password updated successfully" });
});

// Permanently Delete User Account
router.delete("/account", authenticateToken, async (req: AuthRequest, res: Response) => {
  const parse = deleteAccountSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({
      error: "Password is required to confirm permanent account deletion",
      details: parse.error.issues,
    });
  }

  const userId = req.user!.id;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const isMatch = await bcrypt.compare(parse.data.password, user.password);
  if (!isMatch) {
    return res.status(400).json({ error: "Incorrect password. Account deletion aborted." });
  }

  // 1. Clean up password reset OTPs for this user's email
  await prisma.passwordResetOtp.deleteMany({
    where: { email: user.email },
  }).catch(() => {});

  // 2. Clear out foreign key links on managed/created entities
  await prisma.project.updateMany({
    where: { managerId: userId },
    data: { managerId: null },
  }).catch(() => {});

  await prisma.project.updateMany({
    where: { creatorId: userId },
    data: { creatorId: null },
  }).catch(() => {});

  await prisma.task.updateMany({
    where: { assigneeId: userId },
    data: { assigneeId: null },
  }).catch(() => {});

  await prisma.task.updateMany({
    where: { creatorId: userId },
    data: { creatorId: null },
  }).catch(() => {});

  // 3. Permanently remove the user record (Prisma cascades memberships, comments, notifications, etc.)
  await prisma.user.delete({
    where: { id: userId },
  });

  return res.json({
    message: "Your account, credentials, and profile have been permanently deleted.",
  });
});

// =================== FORGOT & RESET PASSWORD VIA OTP ===================

// Request 6-digit OTP for password reset
router.post("/forgot-password", async (req, res) => {
  const parse = forgotPasswordSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Validation failed", details: parse.error.issues });
  }

  const normalizedEmail = parse.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user || !user.isActive) {
    return res.json({
      message: "If an account with that email exists, a verification code has been sent to your inbox.",
      email: normalizedEmail,
    });
  }

  // Automatically cleanup expired OTP records older than 24h
  await prisma.passwordResetOtp.deleteMany({
    where: {
      expiresAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  }).catch((err) => console.error("[Auth] Cleanup old OTPs error:", err));

  // Generate cryptographically secure 6-digit numeric OTP
  const otp = crypto.randomInt(100000, 1000000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Invalidate any previous pending OTPs for this email
  await prisma.passwordResetOtp.updateMany({
    where: { email: normalizedEmail, used: false },
    data: { used: true },
  });

  // Store new OTP safely in DB
  await prisma.passwordResetOtp.create({
    data: {
      email: normalizedEmail,
      otp,
      expiresAt,
    },
  });

  // Dispatch OTP email
  sendPasswordResetOtpEmail({
    to: user.email,
    name: user.name,
    otp,
  }).catch((err) => console.error("[Auth] Reset OTP email error:", err));

  return res.json({
    message: "A 6-digit verification code has been sent to your email address.",
    email: user.email,
    ...(process.env.NODE_ENV === "test" ? { testOtp: otp } : {}),
  });
});

// Reset Password with OTP & Log In
router.post("/reset-password", async (req, res) => {
  const parse = resetPasswordSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Validation failed", details: parse.error.issues });
  }

  const { email, otp, newPassword } = parse.data;
  const normalizedEmail = email.toLowerCase().trim();

  // Verify user exists and is active
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    return res.status(404).json({ error: "No account found matching this email address." });
  }

  if (!user.isActive) {
    return res.status(403).json({ error: "This account has been deactivated. Please contact an administrator." });
  }

  // Find valid, unused OTP that hasn't expired
  const validOtp = await prisma.passwordResetOtp.findFirst({
    where: {
      email: normalizedEmail,
      otp: otp.trim(),
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!validOtp) {
    return res.status(400).json({
      error: "Invalid or expired verification code. Please check the code or request a new one.",
    });
  }

  // Atomically mark OTP as used (replay protection)
  await prisma.passwordResetOtp.update({
    where: { id: validOtp.id },
    data: { used: true },
  });

  // Hash new password securely
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
    include: {
      organizationMemberships: {
        include: { organization: true },
      },
    },
  });

  // Create in-app security notification
  await createNotification({
    userId: updatedUser.id,
    type: "SYSTEM_ALERT",
    title: "Password Changed",
    message: "Your account password was successfully reset using email OTP verification.",
    entityType: "USER",
    entityId: updatedUser.id,
  });

  await logActivity({
    userId: updatedUser.id,
    action: "PASSWORD_RESET",
    entityType: "USER",
    entityId: updatedUser.id,
    metadata: { email: updatedUser.email },
  });

  // Automatically authenticate user
  const token = jwt.sign({ userId: updatedUser.id }, JWT_SECRET, { expiresIn: "7d" });

  const safeUser = {
    id: updatedUser.id,
    email: updatedUser.email,
    name: updatedUser.name,
    role: updatedUser.role,
    avatarUrl: updatedUser.avatarUrl,
    isActive: updatedUser.isActive,
    organizationMemberships: updatedUser.organizationMemberships,
  };

  return res.json({
    message: "Password reset successful! You are now logged in.",
    token,
    user: safeUser,
  });
});

export default router;
