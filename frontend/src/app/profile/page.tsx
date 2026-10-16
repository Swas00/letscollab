"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "../../components/layout/AppLayout";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import {
  User as UserIcon,
  Shield,
  Key,
  CheckCircle2,
  XCircle,
  Save,
  Lock,
  AlertCircle,
  Sparkles,
  Upload,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Check,
  Database,
  Calendar,
} from "lucide-react";
import { ROLE_CONFIG, cn } from "../../lib/utils";

// Preset avatar styles and collections
const AVATAR_PRESETS = [
  {
    category: "Adventurer",
    avatars: [
      { name: "Felix", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix" },
      { name: "Aria", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Aria" },
      { name: "Leo", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Leo" },
      { name: "Maya", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Maya" },
    ],
  },
  {
    category: "Notionists",
    avatars: [
      { name: "Sasha", url: "https://api.dicebear.com/7.x/notionists/svg?seed=Sasha" },
      { name: "Zane", url: "https://api.dicebear.com/7.x/notionists/svg?seed=Zane" },
      { name: "Kira", url: "https://api.dicebear.com/7.x/notionists/svg?seed=Kira" },
      { name: "Milo", url: "https://api.dicebear.com/7.x/notionists/svg?seed=Milo" },
    ],
  },
  {
    category: "Tech AI Bots",
    avatars: [
      { name: "CyberSpark", url: "https://api.dicebear.com/7.x/bottts/svg?seed=CyberSpark" },
      { name: "NeoBot", url: "https://api.dicebear.com/7.x/bottts/svg?seed=NeoBot" },
      { name: "Byte", url: "https://api.dicebear.com/7.x/bottts/svg?seed=Byte" },
      { name: "Quantum", url: "https://api.dicebear.com/7.x/bottts/svg?seed=Quantum" },
    ],
  },
  {
    category: "Micah Art",
    avatars: [
      { name: "Cosmo", url: "https://api.dicebear.com/7.x/micah/svg?seed=Cosmo" },
      { name: "Luna", url: "https://api.dicebear.com/7.x/micah/svg?seed=Luna" },
      { name: "Orion", url: "https://api.dicebear.com/7.x/micah/svg?seed=Orion" },
      { name: "Nova", url: "https://api.dicebear.com/7.x/micah/svg?seed=Nova" },
    ],
  },
  {
    category: "Modern People",
    avatars: [
      { name: "Alex", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" },
      { name: "Taylor", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Taylor" },
      { name: "Jordan", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan" },
      { name: "Morgan", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Morgan" },
    ],
  },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, refreshUser, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Form
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Adventurer");
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

  // Delete Account Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setAvatarUrl(user.avatarUrl || "");
    }
  }, [user]);

  const handleUpdateProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

  const handleSelectPresetAvatar = (url: string) => {
    setAvatarUrl(url);
    setProfileError(null);
  };

  const handleRandomizeAvatar = () => {
    const styles = ["adventurer", "notionists", "bottts", "micah", "avataaars", "big-smile", "fun-emoji"];
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    const randomSeed = Math.random().toString(36).substring(2, 9);
    const newAvatar = `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${randomSeed}`;
    setAvatarUrl(newAvatar);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setProfileError("Please select a valid image file (PNG, JPG, SVG, WebP)");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setProfileError("Image size must be under 3 MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setAvatarUrl(result);
        setProfileError(null);
      }
    };
    reader.readAsDataURL(file);
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

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(null);

    if (deleteConfirmText.toLowerCase() !== "delete permanently") {
      setDeleteError('Please type "delete permanently" to confirm.');
      return;
    }

    if (!deletePassword) {
      setDeleteError("Please enter your current account password to authorize deletion.");
      return;
    }

    setIsDeletingAccount(true);
    const res = await api.auth.deleteAccount(deletePassword);
    setIsDeletingAccount(false);

    if (res.data) {
      setIsDeleteModalOpen(false);
      logout();
      router.push("/register?deleted=true");
    } else {
      setDeleteError(res.error || "Failed to delete account. Please verify your password.");
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
      <div className="space-y-8 max-w-5xl mx-auto pb-12">
        {/* Profile Header Card */}
        <div className="p-8 rounded-3xl bg-editor border border-divider shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative group">
            <img
              src={
                avatarUrl ||
                user?.avatarUrl ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || "User"}`
              }
              alt={user?.name || "User"}
              className="w-24 h-24 rounded-3xl object-cover bg-paper border-2 border-coral/40 shadow-md transition-transform duration-200 group-hover:scale-105"
            />
            <button
              type="button"
              onClick={handleRandomizeAvatar}
              title="Quick Randomize Avatar"
              className="absolute -bottom-2 -right-2 p-2 bg-coral text-white rounded-full shadow-lg hover:bg-[#d34628] transition active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

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

            <p className="text-xs text-muted font-mono">{user?.email}</p>
            <p className="text-xs text-carbon max-w-xl leading-relaxed pt-1 font-medium">
              {roleCfg?.description}
            </p>

            <div className="pt-3 flex flex-wrap items-center gap-4 text-xs text-muted">
              <span className="flex items-center gap-1.5 font-mono">
                <Database className="w-3.5 h-3.5 text-coral" />
                Account Details: Permanently Stored
              </span>
              <span className="flex items-center gap-1.5 font-mono">
                <Shield className="w-3.5 h-3.5 text-moss" />
                Status: Active
              </span>
              <span className="flex items-center gap-1.5 font-mono">
                <Key className="w-3.5 h-3.5 text-coral" />
                Auth: Bearer JWT
              </span>
            </div>
          </div>
        </div>

        {/* Avatar Customizer Section */}
        <div className="p-6 rounded-3xl bg-editor border border-divider shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-carbon flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-coral" />
                <span>Customize & Choose Your Avatar</span>
              </h3>
              <p className="text-xs text-muted mt-0.5">
                Pick from curated character styles, randomize a unique persona, or upload your own photo.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRandomizeAvatar}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-paper hover:bg-hover border border-divider rounded-xl text-xs font-semibold text-carbon transition shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5 text-coral" />
                <span>🎲 Randomize</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-paper hover:bg-hover border border-divider rounded-xl text-xs font-semibold text-carbon transition shadow-sm"
              >
                <Upload className="w-3.5 h-3.5 text-coral" />
                <span>Upload Photo</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-divider">
            {AVATAR_PRESETS.map((preset) => (
              <button
                key={preset.category}
                type="button"
                onClick={() => setSelectedCategory(preset.category)}
                className={cn(
                  "px-3.5 py-1.5 text-xs font-bold rounded-xl transition whitespace-nowrap",
                  selectedCategory === preset.category
                    ? "bg-coral text-white shadow-sm"
                    : "text-muted hover:text-carbon hover:bg-paper"
                )}
              >
                {preset.category}
              </button>
            ))}
          </div>

          {/* Preset Avatars Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-4">
            {AVATAR_PRESETS.find((p) => p.category === selectedCategory)?.avatars.map((preset) => {
              const isSelected = avatarUrl === preset.url;
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleSelectPresetAvatar(preset.url)}
                  className={cn(
                    "relative p-3 rounded-2xl border transition-all text-center flex flex-col items-center gap-2 group",
                    isSelected
                      ? "bg-paper border-coral ring-2 ring-coral/30 shadow-md scale-[1.02]"
                      : "bg-paper/60 border-divider hover:border-coral/50 hover:bg-paper hover:scale-[1.01]"
                  )}
                >
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="w-16 h-16 rounded-2xl object-cover bg-paper border border-divider shadow-sm"
                  />
                  <div className="flex items-center justify-between w-full px-1">
                    <span className="text-xs font-bold text-carbon truncate">{preset.name}</span>
                    {isSelected ? (
                      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-coral text-white">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted opacity-0 group-hover:opacity-100 transition">Select</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Direct URL Input fallback */}
          <div className="pt-2">
            <label className="text-xs font-bold text-carbon block mb-1">
              Or Use Custom Image URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/my-avatar.png"
                className="flex-1 px-3.5 py-2 bg-paper border border-divider rounded-xl text-xs text-carbon placeholder-muted focus:outline-none focus:border-coral focus:bg-editor"
              />
              <button
                type="button"
                onClick={() => handleUpdateProfile()}
                disabled={profileSaving}
                className="px-4 py-2 bg-coral hover:bg-[#d34628] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Avatar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Edit Profile & Password Two-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Edit Profile Information */}
          <div className="p-6 rounded-3xl bg-editor border border-divider shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-carbon flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-coral" />
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
                <label className="text-xs font-bold text-muted block mb-1">
                  Work Email (Permanent Identity)
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ""}
                  className="w-full px-3.5 py-2.5 bg-paper border border-divider rounded-xl text-xs text-muted cursor-not-allowed font-medium font-mono"
                />
                <p className="text-[11px] text-muted mt-1">
                  Your email is the persistent anchor for project memberships, invites, and notifications.
                </p>
              </div>

              <button
                type="submit"
                disabled={profileSaving}
                className="flex items-center gap-2 px-5 py-2.5 bg-coral hover:bg-[#d34628] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-coral/20 transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{profileSaving ? "Saving..." : "Save Profile Details"}</span>
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

        {/* Account Retention & Preservation Notice */}
        <div className="p-6 rounded-3xl bg-editor border border-divider shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-coral" />
            <h3 className="text-sm font-bold text-carbon">Account Creation Details & Retention Policy</h3>
          </div>
          <div className="p-4 bg-paper rounded-2xl border border-divider space-y-2 text-xs text-muted leading-relaxed">
            <p className="text-carbon font-semibold">
              ✓ All account details are saved permanently in the persistent database.
            </p>
            <p>
              Your account identity, email, encrypted credentials, project workspaces, and collaboration history are retained indefinitely across logins, logouts, and system restarts.
            </p>
            <p>
              They will remain stored and safeguarded unless you explicitly choose to permanently delete your account below.
            </p>
          </div>
        </div>

        {/* Danger Zone: Permanent Account Deletion */}
        <div className="p-6 rounded-3xl bg-coral/5 border border-coral/30 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-coral flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Danger Zone: Permanent Account Deletion</span>
              </h3>
              <p className="text-xs text-muted max-w-xl">
                Permanently erase your account, login credentials, and personal profile from the database. This action is irreversible.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-4 py-2 bg-coral hover:bg-[#d34628] text-white text-xs font-bold rounded-xl transition shadow-md shadow-coral/20 flex items-center gap-1.5 shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Account Permanently</span>
            </button>
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

      {/* Confirmation Modal for Permanent Account Deletion */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-carbon/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 bg-editor border border-divider rounded-3xl shadow-2xl space-y-5 animate-activity-slide">
            <div className="flex items-center gap-3 text-coral">
              <div className="p-2.5 rounded-2xl bg-coral/15 border border-coral/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-carbon">Permanently Delete Account?</h3>
                <p className="text-xs text-muted">This action is irreversible and immediate.</p>
              </div>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              All your account details, passwords, assigned roles, and invitations will be permanently removed from the database. Any shared project data you created will remain safe, but disassociated from your deleted identity.
            </p>

            {deleteError && (
              <div className="p-3 bg-coral/15 border border-coral/30 rounded-xl flex items-center gap-2 text-xs text-coral">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-carbon block mb-1">
                  Type <span className="font-mono text-coral font-bold">delete permanently</span> to confirm:
                </label>
                <input
                  type="text"
                  required
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="delete permanently"
                  className="w-full px-3.5 py-2 bg-paper border border-divider rounded-xl text-xs text-carbon placeholder-muted focus:outline-none focus:border-coral"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-carbon block mb-1">
                  Current Account Password
                </label>
                <input
                  type="password"
                  required
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-3.5 py-2 bg-paper border border-divider rounded-xl text-xs text-carbon placeholder-muted focus:outline-none focus:border-coral"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDeletePassword("");
                    setDeleteConfirmText("");
                    setDeleteError(null);
                  }}
                  className="px-4 py-2 bg-paper hover:bg-hover border border-divider rounded-xl text-xs font-bold text-carbon transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeletingAccount}
                  className="px-4 py-2 bg-coral hover:bg-[#d34628] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-md shadow-coral/20 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeletingAccount ? "Deleting..." : "Confirm Delete"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
