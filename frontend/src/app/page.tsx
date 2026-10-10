"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import {
  Layers,
  ArrowRight,
  Shield,
  Zap,
  RefreshCw,
  Users,
  CheckCircle2,
  Lock,
  MessageSquare,
  Sparkles,
  BarChart3,
  Terminal,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen bg-[#090a0f] text-white flex flex-col justify-between selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-[#090a0f]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-white">NeoStats</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#architecture" className="hover:text-white transition">Architecture</a>
            <a href="#workflow" className="hover:text-white transition">Workflow</a>
            <a href="#security" className="hover:text-white transition">Governance</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800/60 transition"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition hover:scale-105"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative pt-20 pb-16 px-6 max-w-6xl mx-auto text-center space-y-8">
          {/* Subtle Glow Backdrop */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-700/60 text-indigo-300 text-xs font-semibold shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Next-Generation Real-Time Collaborative Workspace</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] max-w-4xl mx-auto">
            The collaborative project hub built for{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              high-velocity teams.
            </span>
          </h1>

          <p className="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Collaborate across projects and sprint tasks with sub-10ms WebSocket sync, optimistic
            concurrency conflict prevention, and strict server-enforced role governance.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/register"
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 transition hover:scale-105"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="px-6 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium text-sm border border-zinc-800 transition"
            >
              Sign In to Existing Team
            </Link>
          </div>

          {/* Interactive UI Mockup Card */}
          <div className="pt-10 max-w-5xl mx-auto">
            <div className="relative rounded-3xl p-2 bg-gradient-to-b from-zinc-800 to-zinc-950/80 border border-zinc-700/60 shadow-2xl overflow-hidden">
              <div className="bg-[#0d0e15] rounded-2xl p-6 text-left space-y-4">
                {/* Window header */}
                <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    <span className="text-xs font-mono text-zinc-500 ml-2">neostats.app/projects/NEO/tasks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-mono text-zinc-400">WebSocket Connected (sub-10ms)</span>
                  </div>
                </div>

                {/* Simulated Kanban Columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase font-mono">
                      <span>To Do</span>
                      <span>2</span>
                    </div>
                    <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-indigo-400 font-bold">NEO-4</span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[10px]">High</span>
                      </div>
                      <p className="font-semibold text-zinc-200">Alert webhooks for audit log streams</p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-400 uppercase font-mono">
                      <span>In Progress</span>
                      <span>1</span>
                    </div>
                    <div className="p-3 bg-zinc-950 border border-amber-900/40 rounded-lg text-xs space-y-1 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-indigo-400 font-bold">NEO-1</span>
                        <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[10px]">Urgent</span>
                      </div>
                      <p className="font-semibold text-zinc-100">WebSocket room clustering & heartbeat</p>
                      <div className="text-[10px] text-zinc-500 pt-1 font-mono">v1 • Assignee: David Chen</div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-400 uppercase font-mono">
                      <span>Done</span>
                      <span>1</span>
                    </div>
                    <div className="p-3 bg-zinc-950 border border-emerald-900/40 rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-indigo-400 font-bold">NEO-3</span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px]">Done</span>
                      </div>
                      <p className="font-semibold text-zinc-200">Audit RBAC server-side authorization</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-20 px-6 max-w-6xl mx-auto border-t border-zinc-800/80 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Core Capabilities</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white">Engineered for real collaborative speed</h3>
            <p className="text-zinc-400 text-sm max-w-xl mx-auto">
              Every detail built with purpose: from instant Socket.IO propagation to rock-solid data integrity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 space-y-3.5 hover:border-indigo-500/40 transition">
              <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-800/60 flex items-center justify-center text-indigo-400">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-base">Real-Time Sync</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Task changes, status shifts, comments, and member additions reflect instantly across all connected browsers without manual page reloads.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 space-y-3.5 hover:border-indigo-500/40 transition">
              <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-800/60 flex items-center justify-center text-amber-400">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-base">Conflict Prevention (OCC)</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Optimistic Concurrency Control prevents stale overwrites with HTTP 409 conflict detection and interactive side-by-side visual diff resolution.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 space-y-3.5 hover:border-indigo-500/40 transition">
              <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
                <Shield className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-base">Air-tight Server RBAC</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Permissions enforced strictly at the API controller layer for Admin, Project Manager, Team Member, and Viewer roles.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 space-y-3.5 hover:border-indigo-500/40 transition">
              <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-800/60 flex items-center justify-center text-purple-400">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-base">Executive Analytics</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Interactive charts tracking task status velocity, priority distribution, and sprint milestone completion rates.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 space-y-3.5 hover:border-indigo-500/40 transition">
              <div className="w-10 h-10 rounded-xl bg-rose-950 border border-rose-800/60 flex items-center justify-center text-rose-400">
                <Terminal className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-base">Immutable Audit Trail</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Every project and task mutation produces an immutable audit record with JSON metadata for security compliance.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 space-y-3.5 hover:border-indigo-500/40 transition">
              <div className="w-10 h-10 rounded-xl bg-sky-950 border border-sky-800/60 flex items-center justify-center text-sky-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-base">Smart Mentions & Alerts</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                In-app notification center with read/unread tracking and real-time toast alerts on task assignments and @mentions.
              </p>
            </div>
          </div>
        </section>

        {/* Workflow Section */}
        <section id="workflow" className="py-20 px-6 max-w-5xl mx-auto border-t border-zinc-800/80 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">How It Works</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white">Seamless flow from backlog to release</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6 rounded-2xl bg-[#0d0e15] border border-zinc-800 space-y-3">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center mx-auto text-sm">
                1
              </div>
              <h4 className="font-bold text-white text-base">Plan & Scope</h4>
              <p className="text-xs text-zinc-400">
                Admins and PMs create projects, set milestone deadlines, and assign team roles with precision.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0d0e15] border border-zinc-800 space-y-3">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center mx-auto text-sm">
                2
              </div>
              <h4 className="font-bold text-white text-base">Execute in Real Time</h4>
              <p className="text-xs text-zinc-400">
                Engineers move tasks through Kanban stages, comment with @mentions, and see collaborators live.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0d0e15] border border-zinc-800 space-y-3">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center mx-auto text-sm">
                3
              </div>
              <h4 className="font-bold text-white text-base">Resolve & Audit</h4>
              <p className="text-xs text-zinc-400">
                Automatic OCC conflict prevention resolves simultaneous edits, while audit logs maintain compliance.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-16 px-6 max-w-4xl mx-auto text-center space-y-6 bg-gradient-to-r from-indigo-950/60 via-zinc-900 to-purple-950/60 border border-indigo-800/40 rounded-3xl my-12">
          <h2 className="text-3xl font-black text-white">Ready to elevate your team&apos;s velocity?</h2>
          <p className="text-xs sm:text-sm text-zinc-300 max-w-xl mx-auto">
            Experience the full collaborative project management platform today.
          </p>
          <div className="pt-2">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/40 transition hover:scale-105"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-zinc-800/80 bg-[#0d0e15]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-zinc-300">NeoStats</span>
            <span>— Full Stack Collaborative Engineering Platform</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-zinc-300 transition">Sign In</Link>
            <Link href="/register" className="hover:text-zinc-300 transition">Create Account</Link>
            <Link href="/dashboard" className="hover:text-zinc-300 transition">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
