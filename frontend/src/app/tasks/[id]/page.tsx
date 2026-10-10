"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppLayout } from "../../../components/layout/AppLayout";
import { TaskModal } from "../../../components/tasks/TaskModal";
import { api } from "../../../lib/api";
import { ArrowLeft, CheckSquare } from "lucide-react";

export default function StandaloneTaskPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs text-muted hover:text-carbon transition font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        {taskId && (
          <TaskModal
            taskId={taskId}
            onClose={() => router.push("/dashboard")}
            onTaskUpdated={() => {}}
            onTaskDeleted={() => router.push("/dashboard")}
          />
        )}
      </div>
    </AppLayout>
  );
}
