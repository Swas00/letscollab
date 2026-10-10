"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Layers, ArrowRight, AlertCircle, ChevronDown, Key } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { ROLE_CONFIG, cn } from "../../lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [demoUsers, setDemoUsers] = useState<any[]>([]);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);
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
      setErrorMsg(res.error || "Invalid email or password");
    }
  };

  const handleQuickFill = (dEmail: string) => {
    setEmail(dEmail);
    setPassword("password123");
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-6 antialiased selection:bg-periwinkle selection:text-carbon">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-coral flex items-center justify-center text-white shadow-md shadow-coral/20 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-black text-carbon tracking-tight">NeoStats</span>
          </Link>
          <h1 className="text-xl font-extrabold text-carbon">Welcome back</h1>
          <p className="text-xs text-muted">
            Sign in to your collaborative workspace.
          </p>
        </div>

        {/* Card */}
        <div className="p-8 rounded-3xl bg-editor border border-divider shadow-xl space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-coral/15 border border-coral/30 flex items-center gap-2.5 text-xs text-coral">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-carbon block mb-1.5">
                Work Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-3.5 py-2.5 bg-paper border border-divider rounded-xl text-sm text-carbon placeholder-muted focus:outline-none focus:border-coral focus:bg-editor transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-carbon">
                  Password
                </label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-paper border border-divider rounded-xl text-sm text-carbon placeholder-muted focus:outline-none focus:border-coral focus:bg-editor transition"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-coral hover:bg-[#d34628] disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md shadow-coral/20 transition flex items-center justify-center gap-2 mt-2"
            >
              <span>{isLoading ? "Signing in..." : "Sign In"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-divider text-center text-xs text-muted">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-coral font-bold hover:underline">
              Create an account
            </Link>
          </div>

          {/* Collapsible Sample Accounts */}
          {demoUsers.length > 0 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowDemoAccounts(!showDemoAccounts)}
                className="w-full py-2 px-3 rounded-xl bg-paper hover:bg-editor border border-divider text-[11px] text-muted flex items-center justify-between transition"
              >
                <div className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-muted" />
                  <span className="font-medium">Sample Pre-seeded Accounts (password: password123)</span>
                </div>
                <ChevronDown
                  className={cn("w-3.5 h-3.5 transition-transform text-muted", showDemoAccounts && "rotate-180")}
                />
              </button>

              {showDemoAccounts && (
                <div className="mt-2.5 space-y-1.5 animate-in fade-in duration-150">
                  {demoUsers.map((dUser) => (
                    <button
                      key={dUser.id}
                      type="button"
                      onClick={() => handleQuickFill(dUser.email)}
                      className="w-full p-2 rounded-xl bg-paper hover:bg-editor border border-divider text-left transition flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={dUser.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${dUser.name}`}
                          alt={dUser.name}
                          className="w-5 h-5 rounded-full object-cover shrink-0 border border-divider"
                        />
                        <span className="text-carbon font-semibold truncate">{dUser.name}</span>
                        <span className="text-[10px] text-muted truncate">({dUser.email})</span>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-editor border border-divider text-muted shrink-0 font-medium">
                        {dUser.role}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
