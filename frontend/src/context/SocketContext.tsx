"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { api } from "../lib/api";

export interface ToastAlert {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "conflict";
  timestamp: Date;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  toasts: ToastAlert[];
  unreadCount: number;
  removeToast: (id: string) => void;
  joinProject: (projectId: string) => void;
  leaveProject: (projectId: string) => void;
  broadcastViewingTask: (taskId: string) => void;
  activeViewers: Record<string, string[]>; // taskId -> list of usernames
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  fetchUnreadCount: () => Promise<void>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  (process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, "")
    : "http://localhost:5001");

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [toasts, setToasts] = useState<ToastAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeViewers, setActiveViewers] = useState<Record<string, string[]>>({});
  const activeProjectRef = useRef<string | null>(null);

  const addToast = (toast: Omit<ToastAlert, "id" | "timestamp">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastAlert = {
      ...toast,
      id,
      timestamp: new Date(),
    };
    setToasts((prev) => [newToast, ...prev].slice(0, 5)); // Keep latest 5

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchUnreadCount = async () => {
    if (!user) return;
    const res = await api.notifications.list();
    if (res.data) {
      setUnreadCount(res.data.unreadCount);
    }
  };

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const s = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
    });

    s.on("connect", () => {
      setIsConnected(true);
      s.emit("join:user", user.id);
      if (activeProjectRef.current) {
        s.emit("join:project", activeProjectRef.current);
      }
    });

    s.on("disconnect", () => {
      setIsConnected(false);
    });

    // Real-time notification received
    s.on("notification:new", (notification) => {
      setUnreadCount((c) => c + 1);
      addToast({
        title: notification.title || "New Notification",
        message: notification.message || "You have an update",
        type: notification.type === "CONCURRENT_CONFLICT" ? "conflict" : "info",
      });
    });

    // Real-time task update toast
    s.on("task:updated", (task) => {
      addToast({
        title: "Task Updated",
        message: `'${task.title}' was updated (now v${task.version})`,
        type: "success",
      });
    });

    // Real-time task created toast
    s.on("task:created", (task) => {
      addToast({
        title: "New Task Created",
        message: `'${task.title}' was added`,
        type: "info",
      });
    });

    // Real-time viewer presence
    s.on("presence:viewing", ({ taskId, userName }) => {
      setActiveViewers((prev) => {
        const current = prev[taskId] || [];
        if (!current.includes(userName)) {
          return { ...prev, [taskId]: [...current, userName] };
        }
        return prev;
      });
    });

    setSocket(s);
    fetchUnreadCount();

    return () => {
      s.disconnect();
    };
  }, [user?.id]);

  const joinProject = (projectId: string) => {
    activeProjectRef.current = projectId;
    if (socket && isConnected) {
      socket.emit("join:project", projectId);
    }
  };

  const leaveProject = (projectId: string) => {
    if (activeProjectRef.current === projectId) {
      activeProjectRef.current = null;
    }
    if (socket && isConnected) {
      socket.emit("leave:project", projectId);
    }
  };

  const broadcastViewingTask = (taskId: string) => {
    if (socket && isConnected && user) {
      socket.emit("task:viewing", {
        taskId,
        userId: user.id,
        userName: user.name,
      });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        toasts,
        unreadCount,
        removeToast,
        joinProject,
        leaveProject,
        broadcastViewingTask,
        activeViewers,
        setUnreadCount,
        fetchUnreadCount,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}
