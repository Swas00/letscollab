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
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { ROLE_CONFIG, cn } from "../../lib/utils";
import { api } from "../../lib/api";
import { SyncStatusBadge } from "../ui/SyncStatusBadge";
import { CommandPalette } from "../ui/CommandPalette";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { isConnected, toasts, removeToast, unreadCount } = useSocket();
  const pathname = usePathname();
  const router = useRouter();

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showCmd, setShowCmd] = useState(false);

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

      {/* Global Command Palette (Cmd+K) */}
      <CommandPalette isOpen={showCmd} onClose={() => setShowCmd(false)} />
    </div>
  );
}
