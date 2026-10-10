"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Layers, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { register, user } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("PROJECT_MANAGER");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);
    const res = await register(name, email, password, role);
    setIsLoading(false);

    if (res.success) {
      router.push("/dashboard");
    } else {
      setErrorMsg(res.error || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] flex items-center justify-center p-6 antialiased selection:bg-indigo-500/30">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black text-white tracking-tight">NeoStats</span>
          </Link>
          <h1 className="text-xl font-bold text-white">Create your account</h1>
          <p className="text-xs text-zinc-400">
            Start collaborating with your team in real time.
          </p>
        </div>

        {/* Card */}
        <div className="p-8 rounded-3xl bg-[#0d0e15] border border-zinc-800 shadow-2xl space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-900/60 flex items-center gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                Work Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@company.com"
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                Role in Organization
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="PROJECT_MANAGER">Project Manager (Can create projects & tasks)</option>
                <option value="TEAM_MEMBER">Team Member (Can work on tasks & comment)</option>
                <option value="VIEWER">Viewer (Read-only observation)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                  Confirm
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 mt-2"
            >
              <span>{isLoading ? "Creating Account..." : "Create Account"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-zinc-800 text-center text-xs text-zinc-400">
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-400 font-semibold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
