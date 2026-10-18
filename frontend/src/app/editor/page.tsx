"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CollaborativeEditor } from "../../components/editor/CollaborativeEditor";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";

function StandaloneEditorContent() {
  const searchParams = useSearchParams();
  const requestedProjectId = searchParams.get("projectId") || "";
  const { joinProject, leaveProject } = useSocket();
  const { user } = useAuth();

  const [activeProject, setActiveProject] = useState<any>(null);
  const [resolvedId, setResolvedId] = useState<string>(
    requestedProjectId || "personal-studio"
  );

  useEffect(() => {
    if (requestedProjectId) {
      setResolvedId(requestedProjectId);
      api.projects.get(requestedProjectId).then((res) => {
        if (res.data?.project) {
          setActiveProject(res.data.project);
        }
      });
      return;
    }

    if (user) {
      api.projects.list().then((res) => {
        const list = res.data?.projects || [];
        if (list.length > 0) {
          setActiveProject(list[0]);
          setResolvedId(list[0].id);
        }
      });
    }
  }, [requestedProjectId, user]);

  useEffect(() => {
    if (!resolvedId || resolvedId === "personal-studio") return;
    joinProject(resolvedId);
    return () => {
      leaveProject(resolvedId);
    };
  }, [resolvedId]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#1e1e1e]">
      <CollaborativeEditor
        projectId={resolvedId}
        projectName={activeProject?.name || "LetsCollab Studio IDE"}
        projectKey={activeProject?.key || "IDE"}
        backHref={activeProject?.id ? `/projects/${activeProject.id}` : user ? "/dashboard" : "/"}
        backLabel={
          activeProject?.name
            ? `Back to ${activeProject.name}`
            : user
            ? "Back to Dashboard"
            : "Back to Home"
        }
        fullPage={true}
      />
    </div>
  );
}

export default function StandaloneEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen bg-[#1e1e1e] flex items-center justify-center text-xs font-mono text-[#858585]">
          Launching Visual Studio Code IDE...
        </div>
      }
    >
      <StandaloneEditorContent />
    </Suspense>
  );
}
