"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Trash2,
  Save,
  MessageSquare,
  Clock,
  Calendar,
  User as UserIcon,
  Tag,
  AlertCircle,
  Eye,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { api } from "../../lib/api";
import { ConflictModal } from "./ConflictModal";
import {
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  ROLE_CONFIG,
  formatDate,
  formatRelativeTime,
  cn,
} from "../../lib/utils";

interface TaskModalProps {
  taskId: string | null;
  onClose: () => void;
  onTaskUpdated?: (updatedTask: any) => void;
  onTaskDeleted?: (deletedTaskId: string) => void;
}

export function TaskModal({ taskId, onClose, onTaskUpdated, onTaskDeleted }: TaskModalProps) {
  const { user } = useAuth();
  const { broadcastViewingTask, activeViewers } = useSocket();

  const [task, setTask] = useState<any>(null);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("TODO");
  const [priority, setPriority] = useState("MEDIUM");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [tags, setTags] = useState("");
  const [estimatedHours, setEstimatedHours] = useState<number | "">("");

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

  const fetchTaskDetails = async (id: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    const res = await api.tasks.get(id);

    if (res.data?.task) {
      const t = res.data.task;
      setTask(t);
      setTitle(t.title);
      setDescription(t.description || "");
      setStatus(t.status);
      setPriority(t.priority);
      setAssigneeId(t.assigneeId || null);
      setDueDate(t.dueDate ? new Date(t.dueDate).toISOString().split("T")[0] : "");
      setTags(t.tags || "");
      setEstimatedHours(t.estimatedHours || "");
      setComments(t.comments || []);

      // Fetch project members for assignee dropdown
      if (t.projectId) {
        api.projects.get(t.projectId).then((pRes) => {
          if (pRes.data?.project?.members) {
            setProjectMembers(pRes.data.project.members);
          }
        });
      }

      // Broadcast viewing presence to connected collaborators
      broadcastViewingTask(t.id);
    } else {
      setErrorMsg(res.error || "Failed to load task");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (taskId) {
      fetchTaskDetails(taskId);
    }
  }, [taskId]);

  const handleSave = async (forceOverwrite = false) => {
    if (!task) return;
    setIsSaving(true);
    setErrorMsg(null);

    const payload = {
      title,
      description,
      status,
      priority,
      assigneeId: assigneeId || null,
      dueDate: dueDate || null,
      tags: tags || null,
      estimatedHours: estimatedHours === "" ? null : Number(estimatedHours),
      version: task.version, // OPTIMISTIC CONCURRENCY CONTROL
      forceOverwrite,
    };

    const res = await api.tasks.update(task.id, payload);

    if (res.status === 409 && res.conflictData) {
      // 409 CONFLICT DETECTED!
      setConflictState({
        isOpen: true,
        serverTask: res.conflictData.currentTask,
        localChanges: payload,
        serverVersion: res.conflictData.serverVersion,
        clientVersion: res.conflictData.clientVersion,
      });
      setIsSaving(false);
      return;
    }

    if (res.data?.task) {
      setTask(res.data.task);
      setConflictState((prev) => ({ ...prev, isOpen: false }));
      if (onTaskUpdated) onTaskUpdated(res.data.task);
    } else {
      setErrorMsg(res.error || "Update failed");
    }

    setIsSaving(false);
  };

  const handleReloadServer = () => {
    if (conflictState.serverTask) {
      const st = conflictState.serverTask;
      setTask(st);
      setTitle(st.title);
      setDescription(st.description || "");
      setStatus(st.status);
      setPriority(st.priority);
      setAssigneeId(st.assigneeId || null);
      setDueDate(st.dueDate ? new Date(st.dueDate).toISOString().split("T")[0] : "");
      setTags(st.tags || "");
      setEstimatedHours(st.estimatedHours || "");
    }
    setConflictState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleDeleteTask = async () => {
    if (!task) return;
    if (!confirm("Are you sure you want to delete this task?")) return;

    const res = await api.tasks.delete(task.id);
    if (res.error) {
      setErrorMsg(res.error);
    } else {
      if (onTaskDeleted) onTaskDeleted(task.id);
      onClose();
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !task) return;

    const res = await api.comments.create(task.id, newComment.trim());
    if (res.data?.comment) {
      const createdComment = res.data.comment;
      setComments((prev) => [...prev, createdComment]);
      setNewComment("");
    } else {
      setErrorMsg(res.error || "Failed to post comment");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const res = await api.comments.delete(commentId);
    if (!res.error) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } else {
      setErrorMsg(res.error);
    }
  };

  if (!taskId) return null;

  const isViewer = user?.role === "VIEWER";
  const viewers = activeViewers[taskId] || [];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
        <div className="relative w-full max-w-4xl bg-[#0d0e15] border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
            <div className="flex items-center gap-3">
              {task && (
                <>
                  <span className="text-sm font-mono font-bold text-indigo-400">
                    {task.project?.key}-{task.taskNumber}
                  </span>
                  <span
                    title="Optimistic Locking Version counter"
                    className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700"
                  >
                    version {task.version}
                  </span>
                </>
              )}
              {viewers.length > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-950/60 border border-indigo-700/50 text-indigo-300 text-xs">
                  <Eye className="w-3.5 h-3.5 animate-pulse" />
                  <span>Viewing: {viewers.join(", ")}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {user?.role !== "VIEWER" && user?.role !== "TEAM_MEMBER" && (
                <button
                  onClick={handleDeleteTask}
                  title="Delete Task"
                  className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-zinc-900 rounded-xl transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="px-6 py-3 bg-rose-950/40 border-b border-rose-900/60 flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isLoading ? (
            <div className="p-12 text-center text-sm text-zinc-500">Loading task details...</div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Task Properties & Editor */}
              <div className="lg:col-span-2 space-y-5">
                {/* Task Title */}
                <div>
                  <label className="text-xs text-zinc-400 font-medium block mb-1.5">Task Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isViewer}
                    className="w-full px-3.5 py-2.5 bg-zinc-900/90 border border-zinc-700/80 rounded-xl text-white font-medium text-base focus:outline-none focus:border-indigo-500 transition disabled:opacity-60"
                  />
                </div>

                {/* Status & Priority Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-zinc-400 font-medium block mb-1.5">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      disabled={isViewer}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                    >
                      <option value="BACKLOG">Backlog</option>
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="IN_REVIEW">In Review</option>
                      <option value="DONE">Done</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-zinc-400 font-medium block mb-1.5">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      disabled={isViewer}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>

                {/* Assignee, Due Date & Estimated Hours */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-zinc-400 font-medium block mb-1.5">Assignee</label>
                    <select
                      value={assigneeId || ""}
                      onChange={(e) => setAssigneeId(e.target.value || null)}
                      disabled={isViewer}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                    >
                      <option value="">Unassigned</option>
                      {projectMembers.map((m) => (
                        <option key={m.userId} value={m.userId}>
                          {m.user.name} ({m.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-zinc-400 font-medium block mb-1.5">Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      disabled={isViewer}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-zinc-400 font-medium block mb-1.5">Est. Hours</label>
                    <input
                      type="number"
                      step="0.5"
                      value={estimatedHours}
                      onChange={(e) => setEstimatedHours(e.target.value ? Number(e.target.value) : "")}
                      disabled={isViewer}
                      placeholder="e.g. 8"
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="text-xs text-zinc-400 font-medium block mb-1.5">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    disabled={isViewer}
                    placeholder="Backend, API, Security"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs text-zinc-400 font-medium block mb-1.5">Description</label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isViewer}
                    placeholder="Provide details and specifications..."
                    className="w-full px-3.5 py-2.5 bg-zinc-900/90 border border-zinc-700/80 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                  />
                </div>

                {/* Save Button */}
                {!isViewer && (
                  <button
                    onClick={() => handleSave(false)}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                  </button>
                )}
              </div>

              {/* Right Column: Comments & Real-time Collaboration */}
              <div className="border-t lg:border-t-0 lg:border-l border-zinc-800/80 lg:pl-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Comments ({comments.length})
                    </h3>
                  </div>

                  {/* Comments Feed */}
                  <div className="space-y-3.5 my-4 max-h-72 overflow-y-auto pr-1">
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="p-3 bg-zinc-900/80 border border-zinc-800/80 rounded-xl text-xs space-y-1.5 group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img
                              src={
                                comment.user.avatarUrl ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user.name}`
                              }
                              alt={comment.user.name}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                            <span className="font-semibold text-zinc-200">{comment.user.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-zinc-500">
                              {formatRelativeTime(comment.createdAt)}
                            </span>
                            {(user?.id === comment.userId ||
                              user?.role === "ADMIN" ||
                              user?.role === "PROJECT_MANAGER") && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 transition"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </div>
                    ))}

                    {comments.length === 0 && (
                      <p className="text-xs text-zinc-500 italic py-6 text-center">
                        No comments yet. Mention team members with @Name!
                      </p>
                    )}
                  </div>
                </div>

                {/* New Comment Input */}
                {!isViewer && (
                  <form onSubmit={handlePostComment} className="pt-3 border-t border-zinc-800">
                    <div className="text-[10px] text-zinc-500 mb-1">
                      Tip: Use @Name to notify a collaborator
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="submit"
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition"
                      >
                        Send
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Concurrent Update Conflict Resolution Modal */}
      <ConflictModal
        isOpen={conflictState.isOpen}
        onClose={() => setConflictState((prev) => ({ ...prev, isOpen: false }))}
        serverTask={conflictState.serverTask}
        localChanges={conflictState.localChanges}
        serverVersion={conflictState.serverVersion}
        clientVersion={conflictState.clientVersion}
        onReloadServer={handleReloadServer}
        onForceOverwrite={() => handleSave(true)}
      />
    </>
  );
}
