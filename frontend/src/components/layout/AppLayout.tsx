"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Bell,
  LogOut,
  ChevronDown,
  Layers,
  X,
  Settings,
  User as UserIcon,
  Search,
  Building,
  Plus,
  Mail,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  Briefcase,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { ROLE_CONFIG, cn } from "../../lib/utils";
import { api } from "../../lib/api";
import { SyncStatusBadge } from "../ui/SyncStatusBadge";
import { CommandPalette } from "../ui/CommandPalette";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, refreshUser } = useAuth();
  const { isConnected, toasts, removeToast, unreadCount } = useSocket();
  const pathname = usePathname();
  const router = useRouter();

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showCmd, setShowCmd] = useState(false);

  // Organization workspace state
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [orgTab, setOrgTab] = useState<"overview" | "create" | "invite">("overview");
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgDesc, setNewOrgDesc] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"MEMBER" | "ADMIN">("MEMBER");
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgSuccess, setOrgSuccess] = useState<string | null>(null);
  const [orgError, setOrgError] = useState<string | null>(null);
  const [activeOrgDetails, setActiveOrgDetails] = useState<any | null>(null);

  const activeMembership =
    user?.organizationMemberships && user.organizationMemberships.length > 0
      ? user.organizationMemberships[0]
      : null;

  useEffect(() => {
    if (showOrgModal && activeMembership) {
      api.organizations.get(activeMembership.organizationId).then((res) => {
        if (res.data?.organization) {
          setActiveOrgDetails(res.data.organization);
        }
      });
    }
  }, [showOrgModal, activeMembership]);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    setOrgLoading(true);
    setOrgError(null);
    setOrgSuccess(null);
    const res = await api.organizations.create({
      name: newOrgName.trim(),
      description: newOrgDesc.trim() || undefined,
    });
    setOrgLoading(false);
    if (res.data?.organization) {
      setOrgSuccess(`Organization "${res.data.organization.name}" created successfully!`);
      setNewOrgName("");
      setNewOrgDesc("");
      await refreshUser();
      setTimeout(() => {
        setOrgTab("overview");
        setOrgSuccess(null);
      }, 1500);
    } else {
      setOrgError(res.error || "Failed to create organization");
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !activeMembership) return;
    setOrgLoading(true);
    setOrgError(null);
    setOrgSuccess(null);
    const res = await api.organizations.addMember(activeMembership.organizationId, {
      email: inviteEmail.trim(),
      role: inviteRole,
    });
    setOrgLoading(false);
    if (res.data?.member) {
      setOrgSuccess(`Invited ${inviteEmail} to ${activeMembership.organization.name}!`);
      setInviteEmail("");
      const updated = await api.organizations.get(activeMembership.organizationId);
      if (updated.data?.organization) setActiveOrgDetails(updated.data.organization);
      setTimeout(() => setOrgSuccess(null), 3000);
    } else {
      setOrgError(res.error || "Failed to invite member");
    }
  };

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Projects", href: "/projects", icon: FolderKanban },
    ...(user?.role === "ADMIN"
      ? [{ label: "Users & Team", href: "/users", icon: Users, badge: "Admin" }]
      : []),
    {
      label: "Notifications",
      href: "/notifications",
      icon: Bell,
      count: unreadCount,
    },
    { label: "Profile & Settings", href: "/profile", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-paper text-carbon flex flex-col md:flex-row antialiased selection:bg-periwinkle selection:text-carbon">
      {/* Toast Notification Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto p-4 rounded-xl border border-divider bg-editor shadow-2xl text-carbon flex items-start justify-between gap-3 animate-in slide-in-from-top-3 fade-in duration-300"
          >
            <div className="flex items-start gap-2.5">
              <span
                className={cn(
                  "w-2.5 h-2.5 rounded-full mt-1.5 shrink-0",
                  toast.type === "success" && "bg-moss border border-[#3B5A38]",
                  toast.type === "warning" && "bg-coral/80",
                  toast.type === "conflict" && "bg-coral",
                  toast.type === "info" && "bg-periwinkle border border-[#364573]"
                )}
              />
              <div>
                <p className="text-sm font-bold text-carbon">{toast.title}</p>
                <p className="text-xs text-muted mt-0.5 line-clamp-2">{toast.message}</p>
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-muted hover:text-carbon transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-divider bg-editor flex flex-col justify-between shrink-0 shadow-sm">
        <div>
          {/* Logo & App Title */}
          <div className="p-5 border-b border-divider flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-coral flex items-center justify-center text-white shadow-md shadow-coral/20 group-hover:scale-105 transition-transform duration-200">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg tracking-tight text-carbon">LetsCollab</span>
                </div>
                <span className="text-[11px] text-muted block -mt-0.5 font-medium">Project Workspace</span>
              </div>
            </Link>
          </div>

          {/* Organization Switcher / Workspace Badge */}
          <div className="p-3 border-b border-divider">
            <button
              onClick={() => {
                setOrgTab(activeMembership ? "overview" : "create");
                setShowOrgModal(true);
              }}
              className="w-full p-2.5 rounded-xl bg-paper border border-divider hover:border-coral/50 flex items-center justify-between text-left transition-all duration-140 hover:-translate-y-0.5 active:scale-[0.98] group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-coral/10 border border-coral/20 flex items-center justify-center shrink-0 text-coral">
                  {activeMembership ? (
                    <Building className="w-3.5 h-3.5" />
                  ) : (
                    <Briefcase className="w-3.5 h-3.5 text-muted" />
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase tracking-wider text-muted font-bold block truncate">
                    {activeMembership ? "Organization" : "Workspace"}
                  </span>
                  <span className="text-xs font-bold text-carbon block truncate">
                    {activeMembership ? activeMembership.organization.name : "Personal (No Org)"}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono font-medium text-coral group-hover:underline shrink-0">
                {activeMembership ? "Manage" : "Opt-in"}
              </span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-160 ease-out select-none hover:-translate-y-0.5 active:scale-[0.98]",
                    isActive
                      ? "bg-carbon text-paper font-semibold shadow-xs"
                      : "text-muted hover:text-carbon hover:bg-paper border border-transparent hover:border-divider"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("w-4 h-4", isActive ? "text-paper" : "text-muted")} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-paper border border-divider text-muted font-mono font-medium">
                      {item.badge}
                    </span>
                  )}
                  {item.count !== undefined && item.count > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-coral text-white font-bold">
                      {item.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card in Sidebar Footer */}
        <div className="p-3 border-t border-divider bg-paper/60">
          {user ? (
            <div className="p-2.5 rounded-xl bg-editor border border-divider flex items-center justify-between shadow-sm">
              <Link href="/profile" className="flex items-center gap-2.5 min-w-0 group">
                <img
                  src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                  alt={user.name}
                  className="w-8 h-8 rounded-full bg-paper object-cover border border-divider"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-carbon group-hover:text-coral transition truncate">
                    {user.name}
                  </p>
                  <span
                    className={cn(
                      "inline-block text-[10px] font-medium px-1.5 py-0.2 rounded border mt-0.5",
                      ROLE_CONFIG[user.role]?.badge || "bg-paper text-muted border-divider"
                    )}
                  >
                    {ROLE_CONFIG[user.role]?.label || user.role}
                  </span>
                </div>
              </Link>

              <button
                onClick={logout}
                title="Sign Out"
                className="p-1.5 text-muted hover:text-coral rounded-lg hover:bg-paper transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-coral hover:bg-[#d34628] text-white text-xs font-semibold rounded-xl transition shadow-md"
            >
              Sign In
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 border-b border-divider bg-editor/90 backdrop-blur-md px-6 flex items-center justify-between shrink-0 shadow-sm">
          {/* Real-time Status Badge & Breadcrumb */}
          <div className="flex items-center gap-4">
            <SyncStatusBadge state={isConnected ? "Synced" : "Offline"} />

            <button
              onClick={() => setShowCmd(true)}
              className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-paper hover:bg-editor border border-divider text-muted hover:text-carbon text-xs font-mono transition-all duration-140 hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <Search className="w-3.5 h-3.5 text-muted" />
              <span>Search commands & actions</span>
              <kbd className="px-1.5 py-0.5 rounded bg-editor border border-divider text-[10px] text-muted">⌘K</kbd>
            </button>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <Link
              href="/notifications"
              className="relative p-2 text-muted hover:text-carbon rounded-xl hover:bg-paper transition-all duration-150 hover:-translate-y-0.5 active:scale-95"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-coral ring-2 ring-editor" />
              )}
            </Link>

            {/* User Profile Dropdown */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl hover:bg-paper border border-divider bg-editor transition-all duration-150 hover:-translate-y-0.5 shadow-xs"
                >
                  <img
                    src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                    alt={user.name}
                    className="w-6 h-6 rounded-full object-cover bg-paper border border-divider"
                  />
                  <span className="text-xs font-bold text-carbon hidden sm:inline">
                    {user.name.split(" ")[0]}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 text-muted transition-transform duration-160",
                      showUserDropdown && "rotate-180"
                    )}
                  />
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-editor border border-divider rounded-2xl shadow-xl p-2 z-50 animate-tooltip">
                    <div className="px-3 py-2 border-b border-divider">
                      <p className="text-xs font-bold text-carbon">{user.name}</p>
                      <p className="text-[11px] text-muted truncate">{user.email}</p>
                      <span
                        className={cn(
                          "inline-block text-[9px] px-1.5 py-0.2 rounded border font-mono mt-1",
                          ROLE_CONFIG[user.role]?.badge || "bg-paper text-muted border-divider"
                        )}
                      >
                        {user.role}
                      </span>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-muted hover:text-carbon hover:bg-paper transition"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-muted" />
                        <span>Profile & Settings</span>
                      </Link>

                      <Link
                        href="/projects"
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-muted hover:text-carbon hover:bg-paper transition"
                      >
                        <FolderKanban className="w-3.5 h-3.5 text-muted" />
                        <span>My Projects</span>
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-divider">
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-coral hover:bg-coral/10 transition font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Page Main Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-paper">{children}</main>
      </div>

      {/* Organization Workspace Modal */}
      {showOrgModal && (
        <div className="fixed inset-0 z-50 bg-carbon/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-editor border border-divider rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-divider flex items-center justify-between bg-paper/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-coral/10 border border-coral/20 flex items-center justify-center text-coral">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-carbon">
                    {activeMembership ? activeMembership.organization.name : "Organization Workspaces"}
                  </h3>
                  <p className="text-xs text-muted">
                    {activeMembership
                      ? `Role: ${activeMembership.role}`
                      : "Optional team collaboration & shared projects"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowOrgModal(false)}
                className="p-1.5 text-muted hover:text-carbon rounded-lg hover:bg-paper transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-divider px-5 pt-3 bg-paper/20 gap-2">
              <button
                onClick={() => setOrgTab("overview")}
                className={cn(
                  "px-3 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 -mb-px",
                  orgTab === "overview"
                    ? "border-coral text-coral bg-editor"
                    : "border-transparent text-muted hover:text-carbon"
                )}
              >
                Overview
              </button>
              {activeMembership && (
                <button
                  onClick={() => setOrgTab("invite")}
                  className={cn(
                    "px-3 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 -mb-px flex items-center gap-1.5",
                    orgTab === "invite"
                      ? "border-coral text-coral bg-editor"
                      : "border-transparent text-muted hover:text-carbon"
                  )}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Invite Teammates
                </button>
              )}
              <button
                onClick={() => setOrgTab("create")}
                className={cn(
                  "px-3 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 -mb-px flex items-center gap-1.5",
                  orgTab === "create"
                    ? "border-coral text-coral bg-editor"
                    : "border-transparent text-muted hover:text-carbon"
                )}
              >
                <Plus className="w-3.5 h-3.5" />
                {activeMembership ? "Create Another" : "Opt In / Create"}
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-4">
              {orgSuccess && (
                <div className="p-3 rounded-xl bg-moss/10 border border-moss/30 text-[#2D5A27] text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-moss" />
                  <span>{orgSuccess}</span>
                </div>
              )}
              {orgError && (
                <div className="p-3 rounded-xl bg-coral/10 border border-coral/30 text-coral text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{orgError}</span>
                </div>
              )}

              {/* TAB 1: OVERVIEW */}
              {orgTab === "overview" && (
                <div>
                  {activeMembership ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-paper border border-divider">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-muted font-bold block">
                              Active Workspace
                            </span>
                            <h4 className="text-base font-extrabold text-carbon mt-0.5">
                              {activeMembership.organization.name}
                            </h4>
                            <p className="text-xs text-muted mt-1">
                              Slug: <code className="font-mono text-coral">@{activeMembership.organization.slug}</code>
                            </p>
                          </div>
                          <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-coral/10 text-coral border border-coral/20">
                            {activeMembership.role}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-xs font-bold text-carbon uppercase tracking-wider">
                            Team Members ({activeOrgDetails?.members?.length || 1})
                          </h5>
                          <button
                            onClick={() => setOrgTab("invite")}
                            className="text-xs text-coral font-bold hover:underline flex items-center gap-1"
                          >
                            <UserPlus className="w-3 h-3" />
                            Invite
                          </button>
                        </div>

                        <div className="divide-y divide-divider rounded-xl border border-divider bg-paper overflow-hidden">
                          {activeOrgDetails?.members?.map((m: any) => (
                            <div key={m.id} className="p-3 flex items-center justify-between">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <img
                                  src={
                                    m.user?.avatarUrl ||
                                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.user?.name || "Member"}`
                                  }
                                  alt={m.user?.name}
                                  className="w-7 h-7 rounded-full bg-editor border border-divider object-cover"
                                />
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-carbon truncate">
                                    {m.user?.name || "Teammate"} {m.userId === user?.id && "(You)"}
                                  </p>
                                  <p className="text-[11px] text-muted truncate">{m.user?.email}</p>
                                </div>
                              </div>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-editor border border-divider text-muted font-semibold">
                                {m.role}
                              </span>
                            </div>
                          )) || (
                            <div className="p-4 text-center text-xs text-muted">
                              Loading organization members...
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-paper/60 border border-divider flex items-center justify-between text-xs text-muted">
                        <span>Projects in this Organization</span>
                        <span className="font-mono font-bold text-carbon">
                          {activeOrgDetails?.projects?.length ?? "—"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 space-y-4">
                      <div className="w-14 h-14 rounded-2xl bg-paper border border-divider mx-auto flex items-center justify-center text-muted">
                        <Briefcase className="w-7 h-7 text-coral" />
                      </div>
                      <div className="max-w-sm mx-auto space-y-1.5">
                        <h4 className="text-sm font-extrabold text-carbon">Personal Workspace Active</h4>
                        <p className="text-xs text-muted leading-relaxed">
                          Organizations are completely <strong className="text-carbon">optional</strong> in LetsCollab. You can create projects, assign tasks, and track activity independently without any organization overhead.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-paper border border-divider text-left space-y-2">
                        <p className="text-xs font-bold text-carbon">Why opt into an organization?</p>
                        <ul className="text-xs text-muted space-y-1 list-disc list-inside">
                          <li>Invite colleagues and collaborate on shared projects</li>
                          <li>Control member roles (Admin, Member, Viewer)</li>
                          <li>Centralize project visibility across your company</li>
                        </ul>
                      </div>
                      <button
                        onClick={() => setOrgTab("create")}
                        className="w-full py-2.5 px-4 bg-coral hover:bg-[#d34628] text-white text-xs font-bold rounded-xl transition shadow-md shadow-coral/20 flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Opt In & Create an Organization
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: INVITE TEAMMATES */}
              {orgTab === "invite" && activeMembership && (
                <form onSubmit={handleInviteMember} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-carbon mb-1">
                      Teammate&apos;s Registered Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-3 text-muted" />
                      <input
                        type="email"
                        required
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="colleague@example.com"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-paper border border-divider text-xs text-carbon placeholder:text-muted/60 focus:outline-none focus:border-coral transition"
                      />
                    </div>
                    <p className="text-[11px] text-muted mt-1">
                      If the user already has an account, they will instantly be added to <strong className="text-carbon">{activeMembership.organization.name}</strong>.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-carbon mb-1">Organization Role</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as "MEMBER" | "ADMIN")}
                      className="w-full p-2 rounded-xl bg-paper border border-divider text-xs text-carbon focus:outline-none focus:border-coral transition"
                    >
                      <option value="MEMBER">Member (Can collaborate on projects)</option>
                      <option value="ADMIN">Admin (Can manage settings and invite teammates)</option>
                    </select>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setOrgTab("overview")}
                      className="px-4 py-2 rounded-xl border border-divider text-xs font-medium text-muted hover:text-carbon transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={orgLoading}
                      className="px-5 py-2 bg-coral hover:bg-[#d34628] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-md shadow-coral/20 flex items-center gap-1.5"
                    >
                      {orgLoading ? "Inviting..." : "Send Invitation"}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: CREATE / OPT IN */}
              {orgTab === "create" && (
                <form onSubmit={handleCreateOrg} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-carbon mb-1">
                      Organization / Company Name <span className="text-coral">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newOrgName}
                      onChange={(e) => setNewOrgName(e.target.value)}
                      placeholder="e.g. Acme Studio, Nova Labs"
                      className="w-full px-3 py-2 rounded-xl bg-paper border border-divider text-xs text-carbon placeholder:text-muted/60 focus:outline-none focus:border-coral transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-carbon mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={newOrgDesc}
                      onChange={(e) => setNewOrgDesc(e.target.value)}
                      placeholder="Brief summary of what this organization or department does"
                      className="w-full px-3 py-2 rounded-xl bg-paper border border-divider text-xs text-carbon placeholder:text-muted/60 focus:outline-none focus:border-coral transition"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-paper/60 border border-divider text-[11px] text-muted leading-relaxed">
                    💡 <strong className="text-carbon">Note:</strong> You will be the Owner of this organization. You can still create individual personal projects whenever you like.
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setOrgTab("overview")}
                      className="px-4 py-2 rounded-xl border border-divider text-xs font-medium text-muted hover:text-carbon transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={orgLoading || !newOrgName.trim()}
                      className="px-5 py-2 bg-coral hover:bg-[#d34628] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-md shadow-coral/20 flex items-center gap-1.5"
                    >
                      {orgLoading ? "Creating..." : "Create Organization"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global Command Palette (Cmd+K) */}
      <CommandPalette isOpen={showCmd} onClose={() => setShowCmd(false)} />
    </div>
  );
}
