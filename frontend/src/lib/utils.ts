import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString?: string | Date | null): string {
  if (!dateString) return "No date";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRelativeTime(dateString: string | Date): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return formatDate(dateString);
}

export const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  BACKLOG: {
    label: "Backlog",
    bg: "bg-zinc-800/60",
    text: "text-zinc-400",
    border: "border-zinc-700/60",
    dot: "bg-zinc-500",
  },
  TODO: {
    label: "To Do",
    bg: "bg-blue-950/40",
    text: "text-blue-400",
    border: "border-blue-800/50",
    dot: "bg-blue-400",
  },
  IN_PROGRESS: {
    label: "In Progress",
    bg: "bg-amber-950/40",
    text: "text-amber-400",
    border: "border-amber-800/50",
    dot: "bg-amber-400",
  },
  IN_REVIEW: {
    label: "In Review",
    bg: "bg-purple-950/40",
    text: "text-purple-400",
    border: "border-purple-800/50",
    dot: "bg-purple-400",
  },
  DONE: {
    label: "Done",
    bg: "bg-emerald-950/40",
    text: "text-emerald-400",
    border: "border-emerald-800/50",
    dot: "bg-emerald-400",
  },
};

export const PRIORITY_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  LOW: {
    label: "Low",
    bg: "bg-zinc-800/50",
    text: "text-zinc-400",
    border: "border-zinc-700/50",
  },
  MEDIUM: {
    label: "Medium",
    bg: "bg-sky-950/40",
    text: "text-sky-400",
    border: "border-sky-800/50",
  },
  HIGH: {
    label: "High",
    bg: "bg-amber-950/40",
    text: "text-amber-400",
    border: "border-amber-800/50",
  },
  URGENT: {
    label: "Urgent",
    bg: "bg-rose-950/40",
    text: "text-rose-400",
    border: "border-rose-800/50",
  },
};

export const ROLE_CONFIG: Record<
  string,
  { label: string; badge: string; description: string }
> = {
  ADMIN: {
    label: "Admin",
    badge: "bg-rose-900/40 text-rose-300 border-rose-700/50",
    description: "Full system administration & user access",
  },
  PROJECT_MANAGER: {
    label: "Project Manager",
    badge: "bg-indigo-900/40 text-indigo-300 border-indigo-700/50",
    description: "Manage project tasks, team members & activity",
  },
  TEAM_MEMBER: {
    label: "Team Member",
    badge: "bg-emerald-900/40 text-emerald-300 border-emerald-700/50",
    description: "Update assigned tasks & add comments",
  },
  VIEWER: {
    label: "Viewer",
    badge: "bg-zinc-800 text-zinc-300 border-zinc-700",
    description: "Read-only access to projects and tasks",
  },
};
