"use client";

import React from "react";
import { cn } from "../../lib/utils";
import { Tooltip } from "./Tooltip";
import { Check, Loader2, AlertCircle, WifiOff } from "lucide-react";

export type SyncState = "Connecting" | "Synced" | "Saving" | "Offline" | "Error";

interface SyncStatusBadgeProps {
  state: SyncState;
  lastSynced?: Date | null;
  className?: string;
  errorMessage?: string;
}

export function SyncStatusBadge({
  state,
  lastSynced,
  className,
  errorMessage,
}: SyncStatusBadgeProps) {
  const configs: Record<
    SyncState,
    {
      dotColor: string;
      label: string;
      description: string;
      icon: React.ReactNode;
      isPulse?: boolean;
    }
  > = {
    Connecting: {
      dotColor: "bg-periwinkle-dark border border-periwinkle",
      label: "Connecting",
      description: "Establishing live WebSocket channel with server...",
      icon: <Loader2 className="w-2.5 h-2.5 animate-spin text-periwinkle-dark" />,
      isPulse: true,
    },
    Synced: {
      dotColor: "bg-[#3B5A38]",
      label: "Synced",
      description: lastSynced
        ? `All edits synchronized live (${lastSynced.toLocaleTimeString()})`
        : "All edits synchronized live",
      icon: <Check className="w-2.5 h-2.5 text-[#3B5A38]" />,
    },
    Saving: {
      dotColor: "bg-coral",
      label: "Saving",
      description: "Persisting changes to server storage...",
      icon: <Loader2 className="w-2.5 h-2.5 animate-spin text-coral" />,
      isPulse: true,
    },
    Offline: {
      dotColor: "bg-muted",
      label: "Offline",
      description: "Disconnected from server. Edits buffered locally.",
      icon: <WifiOff className="w-2.5 h-2.5 text-muted" />,
    },
    Error: {
      dotColor: "bg-[#b0361e]",
      label: "Sync Error",
      description: errorMessage || "Failed to synchronize changes with server.",
      icon: <AlertCircle className="w-2.5 h-2.5 text-[#b0361e]" />,
    },
  };

  const current = configs[state] || configs.Offline;

  return (
    <Tooltip content={current.description} side="bottom">
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-paper border border-divider text-xs font-mono transition-colors duration-160 select-none cursor-default",
          className
        )}
      >
        <span
          className={cn(
            "w-2 h-2 rounded-full transition-all duration-180 ease-out shrink-0",
            current.dotColor,
            current.isPulse && "animate-sync-pulse"
          )}
        />
        <span className="text-[11px] font-medium text-carbon tracking-tight">{current.label}</span>
      </div>
    </Tooltip>
  );
}
