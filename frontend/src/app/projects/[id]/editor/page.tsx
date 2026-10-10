"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AppLayout } from "../../../../components/layout/AppLayout";
import { ProjectHeader } from "../../../../components/projects/ProjectHeader";
import { CollaborativeEditor } from "../../../../components/editor/CollaborativeEditor";
import { useSocket } from "../../../../context/SocketContext";
import { api } from "../../../../lib/api";
import { AlertCircle, Loader2 } from "lucide-react";

export default function ProjectEditorPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { joinProject, leaveProject } = useSocket();

  const [project, setProject] = useState<any>(null);
  const [userAccess, setUserAccess] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;

    joinProject(projectId);

    api.projects.get(projectId).then((res) => {
      if (res.data?.project) {
        setProject(res.data.project);
        setUserAccess(res.data.userAccess);
      } else {
        setErrorMsg(res.error || "Project not found or unauthorized");
      }
      setIsLoading(false);
    });

    return () => {
      leaveProject(projectId);
    };
  }, [projectId]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-16 text-center text-xs font-mono text-muted flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-coral" />
          <span>Mounting Real-Time Code Workspace...</span>
        </div>
      </AppLayout>
    );
  }

  if (errorMsg) {
    return (
      <AppLayout>
        <div className="p-16 text-center text-sm text-coral space-y-3 font-mono">
          <AlertCircle className="w-8 h-8 mx-auto" />
          <p>{errorMsg}</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <ProjectHeader project={project} userAccess={userAccess} />

        {/* Real-Time Collaborative Code Editor */}
        <CollaborativeEditor projectId={projectId} />
      </div>
    </AppLayout>
  );
}
