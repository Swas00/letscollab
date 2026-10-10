import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";

let io: SocketIOServer | null = null;

export function initSocket(server: HttpServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: "*", // Allow Next.js frontend
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    },
  });

  io.on("connection", (socket: Socket) => {
    // Join a user room for private real-time notifications
    socket.on("join:user", (userId: string) => {
      if (userId) {
        socket.join(`user:${userId}`);
      }
    });

    // Join a project room for collaborative task updates
    socket.on("join:project", (projectId: string) => {
      if (projectId) {
        socket.join(`project:${projectId}`);
      }
    });

    socket.on("leave:project", (projectId: string) => {
      if (projectId) {
        socket.leave(`project:${projectId}`);
      }
    });

    // Real-time presence indicator: user is viewing or editing a task
    socket.on("task:viewing", ({ taskId, userId, userName }: { taskId: string; userId: string; userName: string }) => {
      socket.broadcast.emit("presence:viewing", { taskId, userId, userName });
    });

    socket.on("disconnect", () => {
      // Clean disconnect
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error("Socket.IO has not been initialized yet!");
  }
  return io;
}

export function emitToProject(projectId: string, event: string, data: any) {
  if (io) {
    io.to(`project:${projectId}`).emit(event, data);
    // Also emit broadcast so global feeds stay synchronized
    io.emit(event, data);
  }
}

export function emitToUser(userId: string, event: string, data: any) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

export function emitBroadcast(event: string, data: any) {
  if (io) {
    io.emit(event, data);
  }
}
