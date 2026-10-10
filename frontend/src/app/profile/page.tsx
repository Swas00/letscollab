"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "../../components/layout/AppLayout";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import {
  User,
  Shield,
  Key,
  CheckCircle2,
  XCircle,
  Save,
  Lock,
  AlertCircle,
  FolderKanban,
  CheckSquare,
} from "lucide-react";
import { ROLE_CONFIG, formatDate, cn } from "../../lib/utils";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  // Profile Form
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Active User Projects and Tasks
  const [userProfileData, setUserProfileData] = useState<any>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setAvatarUrl(user.avatarUrl || "");

      api.users.get(user.id).then((res) => {
        if (res.data?.user) {
          setUserProfileData(res.data.user);
        }
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess(false);
    setProfileError(null);

    const res = await api.auth.updateProfile({ name, avatarUrl });
    setProfileSaving(false);

    if (res.data?.user) {
      setProfileSuccess(true);
      await refreshUser();
      setTimeout(() => setProfileSuccess(false), 3000);
    } else {
      setProfileError(res.error || "Failed to update profile");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordSuccess(false);
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      setPasswordSaving(false);
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      setPasswordSaving(false);
      return;
    }

    const res = await api.auth.changePassword({ currentPassword, newPassword });
    setPasswordSaving(false);

    if (res.data) {
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 3000);
    } else {
      setPasswordError(res.error || "Failed to change password");
    }
  };

  const roleCfg = user ? ROLE_CONFIG[user.role] : null;

  const permissionsMatrix = [
    {
      permission: "System User Management (Create, Edit, Deactivate)",
      admin: true,
      pm: false,
      member: false,
      viewer: false,
    },
    {
      permission: "Create & Delete Projects",
      admin: true,
      pm: false,
      member: false,
      viewer: false,
    },
    {
      permission: "Manage Project Team (Add/Remove members, Change roles)",
      admin: true,
      pm: true,
      member: false,
      viewer: false,
    },
    {
      permission: "Create & Delete Tasks",
      admin: true,
      pm: true,
      member: false,
      viewer: false,
    },
    {
      permission: "Update Assigned Tasks & Status",
      admin: true,
      pm: true,
      member: true,
      viewer: false,
    },
    {
      permission: "Post Comments with @mentions",
      admin: true,
      pm: true,
      member: true,
      viewer: false,
    },
    {
      permission: "Read-only Viewing Access",
      admin: true,
      pm: true,
      member: true,
      viewer: true,
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Profile Header Card */}
        <div className="p-8 rounded-3xl bg-[#0d0e15] border border-zinc-800/80 shadow-card flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <img
            src={
              avatarUrl ||
              user?.avatarUrl ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || "User"}`
            }
            alt={user?.name || "User"}
            className="w-24 h-24 rounded-3xl object-cover bg-zinc-800 border-2 border-indigo-500/30 shadow-xl"
          />

          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <h1 className="text-2xl font-black text-white">{user?.name}</h1>
              {user && (
                <span
                  className={cn(
                    "text-xs px-3 py-1 rounded-full font-semibold border",
                    roleCfg?.badge || "bg-zinc-800 text-zinc-300"
                  )}
                >
                  {roleCfg?.label || user.role}
                </span>
              )}
            </div>

            <p className="text-xs text-zinc-400">{user?.email}</p>
            <p className="text-xs text-zinc-300 max-w-xl leading-relaxed pt-1">
              {roleCfg?.description}
            </p>

            <div className="pt-3 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5 font-mono">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                Auth Status: Active
              </span>
              <span className="flex items-center gap-1.5 font-mono">
                <Key className="w-3.5 h-3.5 text-indigo-400" />
                Token Type: Bearer JWT
              </span>
            </div>
          </div>
        </div>

        {/* Edit Profile & Password Two-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Edit Profile Information */}
          <div className="p-6 rounded-3xl bg-[#0d0e15] border border-zinc-800/80 shadow-card space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" />
              <span>Personal Details</span>
            </h3>

            {profileSuccess && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-900/60 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Profile updated successfully!</span>
              </div>
            )}

            {profileError && (
              <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-xl flex items-center gap-2 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Avatar Image URL
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">
                  Email Address (Read-Only)
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ""}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-500 cursor-not-allowed"
                />
              </div>

              <button
                type="submit"
                disabled={profileSaving}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{profileSaving ? "Saving..." : "Save Profile"}</span>
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div className="p-6 rounded-3xl bg-[#0d0e15] border border-zinc-800/80 shadow-card space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-400" />
              <span>Change Password</span>
            </h3>

            {passwordSuccess && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-900/60 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Password changed successfully!</span>
              </div>
            )}

            {passwordError && (
              <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-xl flex items-center gap-2 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  New Password (min. 6 chars)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={passwordSaving}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{passwordSaving ? "Updating..." : "Update Password"}</span>
              </button>
            </form>
          </div>
        </div>

        {/* RBAC Server Permissions Matrix */}
        <div className="p-6 rounded-3xl bg-[#0d0e15] border border-zinc-800/80 shadow-card space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">System Role Governance Matrix</h3>
            <p className="text-xs text-zinc-400">
              Role permissions enforced on every API mutation by server middleware:
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/80 text-zinc-400 uppercase font-mono border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Action / Capability</th>
                  <th className="py-3 px-3 text-center">Admin</th>
                  <th className="py-3 px-3 text-center">Project Manager</th>
                  <th className="py-3 px-3 text-center">Team Member</th>
                  <th className="py-3 px-3 text-center">Viewer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono">
                {permissionsMatrix.map((item, idx) => (
                  <tr key={idx} className="hover:bg-zinc-900/40">
                    <td className="py-3 px-4 font-sans text-zinc-200">{item.permission}</td>
                    <td className="py-3 px-3 text-center">
                      {item.admin ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-zinc-600 mx-auto" />
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {item.pm ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-zinc-600 mx-auto" />
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {item.member ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-zinc-600 mx-auto" />
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {item.viewer ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-zinc-600 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
