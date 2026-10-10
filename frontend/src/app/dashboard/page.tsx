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
  AlertCircle,
  Activity,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import {
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  ROLE_CONFIG,
  formatDate,
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

  // Chart Data preparation
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
    { name: "Backlog", count: statusCounts.BACKLOG, color: "#71717a" },
    { name: "To Do", count: statusCounts.TODO, color: "#3b82f6" },
    { name: "In Progress", count: statusCounts.IN_PROGRESS, color: "#f59e0b" },
    { name: "In Review", count: statusCounts.IN_REVIEW, color: "#a855f7" },
    { name: "Done", count: statusCounts.DONE, color: "#10b981" },
  ];

  const priorityCounts: Record<string, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 };
  tasks.forEach((t) => {
    if (priorityCounts[t.priority] !== undefined) priorityCounts[t.priority]++;
  });

  const priorityChartData = [
    { name: "Urgent", count: priorityCounts.URGENT, color: "#f43f5e" },
    { name: "High", count: priorityCounts.HIGH, color: "#f59e0b" },
    { name: "Medium", count: priorityCounts.MEDIUM, color: "#38bdf8" },
    { name: "Low", count: priorityCounts.LOW, color: "#71717a" },
  ];

  return (
    <AppLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-indigo-950/40 border border-zinc-800 shadow-card">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-white tracking-tight">
                Welcome, {user?.name || "Collaborator"}
              </h1>
              {user && (
                <span
                  className={cn(
                    "text-xs px-2.5 py-0.5 rounded-full font-semibold border",
                    ROLE_CONFIG[user.role]?.badge || "bg-zinc-800 text-zinc-300"
                  )}
                >
                  {ROLE_CONFIG[user.role]?.label || user.role}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400">
              {ROLE_CONFIG[user?.role || ""]?.description ||
                "Real-time project overview and team velocity."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/projects"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
            >
              <span>Explore Projects</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#0d0e15] border border-zinc-800/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 font-medium">Active Projects</p>
              <h3 className="text-2xl font-black text-white mt-1">{activeProjectsCount}</h3>
            </div>
            <div className="p-3 bg-indigo-950/60 border border-indigo-800/50 rounded-xl text-indigo-400">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0d0e15] border border-zinc-800/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 font-medium">Assigned to Me</p>
              <h3 className="text-2xl font-black text-white mt-1">{myAssignedTasks.length}</h3>
            </div>
            <div className="p-3 bg-blue-950/60 border border-blue-800/50 rounded-xl text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0d0e15] border border-zinc-800/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 font-medium">In Progress</p>
              <h3 className="text-2xl font-black text-white mt-1">{inProgressCount}</h3>
            </div>
            <div className="p-3 bg-amber-950/60 border border-amber-800/50 rounded-xl text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0d0e15] border border-zinc-800/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 font-medium">Tasks Completed</p>
              <h3 className="text-2xl font-black text-white mt-1">{completedCount}</h3>
            </div>
            <div className="p-3 bg-emerald-950/60 border border-emerald-800/50 rounded-xl text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <DashboardCharts statusData={statusChartData} priorityData={priorityChartData} />

        {/* Two Column Split: My Tasks & Live Activity Stream */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Tasks List */}
          <div className="p-6 rounded-3xl bg-[#0d0e15] border border-zinc-800/80 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">My Assigned Tasks</h3>
                <p className="text-xs text-zinc-400">Direct work items requiring your attention</p>
              </div>
              <span className="text-xs text-zinc-500 font-mono">
                {myAssignedTasks.length} tasks
              </span>
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {myAssignedTasks.map((t) => {
                const prio = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.MEDIUM;
                const stat = STATUS_CONFIG[t.status] || STATUS_CONFIG.TODO;

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTaskId(t.id)}
                    className="p-3.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-indigo-500/50 cursor-pointer transition flex items-center justify-between group"
                  >
                    <div className="space-y-1 min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-indigo-400">
                          {t.projectKey || "TSK"}-{t.taskNumber}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                          v{t.version}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-white group-hover:text-indigo-200 transition truncate">
                        {t.title}
                      </h4>
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
                <div className="py-12 text-center text-xs text-zinc-500 italic">
                  No tasks currently assigned to you.
                </div>
              )}
            </div>
          </div>

          {/* Real-time Activity Stream */}
          <div className="p-6 rounded-3xl bg-[#0d0e15] border border-zinc-800/80 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Live Activity Feed</h3>
              </div>
              <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Real-time
              </span>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {activities.map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/60 flex items-start gap-3 text-xs"
                >
                  <img
                    src={
                      act.user?.avatarUrl ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${act.user?.name || "System"}`
                    }
                    alt={act.user?.name || "User"}
                    className="w-6 h-6 rounded-full object-cover mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-zinc-200 truncate">
                        {act.user?.name || "System"}
                      </p>
                      <span className="text-[10px] text-zinc-500 shrink-0">
                        {formatRelativeTime(act.createdAt)}
                      </span>
                    </div>
                    <p className="text-zinc-400 mt-0.5 text-[11px]">
                      <span className="font-mono text-indigo-400">{act.action}</span>
                      {act.project && ` in [${act.project.key}]`}
                    </p>
                  </div>
                </div>
              ))}

              {activities.length === 0 && (
                <div className="py-12 text-center text-xs text-zinc-500 italic">
                  No recent activity recorded.
                </div>
              )}
            </div>
          </div>
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
