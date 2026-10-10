"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "../../components/layout/AppLayout";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { api } from "../../lib/api";
import {
  FolderKanban,
  Plus,
  Search,
  Archive,
  ArrowRight,
  Users,
  X,
  AlertCircle,
} from "lucide-react";
import { PRIORITY_CONFIG, cn } from "../../lib/utils";

export default function ProjectsPage() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [projects, setProjects] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);

  // Create Project Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [managerId, setManagerId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchProjects = async () => {
    setIsLoading(true);
    const params: any = {};
    if (statusFilter !== "ALL") params.status = statusFilter;
    if (search.trim()) params.search = search.trim();

    const res = await api.projects.list(params);
    if (res.data?.projects) {
      setProjects(res.data.projects);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, [statusFilter, user?.id]);

  useEffect(() => {
    if (user?.role === "ADMIN") {
      api.users.list().then((res) => {
        if (res.data?.users) {
          setAllUsers(res.data.users);
        }
      });
    }
  }, [user]);

  // Real-time project updates via socket
  useEffect(() => {
    if (!socket) return;

    const handleProjectCreated = (newProj: any) => {
      setProjects((prev) => [newProj, ...prev]);
    };

    const handleProjectUpdated = (upProj: any) => {
      setProjects((prev) =>
        prev.map((p) => (p.id === upProj.id ? { ...p, ...upProj } : p))
      );
    };

    socket.on("project:created", handleProjectCreated);
    socket.on("project:updated", handleProjectUpdated);

    return () => {
      socket.off("project:created", handleProjectCreated);
      socket.off("project:updated", handleProjectUpdated);
    };
  }, [socket]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError(null);

    const payload = {
      name,
      key,
      description,
      priority,
      managerId: managerId || undefined,
    };

    const res = await api.projects.create(payload);
    setIsSubmitting(false);

    if (res.data?.project) {
      setIsModalOpen(false);
      setName("");
      setKey("");
      setDescription("");
      setManagerId("");
      fetchProjects();
    } else {
      setModalError(res.error || "Failed to create project");
    }
  };

  const handleToggleArchive = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const res = await api.projects.archive(projectId);
    if (!res.error) {
      fetchProjects();
    }
  };

  const isAdmin = user?.role === "ADMIN";

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-carbon tracking-tight">Projects</h1>
            <p className="text-xs text-muted mt-1">
              Collaborative workspaces, team assignments, and milestone tracking.
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-coral hover:bg-[#d34628] text-white text-xs font-bold shadow-md shadow-coral/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project</span>
            </button>
          )}
        </div>

        {/* Filters & Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-editor border border-divider rounded-2xl shadow-sm">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto">
            {["ALL", "ACTIVE", "COMPLETED", "ARCHIVED"].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0",
                  statusFilter === tab
                    ? "bg-carbon text-paper shadow-sm"
                    : "text-muted hover:text-carbon hover:bg-paper"
                )}
              >
                {tab === "ALL" ? "All Projects" : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchProjects();
            }}
            className="relative w-full sm:w-72"
          >
            <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-9 pr-3 py-2 bg-paper border border-divider rounded-xl text-xs text-carbon placeholder-muted focus:outline-none focus:border-coral focus:bg-editor"
            />
          </form>
        </div>

        {/* Project Cards Grid */}
        {isLoading ? (
          <div className="p-12 text-center text-sm text-muted">Loading projects...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((proj) => {
              const prio = PRIORITY_CONFIG[proj.priority] || PRIORITY_CONFIG.MEDIUM;
              const isArchived = proj.status === "ARCHIVED";

              return (
                <Link
                  key={proj.id}
                  href={`/projects/${proj.id}`}
                  className="group p-6 rounded-3xl bg-editor hover:bg-[#FAF8F2] border border-divider hover:border-coral transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-md"
                >
                  <div className="space-y-4">
                    {/* Top Row: Key & Priority & Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-black text-coral px-2 py-0.5 rounded-md bg-coral/15 border border-coral/30">
                          {proj.key}
                        </span>
                        {isArchived && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-paper text-muted border border-divider font-medium">
                            Archived
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
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

                        {(isAdmin || user?.role === "PROJECT_MANAGER") && (
                          <button
                            onClick={(e) => handleToggleArchive(proj.id, e)}
                            title={isArchived ? "Restore Project" : "Archive Project"}
                            className="p-1.5 text-muted hover:text-coral rounded-lg hover:bg-paper transition"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Name & Description */}
                    <div>
                      <h3 className="text-base font-bold text-carbon group-hover:text-coral transition">
                        {proj.name}
                      </h3>
                      <p className="text-xs text-muted mt-1 line-clamp-2 leading-relaxed">
                        {proj.description || "No project description provided."}
                      </p>
                    </div>

                    {/* Manager & Members */}
                    <div className="flex items-center justify-between text-xs text-muted pt-2 border-t border-divider">
                      <div>
                        <span className="text-[10px] text-muted block">Lead Manager:</span>
                        <span className="font-semibold text-carbon">
                          {proj.manager?.name || "Unassigned"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-muted" />
                        <span className="text-xs font-mono text-carbon font-medium">
                          {proj._count?.members || proj.members?.length || 0} members
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Total Tasks & Open Link */}
                  <div className="mt-6 pt-4 border-t border-divider flex items-center justify-between">
                    <span className="text-xs text-muted">
                      <strong className="text-carbon font-mono">{proj._count?.tasks || 0}</strong> tasks
                    </span>

                    <span className="flex items-center gap-1 text-xs text-coral font-bold group-hover:translate-x-1 transition-transform">
                      Open Board <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {projects.length === 0 && !isLoading && (
          <div className="p-16 text-center rounded-3xl bg-editor border border-dashed border-divider text-muted space-y-3 shadow-sm">
            <FolderKanban className="w-8 h-8 mx-auto text-muted" />
            <p className="text-sm font-bold text-carbon">No projects found</p>
            {isAdmin && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-coral hover:bg-[#d34628] text-white text-xs font-bold rounded-xl transition shadow-md shadow-coral/20"
              >
                Create your first project
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Project Modal (Admin Only) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-carbon/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-editor border border-divider rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-divider">
              <h2 className="text-lg font-bold text-carbon flex items-center gap-2">
                <Plus className="w-5 h-5 text-coral" />
                Create New Project
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-muted hover:text-carbon rounded-lg hover:bg-paper transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-coral/15 border border-coral/30 rounded-xl flex items-center gap-2 text-xs text-coral font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-carbon block mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!key) {
                      setKey(
                        e.target.value
                          .replace(/[^a-zA-Z]/g, "")
                          .slice(0, 3)
                          .toUpperCase()
                      );
                    }
                  }}
                  placeholder="e.g. NeoFlow Cloud Platform"
                  className="w-full px-3.5 py-2.5 bg-paper border border-divider rounded-xl text-xs text-carbon placeholder-muted focus:outline-none focus:border-coral focus:bg-editor"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-carbon block mb-1">
                    Key Prefix (2-5 letters)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={key}
                    onChange={(e) => setKey(e.target.value.toUpperCase())}
                    placeholder="NEO"
                    className="w-full px-3.5 py-2.5 bg-paper border border-divider rounded-xl text-xs font-mono font-bold text-coral focus:outline-none focus:border-coral focus:bg-editor"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-carbon block mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-paper border border-divider rounded-xl text-xs text-carbon focus:outline-none focus:border-coral focus:bg-editor font-medium"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-carbon block mb-1">
                  Assign Project Manager
                </label>
                <select
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-paper border border-divider rounded-xl text-xs text-carbon focus:outline-none focus:border-coral focus:bg-editor font-medium"
                >
                  <option value="">Select Project Manager</option>
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-carbon block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Goals, deliverables, and scope..."
                  className="w-full px-3.5 py-2.5 bg-paper border border-divider rounded-xl text-xs text-carbon placeholder-muted focus:outline-none focus:border-coral focus:bg-editor"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-muted hover:text-carbon transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-coral hover:bg-[#d34628] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-md shadow-coral/20"
                >
                  {isSubmitting ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
