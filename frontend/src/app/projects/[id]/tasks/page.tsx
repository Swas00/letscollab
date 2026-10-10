"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AppLayout } from "../../../../components/layout/AppLayout";
import { ProjectHeader } from "../../../../components/projects/ProjectHeader";
import { KanbanBoard } from "../../../../components/kanban/KanbanBoard";
import { TaskModal } from "../../../../components/tasks/TaskModal";
import { ConflictModal } from "../../../../components/tasks/ConflictModal";
import { useAuth } from "../../../../context/AuthContext";
import { useSocket } from "../../../../context/SocketContext";
import { api } from "../../../../lib/api";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  AlertCircle,
  X,
  CheckCircle2,
} from "lucide-react";
import { STATUS_CONFIG, PRIORITY_CONFIG, formatDate, cn } from "../../../../lib/utils";
import { Button } from "../../../../components/ui/Button";

export default function ProjectTasksPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { user } = useAuth();
  const { socket, joinProject, leaveProject } = useSocket();

  const [project, setProject] = useState<any>(null);
  const [userAccess, setUserAccess] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState("ALL");

  // Create Task Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState("MEDIUM");
  const [newStatus, setNewStatus] = useState("TODO");
  const [newAssigneeId, setNewAssigneeId] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newTags, setNewTags] = useState("");
  const [newEstHours, setNewEstHours] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Concurrency Conflict State
  const [conflictState, setConflictState] = useState<{
    isOpen: boolean;
    serverTask: any;
    localChanges: any;
    serverVersion: number;
    clientVersion: number;
  }>({
    isOpen: false,
    serverTask: null,
    localChanges: null,
    serverVersion: 1,
    clientVersion: 1,
  });

  const loadData = async () => {
    setIsLoading(true);
    const [pRes, tRes] = await Promise.all([
      api.projects.get(projectId),
      api.tasks.listByProject(projectId),
    ]);

    if (pRes.data?.project) {
      setProject(pRes.data.project);
      setUserAccess(pRes.data.userAccess);
    }
    if (tRes.data?.tasks) {
      setTasks(tRes.data.tasks);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!projectId) return;

    joinProject(projectId);
    loadData();

    return () => {
      leaveProject(projectId);
    };
  }, [projectId]);

  // Real-time synchronization
  useEffect(() => {
    if (!socket) return;

    const handleTaskCreated = (newTask: any) => {
      if (newTask.projectId === projectId) {
        setTasks((prev) => {
          if (prev.some((t) => t.id === newTask.id)) return prev;
          return [newTask, ...prev];
        });
      }
    };

    const handleTaskUpdated = (upTask: any) => {
      if (upTask.projectId === projectId) {
        setTasks((prev) =>
          prev.map((t) => (t.id === upTask.id ? { ...t, ...upTask } : t))
        );
      }
    };

    const handleTaskDeleted = ({ taskId }: { taskId: string }) => {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    };

    socket.on("task:created", handleTaskCreated);
    socket.on("task:updated", handleTaskUpdated);
    socket.on("task:deleted", handleTaskDeleted);

    return () => {
      socket.off("task:created", handleTaskCreated);
      socket.off("task:updated", handleTaskUpdated);
      socket.off("task:deleted", handleTaskDeleted);
    };
  }, [socket, projectId]);

  const handleStatusChange = async (taskId: string, newStatus: string, currentVersion: number) => {
    const res = await api.tasks.update(taskId, {
      status: newStatus,
      version: currentVersion,
    });

    if (res.status === 409) {
      const conflictData = res.data as any;
      const serverTask = conflictData?.serverTask;
      setConflictState({
        isOpen: true,
        serverTask,
        localChanges: { status: newStatus },
        serverVersion: conflictData?.currentVersion || currentVersion + 1,
        clientVersion: currentVersion,
      });
      return;
    }

    if (res.data?.task) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...res.data!.task } : t))
      );
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setCreateError(null);

    const payload = {
      title: newTitle,
      description: newDesc,
      status: newStatus,
      priority: newPriority,
      assigneeId: newAssigneeId || undefined,
      dueDate: newDueDate ? new Date(newDueDate).toISOString() : undefined,
      tags: newTags || undefined,
      estimatedHours: newEstHours ? Number(newEstHours) : undefined,
    };

    const res = await api.tasks.create(projectId, payload);
    setIsSubmitting(false);

    if (res.data?.task) {
      setIsCreateOpen(false);
      setNewTitle("");
      setNewDesc("");
      setNewAssigneeId("");
      setNewDueDate("");
      setNewTags("");
      setNewEstHours("");
      setTasks((prev) => [res.data!.task, ...prev]);
    } else {
      setCreateError(res.error || "Failed to create task");
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (priorityFilter !== "ALL" && t.priority !== priorityFilter) return false;
    if (assigneeFilter !== "ALL" && t.assigneeId !== assigneeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchTags = t.tags?.toLowerCase().includes(q);
      if (!matchTitle && !matchTags) return false;
    }
    return true;
  });

  const canCreate = user?.role !== "VIEWER";

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <ProjectHeader project={project} userAccess={userAccess} />

        {/* Toolbar: Filters, View Toggle & Create Task Button */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-4 bg-editor border border-divider rounded-2xl shadow-sm">
          {/* Search & Select Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks..."
                className="w-full pl-9 pr-3 py-2 bg-paper border border-divider rounded-xl text-xs text-carbon placeholder-muted focus:outline-none focus:border-coral focus:bg-editor"
              />
            </div>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 bg-paper border border-divider rounded-xl text-xs text-carbon focus:outline-none focus:border-coral focus:bg-editor font-medium"
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>

            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="px-3 py-2 bg-paper border border-divider rounded-xl text-xs text-carbon focus:outline-none focus:border-coral focus:bg-editor font-medium"
            >
              <option value="ALL">All Assignees</option>
              {project?.members?.map((m: any) => (
                <option key={m.userId} value={m.userId}>
                  {m.user.name}
                </option>
              ))}
            </select>
          </div>

          {/* Right Toolbar: View Toggle & Create Task */}
          <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
            <div className="flex items-center p-1 bg-paper border border-divider rounded-xl">
              <button
                onClick={() => setViewMode("kanban")}
                className={cn(
                  "p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5",
                  viewMode === "kanban"
                    ? "bg-carbon text-paper shadow-sm"
                    : "text-muted hover:text-carbon"
                )}
                title="Kanban Board View"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Board</span>
              </button>

              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5",
                  viewMode === "list"
                    ? "bg-carbon text-paper shadow-sm"
                    : "text-muted hover:text-carbon"
                )}
                title="List View"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>

            {canCreate && (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-coral hover:bg-[#d34628] text-white text-xs font-bold rounded-xl shadow-md shadow-coral/20 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Create Task</span>
              </button>
            )}
          </div>
        </div>

        {/* Board or List View */}
        {isLoading ? (
          <div className="p-16 text-center text-sm text-muted">Loading tasks...</div>
        ) : viewMode === "kanban" ? (
          <KanbanBoard
            tasks={filteredTasks}
            projectKey={project?.key || "TASK"}
            onTaskClick={(t) => setSelectedTaskId(t.id)}
            onStatusChange={handleStatusChange}
            canEdit={user?.role !== "VIEWER"}
          />
        ) : (
          /* List View */
          <div className="bg-editor border border-divider rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-paper text-muted uppercase font-mono border-b border-divider">
                  <tr>
                    <th className="py-3 px-4">Task</th>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Assignee</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Version</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {filteredTasks.map((t) => {
                    const stat = STATUS_CONFIG[t.status] || STATUS_CONFIG.TODO;
                    const prio = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.MEDIUM;

                    return (
                      <tr
                        key={t.id}
                        onClick={() => setSelectedTaskId(t.id)}
                        className="hover:bg-paper cursor-pointer transition"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-coral">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(t.id, t.status === "DONE" ? "TODO" : "DONE", t.version);
                              }}
                              title={t.status === "DONE" ? "Click to Reopen Task" : "Click to Mark Task as Completed"}
                              className={cn(
                                "p-1 rounded-full border transition-all duration-140 hover:scale-110 active:scale-95",
                                t.status === "DONE"
                                  ? "bg-moss border-[#b0c7ac] text-carbon shadow-xs"
                                  : "bg-paper border-divider text-muted hover:text-coral hover:border-coral"
                              )}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                            <span>{project?.key}-{t.taskNumber}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-bold text-carbon">{t.title}</td>
                        <td className="py-3 px-4">
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
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full border",
                              prio.bg,
                              prio.text,
                              prio.border
                            )}
                          >
                            {prio.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-carbon font-medium">
                          {t.assignee?.name || <span className="text-muted italic">Unassigned</span>}
                        </td>
                        <td className="py-3 px-4 text-muted">
                          {t.dueDate ? formatDate(t.dueDate) : "—"}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-muted">v{t.version}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-carbon/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-editor border border-divider rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-divider">
              <h2 className="text-lg font-bold text-carbon flex items-center gap-2">
                <Plus className="w-5 h-5 text-coral" />
                Create New Task
              </h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 text-muted hover:text-carbon rounded-lg hover:bg-paper transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-coral/15 border border-coral/30 rounded-xl flex items-center gap-2 text-xs text-coral font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-carbon block mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Implement WebSocket heartbeat clustering"
                  className="w-full px-3.5 py-2.5 bg-paper border border-divider rounded-xl text-xs text-carbon placeholder-muted focus:outline-none focus:border-coral focus:bg-editor"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-carbon block mb-1">Initial Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-paper border border-divider rounded-xl text-xs text-carbon focus:outline-none focus:border-coral focus:bg-editor font-medium"
                  >
                    <option value="BACKLOG">Backlog</option>
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-carbon block mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-paper border border-divider rounded-xl text-xs text-carbon focus:outline-none focus:border-coral focus:bg-editor font-medium"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-carbon block mb-1">Assignee</label>
                  <select
                    value={newAssigneeId}
                    onChange={(e) => setNewAssigneeId(e.target.value)}
                    className="w-full px-3 py-2 bg-paper border border-divider rounded-xl text-xs text-carbon focus:outline-none focus:border-coral focus:bg-editor font-medium"
                  >
                    <option value="">Unassigned</option>
                    {project?.members?.map((m: any) => (
                      <option key={m.userId} value={m.userId}>
                        {m.user.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-carbon block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-paper border border-divider rounded-xl text-xs text-carbon focus:outline-none focus:border-coral focus:bg-editor font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-carbon block mb-1">Tags</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="Backend, API, Urgent"
                  className="w-full px-3.5 py-2 bg-paper border border-divider rounded-xl text-xs text-carbon placeholder-muted focus:outline-none focus:border-coral focus:bg-editor"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-carbon block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Requirements and notes..."
                  className="w-full px-3.5 py-2.5 bg-paper border border-divider rounded-xl text-xs text-carbon placeholder-muted focus:outline-none focus:border-coral focus:bg-editor"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-muted hover:text-carbon transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-coral hover:bg-[#d34628] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-md shadow-coral/20"
                >
                  {isSubmitting ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      <TaskModal
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onTaskUpdated={(up) => {
          setTasks((prev) => prev.map((t) => (t.id === up.id ? { ...t, ...up } : t)));
        }}
        onTaskDeleted={(delId) => {
          setTasks((prev) => prev.filter((t) => t.id !== delId));
        }}
      />

      {/* Concurrency Conflict Resolution Modal */}
      <ConflictModal
        isOpen={conflictState.isOpen}
        onClose={() => setConflictState((prev) => ({ ...prev, isOpen: false }))}
        serverTask={conflictState.serverTask}
        localChanges={conflictState.localChanges}
        serverVersion={conflictState.serverVersion}
        clientVersion={conflictState.clientVersion}
        onReloadServer={() => {
          setConflictState((prev) => ({ ...prev, isOpen: false }));
          loadData();
        }}
        onForceOverwrite={async () => {
          if (!conflictState.serverTask) return;
          await api.tasks.update(conflictState.serverTask.id, {
            ...conflictState.localChanges,
            forceOverwrite: true,
          });
          setConflictState((prev) => ({ ...prev, isOpen: false }));
          loadData();
        }}
      />
    </AppLayout>
  );
}
