"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppLayout } from "../../../components/layout/AppLayout";
import { ProjectHeader } from "../../../components/projects/ProjectHeader";
import { useSocket } from "../../../context/SocketContext";
import { api } from "../../../lib/api";
import {
  CheckSquare,
  Users,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { STATUS_CONFIG, PRIORITY_CONFIG, cn } from "../../../lib/utils";

export default function ProjectOverviewPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { joinProject, leaveProject } = useSocket();

  const [project, setProject] = useState<any>(null);
  const [userAccess, setUserAccess] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;

    joinProject(projectId);

    api.projects.get(projectId).then((res) => {
      if (res.data?.project) {
        setProject(res.data.project);
        setUserAccess(res.data.userAccess);
      } else {
        setErrorMsg(res.error || "Project not found or unauthorized");
      }
      setIsLoading(false);
    });

    return () => {
      leaveProject(projectId);
    };
  }, [projectId]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-16 text-center text-sm text-muted">Loading project...</div>
      </AppLayout>
    );
  }

  if (errorMsg) {
    return (
      <AppLayout>
        <div className="p-16 text-center text-sm text-coral space-y-3">
          <AlertCircle className="w-8 h-8 mx-auto" />
          <p>{errorMsg}</p>
          <Link
            href="/projects"
            className="inline-block px-4 py-2 bg-editor border border-divider text-carbon rounded-xl text-xs font-bold hover:bg-paper transition"
          >
            Back to Projects
          </Link>
        </div>
      </AppLayout>
    );
  }

  const tasks = project.tasks || [];
  const members = project.members || [];
  const completedTasks = tasks.filter((t: any) => t.status === "DONE");
  const progressPercent = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  return (
    <AppLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        <ProjectHeader project={project} userAccess={userAccess} />

        {/* Project Metrics Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-editor border border-divider shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-muted font-medium">Completion Rate</p>
              <h3 className="text-2xl font-black text-carbon mt-1">{progressPercent}%</h3>
            </div>
            <div className="p-3 bg-moss border border-[#b5cea8] rounded-xl text-[#254622]">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-editor border border-divider shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-muted font-medium">Total Tasks</p>
              <h3 className="text-2xl font-black text-carbon mt-1">{tasks.length}</h3>
            </div>
            <div className="p-3 bg-periwinkle border border-[#bec5ea] rounded-xl text-carbon">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-editor border border-divider shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-muted font-medium">Team Members</p>
              <h3 className="text-2xl font-black text-carbon mt-1">{members.length}</h3>
            </div>
            <div className="p-3 bg-paper border border-divider rounded-xl text-carbon">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-editor border border-divider shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-muted font-medium">Completed</p>
              <h3 className="text-2xl font-black text-carbon mt-1">{completedTasks.length}</h3>
            </div>
            <div className="p-3 bg-moss border border-[#b5cea8] rounded-xl text-[#254622]">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="p-6 rounded-3xl bg-editor border border-divider shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-carbon">Overall Project Velocity</span>
            <span className="text-coral font-mono font-bold">{progressPercent}% Completed</span>
          </div>
          <div className="w-full h-3 rounded-full bg-paper overflow-hidden border border-divider">
            <div
              className="h-full bg-coral rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Two Columns: Recent Tasks & Team Quick View */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tasks Column */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-editor border border-divider shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-divider">
              <h3 className="text-sm font-bold text-carbon">Project Tasks</h3>
              <Link
                href={`/projects/${project.id}/tasks`}
                className="flex items-center gap-1 text-xs text-coral hover:text-[#d34628] font-bold transition"
              >
                <span>Open Kanban Board</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {tasks.slice(0, 5).map((t: any) => {
                const stat = STATUS_CONFIG[t.status] || STATUS_CONFIG.TODO;

                return (
                  <Link
                    key={t.id}
                    href={`/projects/${project.id}/tasks`}
                    className="p-3.5 rounded-xl bg-paper hover:bg-editor border border-divider hover:border-coral flex items-center justify-between transition group shadow-sm"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-coral">
                          {project.key}-{t.taskNumber}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-editor border border-divider text-muted">
                          v{t.version}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-carbon group-hover:text-coral transition">
                        {t.title}
                      </h4>
                    </div>

                    <span
                      className={cn(
                        "text-[10px] font-medium px-2 py-0.5 rounded-full border",
                        stat.bg,
                        stat.text,
                        stat.border
                      )}
                    >
                      {stat.label}
                    </span>
                  </Link>
                );
              })}

              {tasks.length === 0 && (
                <p className="text-xs text-muted italic py-8 text-center">
                  No tasks created in this project yet.
                </p>
              )}
            </div>
          </div>

          {/* Team Members Column */}
          <div className="p-6 rounded-3xl bg-editor border border-divider shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-divider">
              <h3 className="text-sm font-bold text-carbon">Project Members</h3>
              <Link
                href={`/projects/${project.id}/team`}
                className="flex items-center gap-1 text-xs text-coral hover:text-[#d34628] font-bold transition"
              >
                <span>Manage Team</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {members.map((m: any) => (
                <div
                  key={m.id}
                  className="p-2.5 rounded-xl bg-paper border border-divider flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={
                        m.user.avatarUrl ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.user.name}`
                      }
                      alt={m.user.name}
                      className="w-7 h-7 rounded-full object-cover bg-editor border border-divider"
                    />
                    <div>
                      <p className="font-bold text-carbon">{m.user.name}</p>
                      <p className="text-[10px] text-muted">{m.user.email}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-editor text-carbon border border-divider font-medium">
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
