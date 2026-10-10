"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AppLayout } from "../../../../components/layout/AppLayout";
import { ProjectHeader } from "../../../../components/projects/ProjectHeader";
import { useSocket } from "../../../../context/SocketContext";
import { api } from "../../../../lib/api";
import { Activity } from "lucide-react";
import { formatRelativeTime } from "../../../../lib/utils";

export default function ProjectActivityPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { socket, joinProject, leaveProject } = useSocket();

  const [project, setProject] = useState<any>(null);
  const [userAccess, setUserAccess] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    const [pRes, actRes] = await Promise.all([
      api.projects.get(projectId),
      api.activity.listByProject(projectId, { limit: 50 }),
    ]);

    if (pRes.data?.project) {
      setProject(pRes.data.project);
      setUserAccess(pRes.data.userAccess);
    }
    if (actRes.data?.activities) {
      setActivities(actRes.data.activities);
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

  // Real-time activity updates
  useEffect(() => {
    if (!socket) return;

    const handleNewActivity = (act: any) => {
      if (act.projectId === projectId) {
        setActivities((prev) => [act, ...prev]);
      }
    };

    socket.on("activity:new", handleNewActivity);

    return () => {
      socket.off("activity:new", handleNewActivity);
    };
  }, [socket, projectId]);

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <ProjectHeader project={project} userAccess={userAccess} />

        <div className="flex items-center justify-between p-4 bg-editor border border-divider rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-coral" />
            <h2 className="text-sm font-bold text-carbon">Project Audit Trail</h2>
          </div>
          <span className="text-[11px] font-mono text-muted">
            {activities.length} recorded events
          </span>
        </div>

        {/* Timeline Feed */}
        <div className="bg-editor border border-divider rounded-3xl p-6 shadow-sm">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-muted">Loading audit records...</div>
          ) : (
            <div className="space-y-4">
              {activities.map((act) => {
                let parsedMeta: any = null;
                if (act.metadata) {
                  try {
                    parsedMeta = JSON.parse(act.metadata);
                  } catch (e) {
                    parsedMeta = act.metadata;
                  }
                }

                return (
                  <div
                    key={act.id}
                    className="p-4 rounded-2xl bg-paper border border-divider flex items-start gap-4 text-xs shadow-sm"
                  >
                    <img
                      src={
                        act.user?.avatarUrl ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${act.user?.name || "System"}`
                      }
                      alt={act.user?.name || "User"}
                      className="w-8 h-8 rounded-full object-cover bg-editor border border-divider shrink-0 mt-0.5"
                    />

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-carbon">{act.user?.name || "System"}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-editor text-coral border border-divider font-semibold">
                            {act.action}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted font-mono">
                          {formatRelativeTime(act.createdAt)}
                        </span>
                      </div>

                      <p className="text-muted">
                        Affected {act.entityType.toLowerCase()}:{" "}
                        <span className="font-mono text-carbon font-semibold">{act.entityId}</span>
                      </p>

                      {parsedMeta && (
                        <div className="mt-2 p-2.5 rounded-xl bg-editor border border-divider font-mono text-[11px] text-carbon overflow-x-auto">
                          {typeof parsedMeta === "object" ? (
                            <pre className="whitespace-pre-wrap">
                              {JSON.stringify(parsedMeta, null, 2)}
                            </pre>
                          ) : (
                            <span>{String(parsedMeta)}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {activities.length === 0 && (
                <div className="py-12 text-center text-xs text-muted italic">
                  No activity recorded for this project yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
