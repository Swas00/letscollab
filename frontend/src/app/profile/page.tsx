"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "../../components/layout/AppLayout";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import {
  User,
  Shield,
  Key,
  Calendar,
  CheckCircle2,
  XCircle,
  FolderKanban,
  CheckSquare,
} from "lucide-react";
import { ROLE_CONFIG, formatDate, cn } from "../../lib/utils";

export default function ProfilePage() {
  const { user, switchUser } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [demoUsers, setDemoUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    api.users.get(user.id).then((res) => {
      if (res.data?.user) {
        setProfileData(res.data.user);
      }
      setIsLoading(false);
    });

    api.auth.demoUsers().then((res) => {
      if (res.data?.demoUsers) {
        setDemoUsers(res.data.demoUsers);
      }
    });
  }, [user?.id]);

  const handleSwitchDemoUser = async (demoUser: any) => {
    const res = await api.auth.login({ email: demoUser.email, password: "password123" });
    if (res.data) {
      switchUser(res.data.user, res.data.token);
    }
  };

  const roleCfg = user ? ROLE_CONFIG[user.role] : null;

  // RBAC permissions table to showcase server rules
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
        {/* Profile Card */}
        <div className="p-8 rounded-3xl bg-[#0d0e15] border border-zinc-800/80 shadow-card flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <img
            src={
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

        {/* 1-Click Role Switcher on Profile */}
        <div className="p-6 rounded-3xl bg-[#0d0e15] border border-zinc-800/80 shadow-card space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">Interactive Persona Switcher</h3>
            <p className="text-xs text-zinc-400">
              Instantly toggle between all four defined roles to test server permission boundaries:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {demoUsers.map((dUser) => {
              const isCurrent = user?.id === dUser.id;

              return (
                <button
                  key={dUser.id}
                  onClick={() => handleSwitchDemoUser(dUser)}
                  className={cn(
                    "p-3 rounded-2xl text-left border transition flex items-center gap-3",
                    isCurrent
                      ? "bg-indigo-600/20 border-indigo-500 text-white shadow-sm"
                      : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 text-zinc-300"
                  )}
                >
                  <img
                    src={
                      dUser.avatarUrl ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${dUser.name}`
                    }
                    alt={dUser.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{dUser.name}</p>
                    <span className="text-[10px] text-zinc-400 font-mono">{dUser.role}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RBAC Server-Enforced Permissions Matrix */}
        <div className="p-6 rounded-3xl bg-[#0d0e15] border border-zinc-800/80 shadow-card space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">System RBAC Permissions Matrix</h3>
            <p className="text-xs text-zinc-400">
              Enforced on all API endpoints directly by Express middleware:
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
