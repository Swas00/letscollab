import { Router, Response } from "express";
import { prisma } from "../prisma";
import { AuthRequest, authenticateToken } from "../middleware/auth";

const router = Router();

// Get notifications for current user
router.get("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      include: {
        actor: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.notification.count({
      where: { userId, isRead: false },
    }),
  ]);

  return res.json({ notifications, unreadCount });
});

// Mark single notification as read
router.patch("/:id/read", authenticateToken, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const notification = await prisma.notification.findUnique({
    where: { id },
  });

  if (!notification || notification.userId !== userId) {
    return res.status(404).json({ error: "Notification not found" });
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  const unreadCount = await prisma.notification.count({
    where: { userId, isRead: false },
  });

  return res.json({ notification: updated, unreadCount });
});

// Mark all notifications as read
router.patch("/read-all", authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  return res.json({ message: "All notifications marked as read", unreadCount: 0 });
});

export default router;
