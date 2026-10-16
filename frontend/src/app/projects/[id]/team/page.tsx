"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AppLayout } from "../../../../components/layout/AppLayout";
import { ProjectHeader } from "../../../../components/projects/ProjectHeader";
import { useAuth } from "../../../../context/AuthContext";
import { useSocket } from "../../../../context/SocketContext";
import { api } from "../../../../lib/api";
import {
  UserPlus,
  Trash2,
  Users,
  AlertCircle,
  X,
  Mail,
  Clock,
  Send,
} from "lucide-react";
import { formatDate } from "../../../../lib/utils";
import { Button } from "../../../../components/ui/Button";

export default function ProjectTeamPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { user } = useAuth();
  const { socket, joinProject, leaveProject } = useSocket();

  const [project, setProject] = useState<any>(null);
  const [userAccess, setUserAccess] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Invite Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("TEAM_MEMBER");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    const [pRes, invRes] = await Promise.all([
      api.projects.get(projectId),
      api.projects.listInvitations(projectId),
    ]);

    if (pRes.data?.project) {
      setProject(pRes.data.project);
      setUserAccess(pRes.data.userAccess);
      setMembers(pRes.data.project.members || []);
    } else {
      setErrorMsg(pRes.error || "Failed to load project team");
    }

    if (invRes.data?.invitations) {
      setInvitations(invRes.data.invitations);
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

  // Real-time member events
  useEffect(() => {
    if (!socket) return;

    const handleMemberAdded = (member: any) => {
      if (member.projectId === projectId) {
        setMembers((prev) => {
          if (prev.some((m) => m.userId === member.userId)) return prev;
          return [...prev, member];
        });
        setInvitations((prev) =>
          prev.filter((inv) => inv.email.toLowerCase() !== member.user?.email?.toLowerCase())
        );
      }
    };

    const handleMemberUpdated = (member: any) => {
      if (member.projectId === projectId) {
        setMembers((prev) =>
          prev.map((m) => (m.userId === member.userId ? { ...m, ...member } : m))
        );
      }
    };

    const handleMemberRemoved = ({ userId }: { userId: string }) => {
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
    };

    socket.on("member:added", handleMemberAdded);
    socket.on("member:updated", handleMemberUpdated);
    socket.on("member:removed", handleMemberRemoved);

    return () => {
      socket.off("member:added", handleMemberAdded);
      socket.off("member:updated", handleMemberUpdated);
      socket.off("member:removed", handleMemberRemoved);
    };
  }, [socket, projectId]);

  const canManageTeam =
    user?.role === "ADMIN" ||
    userAccess?.isManager ||
    userAccess?.projectRole === "PROJECT_MANAGER";

  const handleRoleChange = async (targetUserId: string, newRole: string) => {
    const res = await api.projects.updateMemberRole(projectId, targetUserId, newRole);
    if (res.data?.member) {
      setMembers((prev) =>
        prev.map((m) => (m.userId === targetUserId ? { ...m, role: newRole } : m))
      );
    } else {
      setErrorMsg(res.error || "Failed to update member role");
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = inviteEmail.trim().toLowerCase();
    if (!cleanEmail) return;

    setIsSubmitting(true);
    setModalError(null);

    const res = await api.projects.sendInvitation(projectId, {
      email: cleanEmail,
      role: selectedRole,
    });
    setIsSubmitting(false);

    if (res.data?.invitation) {
      setIsAddOpen(false);
      setInviteEmail("");
      setSelectedRole("TEAM_MEMBER");
      setInvitations((prev) => [
        res.data!.invitation,
        ...prev.filter((i) => i.id !== res.data!.invitation.id),
      ]);
    } else {
      setModalError(res.error || "Failed to send invitation");
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!confirm("Are you sure you want to cancel and revoke this invitation?")) return;

    const res = await api.projects.revokeInvitation(projectId, invitationId);
    if (!res.error) {
      setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
    } else {
      setErrorMsg(res.error || "Failed to revoke invitation");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this member from the project?")) return;

    const res = await api.projects.removeMember(projectId, userId);
    if (!res.error) {
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
    } else {
      setErrorMsg(res.error || "Failed to remove member");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <ProjectHeader project={project} userAccess={userAccess} />

        {/* Header Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-editor border border-divider rounded-2xl shadow-sm">
          <div>
            <h2 className="text-sm font-bold text-carbon flex items-center gap-2">
              <Users className="w-4 h-4 text-coral" />
              Project Members ({members.length})
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Control project-level roles and team access permissions.
            </p>
          </div>

          {canManageTeam && (
            <button
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-coral hover:bg-[#d34628] text-white text-xs font-bold rounded-xl shadow-md shadow-coral/20 transition"
            >
              <Mail className="w-4 h-4" />
              <span>Invite by Email</span>
            </button>
          )}
        </div>

        {errorMsg && (
          <div className="p-3 bg-coral/15 border border-coral/30 rounded-xl flex items-center gap-2 text-xs text-coral font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Team Table */}
        <div className="bg-editor border border-divider rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-paper text-muted uppercase font-mono border-b border-divider">
                <tr>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">System Role</th>
                  <th className="py-3 px-4">Project Role</th>
                  <th className="py-3 px-4">Joined Date</th>
                  {canManageTeam && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-paper transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            member.user.avatarUrl ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user.name}`
                          }
                          alt={member.user.name}
                          className="w-8 h-8 rounded-full object-cover bg-paper border border-divider"
                        />
                        <div>
                          <p className="font-bold text-carbon">{member.user.name}</p>
                          <p className="text-[11px] text-muted">{member.user.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-paper border border-divider text-muted font-medium">
                        {member.user.role}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {canManageTeam ? (
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                          className="px-2.5 py-1.5 bg-paper border border-divider rounded-lg text-xs text-carbon focus:outline-none focus:border-coral font-medium"
                        >
                          <option value="PROJECT_MANAGER">Project Manager</option>
                          <option value="TEAM_MEMBER">Team Member</option>
                          <option value="VIEWER">Viewer</option>
                        </select>
                      ) : (
                        <span className="text-xs font-bold text-carbon">
                          {member.role}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-muted">
                      {formatDate(member.joinedAt)}
                    </td>

                    {canManageTeam && (
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleRemoveMember(member.userId)}
                          title="Remove Member"
                          className="p-1.5 text-muted hover:text-coral hover:bg-paper rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Invitations Section */}
        {invitations.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-carbon flex items-center gap-2">
                  <Clock className="w-4 h-4 text-coral" />
                  Pending Invitations ({invitations.length})
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Invited users who have not yet accepted their invitation.
                </p>
              </div>
            </div>

            <div className="bg-editor border border-divider rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-paper text-muted uppercase font-mono border-b border-divider">
                    <tr>
                      <th className="py-3 px-4">Invited Email</th>
                      <th className="py-3 px-4">Invited Role</th>
                      <th className="py-3 px-4">Invited By</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Sent Date</th>
                      {canManageTeam && <th className="py-3 px-4 text-right">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-divider">
                    {invitations.map((inv) => (
                      <tr key={inv.id} className="hover:bg-paper transition">
                        <td className="py-3.5 px-4 font-mono font-medium text-carbon">
                          {inv.email}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-periwinkle/20 border border-periwinkle/40 text-navy font-semibold">
                            {inv.role?.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-muted">
                          {inv.inviter?.name || inv.inviter?.email || "Manager"}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 font-bold">
                            PENDING
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-muted">
                          {formatDate(inv.createdAt)}
                        </td>
                        {canManageTeam && (
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleRevokeInvitation(inv.id)}
                              title="Revoke Invitation"
                              className="px-2.5 py-1 text-xs text-coral hover:bg-coral/10 rounded-lg transition font-medium"
                            >
                              Revoke
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Invite Member Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-carbon/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-editor border border-divider rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-divider">
              <h2 className="text-base font-bold text-carbon flex items-center gap-2">
                <Mail className="w-5 h-5 text-coral" />
                Invite Teammate by Email
              </h2>
              <button
                onClick={() => setIsAddOpen(false)}
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

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-carbon block mb-1">
                  Collaborator Email Address
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="w-full px-3.5 py-2.5 bg-paper border border-divider rounded-xl text-xs text-carbon focus:outline-none focus:border-coral font-medium placeholder-muted"
                />
                <p className="text-[11px] text-muted mt-1 leading-relaxed">
                  Enter the email address of the person you want to invite. They will receive an invitation in their account to join this project.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-carbon block mb-1">Project Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-paper border border-divider rounded-xl text-xs text-carbon focus:outline-none focus:border-coral font-medium"
                >
                  <option value="PROJECT_MANAGER">Project Manager</option>
                  <option value="TEAM_MEMBER">Team Member</option>
                  <option value="VIEWER">Viewer (Read Only)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-muted hover:text-carbon transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !inviteEmail.trim()}
                  className="px-5 py-2.5 bg-coral hover:bg-[#d34628] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-md shadow-coral/20 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Sending..." : "Send Invitation"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
