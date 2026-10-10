"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { Layers, ArrowRight, Shield, Zap, RefreshCw, Users } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen bg-[#090a0f] text-white flex flex-col justify-between selection:bg-indigo-500/30">
      {/* Hero Header */}
      <header className="px-8 py-6 border-b border-zinc-800/80 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Layers className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-xl tracking-tight">NeoStats</span>
        </div>

        <Link
          href="/login"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold shadow-lg shadow-indigo-600/30 transition"
        >
          <span>Launch Platform</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </header>

      {/* Hero Content */}
      <main className="max-w-5xl mx-auto px-6 py-16 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-700/50 text-indigo-300 text-xs font-semibold">
          <Zap className="w-3.5 h-3.5" />
          <span>Full Stack Collaborative Engineering Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
          Enterprise Project Collaboration,{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
            Engineered to Win.
          </span>
        </h1>

        <p className="text-zinc-400 text-lg max-w-2xl mx-auto leading-relaxed">
          Multi-user real-time workspace with strict server-side RBAC, optimistic concurrency conflict
          detection (HTTP 409), audit logs, and Socket.IO clustering.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/login"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-base shadow-xl shadow-indigo-600/40 transition hover:scale-105"
          >
            <span>Demo Live Platform</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/login"
            className="px-6 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium text-base border border-zinc-800 transition"
          >
            Explore 4 Demo Roles
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 text-left">
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Real-Time WebSockets</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Task changes, assignments, status transitions, and comments reflect instantly across all
              connected browser sessions with zero manual reloads.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-800/60 flex items-center justify-center text-amber-400">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Concurrency Control (OCC)</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Automatic stale write prevention with HTTP 409 conflict detection and side-by-side visual
              diff resolution modal.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Air-tight Server RBAC</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Server-enforced role boundaries for Admin, Project Manager, Team Member, and Viewer with
              immutable audit logging.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-zinc-800/80 text-center text-xs text-zinc-500">
        NeoStats Full Stack Engineering Hackathon 2026 • Built for Performance & Scalability
      </footer>
    </div>
  );
}
