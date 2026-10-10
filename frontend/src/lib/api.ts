const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("neostats_token");
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string; status: number; conflictData?: any }> {
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const contentType = res.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");
    const json = isJson ? await res.json() : null;

    if (res.status === 409) {
      // Optimistic concurrency conflict
      return {
        error: json?.message || json?.error || "Concurrent edit conflict detected",
        conflictData: json,
        status: res.status,
      };
    }

    if (!res.ok) {
      return {
        error: json?.error || `Request failed with status ${res.status}`,
        status: res.status,
      };
    }

    return { data: json as T, status: res.status };
  } catch (err: any) {
    return {
      error: err.message || "Network connection error. Is backend server running on port 5001?",
      status: 0,
    };
  }
}

export const api = {
  auth: {
    login: (credentials: { email: string; password: string }) =>
      apiFetch<{ token: string; user: any }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),
    register: (data: { name: string; email: string; password: string; role?: string }) =>
      apiFetch<{ token: string; user: any }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    me: () => apiFetch<{ user: any }>("/auth/me"),
    updateProfile: (data: { name?: string; avatarUrl?: string }) =>
      apiFetch<{ user: any }>("/auth/profile", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      apiFetch<{ message: string }>("/auth/change-password", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },
  users: {
    list: (params?: { search?: string; role?: string; includeInactive?: boolean }) => {
      const q = new URLSearchParams();
      if (params?.search) q.set("search", params.search);
      if (params?.role) q.set("role", params.role);
      if (params?.includeInactive) q.set("includeInactive", "true");
      return apiFetch<{ users: any[] }>(`/users?${q.toString()}`);
    },
    get: (id: string) => apiFetch<{ user: any }>(`/users/${id}`),
    create: (data: any) =>
      apiFetch<{ user: any }>("/users", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      apiFetch<{ user: any }>(`/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    toggleStatus: (id: string, isActive: boolean) =>
      apiFetch<{ user: any; message: string }>(`/users/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      }),
  },
  projects: {
    list: (params?: { status?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.status) q.set("status", params.status);
      if (params?.search) q.set("search", params.search);
      return apiFetch<{ projects: any[] }>(`/projects?${q.toString()}`);
    },
    get: (id: string) => apiFetch<{ project: any; userAccess: any }>(`/projects/${id}`),
    create: (data: any) =>
      apiFetch<{ project: any }>("/projects", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      apiFetch<{ project: any }>(`/projects/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    archive: (id: string) =>
      apiFetch<{ project: any; message: string }>(`/projects/${id}/archive`, {
        method: "PATCH",
      }),
    delete: (id: string) =>
      apiFetch<{ message: string }>(`/projects/${id}`, {
        method: "DELETE",
      }),
    addMember: (projectId: string, data: { userId: string; role: string }) =>
      apiFetch<{ member: any }>(`/projects/${projectId}/members`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateMemberRole: (projectId: string, userId: string, role: string) =>
      apiFetch<{ member: any }>(`/projects/${projectId}/members/${userId}`, {
        method: "PUT",
        body: JSON.stringify({ role }),
      }),
    removeMember: (projectId: string, userId: string) =>
      apiFetch<{ message: string }>(`/projects/${projectId}/members/${userId}`, {
        method: "DELETE",
      }),
  },
  tasks: {
    listByProject: (projectId: string, params?: { search?: string; status?: string; priority?: string; assigneeId?: string }) => {
      const q = new URLSearchParams();
      if (params?.search) q.set("search", params.search);
      if (params?.status) q.set("status", params.status);
      if (params?.priority) q.set("priority", params.priority);
      if (params?.assigneeId) q.set("assigneeId", params.assigneeId);
      return apiFetch<{ tasks: any[] }>(`/tasks/project/${projectId}?${q.toString()}`);
    },
    get: (id: string) => apiFetch<{ task: any; userAccess: any }>(`/tasks/${id}`),
    create: (projectId: string, data: any) =>
      apiFetch<{ task: any }>(`/tasks/project/${projectId}`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      apiFetch<{ task: any }>(`/tasks/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    updateStatus: (id: string, status: string, version?: number) =>
      apiFetch<{ task: any }>(`/tasks/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, version }),
      }),
    delete: (id: string) =>
      apiFetch<{ message: string }>(`/tasks/${id}`, {
        method: "DELETE",
      }),
  },
  comments: {
    list: (taskId: string) => apiFetch<{ comments: any[] }>(`/comments/task/${taskId}`),
    create: (taskId: string, content: string) =>
      apiFetch<{ comment: any }>(`/comments/task/${taskId}`, {
        method: "POST",
        body: JSON.stringify({ content }),
      }),
    delete: (commentId: string) =>
      apiFetch<{ message: string }>(`/comments/${commentId}`, {
        method: "DELETE",
      }),
  },
  notifications: {
    list: () => apiFetch<{ notifications: any[]; unreadCount: number }>("/notifications"),
    markRead: (id: string) =>
      apiFetch<{ notification: any; unreadCount: number }>(`/notifications/${id}/read`, {
        method: "PATCH",
      }),
    markAllRead: () =>
      apiFetch<{ message: string; unreadCount: number }>("/notifications/read-all", {
        method: "PATCH",
      }),
  },
  activity: {
    list: (params?: { limit?: number; entityType?: string; action?: string }) => {
      const q = new URLSearchParams();
      if (params?.limit) q.set("limit", params.limit.toString());
      if (params?.entityType) q.set("entityType", params.entityType);
      if (params?.action) q.set("action", params.action);
      return apiFetch<{ activities: any[] }>(`/activity?${q.toString()}`);
    },
    listByProject: (projectId: string, params?: { limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.limit) q.set("limit", params.limit.toString());
      return apiFetch<{ activities: any[] }>(`/activity/project/${projectId}?${q.toString()}`);
    },
  },
};
