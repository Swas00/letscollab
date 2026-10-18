"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { CollaborativeEditor } from "../../../../components/editor/CollaborativeEditor";
import { useSocket } from "../../../../context/SocketContext";
import { useAuth } from "../../../../context/AuthContext";
import { api } from "../../../../lib/api";

export default function ProjectEditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { joinProject, leaveProject } = useSocket();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [project, setProject] = useState<any>(null);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace("/login");
    }
  }, [user, isAuthLoading, router]);

  useEffect(() => {
    if (!projectId) return;

    joinProject(projectId);

    api.projects.get(projectId).then((res) => {
      if (res.data?.project) {
        setProject(res.data.project);
      }
    });

    return () => {
      leaveProject(projectId);
    };
  }, [projectId]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#1e1e1e]">
      <CollaborativeEditor
        projectId={projectId}
        projectName={project?.name || "Project Workspace"}
        projectKey={project?.key}
        backHref={`/projects/${projectId}`}
        backLabel={project?.name ? `Back to ${project.name}` : "Back to Project"}
        fullPage={true}
      />
    </div>
  );
}
