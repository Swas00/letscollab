"use client";

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
  Code2,
  Play,
  Check,
  Search,
} from "lucide-react";
import { CollaborativeEditor } from "../components/editor/CollaborativeEditor";
import { Button } from "../components/ui/Button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-paper text-carbon flex flex-col justify-between selection:bg-periwinkle selection:text-carbon overflow-x-hidden font-sans">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-divider bg-editor/95 backdrop-blur-md shadow-xs">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-coral flex items-center justify-center text-white shadow-xs transition-transform duration-150 group-hover:scale-105">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-carbon">NeoStats</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-moss border border-[#b5cea8] text-[#254622] font-semibold">
                v1.4 • CRDT
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-muted">
            <a href="#editor" className="hover:text-carbon transition-colors duration-140">Code Workspace</a>
            <a href="#features" className="hover:text-carbon transition-colors duration-140">Capabilities</a>
            <a href="#workflow" className="hover:text-carbon transition-colors duration-140">Architecture</a>
            <a href="#governance" className="hover:text-carbon transition-colors duration-140">Governance</a>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="sm" withArrow>
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="pt-16 pb-12 px-6 max-w-7xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-editor border border-divider text-carbon text-xs font-mono shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#3B5A38]" />
            <span>Real-Time Multi-Developer Coding Platform</span>
            <span className="text-muted">•</span>
            <span className="text-coral font-bold">Sub-10ms Sync</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] max-w-4xl mx-auto text-carbon">
            The real-time collaborative code editor built for{" "}
            <span className="text-coral underline decoration-periwinkle decoration-wavy decoration-2">
              high-velocity teams.
            </span>
          </h1>

          <p className="text-muted text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Multiple developers writing, debugging, and reviewing code in the same workspace with
            live collaborator presence, vector clock synchronization, integrated terminal execution, and zero artificial delays.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/register">
              <Button variant="primary" size="lg" withArrow>
                Open Collaborative Workspace
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="lg">
                Sign In to Existing Project
              </Button>
            </Link>
          </div>

          {/* Interactive Live Collaborative Editor Showcase */}
          <div id="editor" className="pt-8 max-w-6xl mx-auto text-left">
            <div className="mb-2 flex items-center justify-between text-xs font-mono text-muted px-1">
              <span>LIVE INTERACTIVE WORKSPACE (TRY TYPING, RUNNING & FORMATTING)</span>
              <span>⌘K for Command Palette</span>
            </div>
            <CollaborativeEditor projectId="landing-demo" />
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-20 px-6 max-w-6xl mx-auto border-t border-divider space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-coral font-mono">Engineered For Developers</h2>
            <h3 className="text-2xl sm:text-3xl font-black text-carbon">Tactile speed and deterministic consensus</h3>
            <p className="text-muted text-xs sm:text-sm max-w-xl mx-auto">
              Every interaction designed for software teams: instant peer propagation, robust OCC conflict prevention, and zero AI gimmicks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="card-developer p-6 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-coral/15 border border-coral/30 flex items-center justify-center text-coral">
                <Zap className="w-4.5 h-4.5" />
              </div>
              <h4 className="font-bold text-carbon text-sm">Sub-10ms CRDT Sync</h4>
              <p className="text-xs text-muted leading-relaxed">
                Code edits, cursor coordinates, and document selections synchronize live across all connected peers with vector clocks.
              </p>
            </div>

            <div className="card-developer p-6 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-periwinkle border border-[#bec5ea] flex items-center justify-center text-carbon">
                <RefreshCw className="w-4.5 h-4.5" />
              </div>
              <h4 className="font-bold text-carbon text-sm">Conflict Prevention (OCC)</h4>
              <p className="text-xs text-muted leading-relaxed">
                Optimistic Concurrency Control rejects stale writes with HTTP 409 and presents side-by-side visual diffs for clean resolution.
              </p>
            </div>

            <div className="card-developer p-6 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-moss border border-[#b5cea8] flex items-center justify-center text-[#254622]">
                <Shield className="w-4.5 h-4.5" />
              </div>
              <h4 className="font-bold text-carbon text-sm">Server RBAC Governance</h4>
              <p className="text-xs text-muted leading-relaxed">
                Strict server-enforced role authorizations across Admin, Project Manager, Developer, and Viewer permissions.
              </p>
            </div>

            <div className="card-developer p-6 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-paper border border-divider flex items-center justify-center text-carbon">
                <Terminal className="w-4.5 h-4.5 text-carbon" />
              </div>
              <h4 className="font-bold text-carbon text-sm">Integrated Terminal & Run</h4>
              <p className="text-xs text-muted leading-relaxed">
                Collapsible terminal drawer with test execution, compilation diagnostics, and command history at your fingertips.
              </p>
            </div>

            <div className="card-developer p-6 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-periwinkle border border-[#bec5ea] flex items-center justify-center text-carbon">
                <BarChart3 className="w-4.5 h-4.5" />
              </div>
              <h4 className="font-bold text-carbon text-sm">Sprint & Task Velocity</h4>
              <p className="text-xs text-muted leading-relaxed">
                Integrated sprint boards, issue tracking, and completion velocity metrics linked directly to project branches.
              </p>
            </div>

            <div className="card-developer p-6 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-moss border border-[#b5cea8] flex items-center justify-center text-[#254622]">
                <MessageSquare className="w-4.5 h-4.5" />
              </div>
              <h4 className="font-bold text-carbon text-sm">Peer Mentions & Alerts</h4>
              <p className="text-xs text-muted leading-relaxed">
                Contextual code comments, live peer presence avatars with identity colors, and real-time team notifications.
              </p>
            </div>
          </div>
        </section>

        {/* Workflow Section */}
        <section id="workflow" className="py-20 px-6 max-w-5xl mx-auto border-t border-divider space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-coral font-mono">Workflow Architecture</h2>
            <h3 className="text-2xl sm:text-3xl font-black text-carbon">From branch commit to shared execution</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="card-developer p-6 space-y-3">
              <div className="w-7 h-7 rounded-md bg-coral text-white font-mono font-bold flex items-center justify-center text-xs">
                01
              </div>
              <h4 className="font-bold text-carbon text-sm">Join Project Room</h4>
              <p className="text-xs text-muted leading-relaxed">
                Developers connect via Socket.IO, establish active peer presence, and sync file trees instantly.
              </p>
            </div>

            <div className="card-developer p-6 space-y-3">
              <div className="w-7 h-7 rounded-md bg-carbon text-paper font-mono font-bold flex items-center justify-center text-xs">
                02
              </div>
              <h4 className="font-bold text-carbon text-sm">Collaborative Edit & Format</h4>
              <p className="text-xs text-muted leading-relaxed">
                See teammate cursors in real time with distinct identity colors, format code with keyboard shortcuts, and resolve vector clocks.
              </p>
            </div>

            <div className="card-developer p-6 space-y-3">
              <div className="w-7 h-7 rounded-md bg-moss text-[#254622] font-mono font-bold flex items-center justify-center text-xs border border-[#3B5A38]/30">
                03
              </div>
              <h4 className="font-bold text-carbon text-sm">Run & Audit</h4>
              <p className="text-xs text-muted leading-relaxed">
                Execute tests in the terminal drawer while immutable audit records track every milestone state.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section id="governance" className="py-14 px-6 max-w-4xl mx-auto text-center space-y-5 bg-carbon text-paper rounded-2xl my-12 shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-black text-paper">Ready to code with your team in real time?</h2>
          <p className="text-xs sm:text-sm text-paper/80 max-w-lg mx-auto">
            Open your collaborative workspace and start coding simultaneously with zero latency.
          </p>
          <div className="pt-2">
            <Link href="/register">
              <Button variant="primary" size="lg" withArrow>
                Start Coding for Free
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-divider bg-editor">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted font-mono">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-coral" />
            <span className="font-bold text-carbon">NeoStats</span>
            <span>— Real-Time Collaborative Code Platform</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-carbon transition-colors duration-140">Sign In</Link>
            <Link href="/register" className="hover:text-carbon transition-colors duration-140">Create Account</Link>
            <Link href="/dashboard" className="hover:text-carbon transition-colors duration-140">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
