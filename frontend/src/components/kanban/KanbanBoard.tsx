"use client";

import React from "react";
import { MessageSquare, Calendar, ArrowRight, ArrowLeft, Clock, ShieldAlert } from "lucide-react";
import { STATUS_CONFIG, PRIORITY_CONFIG, formatDate, cn } from "../../lib/utils";

const COLUMNS: { key: string; label: string }[] = [
  { key: "BACKLOG", label: "Backlog" },
  { key: "TODO", label: "To Do" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "IN_REVIEW", label: "In Review" },
  { key: "DONE", label: "Done" },
];

interface KanbanBoardProps {
  tasks: any[];
  projectKey: string;
  onTaskClick: (task: any) => void;
  onStatusChange: (taskId: string, newStatus: string, currentVersion: number) => void;
  canEdit?: boolean;
}

export function KanbanBoard({
  tasks,
  projectKey,
  onTaskClick,
  onStatusChange,
  canEdit = true,
}: KanbanBoardProps) {
  const getNextStatus = (currentStatus: string): string | null => {
    const idx = COLUMNS.findIndex((c) => c.key === currentStatus);
    if (idx !== -1 && idx < COLUMNS.length - 1) {
      return COLUMNS[idx + 1].key;
    }
    return null;
  };

  const getPrevStatus = (currentStatus: string): string | null => {
    const idx = COLUMNS.findIndex((c) => c.key === currentStatus);
    if (idx > 0) {
      return COLUMNS[idx - 1].key;
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((column) => {
        const columnTasks = tasks.filter((t) => t.status === column.key);
        const colConfig = STATUS_CONFIG[column.key];

        return (
          <div
            key={column.key}
            className="flex flex-col bg-[#0d0e15] border border-zinc-800/80 rounded-2xl p-3 min-w-[260px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-2 py-2 mb-2 border-b border-zinc-800/50">
              <div className="flex items-center gap-2">
                <span className={cn("w-2 h-2 rounded-full", colConfig?.dot || "bg-zinc-500")} />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  {column.label}
                </h3>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
                {columnTasks.length}
              </span>
            </div>

            {/* Task Cards Column List */}
            <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[75vh] pr-1">
              {columnTasks.map((task) => {
                const prio = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;
                const prev = getPrevStatus(task.status);
                const next = getNextStatus(task.status);

                return (
                  <div
                    key={task.id}
                    onClick={() => onTaskClick(task)}
                    className="group relative p-3.5 bg-zinc-900/90 hover:bg-zinc-900 border border-zinc-800/80 hover:border-indigo-500/50 rounded-xl cursor-pointer shadow-sm hover:shadow-glow transition-all duration-200"
                  >
                    {/* Top Row: Task Key & Version & Priority */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-mono font-bold text-indigo-400">
                          {projectKey}-{task.taskNumber}
                        </span>
                        <span
                          title={`Optimistic Locking Version: ${task.version}`}
                          className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50"
                        >
                          v{task.version}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "text-[10px] font-medium px-2 py-0.5 rounded-full border",
                          prio.bg,
                          prio.text,
                          prio.border
                        )}
                      >
                        {prio.label}
                      </span>
                    </div>

                    {/* Task Title */}
                    <h4 className="text-sm font-semibold text-zinc-100 group-hover:text-indigo-200 transition-colors line-clamp-2 mb-2">
                      {task.title}
                    </h4>

                    {/* Tags */}
                    {task.tags && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {task.tags.split(",").slice(0, 3).map((tag: string) => (
                          <span
                            key={tag}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700/40"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Card Footer: Assignee & Meta */}
                    <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800/60">
                      <div className="flex items-center gap-2">
                        {task.assignee ? (
                          <div className="flex items-center gap-1.5" title={`Assignee: ${task.assignee.name}`}>
                            <img
                              src={
                                task.assignee.avatarUrl ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assignee.name}`
                              }
                              alt={task.assignee.name}
                              className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 object-cover"
                            />
                            <span className="text-[11px] text-zinc-300 truncate max-w-[80px]">
                              {task.assignee.name.split(" ")[0]}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-zinc-500 italic">Unassigned</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2.5">
                        {task.dueDate && (
                          <div className="flex items-center gap-1 text-[11px] text-zinc-400" title="Due Date">
                            <Calendar className="w-3 h-3 text-zinc-500" />
                            <span>{formatDate(task.dueDate)}</span>
                          </div>
                        )}

                        {task._count?.comments > 0 && (
                          <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                            <MessageSquare className="w-3 h-3 text-zinc-500" />
                            <span>{task._count.comments}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Move Action Bar on Hover */}
                    {canEdit && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="mt-3 pt-2 border-t border-zinc-800/40 flex items-center justify-between"
                      >
                        {prev ? (
                          <button
                            onClick={() => onStatusChange(task.id, prev, task.version)}
                            title={`Move back to ${STATUS_CONFIG[prev]?.label}`}
                            className="p-1 text-zinc-500 hover:text-indigo-400 hover:bg-zinc-800 rounded transition"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span />
                        )}

                        <span className="text-[10px] text-zinc-500 font-mono">Move Status</span>

                        {next ? (
                          <button
                            onClick={() => onStatusChange(task.id, next, task.version)}
                            title={`Advance to ${STATUS_CONFIG[next]?.label}`}
                            className="p-1 text-zinc-500 hover:text-indigo-400 hover:bg-zinc-800 rounded transition"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {columnTasks.length === 0 && (
                <div className="py-10 text-center text-xs text-zinc-600 border border-dashed border-zinc-800 rounded-xl">
                  No tasks
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
