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
    bg: "bg-paper",
    text: "text-muted",
    border: "border-divider",
    dot: "bg-muted",
  },
  TODO: {
    label: "To Do",
    bg: "bg-periwinkle/50",
    text: "text-carbon",
    border: "border-divider",
    dot: "bg-[#41538a]",
  },
  IN_PROGRESS: {
    label: "In Progress",
    bg: "bg-periwinkle",
    text: "text-carbon",
    border: "border-[#bcc5ea]",
    dot: "bg-coral",
  },
  IN_REVIEW: {
    label: "In Review",
    bg: "bg-moss/60",
    text: "text-carbon",
    border: "border-[#bfd6bb]",
    dot: "bg-[#3B5A38]",
  },
  DONE: {
    label: "Done",
    bg: "bg-moss",
    text: "text-carbon",
    border: "border-[#b5cea8]",
    dot: "bg-[#254622]",
  },
};

export const PRIORITY_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  LOW: {
    label: "Low",
    bg: "bg-paper",
    text: "text-muted",
    border: "border-divider",
  },
  MEDIUM: {
    label: "Medium",
    bg: "bg-periwinkle/60",
    text: "text-carbon",
    border: "border-divider",
  },
  HIGH: {
    label: "High",
    bg: "bg-coral/15",
    text: "text-coral",
    border: "border-coral/30",
  },
  URGENT: {
    label: "Urgent",
    bg: "bg-coral",
    text: "text-white font-semibold",
    border: "border-coral",
  },
};

export const ROLE_CONFIG: Record<
  string,
  { label: string; badge: string; description: string }
> = {
  ADMIN: {
    label: "Admin",
    badge: "bg-coral text-white border-coral font-semibold",
    description: "Full system administration & user access",
  },
  PROJECT_MANAGER: {
    label: "Project Manager",
    badge: "bg-carbon text-paper border-carbon font-semibold",
    description: "Manage project tasks, team members & activity",
  },
  TEAM_MEMBER: {
    label: "Team Member",
    badge: "bg-moss text-carbon border-[#b5cea8] font-semibold",
    description: "Update assigned tasks & add comments",
  },
  VIEWER: {
    label: "Viewer",
    badge: "bg-paper text-muted border-divider font-medium",
    description: "Read-only access to projects and tasks",
  },
};
