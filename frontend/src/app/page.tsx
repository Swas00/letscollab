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
import ZeroGravityVideoBackground from "@/components/hero/ZeroGravityVideoBackground";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-paper text-carbon flex flex-col justify-between selection:bg-periwinkle selection:text-carbon overflow-x-hidden">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-divider bg-editor/90 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-coral flex items-center justify-center text-white shadow-md shadow-coral/20 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-carbon">NeoStats</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted">
            <a href="#features" className="hover:text-carbon transition">Capabilities</a>
            <a href="#workflow" className="hover:text-carbon transition">Workflow</a>
            <a href="#governance" className="hover:text-carbon transition">Governance</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl text-xs font-bold text-muted hover:text-carbon hover:bg-paper transition"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-coral hover:bg-[#d34628] text-white text-xs font-bold shadow-md shadow-coral/20 transition hover:scale-105"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section with Integrated Zero-Gravity Video Background */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-16 pb-24 px-6 min-h-[92vh] flex flex-col justify-center items-center">
          {/* Zero-Gravity Video Background */}
          <ZeroGravityVideoBackground />

          <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8 pt-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-editor/95 backdrop-blur-md border border-divider text-carbon text-xs font-semibold shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-coral animate-pulse" />
              <span>Next-Generation Real-Time Collaborative Workspace</span>
            </div>

            <div className="p-8 sm:p-12 rounded-3xl bg-editor/90 backdrop-blur-xl border border-divider shadow-2xl space-y-6">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] max-w-4xl mx-auto text-carbon">
                The collaborative project hub built for{" "}
                <span className="text-coral underline decoration-periwinkle decoration-wavy decoration-2">
                  high-velocity teams.
                </span>
              </h1>

              <p className="text-muted text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                Collaborate across projects and sprint tasks with sub-10ms WebSocket sync, optimistic
                concurrency conflict prevention, and strict server-enforced role governance.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <Link
                  href="/register"
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-coral hover:bg-[#d34628] text-white font-bold text-sm shadow-lg shadow-coral/25 transition hover:scale-105"
                >
                  <span>Start Free Trial</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="px-6 py-3.5 rounded-xl bg-paper hover:bg-white text-carbon font-semibold text-sm border border-divider transition shadow-sm"
                >
                  Sign In to Existing Team
                </Link>
              </div>
            </div>

            {/* Interactive UI Mockup Card with Weightless Float */}
            <div className="pt-6 max-w-5xl mx-auto">
              <div className="relative rounded-3xl p-3 bg-editor/95 backdrop-blur-xl border border-divider shadow-2xl overflow-hidden text-left hover:-translate-y-1 transition duration-500">
              <div className="bg-paper rounded-2xl p-6 text-left space-y-4 border border-divider">
                {/* Window header */}
                <div className="flex items-center justify-between pb-4 border-b border-divider">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#E65F42]" />
                    <div className="w-3 h-3 rounded-full bg-[#e3b04b]" />
                    <div className="w-3 h-3 rounded-full bg-[#5bb062]" />
                    <span className="text-xs font-mono text-muted ml-2">neostats.app/projects/NEO/tasks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-moss border border-[#3B5A38]" />
                    <span className="text-xs font-mono text-muted font-medium">WebSocket Connected (sub-10ms)</span>
                  </div>
                </div>

                {/* Simulated Kanban Columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="p-3.5 bg-editor border border-divider rounded-xl space-y-2 shadow-sm">
                    <div className="flex items-center justify-between text-xs font-bold text-muted uppercase font-mono">
                      <span>To Do</span>
                      <span className="px-1.5 py-0.5 rounded bg-paper border border-divider text-carbon font-mono">2</span>
                    </div>
                    <div className="p-3 bg-paper border border-divider rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-coral font-bold">NEO-4</span>
                        <span className="px-1.5 py-0.5 rounded bg-coral/15 text-coral border border-coral/30 text-[10px] font-bold">High</span>
                      </div>
                      <p className="font-bold text-carbon">Alert webhooks for audit log streams</p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-editor border border-divider rounded-xl space-y-2 shadow-sm">
                    <div className="flex items-center justify-between text-xs font-bold text-carbon uppercase font-mono">
                      <span>In Progress</span>
                      <span className="px-1.5 py-0.5 rounded bg-periwinkle border border-divider text-carbon font-mono">1</span>
                    </div>
                    <div className="p-3 bg-periwinkle/40 border border-[#bec5ea] rounded-lg text-xs space-y-1 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-coral font-bold">NEO-1</span>
                        <span className="px-1.5 py-0.5 rounded bg-coral text-white text-[10px] font-bold">Urgent</span>
                      </div>
                      <p className="font-bold text-carbon">WebSocket room clustering & heartbeat</p>
                      <div className="text-[10px] text-muted pt-1 font-mono">v1 • Assignee: David Chen</div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-editor border border-divider rounded-xl space-y-2 shadow-sm">
                    <div className="flex items-center justify-between text-xs font-bold text-carbon uppercase font-mono">
                      <span>Done</span>
                      <span className="px-1.5 py-0.5 rounded bg-moss border border-divider text-carbon font-mono">1</span>
                    </div>
                    <div className="p-3 bg-moss/50 border border-[#b5cea8] rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-coral font-bold">NEO-3</span>
                        <span className="px-1.5 py-0.5 rounded bg-moss text-carbon border border-[#3B5A38]/30 text-[10px] font-bold">Done</span>
                      </div>
                      <p className="font-bold text-carbon">Audit RBAC server-side authorization</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

        {/* Features Grid */}
        <section id="features" className="py-20 px-6 max-w-6xl mx-auto border-t border-divider space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-coral">Core Capabilities</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-carbon">Engineered for real collaborative speed</h3>
            <p className="text-muted text-sm max-w-xl mx-auto">
              Every detail built with purpose: from instant Socket.IO propagation to rock-solid data integrity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-editor border border-divider space-y-3.5 hover:border-coral transition shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-coral/15 border border-coral/30 flex items-center justify-center text-coral">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-carbon text-base">Real-Time Sync</h4>
              <p className="text-xs text-muted leading-relaxed">
                Task changes, status shifts, comments, and member additions reflect instantly across all connected browsers without manual page reloads.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-editor border border-divider space-y-3.5 hover:border-coral transition shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-periwinkle border border-[#bec5ea] flex items-center justify-center text-carbon">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-carbon text-base">Conflict Prevention (OCC)</h4>
              <p className="text-xs text-muted leading-relaxed">
                Optimistic Concurrency Control prevents stale overwrites with HTTP 409 conflict detection and interactive side-by-side visual diff resolution.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-editor border border-divider space-y-3.5 hover:border-coral transition shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-moss border border-[#b5cea8] flex items-center justify-center text-carbon">
                <Shield className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-carbon text-base">Air-tight Server RBAC</h4>
              <p className="text-xs text-muted leading-relaxed">
                Permissions enforced strictly at the API controller layer for Admin, Project Manager, Team Member, and Viewer roles.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-editor border border-divider space-y-3.5 hover:border-coral transition shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-periwinkle border border-[#bec5ea] flex items-center justify-center text-carbon">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-carbon text-base">Executive Analytics</h4>
              <p className="text-xs text-muted leading-relaxed">
                Interactive charts tracking task status velocity, priority distribution, and sprint milestone completion rates.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-editor border border-divider space-y-3.5 hover:border-coral transition shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-paper border border-divider flex items-center justify-center text-carbon">
                <Terminal className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-carbon text-base">Immutable Audit Trail</h4>
              <p className="text-xs text-muted leading-relaxed">
                Every project and task mutation produces an immutable audit record with JSON metadata for security compliance.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-editor border border-divider space-y-3.5 hover:border-coral transition shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-moss border border-[#b5cea8] flex items-center justify-center text-carbon">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-carbon text-base">Smart Mentions & Alerts</h4>
              <p className="text-xs text-muted leading-relaxed">
                In-app notification center with read/unread tracking and real-time toast alerts on task assignments and @mentions.
              </p>
            </div>
          </div>
        </section>

        {/* Workflow Section */}
        <section id="workflow" className="py-20 px-6 max-w-5xl mx-auto border-t border-divider space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-coral">How It Works</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-carbon">Seamless flow from backlog to release</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6 rounded-2xl bg-editor border border-divider space-y-3 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-coral text-white font-bold flex items-center justify-center mx-auto text-sm">
                1
              </div>
              <h4 className="font-bold text-carbon text-base">Plan & Scope</h4>
              <p className="text-xs text-muted">
                Admins and PMs create projects, set milestone deadlines, and assign team roles with precision.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-editor border border-divider space-y-3 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-carbon text-paper font-bold flex items-center justify-center mx-auto text-sm">
                2
              </div>
              <h4 className="font-bold text-carbon text-base">Execute in Real Time</h4>
              <p className="text-xs text-muted">
                Engineers move tasks through Kanban stages, comment with @mentions, and see collaborators live.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-editor border border-divider space-y-3 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-moss text-carbon font-bold flex items-center justify-center mx-auto text-sm border border-[#3B5A38]">
                3
              </div>
              <h4 className="font-bold text-carbon text-base">Resolve & Audit</h4>
              <p className="text-xs text-muted">
                Automatic OCC conflict prevention resolves simultaneous edits, while audit logs maintain compliance.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section id="governance" className="py-16 px-6 max-w-4xl mx-auto text-center space-y-6 bg-carbon text-paper rounded-3xl my-12 shadow-2xl">
          <h2 className="text-3xl font-black text-paper">Ready to elevate your team&apos;s velocity?</h2>
          <p className="text-xs sm:text-sm text-paper/80 max-w-xl mx-auto">
            Experience the full collaborative project management platform today.
          </p>
          <div className="pt-2">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-coral hover:bg-[#d34628] text-white font-bold text-sm shadow-xl shadow-coral/30 transition hover:scale-105"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-divider bg-editor">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-coral" />
            <span className="font-bold text-carbon">NeoStats</span>
            <span>— Full Stack Collaborative Engineering Platform</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-carbon transition font-medium">Sign In</Link>
            <Link href="/register" className="hover:text-carbon transition font-medium">Create Account</Link>
            <Link href="/dashboard" className="hover:text-carbon transition font-medium">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
