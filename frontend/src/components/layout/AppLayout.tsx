"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Bell,
  UserCheck,
  LogOut,
  ChevronDown,
  Layers,
  X,
  Search,
  Settings,
  Shield,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { ROLE_CONFIG, cn } from "../../lib/utils";
import { api } from "../../lib/api";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, switchUser } = useAuth();
  const { isConnected, toasts, removeToast, unreadCount } = useSocket();
  const pathname = usePathname();
  const router = useRouter();

  const [demoUsers, setDemoUsers] = useState<any[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    api.auth.demoUsers().then((res) => {
      if (res.data?.demoUsers) {
        setDemoUsers(res.data.demoUsers);
      }
    });
  }, []);

  const handleSwitchAccount = async (targetUser: any) => {
    setShowUserDropdown(false);
    const res = await api.auth.login({ email: targetUser.email, password: "password123" });
    if (res.data) {
      switchUser(res.data.user, res.data.token);
      router.refresh();
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
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 flex flex-col md:flex-row antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Toast Notification Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto p-4 rounded-xl border border-zinc-700/80 bg-zinc-900/95 backdrop-blur-md shadow-2xl text-zinc-100 flex items-start justify-between gap-3 animate-in slide-in-from-top-3 fade-in duration-300"
          >
            <div className="flex items-start gap-2.5">
              <span
                className={cn(
                  "w-2 h-2 rounded-full mt-1.5 shrink-0",
                  toast.type === "success" && "bg-emerald-400 shadow-sm shadow-emerald-400/50",
                  toast.type === "warning" && "bg-amber-400 shadow-sm shadow-amber-400/50",
                  toast.type === "conflict" && "bg-rose-400 shadow-sm shadow-rose-400/50",
                  toast.type === "info" && "bg-indigo-400 shadow-sm shadow-indigo-400/50"
                )}
              />
              <div>
                <p className="text-sm font-semibold text-white">{toast.title}</p>
                <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{toast.message}</p>
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-zinc-500 hover:text-zinc-300 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-zinc-800/80 bg-[#0d0e15] flex flex-col justify-between shrink-0">
        <div>
          {/* Logo & App Title */}
          <div className="p-5 border-b border-zinc-800/60 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform duration-200">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg tracking-tight text-white">NeoStats</span>
                </div>
                <span className="text-[11px] text-zinc-400 block -mt-0.5">Project Workspace</span>
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
                    "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("w-4 h-4", isActive ? "text-indigo-400" : "text-zinc-400")} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                      {item.badge}
                    </span>
                  )}
                  {item.count !== undefined && item.count > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-bold">
                      {item.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card in Sidebar Footer */}
        <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/40">
          {user ? (
            <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
              <Link href="/profile" className="flex items-center gap-2.5 min-w-0 group">
                <img
                  src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                  alt={user.name}
                  className="w-8 h-8 rounded-full bg-zinc-800 object-cover border border-zinc-700"
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white group-hover:text-indigo-300 transition truncate">
                    {user.name}
                  </p>
                  <span
                    className={cn(
                      "inline-block text-[10px] font-medium px-1.5 py-0.2 rounded border mt-0.5",
                      ROLE_CONFIG[user.role]?.badge || "bg-zinc-800 text-zinc-400 border-zinc-700"
                    )}
                  >
                    {ROLE_CONFIG[user.role]?.label || user.role}
                  </span>
                </div>
              </Link>

              <button
                onClick={logout}
                title="Sign Out"
                className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition shadow-md"
            >
              Sign In
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 border-b border-zinc-800/80 bg-[#0d0e15]/90 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
          {/* Real-time Status Badge & Breadcrumb */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs">
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  isConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                )}
              />
              <span className="text-zinc-400 font-mono text-[11px]">
                {isConnected ? "Real-time Live Sync" : "Reconnecting..."}
              </span>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <Link
              href="/notifications"
              className="relative p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#0d0e15]" />
              )}
            </Link>

            {/* User Profile Dropdown */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl hover:bg-zinc-850 border border-zinc-800/80 bg-zinc-900 transition"
                >
                  <img
                    src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                    alt={user.name}
                    className="w-6 h-6 rounded-full object-cover bg-zinc-800"
                  />
                  <span className="text-xs font-semibold text-zinc-200 hidden sm:inline">
                    {user.name.split(" ")[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 border-b border-zinc-800">
                      <p className="text-xs font-bold text-white">{user.name}</p>
                      <p className="text-[11px] text-zinc-400 truncate">{user.email}</p>
                      <span
                        className={cn(
                          "inline-block text-[9px] px-1.5 py-0.2 rounded border font-mono mt-1",
                          ROLE_CONFIG[user.role]?.badge || "bg-zinc-800 text-zinc-400"
                        )}
                      >
                        {user.role}
                      </span>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Profile & Settings</span>
                      </Link>

                      <Link
                        href="/projects"
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
                      >
                        <FolderKanban className="w-3.5 h-3.5 text-zinc-400" />
                        <span>My Projects</span>
                      </Link>
                    </div>

                    {/* Switch Account Option */}
                    {demoUsers.length > 1 && (
                      <div className="pt-1 border-t border-zinc-800">
                        <div className="px-3 py-1 text-[10px] font-semibold text-zinc-500 uppercase">
                          Switch Active Account
                        </div>
                        <div className="max-h-36 overflow-y-auto space-y-0.5">
                          {demoUsers
                            .filter((u) => u.id !== user.id)
                            .map((otherUser) => (
                              <button
                                key={otherUser.id}
                                onClick={() => handleSwitchAccount(otherUser)}
                                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-left text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition"
                              >
                                <span className="truncate">{otherUser.name}</span>
                                <span className="text-[9px] font-mono text-zinc-500">
                                  {otherUser.role}
                                </span>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-1 border-t border-zinc-800">
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-950/40 transition"
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
        <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
