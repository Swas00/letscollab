"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, AlertCircle, RefreshCw, CheckCircle2, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/Button";
import { Logo } from "../../components/ui/Logo";

export default function RegisterPage() {
  const router = useRouter();
  const { register, user } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("PROJECT_MANAGER");
  const [organizationName, setOrganizationName] = useState("");
  const [avatarSeed, setAvatarSeed] = useState("Alex");
  const [avatarStyle, setAvatarStyle] = useState("avataaars");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deletedNotice, setDeletedNotice] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search);
      const emailParam = q.get("email");
      if (emailParam) {
        setEmail(emailParam);
      }
      if (q.get("deleted") === "true") {
        setDeletedNotice(true);
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      const redirectUrl =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("redirect") || "/dashboard"
          : "/dashboard";
      router.push(redirectUrl);
    }
  }, [user, router]);

  const currentAvatarUrl = `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${encodeURIComponent(
    avatarSeed || name || "User"
  )}`;

  const handleRandomizeAvatar = () => {
    const styles = ["adventurer", "notionists", "bottts", "micah", "avataaars", "big-smile"];
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    const randomSeed = Math.random().toString(36).substring(2, 9);
    setAvatarStyle(randomStyle);
    setAvatarSeed(randomSeed);
  };

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
    const res = await register(name, email, password, role, organizationName, currentAvatarUrl);
    setIsLoading(false);

    if (res.success) {
      const redirectUrl =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("redirect") || "/dashboard"
          : "/dashboard";
      router.push(redirectUrl);
    } else {
      setErrorMsg(res.error || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-6 antialiased selection:bg-periwinkle selection:text-carbon">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Logo href="/" size="lg" className="justify-center" />
          <h1 className="text-xl font-extrabold text-carbon">Create your account</h1>
          <p className="text-xs text-muted">
            Start collaborating with your team in real time.
          </p>
        </div>

        {/* Deleted Account Confirmation Notice */}
        {deletedNotice && (
          <div className="p-3.5 rounded-2xl bg-moss border border-[#b5cea8] flex items-center gap-2.5 text-xs text-[#254622] font-semibold animate-fade-in shadow-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Your account and credentials were permanently deleted. You may create a fresh account anytime.</span>
          </div>
        )}

        {/* Card */}
        <div className="p-8 rounded-3xl bg-editor border border-divider shadow-xl space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-coral/15 border border-coral/30 flex items-center gap-2.5 text-xs text-coral">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Avatar Preview & Quick Customizer */}
          <div className="flex items-center gap-4 p-3 bg-paper rounded-2xl border border-divider">
            <img
              src={currentAvatarUrl}
              alt="Avatar preview"
              className="w-14 h-14 rounded-2xl bg-editor border border-coral/30 shadow-sm object-cover"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-carbon">Profile Avatar</span>
                <button
                  type="button"
                  onClick={handleRandomizeAvatar}
                  className="flex items-center gap-1 text-[11px] font-bold text-coral hover:underline"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>🎲 Randomize</span>
                </button>
              </div>
              <p className="text-[11px] text-muted mt-0.5">
                Style: <span className="capitalize font-medium text-carbon">{avatarStyle}</span>. Change anytime in Profile.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-carbon block mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!avatarSeed || avatarSeed === "Alex") {
                    setAvatarSeed(e.target.value);
                  }
                }}
                placeholder="Alex Morgan"
                className="w-full px-3.5 py-2.5 bg-paper border border-divider rounded-xl text-sm text-carbon placeholder-muted focus:outline-none focus:border-coral focus:bg-editor transition"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-carbon block mb-1.5">
                Work Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@company.com"
                className="w-full px-3.5 py-2.5 bg-paper border border-divider rounded-xl text-sm text-carbon placeholder-muted focus:outline-none focus:border-coral focus:bg-editor transition"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-carbon block mb-1.5">
                Role in Organization
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-paper border border-divider rounded-xl text-xs text-carbon focus:outline-none focus:border-coral focus:bg-editor"
              >
                <option value="PROJECT_MANAGER">Project Manager (Can create projects & tasks)</option>
                <option value="TEAM_MEMBER">Team Member (Can work on tasks & comment)</option>
                <option value="VIEWER">Viewer (Read-only observation)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-carbon">
                  Organization / Company
                </label>
                <span className="text-[10px] text-muted font-medium bg-paper border border-divider px-2 py-0.5 rounded-full">
                  Optional
                </span>
              </div>
              <input
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="e.g. Acme Corp or Stark Labs"
                className="w-full px-3.5 py-2.5 bg-paper border border-divider rounded-xl text-sm text-carbon placeholder-muted focus:outline-none focus:border-coral focus:bg-editor transition"
              />
              <p className="text-[11px] text-muted mt-1 leading-relaxed">
                Opt into a shared organization workspace or leave blank to work independently.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-carbon block mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-paper border border-divider rounded-xl text-sm text-carbon placeholder-muted focus:outline-none focus:border-coral focus:bg-editor transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-carbon block mb-1.5">
                  Confirm
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-paper border border-divider rounded-xl text-sm text-carbon placeholder-muted focus:outline-none focus:border-coral focus:bg-editor transition"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 pt-1 text-[11px] text-muted">
              <ShieldCheck className="w-3.5 h-3.5 text-moss shrink-0" />
              <span>Details saved permanently until account is deleted.</span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              withArrow
              className="w-full mt-2"
            >
              Create Account
            </Button>
          </form>

          <div className="pt-4 border-t border-divider text-center text-xs text-muted">
            Already have an account?{" "}
            <Link href="/login" className="text-coral font-bold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
