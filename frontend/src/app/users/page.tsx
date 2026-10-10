"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "../../components/layout/AppLayout";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import {
  Users,
  UserPlus,
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  X,
  AlertCircle,
} from "lucide-react";
import { ROLE_CONFIG, formatDate, cn } from "../../lib/utils";

export default function UsersAdminPage() {
  const { user } = useAuth();

  const [usersList, setUsersList] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Create User Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("password123");
  const [newRole, setNewRole] = useState("TEAM_MEMBER");
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit User Modal
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    const params: any = { includeInactive: true };
    if (search.trim()) params.search = search.trim();
    if (roleFilter !== "ALL") params.role = roleFilter;

    const res = await api.users.list(params);
    if (res.data?.users) {
      setUsersList(res.data.users);
    } else {
      setErrorMsg(res.error || "Failed to load users");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (user?.role === "ADMIN") {
      fetchUsers();
    }
  }, [user, roleFilter]);

  // Server-side RBAC guard for page
  if (user && user.role !== "ADMIN") {
    return (
      <AppLayout>
        <div className="p-16 max-w-lg mx-auto text-center space-y-4 rounded-3xl bg-editor border border-divider shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-coral/15 border border-coral/30 flex items-center justify-center text-coral mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-carbon">HTTP 403: Forbidden</h2>
          <p className="text-xs text-muted leading-relaxed">
            User administration is restricted to System Administrators. Your current role is{" "}
            <strong className="text-coral">{user.role}</strong>.
          </p>
          <div className="pt-2 text-xs text-muted">
            Please contact your organization administrator if you require elevated permissions.
          </div>
        </div>
      </AppLayout>
    );
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const res = await api.users.create({
      name: newName,
      email: newEmail,
      password: newPassword,
      role: newRole,
    });

    if (res.data?.user) {
      setIsCreateOpen(false);
      setNewName("");
      setNewEmail("");
      setNewPassword("password123");
      setNewRole("TEAM_MEMBER");
      fetchUsers();
    } else {
      setCreateError(res.error || "Failed to create user");
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError(null);

    const res = await api.users.update(editingUser.id, {
      name: editName,
      email: editEmail,
      role: editRole,
    });

    if (res.data?.user) {
      setEditingUser(null);
      fetchUsers();
    } else {
      setEditError(res.error || "Failed to update user");
    }
  };

  const handleToggleStatus = async (targetUser: any) => {
    const action = targetUser.isActive ? "deactivate" : "activate";
    if (!confirm(`Are you sure you want to ${action} ${targetUser.name}?`)) return;

    const res = await api.users.update(targetUser.id, {
      isActive: !targetUser.isActive,
    });

    if (res.data?.user) {
      fetchUsers();
    } else {
      setErrorMsg(res.error || `Failed to ${action} user`);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-carbon tracking-tight">User Administration</h1>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-coral text-white">
                Admin Exclusive
              </span>
            </div>
            <p className="text-xs text-muted mt-1">
              Create, modify, and activate/deactivate platform accounts.
            </p>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-coral hover:bg-[#d34628] text-white text-xs font-bold shadow-md shadow-coral/20 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create User</span>
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-editor border border-divider rounded-2xl shadow-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchUsers();
            }}
            className="relative w-full sm:w-72"
          >
            <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-3 py-2 bg-paper border border-divider rounded-xl text-xs text-carbon placeholder-muted focus:outline-none focus:border-coral focus:bg-editor"
            />
          </form>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-paper border border-divider rounded-xl text-xs text-carbon focus:outline-none focus:border-coral focus:bg-editor font-medium"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="PROJECT_MANAGER">Project Manager</option>
            <option value="TEAM_MEMBER">Team Member</option>
            <option value="VIEWER">Viewer</option>
          </select>
        </div>

        {errorMsg && (
          <div className="p-3 bg-coral/15 border border-coral/30 rounded-xl flex items-center gap-2 text-xs text-coral font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* User Table */}
        <div className="bg-editor border border-divider rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-paper text-muted uppercase font-mono border-b border-divider">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned Tasks</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {usersList.map((u) => {
                  const roleCfg = ROLE_CONFIG[u.role];

                  return (
                    <tr key={u.id} className="hover:bg-paper transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              u.avatarUrl ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`
                            }
                            alt={u.name}
                            className="w-8 h-8 rounded-full object-cover bg-paper border border-divider"
                          />
                          <div>
                            <p className="font-bold text-carbon">{u.name}</p>
                            <p className="text-[11px] text-muted">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={cn(
                            "text-[10px] font-medium px-2 py-0.5 rounded-full border",
                            roleCfg?.badge || "bg-paper text-muted border-divider"
                          )}
                        >
                          {roleCfg?.label || u.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {u.isActive ? (
                          <span className="flex items-center gap-1.5 text-[#254622] font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-coral font-bold">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Deactivated</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-carbon font-semibold">
                        {u._count?.assignedTasks || 0} tasks
                      </td>

                      <td className="py-3.5 px-4 text-muted">
                        {formatDate(u.createdAt)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingUser(u);
                              setEditName(u.name);
                              setEditEmail(u.email);
                              setEditRole(u.role);
                            }}
                            className="p-1.5 text-muted hover:text-coral hover:bg-paper rounded-lg transition"
                            title="Edit User"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {u.id !== user?.id && (
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className={cn(
                                "px-2.5 py-1 rounded-lg text-[10px] font-bold transition border",
                                u.isActive
                                  ? "border-coral/50 bg-coral/10 text-coral hover:bg-coral/20"
                                  : "border-[#b5cea8] bg-moss/50 text-[#254622] hover:bg-moss"
                              )}
                            >
                              {u.isActive ? "Deactivate" : "Activate"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-carbon/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-editor border border-divider rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-divider">
              <h2 className="text-base font-bold text-carbon flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-coral" />
                Create New User
              </h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 text-muted hover:text-carbon rounded-lg hover:bg-paper transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-coral/15 border border-coral/30 rounded-xl flex items-center gap-2 text-xs text-coral font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-carbon block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Rachel Green"
                  className="w-full px-3.5 py-2.5 bg-paper border border-divider rounded-xl text-xs text-carbon placeholder-muted focus:outline-none focus:border-coral focus:bg-editor"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-carbon block mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="rachel@neostats.com"
                  className="w-full px-3.5 py-2.5 bg-paper border border-divider rounded-xl text-xs text-carbon placeholder-muted focus:outline-none focus:border-coral focus:bg-editor"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-carbon block mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-paper border border-divider rounded-xl text-xs text-carbon placeholder-muted focus:outline-none focus:border-coral focus:bg-editor"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-carbon block mb-1">System Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-paper border border-divider rounded-xl text-xs text-carbon focus:outline-none focus:border-coral focus:bg-editor font-medium"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="PROJECT_MANAGER">Project Manager</option>
                  <option value="TEAM_MEMBER">Team Member</option>
                  <option value="VIEWER">Viewer</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-muted hover:text-carbon transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-coral hover:bg-[#d34628] text-white text-xs font-bold rounded-xl transition shadow-md shadow-coral/20"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-carbon/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-editor border border-divider rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-divider">
              <h2 className="text-base font-bold text-carbon flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-coral" />
                Edit User
              </h2>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1.5 text-muted hover:text-carbon rounded-lg hover:bg-paper transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-coral/15 border border-coral/30 rounded-xl flex items-center gap-2 text-xs text-coral font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-carbon block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-paper border border-divider rounded-xl text-xs text-carbon placeholder-muted focus:outline-none focus:border-coral focus:bg-editor"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-carbon block mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-paper border border-divider rounded-xl text-xs text-carbon placeholder-muted focus:outline-none focus:border-coral focus:bg-editor"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-carbon block mb-1">System Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-paper border border-divider rounded-xl text-xs text-carbon focus:outline-none focus:border-coral focus:bg-editor font-medium"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="PROJECT_MANAGER">Project Manager</option>
                  <option value="TEAM_MEMBER">Team Member</option>
                  <option value="VIEWER">Viewer</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-medium text-muted hover:text-carbon transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-coral hover:bg-[#d34628] text-white text-xs font-bold rounded-xl transition shadow-md shadow-coral/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
