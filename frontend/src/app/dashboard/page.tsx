"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "../../components/layout/AppLayout";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { DashboardCharts } from "../../components/charts/DashboardCharts";
import { TaskModal } from "../../components/tasks/TaskModal";
import { api } from "../../lib/api";
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  Activity,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import {
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  ROLE_CONFIG,
  formatRelativeTime,
  cn,
} from "../../lib/utils";

export default function DashboardPage() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = async () => {
    setIsLoading(true);
    const [pRes, actRes] = await Promise.all([
      api.projects.list(),
      api.activity.list({ limit: 12 }),
    ]);

    if (pRes.data?.projects) {
      setProjects(pRes.data.projects);

      // Collect all tasks from user's projects
      const allTasks: any[] = [];
      for (const proj of pRes.data.projects) {
        const tRes = await api.tasks.listByProject(proj.id);
        if (tRes.data?.tasks) {
          allTasks.push(
            ...tRes.data.tasks.map((t: any) => ({ ...t, projectKey: proj.key }))
          );
        }
      }
      setTasks(allTasks);
    }

    if (actRes.data?.activities) {
      setActivities(actRes.data.activities);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, [user?.id]);

  // Real-time activity and task updates via socket
  useEffect(() => {
    if (!socket) return;

    const handleNewActivity = (act: any) => {
      setActivities((prev) => [act, ...prev.slice(0, 15)]);
    };

    const handleTaskUpdated = (updatedTask: any) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t))
      );
    };

    const handleTaskCreated = (newTask: any) => {
      setTasks((prev) => [newTask, ...prev]);
    };

    socket.on("activity:new", handleNewActivity);
    socket.on("task:updated", handleTaskUpdated);
    socket.on("task:created", handleTaskCreated);

    return () => {
      socket.off("activity:new", handleNewActivity);
      socket.off("task:updated", handleTaskUpdated);
      socket.off("task:created", handleTaskCreated);
    };
  }, [socket]);

  // Compute Metrics
  const activeProjectsCount = projects.filter((p) => p.status === "ACTIVE").length;
  const myAssignedTasks = tasks.filter((t) => t.assigneeId === user?.id);
  const inProgressCount = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const completedCount = tasks.filter((t) => t.status === "DONE").length;

  // Chart Data preparation using exact palette
  const statusCounts: Record<string, number> = {
    BACKLOG: 0,
    TODO: 0,
    IN_PROGRESS: 0,
    IN_REVIEW: 0,
    DONE: 0,
  };
  tasks.forEach((t) => {
    if (statusCounts[t.status] !== undefined) statusCounts[t.status]++;
  });

  const statusChartData = [
    { name: "Backlog", count: statusCounts.BACKLOG, color: "#686D64" },
    { name: "To Do", count: statusCounts.TODO, color: "#D8DDF5" },
    { name: "In Progress", count: statusCounts.IN_PROGRESS, color: "#E65F42" },
    { name: "In Review", count: statusCounts.IN_REVIEW, color: "#D9E7D5" },
    { name: "Done", count: statusCounts.DONE, color: "#3B5A38" },
  ];

  const priorityCounts: Record<string, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 };
  tasks.forEach((t) => {
    if (priorityCounts[t.priority] !== undefined) priorityCounts[t.priority]++;
  });

  const priorityChartData = [
    { name: "Urgent", count: priorityCounts.URGENT, color: "#E65F42" },
    { name: "High", count: priorityCounts.HIGH, color: "#ee7f67" },
    { name: "Medium", count: priorityCounts.MEDIUM, color: "#D8DDF5" },
    { name: "Low", count: priorityCounts.LOW, color: "#686D64" },
  ];

  return (
    <AppLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-editor border border-divider shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-carbon tracking-tight">
                Welcome, {user?.name || "Collaborator"}
              </h1>
              {user && (
                <span
                  className={cn(
                    "text-xs px-2.5 py-0.5 rounded-full font-semibold border",
                    ROLE_CONFIG[user.role]?.badge || "bg-paper text-carbon border-divider"
                  )}
                >
                  {ROLE_CONFIG[user.role]?.label || user.role}
                </span>
              )}
            </div>
            <p className="text-xs text-muted">
              {ROLE_CONFIG[user?.role || ""]?.description ||
                "Real-time project overview and team velocity."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/projects"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-carbon hover:bg-[#353a34] text-paper text-xs font-bold shadow-md transition"
            >
              <span>Explore Projects</span>
              <ArrowUpRight className="w-4 h-4 text-paper" />
            </Link>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <section aria-label="Key Performance Indicators" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-editor border border-divider shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-muted font-medium">Active Projects</p>
              <p className="text-2xl font-black text-carbon mt-1">{activeProjectsCount}</p>
            </div>
            <div className="p-3 bg-periwinkle border border-[#bec5ea] rounded-xl text-carbon" aria-hidden="true">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-editor border border-divider shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-muted font-medium">Assigned to Me</p>
              <p className="text-2xl font-black text-carbon mt-1">{myAssignedTasks.length}</p>
            </div>
            <div className="p-3 bg-moss border border-[#b5cea8] rounded-xl text-carbon" aria-hidden="true">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-editor border border-divider shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-muted font-medium">In Progress</p>
              <p className="text-2xl font-black text-carbon mt-1">{inProgressCount}</p>
            </div>
            <div className="p-3 bg-coral/15 border border-coral/30 rounded-xl text-coral" aria-hidden="true">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-editor border border-divider shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-muted font-medium">Tasks Completed</p>
              <p className="text-2xl font-black text-carbon mt-1">{completedCount}</p>
            </div>
            <div className="p-3 bg-moss border border-[#b5cea8] rounded-xl text-[#254622]" aria-hidden="true">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </section>

        {/* Charts Section */}
        <section aria-labelledby="analytics-heading">
          <h2 id="analytics-heading" className="sr-only">Project Analytics & Breakdown</h2>
          <DashboardCharts statusData={statusChartData} priorityData={priorityChartData} />
        </section>

        {/* Two Column Split: My Tasks & Live Activity Stream */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Tasks List */}
          <section aria-labelledby="assigned-tasks-heading" className="p-6 rounded-3xl bg-editor border border-divider shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 id="assigned-tasks-heading" className="text-sm font-bold text-carbon">My Assigned Tasks</h2>
                <p className="text-xs text-muted">Direct work items requiring your attention</p>
              </div>
              <span className="text-xs text-muted font-mono">
                {myAssignedTasks.length} tasks
              </span>
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {myAssignedTasks.map((t) => {
                const stat = STATUS_CONFIG[t.status] || STATUS_CONFIG.TODO;

                return (
                  <div
                    key={t.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open task ${t.projectKey || "TSK"}-${t.taskNumber}: ${t.title}`}
                    onClick={() => setSelectedTaskId(t.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedTaskId(t.id);
                      }
                    }}
                    className="p-3.5 rounded-xl bg-paper hover:bg-editor border border-divider hover:border-coral cursor-pointer transition-all duration-150 ease-out hover:-translate-y-0.5 active:scale-[0.99] flex items-center justify-between group shadow-xs focus-visible:outline-coral"
                  >
                    <div className="space-y-1 min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-coral">
                          {t.projectKey || "TSK"}-{t.taskNumber}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-editor border border-divider text-muted">
                          v{t.version}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-carbon group-hover:text-coral transition truncate">
                        {t.title}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full border",
                          stat.bg,
                          stat.text,
                          stat.border
                        )}
                      >
                        {stat.label}
                      </span>
                    </div>
                  </div>
                );
              })}

              {myAssignedTasks.length === 0 && (
                <div className="py-12 text-center text-xs text-muted italic">
                  No tasks currently assigned to you.
                </div>
              )}
            </div>
          </section>

          {/* Real-time Activity Stream */}
          <section aria-labelledby="activity-feed-heading" className="p-6 rounded-3xl bg-editor border border-divider shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-coral" aria-hidden="true" />
                <h2 id="activity-feed-heading" className="text-sm font-bold text-carbon">Live Activity Feed</h2>
              </div>
              <span className="text-[11px] text-muted font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-moss border border-[#3B5A38]" aria-hidden="true" />
                Real-time
              </span>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {activities.map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl bg-paper border border-divider flex items-start gap-3 text-xs animate-activity-slide transition-colors duration-140 hover:bg-editor"
                >
                  <img
                    src={
                      act.user?.avatarUrl ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${act.user?.name || "System"}`
                    }
                    alt={act.user?.name || "User"}
                    className="w-6 h-6 rounded-full object-cover mt-0.5 border border-divider"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-carbon truncate">
                        {act.user?.name || "System"}
                      </p>
                      <span className="text-[10px] text-muted shrink-0">
                        {formatRelativeTime(act.createdAt)}
                      </span>
                    </div>
                    <p className="text-muted mt-0.5 text-[11px]">
                      <span className="font-mono text-coral font-semibold">{act.action}</span>
                      {act.project && ` in [${act.project.key}]`}
                    </p>
                  </div>
                </div>
              ))}

              {activities.length === 0 && (
                <div className="py-12 text-center text-xs text-muted italic">
                  No recent activity recorded.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Task Details Modal */}
      <TaskModal
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onTaskUpdated={() => loadDashboardData()}
      />
    </AppLayout>
  );
}
