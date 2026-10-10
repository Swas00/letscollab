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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-carbon/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-editor border border-coral/60 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header Banner */}
        <div className="bg-paper px-6 py-5 border-b border-divider flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-coral/15 border border-coral/30 rounded-xl text-coral">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black text-carbon flex items-center gap-2">
                Concurrent Update Conflict
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-coral text-white">
                  HTTP 409
                </span>
              </h2>
              <p className="text-xs text-muted mt-0.5 font-medium">
                Another team member saved changes while you were editing this task.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted hover:text-carbon rounded-lg hover:bg-paper transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto bg-editor">
          <div className="bg-periwinkle/40 border border-[#bec5ea] rounded-xl p-4 text-xs text-carbon">
            <p>
              Your edit was based on <strong className="text-coral">version {clientVersion}</strong>,
              but the server is now at <strong className="text-coral">version {serverVersion}</strong>.
              Review the differences below to avoid silently overwriting someone else&apos;s work.
            </p>
          </div>

          {/* Side by side comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Local Unsaved Changes */}
            <div className="p-4 rounded-xl border border-divider bg-paper space-y-3 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-divider">
                <span className="text-xs font-bold uppercase tracking-wider text-coral">
                  Your Changes (v{clientVersion})
                </span>
                <span className="text-[10px] text-muted font-mono">Unsaved Local</span>
              </div>

              <div>
                <span className="text-xs text-muted block mb-1 font-medium">Title:</span>
                <p className="text-sm font-bold text-carbon bg-editor p-2 rounded-lg border border-divider">
                  {localChanges.title || "(Unchanged)"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-xs text-muted block mb-1 font-medium">Status:</span>
                  <span
                    className={`inline-block text-xs px-2.5 py-1 rounded-md font-medium border ${
                      STATUS_CONFIG[localChanges.status]?.bg || "bg-paper"
                    } ${STATUS_CONFIG[localChanges.status]?.text || "text-carbon"} ${
                      STATUS_CONFIG[localChanges.status]?.border || "border-divider"
                    }`}
                  >
                    {STATUS_CONFIG[localChanges.status]?.label || localChanges.status || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted block mb-1 font-medium">Priority:</span>
                  <span
                    className={`inline-block text-xs px-2.5 py-1 rounded-md font-medium border ${
                      PRIORITY_CONFIG[localChanges.priority]?.bg || "bg-paper"
                    } ${PRIORITY_CONFIG[localChanges.priority]?.text || "text-carbon"} ${
                      PRIORITY_CONFIG[localChanges.priority]?.border || "border-divider"
                    }`}
                  >
                    {PRIORITY_CONFIG[localChanges.priority]?.label || localChanges.priority || "—"}
                  </span>
                </div>
              </div>

              {localChanges.description !== undefined && (
                <div>
                  <span className="text-xs text-muted block mb-1 font-medium">Description:</span>
                  <div className="text-xs text-carbon bg-editor p-2 rounded-lg border border-divider max-h-24 overflow-y-auto whitespace-pre-wrap">
                    {localChanges.description || "(Empty)"}
                  </div>
                </div>
              )}
            </div>

            {/* Current Server State */}
            <div className="p-4 rounded-xl border border-[#b5cea8] bg-moss/30 space-y-3 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-[#b5cea8]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#254622]">
                  Server State (v{serverVersion})
                </span>
                <span className="text-[10px] text-muted font-mono font-medium">Current Live</span>
              </div>

              <div>
                <span className="text-xs text-muted block mb-1 font-medium">Title:</span>
                <p className="text-sm font-bold text-carbon bg-editor p-2 rounded-lg border border-[#b5cea8]">
                  {serverTask.title}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-xs text-muted block mb-1 font-medium">Status:</span>
                  <span
                    className={`inline-block text-xs px-2.5 py-1 rounded-md font-medium border ${
                      STATUS_CONFIG[serverTask.status]?.bg || "bg-paper"
                    } ${STATUS_CONFIG[serverTask.status]?.text || "text-carbon"} ${
                      STATUS_CONFIG[serverTask.status]?.border || "border-divider"
                    }`}
                  >
                    {STATUS_CONFIG[serverTask.status]?.label || serverTask.status}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted block mb-1 font-medium">Priority:</span>
                  <span
                    className={`inline-block text-xs px-2.5 py-1 rounded-md font-medium border ${
                      PRIORITY_CONFIG[serverTask.priority]?.bg || "bg-paper"
                    } ${PRIORITY_CONFIG[serverTask.priority]?.text || "text-carbon"} ${
                      PRIORITY_CONFIG[serverTask.priority]?.border || "border-divider"
                    }`}
                  >
                    {PRIORITY_CONFIG[serverTask.priority]?.label || serverTask.priority}
                  </span>
                </div>
              </div>

              {serverTask.description && (
                <div>
                  <span className="text-xs text-muted block mb-1 font-medium">Description:</span>
                  <div className="text-xs text-carbon bg-editor p-2 rounded-lg border border-[#b5cea8] max-h-24 overflow-y-auto whitespace-pre-wrap">
                    {serverTask.description}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-paper border-t border-divider flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-muted hover:text-carbon rounded-xl transition"
          >
            Review Later / Cancel
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onReloadServer}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold bg-carbon hover:bg-[#353a34] text-paper rounded-xl transition shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Discard & Load Server Version
            </button>

            <button
              onClick={onForceOverwrite}
              disabled={isOverwriting}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold bg-coral hover:bg-[#d34628] disabled:opacity-50 text-white rounded-xl shadow-md shadow-coral/20 transition"
            >
              <Zap className="w-3.5 h-3.5" />
              {isOverwriting ? "Overwriting..." : "Force Overwrite"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
