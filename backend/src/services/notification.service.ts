import { prisma } from "../prisma";
import { emitToUser } from "../socket";

interface CreateNotificationParams {
  userId: string;
  actorId?: string;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    // Don't send notification to self
    if (params.actorId && params.userId === params.actorId) {
      return null;
    }

    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        actorId: params.actorId,
        type: params.type,
        title: params.title,
        message: params.message,
        entityType: params.entityType,
        entityId: params.entityId,
        isRead: false,
      },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    emitToUser(params.userId, "notification:new", notification);
    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}
