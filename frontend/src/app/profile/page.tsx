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
} from "lucide-react";
import { ROLE_CONFIG, cn } from "../../lib/utils";

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

  useEffect(() => {
    if (user) {
      setName(user.name);
      setAvatarUrl(user.avatarUrl || "");
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
      viewer: true,
    },
    {
      permission: "Post Comments with @mentions",
      admin: true,
      pm: true,
      member: true,
      viewer: true,
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
        <div className="p-8 rounded-3xl bg-editor border border-divider shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <img
            src={
              avatarUrl ||
              user?.avatarUrl ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || "User"}`
            }
            alt={user?.name || "User"}
            className="w-24 h-24 rounded-3xl object-cover bg-paper border-2 border-coral/40 shadow-md"
          />

          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <h1 className="text-2xl font-black text-carbon">{user?.name}</h1>
              {user && (
                <span
                  className={cn(
                    "text-xs px-3 py-1 rounded-full font-semibold border",
                    roleCfg?.badge || "bg-paper text-carbon border-divider"
                  )}
                >
                  {roleCfg?.label || user.role}
                </span>
              )}
            </div>

            <p className="text-xs text-muted">{user?.email}</p>
            <p className="text-xs text-carbon max-w-xl leading-relaxed pt-1 font-medium">
              {roleCfg?.description}
            </p>

            <div className="pt-3 flex flex-wrap items-center gap-4 text-xs text-muted">
              <span className="flex items-center gap-1.5 font-mono">
                <Shield className="w-3.5 h-3.5 text-coral" />
                Auth Status: Active
              </span>
              <span className="flex items-center gap-1.5 font-mono">
                <Key className="w-3.5 h-3.5 text-coral" />
                Token Type: Bearer JWT
              </span>
            </div>
          </div>
        </div>

        {/* Edit Profile & Password Two-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Edit Profile Information */}
          <div className="p-6 rounded-3xl bg-editor border border-divider shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-carbon flex items-center gap-2">
              <User className="w-4 h-4 text-coral" />
              <span>Personal Details</span>
            </h3>

            {profileSuccess && (
              <div className="p-3 bg-moss border border-[#b5cea8] rounded-xl flex items-center gap-2 text-xs text-[#254622] font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Profile updated successfully!</span>
              </div>
            )}

            {profileError && (
              <div className="p-3 bg-coral/15 border border-coral/30 rounded-xl flex items-center gap-2 text-xs text-coral font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-carbon block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-paper border border-divider rounded-xl text-xs text-carbon placeholder-muted focus:outline-none focus:border-coral focus:bg-editor"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-carbon block mb-1">
                  Avatar Image URL
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 bg-paper border border-divider rounded-xl text-xs text-carbon placeholder-muted focus:outline-none focus:border-coral focus:bg-editor"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted block mb-1">
                  Email Address (Read-Only)
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ""}
                  className="w-full px-3.5 py-2.5 bg-paper border border-divider rounded-xl text-xs text-muted cursor-not-allowed font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={profileSaving}
                className="flex items-center gap-2 px-5 py-2.5 bg-coral hover:bg-[#d34628] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-coral/20 transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{profileSaving ? "Saving..." : "Save Profile"}</span>
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div className="p-6 rounded-3xl bg-editor border border-divider shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-carbon flex items-center gap-2">
              <Lock className="w-4 h-4 text-coral" />
              <span>Change Password</span>
            </h3>

            {passwordSuccess && (
              <div className="p-3 bg-moss border border-[#b5cea8] rounded-xl flex items-center gap-2 text-xs text-[#254622] font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Password changed successfully!</span>
              </div>
            )}

            {passwordError && (
              <div className="p-3 bg-coral/15 border border-coral/30 rounded-xl flex items-center gap-2 text-xs text-coral font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-carbon block mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-paper border border-divider rounded-xl text-xs text-carbon placeholder-muted focus:outline-none focus:border-coral focus:bg-editor"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-carbon block mb-1">
                  New Password (min. 6 chars)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-paper border border-divider rounded-xl text-xs text-carbon placeholder-muted focus:outline-none focus:border-coral focus:bg-editor"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-carbon block mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-paper border border-divider rounded-xl text-xs text-carbon placeholder-muted focus:outline-none focus:border-coral focus:bg-editor"
                />
              </div>

              <button
                type="submit"
                disabled={passwordSaving}
                className="flex items-center gap-2 px-5 py-2.5 bg-coral hover:bg-[#d34628] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-coral/20 transition"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{passwordSaving ? "Updating..." : "Update Password"}</span>
              </button>
            </form>
          </div>
        </div>

        {/* RBAC Server Permissions Matrix */}
        <div className="p-6 rounded-3xl bg-editor border border-divider shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-carbon">System Role Governance Matrix</h3>
            <p className="text-xs text-muted">
              Role permissions enforced on every API mutation by server middleware:
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-paper text-muted uppercase font-mono border-b border-divider">
                <tr>
                  <th className="py-3 px-4">Action / Capability</th>
                  <th className="py-3 px-3 text-center">Admin</th>
                  <th className="py-3 px-3 text-center">Project Manager</th>
                  <th className="py-3 px-3 text-center">Team Member</th>
                  <th className="py-3 px-3 text-center">Viewer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider font-mono">
                {permissionsMatrix.map((item, idx) => (
                  <tr key={idx} className="hover:bg-paper">
                    <td className="py-3 px-4 font-sans text-carbon font-medium">{item.permission}</td>
                    <td className="py-3 px-3 text-center">
                      {item.admin ? (
                        <CheckCircle2 className="w-4 h-4 text-[#254622] mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-divider mx-auto" />
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {item.pm ? (
                        <CheckCircle2 className="w-4 h-4 text-[#254622] mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-divider mx-auto" />
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {item.member ? (
                        <CheckCircle2 className="w-4 h-4 text-[#254622] mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-divider mx-auto" />
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {item.viewer ? (
                        <CheckCircle2 className="w-4 h-4 text-[#254622] mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-divider mx-auto" />
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
