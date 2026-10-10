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

    // Real-Time Code Editor Collaboration: Peer Presence & Live Editing
    socket.on("editor:join", ({ projectId, user }: { projectId: string; user: { id: string; name: string; email: string; color?: string } }) => {
      if (!projectId || !user) return;
      socket.join(`editor:${projectId}`);
      (socket as any).editorUser = { ...user, socketId: socket.id, projectId };

      // Broadcast to other collaborators in this project
      socket.to(`editor:${projectId}`).emit("editor:user-joined", {
        user,
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });
    });

    socket.on("editor:leave", ({ projectId }: { projectId: string }) => {
      if (!projectId) return;
      socket.leave(`editor:${projectId}`);
      const user = (socket as any).editorUser;
      if (user) {
        socket.to(`editor:${projectId}`).emit("editor:user-left", {
          user,
          socketId: socket.id,
          timestamp: new Date().toISOString()
        });
        delete (socket as any).editorUser;
      }
    });

    socket.on("editor:cursor", (data: { projectId: string; fileId: string; line: number; ch: number; selection?: { start: number; end: number }; user: any }) => {
      if (!data.projectId) return;
      socket.to(`editor:${data.projectId}`).emit("editor:cursor-moved", {
        ...data,
        socketId: socket.id
      });
    });

    socket.on("editor:code-change", (data: { projectId: string; fileId: string; content: string; version: number; user: any }) => {
      if (!data.projectId) return;
      socket.to(`editor:${data.projectId}`).emit("editor:code-updated", {
        ...data,
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });
    });

    socket.on("disconnect", () => {
      const user = (socket as any).editorUser;
      if (user && user.projectId) {
        socket.to(`editor:${user.projectId}`).emit("editor:user-left", {
          user,
          socketId: socket.id,
          timestamp: new Date().toISOString()
        });
      }
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
