"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderKanban,
  CheckSquare,
  Users,
  Activity,
  Calendar,
  Shield,
  ArrowLeft,
} from "lucide-react";
import { PRIORITY_CONFIG, formatDate, cn } from "../../lib/utils";

interface ProjectHeaderProps {
  project: any;
  userAccess?: any;
}

export function ProjectHeader({ project, userAccess }: ProjectHeaderProps) {
  const pathname = usePathname();
  if (!project) return null;

  const tabs = [
    { label: "Overview", href: `/projects/${project.id}`, icon: FolderKanban, exact: true },
    { label: "Tasks", href: `/projects/${project.id}/tasks`, icon: CheckSquare },
    { label: "Team Members", href: `/projects/${project.id}/team`, icon: Users },
    { label: "Activity", href: `/projects/${project.id}/activity`, icon: Activity },
  ];

  const prio = PRIORITY_CONFIG[project.priority] || PRIORITY_CONFIG.MEDIUM;

  return (
    <div className="space-y-6 pb-6 border-b border-zinc-800/80">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Link href="/projects" className="hover:text-zinc-300 flex items-center gap-1 transition">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Projects</span>
        </Link>
        <span>/</span>
        <span className="font-mono text-zinc-400">{project.key}</span>
        <span>/</span>
        <span className="text-zinc-200 font-semibold">{project.name}</span>
      </div>

      {/* Project Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono font-black text-indigo-400 px-2.5 py-0.5 rounded-lg bg-indigo-950/60 border border-indigo-800/50">
              {project.key}
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">{project.name}</h1>
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
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                Archived
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
            {project.description || "No project description provided."}
          </p>
        </div>

        {userAccess && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-zinc-400">Your Project Role:</span>
            <span className="font-semibold text-white">{userAccess.projectRole}</span>
          </div>
        )}
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
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0",
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
