"use client";

import React from "react";
import { AlertTriangle, RefreshCw, Zap, X } from "lucide-react";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "../../lib/utils";

interface ConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverTask: any;
  localChanges: any;
  serverVersion: number;
  clientVersion: number;
  onReloadServer: () => void;
  onForceOverwrite: () => void;
  isOverwriting?: boolean;
}

export function ConflictModal({
  isOpen,
  onClose,
  serverTask,
  localChanges,
  serverVersion,
  clientVersion,
  onReloadServer,
  onForceOverwrite,
  isOverwriting = false,
}: ConflictModalProps) {
  if (!isOpen || !serverTask) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-zinc-900 border border-amber-600/40 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-amber-950/80 to-zinc-900 px-6 py-5 border-b border-amber-800/40 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Concurrent Update Conflict
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-900/60 text-amber-300 border border-amber-700/50">
                  HTTP 409
                </span>
              </h2>
              <p className="text-sm text-zinc-400 mt-0.5">
                Another team member saved changes while you were editing this task.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-4 text-sm text-amber-200">
            <p>
              Your edit was based on <strong className="text-amber-300">version {clientVersion}</strong>,
              but the server is now at <strong className="text-amber-300">version {serverVersion}</strong>.
              Review the differences below to avoid silently overwriting someone else&apos;s work.
            </p>
          </div>

          {/* Side by side comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Local Unsaved Changes */}
            <div className="p-4 rounded-xl border border-zinc-700/80 bg-zinc-950/60 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  Your Changes (v{clientVersion})
                </span>
                <span className="text-xs text-zinc-500">Unsaved Local</span>
              </div>

              <div>
                <span className="text-xs text-zinc-400 block mb-1">Title:</span>
                <p className="text-sm font-medium text-white bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                  {localChanges.title || "(Unchanged)"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-xs text-zinc-400 block mb-1">Status:</span>
                  <span
                    className={`inline-block text-xs px-2.5 py-1 rounded-md font-medium border ${
                      STATUS_CONFIG[localChanges.status]?.bg || "bg-zinc-800"
                    } ${STATUS_CONFIG[localChanges.status]?.text || "text-zinc-300"} ${
                      STATUS_CONFIG[localChanges.status]?.border || "border-zinc-700"
                    }`}
                  >
                    {STATUS_CONFIG[localChanges.status]?.label || localChanges.status || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-zinc-400 block mb-1">Priority:</span>
                  <span
                    className={`inline-block text-xs px-2.5 py-1 rounded-md font-medium border ${
                      PRIORITY_CONFIG[localChanges.priority]?.bg || "bg-zinc-800"
                    } ${PRIORITY_CONFIG[localChanges.priority]?.text || "text-zinc-300"} ${
                      PRIORITY_CONFIG[localChanges.priority]?.border || "border-zinc-700"
                    }`}
                  >
                    {PRIORITY_CONFIG[localChanges.priority]?.label || localChanges.priority || "—"}
                  </span>
                </div>
              </div>

              {localChanges.description !== undefined && (
                <div>
                  <span className="text-xs text-zinc-400 block mb-1">Description:</span>
                  <div className="text-xs text-zinc-300 bg-zinc-900 p-2 rounded-lg border border-zinc-800 max-h-24 overflow-y-auto whitespace-pre-wrap">
                    {localChanges.description || "(Empty)"}
                  </div>
                </div>
              )}
            </div>

            {/* Current Server State */}
            <div className="p-4 rounded-xl border border-indigo-700/60 bg-indigo-950/20 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-indigo-900/50">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  Server State (v{serverVersion})
                </span>
                <span className="text-xs text-indigo-300 font-mono">Current Live</span>
              </div>

              <div>
                <span className="text-xs text-zinc-400 block mb-1">Title:</span>
                <p className="text-sm font-medium text-white bg-zinc-900 p-2 rounded-lg border border-indigo-900/60">
                  {serverTask.title}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-xs text-zinc-400 block mb-1">Status:</span>
                  <span
                    className={`inline-block text-xs px-2.5 py-1 rounded-md font-medium border ${
                      STATUS_CONFIG[serverTask.status]?.bg || "bg-zinc-800"
                    } ${STATUS_CONFIG[serverTask.status]?.text || "text-zinc-300"} ${
                      STATUS_CONFIG[serverTask.status]?.border || "border-zinc-700"
                    }`}
                  >
                    {STATUS_CONFIG[serverTask.status]?.label || serverTask.status}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-zinc-400 block mb-1">Priority:</span>
                  <span
                    className={`inline-block text-xs px-2.5 py-1 rounded-md font-medium border ${
                      PRIORITY_CONFIG[serverTask.priority]?.bg || "bg-zinc-800"
                    } ${PRIORITY_CONFIG[serverTask.priority]?.text || "text-zinc-300"} ${
                      PRIORITY_CONFIG[serverTask.priority]?.border || "border-zinc-700"
                    }`}
                  >
                    {PRIORITY_CONFIG[serverTask.priority]?.label || serverTask.priority}
                  </span>
                </div>
              </div>

              {serverTask.description && (
                <div>
                  <span className="text-xs text-zinc-400 block mb-1">Description:</span>
                  <div className="text-xs text-zinc-300 bg-zinc-900 p-2 rounded-lg border border-indigo-900/60 max-h-24 overflow-y-auto whitespace-pre-wrap">
                    {serverTask.description}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-zinc-950 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition"
          >
            Review Later / Cancel
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onReloadServer}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg border border-zinc-700 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Discard & Load Server Version
            </button>

            <button
              onClick={onForceOverwrite}
              disabled={isOverwriting}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg shadow-lg shadow-amber-900/30 transition"
            >
              <Zap className="w-4 h-4" />
              {isOverwriting ? "Overwriting..." : "Force Overwrite"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
