"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Layers, Sparkles, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { ROLE_CONFIG, cn } from "../../lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();

  const [email, setEmail] = useState("admin@neostats.com");
  const [password, setPassword] = useState("password123");
  const [demoUsers, setDemoUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }

    api.auth.demoUsers().then((res) => {
      if (res.data?.demoUsers) {
        setDemoUsers(res.data.demoUsers);
      }
    });
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const res = await login(email, password);
    setIsLoading(false);

    if (res.success) {
      router.push("/dashboard");
    } else {
      setErrorMsg(res.error || "Login failed");
    }
  };

  const handleDemoClick = async (demoUser: any) => {
    setEmail(demoUser.email);
    setPassword("password123");
    setIsLoading(true);
    setErrorMsg(null);

    const res = await login(demoUser.email, "password123");
    setIsLoading(false);

    if (res.success) {
      router.push("/dashboard");
    } else {
      setErrorMsg(res.error || "Demo login failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] flex items-center justify-center p-6 antialiased">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left: Login Form */}
        <div className="p-8 rounded-3xl bg-[#0d0e15] border border-zinc-800 shadow-2xl space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
                <Layers className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">NeoStats Login</h1>
            </div>
            <p className="text-xs text-zinc-400">
              Enter credentials or pick a demo role on the right.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                Work Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
            >
              <span>{isLoading ? "Signing in..." : "Sign In to Workspace"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-2 text-center text-[11px] text-zinc-500">
            Pre-seeded password for all demo accounts: <code className="text-indigo-400 font-mono">password123</code>
          </div>
        </div>

        {/* Right: 1-Click Role Switcher Demo Cards */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
              1-Click Role Demo Sign-in
            </h2>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Click any profile below to instantly log in as that persona and verify server-enforced role permissions:
          </p>

          <div className="space-y-2.5">
            {demoUsers.map((dUser) => {
              const roleCfg = ROLE_CONFIG[dUser.role];
              const isInactive = !dUser.isActive;

              return (
                <button
                  key={dUser.id}
                  onClick={() => handleDemoClick(dUser)}
                  className="w-full p-3.5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-indigo-500/50 text-left transition flex items-center justify-between group shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        dUser.avatarUrl ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${dUser.name}`
                      }
                      alt={dUser.name}
                      className="w-9 h-9 rounded-full bg-zinc-800 object-cover border border-zinc-700"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white group-hover:text-indigo-300 transition">
                          {dUser.name}
                        </span>
                        {isInactive && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800">
                            Deactivated
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400">{dUser.email}</p>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "text-[10px] font-medium px-2 py-0.5 rounded-full border",
                      roleCfg?.badge || "bg-zinc-800 text-zinc-400"
                    )}
                  >
                    {roleCfg?.label || dUser.role}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
