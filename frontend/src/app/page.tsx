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
  Mail,
  FolderKanban,
  Bug,
  GitBranch,
  Cpu,
} from "lucide-react";
import { CollaborativeEditor } from "../components/editor/CollaborativeEditor";
import { Button } from "../components/ui/Button";
import { Logo, LogoIcon } from "../components/ui/Logo";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-paper text-carbon flex flex-col justify-between selection:bg-periwinkle selection:text-carbon overflow-x-hidden font-sans">
      {/* Accessible Skip Link */}
      <a href="#main-content" className="sr-only focus:not-sr-only">
        Skip to main content
      </a>

      {/* 1. Header & Navigation Landmark */}
      <header className="sticky top-0 z-40 w-full border-b border-divider bg-editor/95 backdrop-blur-md shadow-xs">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo href="/" size="md" badge="v2.0 • VS Code Engine" />

          {/* Desktop Navigation Links */}
          <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-7 text-xs font-semibold text-muted">
            <a href="#workspace" className="hover:text-carbon transition-colors duration-140">
              VS Code Workspace
            </a>
            <a href="#capabilities" className="hover:text-carbon transition-colors duration-140">
              Platform Features
            </a>
            <a href="#workflow" className="hover:text-carbon transition-colors duration-140">
              Team Workflow
            </a>
            <a href="#security" className="hover:text-carbon transition-colors duration-140">
              Security & RBAC
            </a>
          </nav>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="font-bold">
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

      {/* 2. Main Landmark */}
      <main id="main-content" className="flex-1 focus:outline-none">
        {/* HERO SECTION */}
        <section aria-labelledby="hero-heading" className="relative pt-16 pb-14 px-6 max-w-7xl mx-auto">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            {/* Live Status Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-editor border border-divider text-carbon text-xs font-mono shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" aria-hidden="true" />
              <span className="font-semibold">Team-Based Project Collaboration</span>
              <span className="text-muted" aria-hidden="true">•</span>
              <span className="text-coral font-bold">VS Code Real-Time IDE</span>
            </div>

            {/* Main Headline */}
            <h1
              id="hero-heading"
              className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12] text-carbon"
            >
              Collaborate, code, and debug together in{" "}
              <span className="text-coral underline decoration-periwinkle decoration-wavy decoration-2">
                real time.
              </span>
            </h1>

            {/* Sub-headline description */}
            <p className="text-muted text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Create individual accounts, spin up private project workspaces, invite teammates directly by email, and build with a full in-browser VS Code IDE equipped with live execution and step-by-step debugging.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link href="/register">
                <Button variant="primary" size="lg" withArrow className="font-bold shadow-md">
                  Create Free Account
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" size="lg" className="font-bold">
                  Sign In to Workspace
                </Button>
              </Link>
            </div>

            {/* Value Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-mono text-muted">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Email Invitation Access Control</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Node.js, TypeScript & Python Runner</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>OCC Concurrency Conflict Detection</span>
              </div>
            </div>
          </div>

          {/* Interactive VS Code Editor Showcase */}
          <div id="workspace" className="mt-12 max-w-6xl mx-auto">
            <div className="mb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono text-muted px-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-carbon uppercase tracking-wider">
                  Interactive Live Workspace
                </span>
                <span className="text-muted">• Try setting breakpoints, running code, or opening split preview</span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/editor"
                  className="inline-flex items-center gap-1.5 text-[11px] bg-[#1e1e1e] hover:bg-[#007acc] text-white px-3 py-1 rounded-lg font-mono font-bold transition shadow-xs"
                >
                  <Code2 className="w-3.5 h-3.5 text-[#38bdf8]" />
                  <span>Open Full-Page IDE ↗</span>
                </Link>
                <span className="text-[11px] bg-paper px-2 py-0.5 rounded border border-divider font-semibold text-coral hidden sm:inline">
                  Press ⌘K for Command Palette
                </span>
              </div>
            </div>

            {/* Embedded VS Code Lookalike IDE */}
            <CollaborativeEditor projectId="landing-demo" />
          </div>
        </section>

        {/* 3. Core Capabilities Section */}
        <section id="capabilities" aria-labelledby="capabilities-heading" className="py-20 px-6 max-w-6xl mx-auto border-t border-divider space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-coral font-mono">
              Designed For High-Velocity Teams
            </h2>
            <h3 id="capabilities-heading" className="text-2xl sm:text-3xl font-black text-carbon">
              Everything your team needs to build with confidence
            </h3>
            <p className="text-muted text-xs sm:text-sm max-w-xl mx-auto">
              A cohesive architecture connecting user accounts, project access control, task kanban, and developer tools in a unified interface.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="card-developer p-6 space-y-3.5 bg-editor border border-divider rounded-2xl shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-coral/15 border border-coral/30 flex items-center justify-center text-coral">
                <Code2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-carbon text-base">Full VS Code Web IDE</h4>
              <p className="text-xs text-muted leading-relaxed">
                Activity Bar with Explorer, Search & Replace, Source Control, Extensions, split live HTML preview, and responsive multi-file tabs.
              </p>
            </div>

            {/* Card 2 */}
            <div className="card-developer p-6 space-y-3.5 bg-editor border border-divider rounded-2xl shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-600">
                <Bug className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-carbon text-base">Live Run & Step-by-Step Debugger</h4>
              <p className="text-xs text-muted leading-relaxed">
                Click in the gutter to set breakpoints, step through lines (F10), inspect live variables, evaluate watch expressions, and inspect call stacks.
              </p>
            </div>

            {/* Card 3 */}
            <div className="card-developer p-6 space-y-3.5 bg-editor border border-divider rounded-2xl shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-700">
                <Mail className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-carbon text-base">Direct Email Invitations</h4>
              <p className="text-xs text-muted leading-relaxed">
                Invite any teammate by typing their email. The system dispatches secure tokens and welcome guides with single-click acceptance.
              </p>
            </div>

            {/* Card 4 */}
            <div className="card-developer p-6 space-y-3.5 bg-editor border border-divider rounded-2xl shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-700">
                <Shield className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-carbon text-base">Private Project Workspaces</h4>
              <p className="text-xs text-muted leading-relaxed">
                Strict server-side role enforcement (Project Owner, Member, Viewer). Non-members cannot access project data or mutate code files.
              </p>
            </div>

            {/* Card 5 */}
            <div className="card-developer p-6 space-y-3.5 bg-editor border border-divider rounded-2xl shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-700">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-carbon text-base">Optimistic Concurrency (OCC)</h4>
              <p className="text-xs text-muted leading-relaxed">
                Deterministic version counters reject stale overwrites with HTTP 409 and provide interactive side-by-side diff resolution.
              </p>
            </div>

            {/* Card 6 */}
            <div className="card-developer p-6 space-y-3.5 bg-editor border border-divider rounded-2xl shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-paper border border-divider flex items-center justify-center text-carbon">
                <Terminal className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-carbon text-base">Integrated Multi-Tab Terminal</h4>
              <p className="text-xs text-muted leading-relaxed">
                Problems tab with error jump, Output logs, Debug Console with expression REPL, and an integrated bash shell with command history.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Workflow Section */}
        <section id="workflow" aria-labelledby="workflow-heading" className="py-20 px-6 max-w-5xl mx-auto border-t border-divider space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-coral font-mono">
              Step-by-Step Teaming
            </h2>
            <h3 id="workflow-heading" className="text-2xl sm:text-3xl font-black text-carbon">
              How project collaboration works on LetsCollab
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card-developer p-6 space-y-3 bg-editor border border-divider rounded-2xl">
              <div className="w-8 h-8 rounded-lg bg-coral text-white font-mono font-bold flex items-center justify-center text-xs shadow-xs">
                01
              </div>
              <h4 className="font-bold text-carbon text-sm">Create Project & Add Teammates</h4>
              <p className="text-xs text-muted leading-relaxed">
                Create a project name and description. You automatically become the Project Owner, and can invite teammates by typing their email addresses.
              </p>
            </div>

            <div className="card-developer p-6 space-y-3 bg-editor border border-divider rounded-2xl">
              <div className="w-8 h-8 rounded-lg bg-carbon text-paper font-mono font-bold flex items-center justify-center text-xs shadow-xs">
                02
              </div>
              <h4 className="font-bold text-carbon text-sm">Accept Invitation via Email</h4>
              <p className="text-xs text-muted leading-relaxed">
                Invited members receive an email with project details and a secure link. Existing users accept with one click; new users register their verified account.
              </p>
            </div>

            <div className="card-developer p-6 space-y-3 bg-editor border border-divider rounded-2xl">
              <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white font-mono font-bold flex items-center justify-center text-xs shadow-xs">
                03
              </div>
              <h4 className="font-bold text-carbon text-sm">Build, Run & Debug Together</h4>
              <p className="text-xs text-muted leading-relaxed">
                All authorized members access the private workspace, view shared files and tasks, track progress on sprint boards, and code simultaneously.
              </p>
            </div>
          </div>
        </section>

        {/* 5. Security & Governance Matrix */}
        <section id="security" aria-labelledby="security-heading" className="py-20 px-6 max-w-5xl mx-auto border-t border-divider space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-coral font-mono">
              Enterprise Access Control
            </h2>
            <h3 id="security-heading" className="text-2xl sm:text-3xl font-black text-carbon">
              Role-Based Permissions & Isolation
            </h3>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-divider bg-editor shadow-sm">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-paper/80 border-b border-divider text-muted uppercase font-mono text-[11px]">
                <tr>
                  <th scope="col" className="p-3.5 font-bold text-carbon">Capability</th>
                  <th scope="col" className="p-3.5 font-bold text-coral">Project Owner</th>
                  <th scope="col" className="p-3.5 font-bold text-blue-600">Project Member</th>
                  <th scope="col" className="p-3.5 font-bold text-muted">Non-Member</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider font-mono">
                <tr>
                  <td className="p-3.5 font-sans font-medium text-carbon">Invite & Remove Project Members</td>
                  <td className="p-3.5 text-emerald-700 font-bold">✓ Granted</td>
                  <td className="p-3.5 text-muted">✕ Blocked</td>
                  <td className="p-3.5 text-coral">✕ Blocked (403)</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-sans font-medium text-carbon">Edit Files & Run in VS Code IDE</td>
                  <td className="p-3.5 text-emerald-700 font-bold">✓ Granted</td>
                  <td className="p-3.5 text-emerald-700 font-bold">✓ Granted</td>
                  <td className="p-3.5 text-coral">✕ Blocked (403)</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-sans font-medium text-carbon">Manage Tasks & Kanban Sprints</td>
                  <td className="p-3.5 text-emerald-700 font-bold">✓ Granted</td>
                  <td className="p-3.5 text-emerald-700 font-bold">✓ Granted</td>
                  <td className="p-3.5 text-coral">✕ Blocked (403)</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-sans font-medium text-carbon">Delete / Archive Project</td>
                  <td className="p-3.5 text-emerald-700 font-bold">✓ Owner Only</td>
                  <td className="p-3.5 text-muted">✕ Blocked</td>
                  <td className="p-3.5 text-coral">✕ Blocked (403)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 6. High-Contrast Accessible Call to Action */}
        <section aria-labelledby="cta-heading" className="py-16 px-6 max-w-4xl mx-auto text-center space-y-6 bg-carbon text-paper rounded-3xl my-12 shadow-2xl">
          <div className="space-y-2">
            <h2 id="cta-heading" className="text-2xl sm:text-3xl font-black text-paper">
              Ready to collaborate on your next project?
            </h2>
            <p className="text-xs sm:text-sm text-paper/80 max-w-lg mx-auto leading-relaxed">
              Create your account, invite your team members with their email addresses, and launch your private workspace in seconds.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register">
              <Button variant="primary" size="lg" withArrow className="font-bold shadow-md">
                Get Started Now
              </Button>
            </Link>
            <Link href="/login">
              <button className="px-5 py-3 rounded-xl border border-paper/30 hover:border-paper text-paper text-xs font-bold transition">
                Sign In to Account
              </button>
            </Link>
          </div>
        </section>
      </main>

      {/* 7. Footer Landmark */}
      <footer className="py-10 px-6 border-t border-divider bg-editor text-xs text-muted">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <LogoIcon size={22} />
            <span className="font-bold text-carbon text-sm">LetsCollab</span>
            <span className="text-muted">— Collaborative Engineering & Workspace Platform</span>
          </div>

          <nav aria-label="Footer Navigation" className="flex items-center gap-6 font-medium">
            <Link href="/login" className="hover:text-carbon transition">
              Sign In
            </Link>
            <Link href="/register" className="hover:text-carbon transition">
              Create Account
            </Link>
            <a href="#workspace" className="hover:text-carbon transition">
              VS Code IDE
            </a>
            <a href="#security" className="hover:text-carbon transition">
              Security Matrix
            </a>
          </nav>

          <p className="text-[11px] font-mono text-muted">
            © {new Date().getFullYear()} LetsCollab. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
