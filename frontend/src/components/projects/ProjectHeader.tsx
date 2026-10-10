"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FolderKanban,
  CheckSquare,
  Users,
  Activity,
  Shield,
  Code2,
  ArrowLeft,
  Trash2,
} from "lucide-react";
import { PRIORITY_CONFIG, cn } from "../../lib/utils";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";

interface ProjectHeaderProps {
  project: any;
  userAccess?: any;
}

export function ProjectHeader({ project, userAccess }: ProjectHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  if (!project) return null;

  const canDelete =
    user?.role === "ADMIN" ||
    user?.role === "PROJECT_MANAGER" ||
    userAccess?.isManager ||
    project.managerId === user?.id;

  const handleDeleteProject = async () => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete "${project.name}"? This action cannot be undone and will delete all tasks, comments, and members.`
      )
    ) {
      return;
    }
    setIsDeleting(true);
    const res = await api.projects.delete(project.id);
    if (!res.error) {
      router.push("/projects");
    } else {
      alert(res.error || "Failed to delete project");
      setIsDeleting(false);
    }
  };

  const tabs = [
    { label: "Overview", href: `/projects/${project.id}`, icon: FolderKanban, exact: true },
    { label: "Code Editor", href: `/projects/${project.id}/editor`, icon: Code2 },
    { label: "Tasks", href: `/projects/${project.id}/tasks`, icon: CheckSquare },
    { label: "Team Members", href: `/projects/${project.id}/team`, icon: Users },
    { label: "Activity", href: `/projects/${project.id}/activity`, icon: Activity },
  ];

  const prio = PRIORITY_CONFIG[project.priority] || PRIORITY_CONFIG.MEDIUM;

  return (
    <div className="space-y-6 pb-6 border-b border-divider">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs text-muted">
        <Link href="/projects" className="hover:text-carbon flex items-center gap-1 transition font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Projects</span>
        </Link>
        <span>/</span>
        <span className="font-mono text-muted">{project.key}</span>
        <span>/</span>
        <span className="text-carbon font-bold">{project.name}</span>
      </div>

      {/* Project Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono font-black text-coral px-2.5 py-0.5 rounded-lg bg-coral/15 border border-coral/30">
              {project.key}
            </span>
            <h1 className="text-2xl font-black text-carbon tracking-tight">{project.name}</h1>
            <span
              className={cn(
                "text-[10px] font-medium px-2.5 py-0.5 rounded-full border",
                prio.bg,
                prio.text,
                prio.border
              )}
            >
              {prio.label}
            </span>
            {project.status === "ARCHIVED" && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-paper text-muted border border-divider">
                Archived
              </span>
            )}
          </div>
          <p className="text-xs text-muted max-w-2xl leading-relaxed">
            {project.description || "No project description provided."}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {userAccess && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-editor border border-divider text-xs">
              <Shield className="w-3.5 h-3.5 text-coral" />
              <span className="text-muted">Your Project Role:</span>
              <span className="font-bold text-carbon">{userAccess.projectRole}</span>
            </div>
          )}

          {canDelete && (
            <button
              onClick={handleDeleteProject}
              disabled={isDeleting}
              title="Delete Project (Admin & PM only)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-editor hover:bg-red-500/10 border border-divider hover:border-red-500/30 text-xs font-bold text-muted hover:text-red-500 transition shadow-xs disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeleting ? "Deleting..." : "Delete Project"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pt-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "group relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-160 ease-out shrink-0 select-none hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0",
                isActive
                  ? "bg-carbon text-paper shadow-sm"
                  : "text-muted hover:text-carbon hover:bg-paper border border-transparent hover:border-divider"
              )}
            >
              <Icon className={cn("w-3.5 h-3.5 transition-transform duration-160", isActive ? "text-coral" : "text-muted group-hover:scale-105")} />
              <span>{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-coral rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
