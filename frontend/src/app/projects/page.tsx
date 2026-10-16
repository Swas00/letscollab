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
  Trash2,
  Building,
  Mail,
} from "lucide-react";
import { PRIORITY_CONFIG, cn } from "../../lib/utils";
import { Button } from "../../components/ui/Button";

export default function ProjectsPage() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [projects, setProjects] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [orgFilter, setOrgFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);

  // Pending Invitations for logged in user
  const [myInvitations, setMyInvitations] = useState<any[]>([]);
  const [acceptingInviteId, setAcceptingInviteId] = useState<string | null>(null);

  // Create Project Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [inviteEmailsInput, setInviteEmailsInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchProjects = async () => {
    setIsLoading(true);
    const params: any = {};
    if (statusFilter !== "ALL") params.status = statusFilter;
    if (search.trim()) params.search = search.trim();
    if (orgFilter === "PERSONAL") params.organizationId = "personal";
    else if (orgFilter !== "ALL") params.organizationId = orgFilter;

    const res = await api.projects.list(params);
    if (res.data?.projects) {
      setProjects(res.data.projects);
    }
    setIsLoading(false);
  };

  const fetchMyInvitations = async () => {
    const res = await api.projects.myInvitations();
    if (res.data?.invitations) {
      setMyInvitations(res.data.invitations);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchMyInvitations();
  }, [statusFilter, orgFilter, user?.id]);

  // Real-time project updates via socket (strictly respecting assignment and creator)
  useEffect(() => {
    if (!socket) return;

    const handleProjectCreated = (newProj: any) => {
      const isCreator = newProj.creatorId === user?.id || newProj.creator?.id === user?.id;
      const isAssigned =
        newProj.managerId === user?.id ||
        newProj.members?.some((m: any) => m.userId === user?.id || m.user?.id === user?.id);
      if (user?.role === "ADMIN" || isCreator || isAssigned) {
        setProjects((prev) => {
          if (prev.some((p) => p.id === newProj.id)) return prev;
          return [newProj, ...prev];
        });
      }
    };

    const handleProjectUpdated = (upProj: any) => {
      const isCreator = upProj.creatorId === user?.id || upProj.creator?.id === user?.id;
      const isAssigned =
        upProj.managerId === user?.id ||
        upProj.members?.some((m: any) => m.userId === user?.id || m.user?.id === user?.id);
      if (user?.role === "ADMIN" || isCreator || isAssigned) {
        setProjects((prev) =>
          prev.map((p) => (p.id === upProj.id ? { ...p, ...upProj } : p))
        );
      } else {
        setProjects((prev) => prev.filter((p) => p.id !== upProj.id));
      }
    };

    const handleProjectDeleted = ({ projectId }: { projectId: string }) => {
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    };

    const handleInvitationReceived = () => {
      fetchMyInvitations();
    };

    socket.on("project:created", handleProjectCreated);
    socket.on("project:updated", handleProjectUpdated);
    socket.on("project:deleted", handleProjectDeleted);
    socket.on("project:invitation_received", handleInvitationReceived);

    return () => {
      socket.off("project:created", handleProjectCreated);
      socket.off("project:updated", handleProjectUpdated);
      socket.off("project:deleted", handleProjectDeleted);
      socket.off("project:invitation_received", handleInvitationReceived);
    };
  }, [socket, user?.id, user?.role]);

  const handleAcceptInvite = async (invitationId: string) => {
    setAcceptingInviteId(invitationId);
    const res = await api.projects.acceptInvitation(invitationId);
    setAcceptingInviteId(null);
    if (res.data?.success) {
      setMyInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
      fetchProjects();
    }
  };

  const handleDeclineInvite = async (invitationId: string) => {
    const res = await api.projects.declineInvitation(invitationId);
    if (res.data?.success) {
      setMyInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError(null);

    const parsedEmails = inviteEmailsInput
      .split(/[\s,]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e && e.includes("@"));

    const payload = {
      name,
      key,
      description,
      priority,
      organizationId: selectedOrgId || undefined,
      inviteEmails: parsedEmails.length > 0 ? parsedEmails : undefined,
    };

    const res = await api.projects.create(payload);
    setIsSubmitting(false);

    if (res.data?.project) {
      setIsModalOpen(false);
      setName("");
      setKey("");
      setDescription("");
      setSelectedOrgId("");
      setInviteEmailsInput("");
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

  const handleDeleteProject = async (projectId: string, projectName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!window.confirm(`Are you sure you want to permanently delete "${projectName}"? This action cannot be undone and will delete all tasks, comments, and members.`)) {
      return;
    }
    const res = await api.projects.delete(projectId);
    if (!res.error) {
      fetchProjects();
    } else {
      alert(res.error || "Failed to delete project");
    }
  };

  const isAdmin = user?.role === "ADMIN";

  // Filter projects so only the assigned users, the creator, and admins see the project
  const displayedProjects = projects.filter((proj) => {
    if (isAdmin) return true;
    const isCreator = proj.creatorId === user?.id || proj.creator?.id === user?.id;
    const isAssigned =
      proj.managerId === user?.id ||
      proj.members?.some((m: any) => m.userId === user?.id || m.user?.id === user?.id) ||
      proj.tasks?.some((t: any) => t.assigneeId === user?.id);
    return isCreator || isAssigned;
  });

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

          <Button
            onClick={() => setIsModalOpen(true)}
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
          >
            Create Project
          </Button>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 bg-editor border border-divider rounded-2xl shadow-sm">
          {/* Status Tabs & Org Filter */}
          <div className="flex items-center gap-1 w-full md:w-auto overflow-x-auto">
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
                {tab === "ALL" ? "All Status" : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}

            {user?.organizationMemberships && user.organizationMemberships.length > 0 && (
              <div className="h-4 w-px bg-divider mx-1.5 shrink-0" />
            )}

            {user?.organizationMemberships && user.organizationMemberships.length > 0 && (
              <select
                value={orgFilter}
                onChange={(e) => setOrgFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-paper border border-divider text-carbon focus:outline-none focus:border-coral transition shrink-0"
              >
                <option value="ALL">All Workspaces</option>
                <option value="PERSONAL">Personal Projects Only</option>
                {user.organizationMemberships.map((m) => (
                  <option key={m.organizationId} value={m.organizationId}>
                    🏢 {m.organization.name}
                  </option>
                ))}
              </select>
            )}
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

        {/* Pending Invitations Banner */}
        {myInvitations.length > 0 && (
          <div className="p-5 bg-periwinkle/30 border border-[#bec5ea] rounded-3xl space-y-3 shadow-sm animate-activity-slide">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-carbon flex items-center gap-2">
                <Mail className="w-4 h-4 text-coral" />
                Pending Project Invitations ({myInvitations.length})
              </h2>
              <span className="text-xs text-muted">
                Accept invitations to collaborate and access these projects
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {myInvitations.map((inv) => (
                <div
                  key={inv.id}
                  className="p-4 bg-editor border border-divider rounded-2xl flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-paper border border-divider text-coral">
                        {inv.project.key}
                      </span>
                      <h3 className="text-xs font-bold text-carbon truncate">
                        {inv.project.name}
                      </h3>
                    </div>
                    <p className="text-[11px] text-muted">
                      Invited by <strong className="text-carbon">{inv.inviter?.name || inv.inviter?.email}</strong> as{" "}
                      <span className="font-semibold text-coral">{inv.role?.replace("_", " ")}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleAcceptInvite(inv.id)}
                      disabled={acceptingInviteId === inv.id}
                      className="px-3 py-1.5 bg-coral hover:bg-[#d34628] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-xs"
                    >
                      {acceptingInviteId === inv.id ? "Accepting..." : "Accept"}
                    </button>
                    <button
                      onClick={() => handleDeclineInvite(inv.id)}
                      className="px-3 py-1.5 bg-paper hover:bg-divider border border-divider text-muted hover:text-carbon text-xs font-semibold rounded-xl transition"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Project Cards Grid */}
        {isLoading ? (
          <div className="p-12 text-center text-sm text-muted">Loading projects...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedProjects.map((proj) => {
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-black text-coral px-2 py-0.5 rounded-md bg-coral/15 border border-coral/30">
                          {proj.key}
                        </span>
                        {proj.organization?.name ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-periwinkle/15 text-navy border border-periwinkle/30 font-semibold flex items-center gap-1">
                            <Building className="w-2.5 h-2.5" />
                            {proj.organization.name}
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-paper text-muted border border-divider">
                            Personal
                          </span>
                        )}
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

                        {(isAdmin || user?.role === "PROJECT_MANAGER" || proj.managerId === user?.id || proj.members?.some((m: any) => m.userId === user?.id && m.role === "PROJECT_MANAGER")) && (
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={(e) => handleToggleArchive(proj.id, e)}
                              title={isArchived ? "Restore Project" : "Archive Project"}
                              className="p-1.5 text-muted hover:text-coral rounded-lg hover:bg-paper transition"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteProject(proj.id, proj.name, e)}
                              title="Delete Project"
                              className="p-1.5 text-muted hover:text-red-500 rounded-lg hover:bg-red-500/10 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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
                        {proj.creator?.name && proj.creator?.name !== proj.manager?.name && (
                          <span className="text-[10px] text-muted block mt-0.5">
                            Created by: {proj.creator.name}
                          </span>
                        )}
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

        {displayedProjects.length === 0 && !isLoading && (
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-carbon/50 backdrop-blur-xs transition-opacity duration-160">
          <div className="w-full max-w-lg bg-editor border border-divider rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5 animate-command-palette">
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
                  placeholder="e.g. Campus Event Management System"
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

              {/* Workspace / Organization (Optional) */}
              {user?.organizationMemberships && user.organizationMemberships.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-carbon block mb-1">
                    Workspace / Organization (Optional)
                  </label>
                  <select
                    value={selectedOrgId}
                    onChange={(e) => setSelectedOrgId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-paper border border-divider rounded-xl text-xs text-carbon focus:outline-none focus:border-coral focus:bg-editor font-medium"
                  >
                    <option value="">Personal / Independent (No Organization)</option>
                    {user.organizationMemberships.map((m) => (
                      <option key={m.organizationId} value={m.organizationId}>
                        🏢 {m.organization.name} ({m.role})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-muted mt-1">
                    Choose an organization to share with teammates, or leave as Personal for independent work.
                  </p>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-carbon block mb-1">
                  Invite Teammates by Email (Optional)
                </label>
                <input
                  type="text"
                  value={inviteEmailsInput}
                  onChange={(e) => setInviteEmailsInput(e.target.value)}
                  placeholder="e.g. colleague@example.com, developer@company.com"
                  className="w-full px-3.5 py-2.5 bg-paper border border-divider rounded-xl text-xs text-carbon placeholder-muted focus:outline-none focus:border-coral focus:bg-editor"
                />
                <p className="text-[11px] text-muted mt-1 leading-relaxed">
                  Enter email addresses separated by commas. Invited users will receive an in-app invitation to collaborate and gain access once accepted.
                </p>
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
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                >
                  Create Project
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
