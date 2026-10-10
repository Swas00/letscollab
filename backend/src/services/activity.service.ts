import { prisma } from "../prisma";
import { emitToProject, emitBroadcast } from "../socket";

interface LogActivityParams {
  userId?: string;
  projectId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any>;
}

export async function logActivity(params: LogActivityParams) {
  try {
    const activity = await prisma.activityLog.create({
      data: {
        userId: params.userId,
        projectId: params.projectId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            key: true,
          },
        },
      },
    });

    if (params.projectId) {
      emitToProject(params.projectId, "activity:new", activity);
    } else {
      emitBroadcast("activity:new", activity);
    }

    return activity;
  } catch (error) {
    console.error("Failed to log activity:", error);
    return null;
  }
}
