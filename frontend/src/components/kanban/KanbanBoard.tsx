"use client";

import React from "react";
import { MessageSquare, Calendar, ArrowRight, ArrowLeft, CheckCircle2, RotateCcw } from "lucide-react";
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
            className="flex flex-col bg-paper border border-divider rounded-2xl p-3 min-w-[260px] shadow-sm"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-2 py-2 mb-2 border-b border-divider">
              <div className="flex items-center gap-2">
                <span className={cn("w-2.5 h-2.5 rounded-full", colConfig?.dot || "bg-muted")} />
                <h3 className="text-xs font-bold uppercase tracking-wider text-carbon">
                  {column.label}
                </h3>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-editor border border-divider text-muted font-medium">
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
                    className="group relative p-3.5 bg-editor hover:bg-[#FAF8F2] border border-divider hover:border-carbon/30 rounded-xl cursor-pointer shadow-xs hover:shadow-md transition-all duration-160 ease-out hover:-translate-y-1 active:scale-[0.99]"
                  >
                    {/* Top Row: Task Key & Version & Priority */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-mono font-bold text-coral">
                          {projectKey}-{task.taskNumber}
                        </span>
                        <span
                          title={`Optimistic Locking Version: ${task.version}`}
                          className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-paper text-muted border border-divider font-medium"
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
                    <h4 className="text-sm font-bold text-carbon group-hover:text-coral transition-colors line-clamp-2 mb-2">
                      {task.title}
                    </h4>

                    {/* Tags */}
                    {task.tags && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {task.tags.split(",").slice(0, 3).map((tag: string) => (
                          <span
                            key={tag}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-paper text-muted border border-divider font-medium"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Card Footer: Assignee & Meta */}
                    <div className="flex items-center justify-between text-xs text-muted pt-2 border-t border-divider">
                      <div className="flex items-center gap-2">
                        {task.assignee ? (
                          <div className="flex items-center gap-1.5" title={`Assignee: ${task.assignee.name}`}>
                            <img
                              src={
                                task.assignee.avatarUrl ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assignee.name}`
                              }
                              alt={task.assignee.name}
                              className="w-5 h-5 rounded-full bg-paper border border-divider object-cover"
                            />
                            <span className="text-[11px] text-carbon font-semibold truncate max-w-[80px]">
                              {task.assignee.name.split(" ")[0]}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted italic">Unassigned</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2.5">
                        {task.dueDate && (
                          <div className="flex items-center gap-1 text-[11px] text-muted font-medium" title="Due Date">
                            <Calendar className="w-3 h-3 text-muted" />
                            <span>{formatDate(task.dueDate)}</span>
                          </div>
                        )}

                        {task._count?.comments > 0 && (
                          <div className="flex items-center gap-1 text-[11px] text-muted font-medium">
                            <MessageSquare className="w-3 h-3 text-muted" />
                            <span>{task._count.comments}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Move Action Bar on Hover */}
                    {canEdit && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="mt-3 pt-2 border-t border-divider flex items-center justify-between gap-1"
                      >
                        {prev ? (
                          <button
                            onClick={() => onStatusChange(task.id, prev, task.version)}
                            title={`Move back to ${STATUS_CONFIG[prev]?.label}`}
                            className="p-1 text-muted hover:text-carbon hover:bg-paper rounded transition-all duration-140 hover:-translate-x-0.5"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <div className="w-5" />
                        )}

                        {task.status !== "DONE" ? (
                          <button
                            onClick={() => onStatusChange(task.id, "DONE", task.version)}
                            title="Complete and mark task as Done"
                            className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-carbon hover:text-carbon bg-moss/80 hover:bg-moss rounded-md border border-[#bfd2bc] transition-all duration-140 hover:-translate-y-0.5 active:scale-95 shadow-xs"
                          >
                            <CheckCircle2 className="w-3 h-3 text-[#396336]" />
                            <span>Mark Done</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onStatusChange(task.id, "TODO", task.version)}
                            title="Reopen task"
                            className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-muted hover:text-carbon bg-paper hover:bg-[#e8e4d8] rounded-md border border-divider transition-all duration-140 hover:-translate-y-0.5 active:scale-95 shadow-xs"
                          >
                            <RotateCcw className="w-3 h-3 text-muted" />
                            <span>Reopen</span>
                          </button>
                        )}

                        {next ? (
                          <button
                            onClick={() => onStatusChange(task.id, next, task.version)}
                            title={`Advance to ${STATUS_CONFIG[next]?.label}`}
                            className="p-1 text-muted hover:text-coral hover:bg-paper rounded transition-all duration-140 hover:translate-x-0.5"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <div className="w-5" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {columnTasks.length === 0 && (
                <div className="py-10 text-center text-xs text-muted italic border border-dashed border-divider rounded-xl">
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
