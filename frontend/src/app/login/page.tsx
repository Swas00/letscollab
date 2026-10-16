"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  AlertCircle,
  Mail,
  KeyRound,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { Logo } from "../../components/ui/Logo";

type AuthMode = "LOGIN" | "FORGOT_REQUEST" | "FORGOT_VERIFY";

export default function LoginPage() {
  const router = useRouter();
  const { login, setSession, user } = useAuth();

  // Mode
  const [mode, setMode] = useState<AuthMode>("LOGIN");

  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Forgot password form state
  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [previewOtp, setPreviewOtp] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search);
      const emailParam = q.get("email");
      if (emailParam) {
        setEmail(emailParam);
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

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await login(email, password);
    setIsLoading(false);

    if (res.success) {
      const redirectUrl =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("redirect") || "/dashboard"
          : "/dashboard";
      router.push(redirectUrl);
    } else {
      setErrorMsg(res.error || "Invalid email or password");
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = resetEmail.trim().toLowerCase();
    if (!cleanEmail) return;

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setPreviewOtp(null);

    const res = await api.auth.forgotPassword(cleanEmail);
    setIsLoading(false);

    if (res.data) {
      const data = res.data as any;
      if (data.previewOtp) {
        setPreviewOtp(data.previewOtp);
        setOtp(data.previewOtp);
      }
      setSuccessMsg(`We've dispatched a 6-digit verification code for ${cleanEmail}.`);
      setMode("FORGOT_VERIFY");
      setResendCooldown(60);
    } else {
      setErrorMsg(res.error || "Failed to send reset code. Please check your email address.");
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || !resetEmail.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);
    const res = await api.auth.forgotPassword(resetEmail.trim().toLowerCase());
    setIsLoading(false);

    if (res.data) {
      const data = res.data as any;
      if (data.previewOtp) {
        setPreviewOtp(data.previewOtp);
        setOtp(data.previewOtp);
      }
      setSuccessMsg("A fresh 6-digit verification code has been dispatched!");
      setResendCooldown(60);
    } else {
      setErrorMsg(res.error || "Failed to resend code");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please re-enter.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await api.auth.resetPassword({
      email: resetEmail.trim().toLowerCase(),
      otp: otp.trim(),
      newPassword,
    });
    setIsLoading(false);

    if (res.data?.token && res.data?.user) {
      setSuccessMsg("Password reset successfully! Logging you into your workspace...");
      setSession(res.data.token, res.data.user);
      setTimeout(() => {
        const redirectUrl =
          typeof window !== "undefined"
            ? new URLSearchParams(window.location.search).get("redirect") || "/dashboard"
            : "/dashboard";
        router.push(redirectUrl);
      }, 1000);
    } else {
      setErrorMsg(res.error || "Invalid or expired verification code.");
    }
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-6 antialiased selection:bg-periwinkle selection:text-carbon">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Logo href="/" size="lg" className="justify-center" />
          <h1 className="text-xl font-extrabold text-carbon">
            {mode === "LOGIN" && "Welcome back"}
            {mode === "FORGOT_REQUEST" && "Reset your password"}
            {mode === "FORGOT_VERIFY" && "Verify code & reset"}
          </h1>
          <p className="text-xs text-muted max-w-xs mx-auto">
            {mode === "LOGIN" && "Sign in to your collaborative workspace."}
            {mode === "FORGOT_REQUEST" && "Enter your registered email and we'll send you an OTP code to regain access."}
            {mode === "FORGOT_VERIFY" && `Enter the 6-digit OTP code sent to ${resetEmail}.`}
          </p>
        </div>

        {/* Card */}
        <div className="p-8 rounded-3xl bg-editor border border-divider shadow-xl space-y-5 animate-activity-slide">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-coral/15 border border-coral/30 flex items-center gap-2.5 text-xs text-coral">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-700">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ===================== MODE 1: LOGIN ===================== */}
          {mode === "LOGIN" && (
            <form onSubmit={handleLogin} className="space-y-4">
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
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email || "");
                      setErrorMsg(null);
                      setSuccessMsg(null);
                      setMode("FORGOT_REQUEST");
                    }}
                    className="text-xs font-semibold text-coral hover:underline"
                  >
                    Forgot password?
                  </button>
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

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                withArrow
                className="w-full mt-2"
              >
                Sign In
              </Button>
            </form>
          )}

          {/* ===================== MODE 2: FORGOT REQUEST ===================== */}
          {mode === "FORGOT_REQUEST" && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-carbon block mb-1.5">
                  Registered Account Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-paper border border-divider rounded-xl text-sm text-carbon placeholder-muted focus:outline-none focus:border-coral focus:bg-editor transition"
                  />
                </div>
                <p className="text-[11px] text-muted mt-1.5">
                  We will send a 6-digit OTP verification code valid for 10 minutes.
                </p>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                withArrow
                className="w-full mt-2"
              >
                Send Verification Code
              </Button>

              <div className="pt-2 text-center text-[11px] text-muted">
                Don&#39;t have an account yet?{" "}
                <Link href="/register" className="text-coral font-bold hover:underline">
                  Create account
                </Link>
              </div>

              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  setPreviewOtp(null);
                  setMode("LOGIN");
                }}
                className="flex items-center justify-center gap-1.5 w-full text-xs font-bold text-muted hover:text-carbon pt-1 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
            </form>
          )}

          {/* ===================== MODE 3: FORGOT VERIFY & RESET ===================== */}
          {mode === "FORGOT_VERIFY" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {previewOtp && (
                <div className="p-3.5 bg-paper rounded-2xl border border-coral/40 space-y-1.5 animate-activity-slide">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-coral flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verification OTP
                    </span>
                    <span className="text-[10px] text-muted font-mono font-medium bg-editor px-2 py-0.5 rounded-full border border-divider">
                      Valid 10 min
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="font-mono text-xl font-black tracking-widest text-carbon">
                      {previewOtp}
                    </span>
                    <button
                      type="button"
                      onClick={() => setOtp(previewOtp)}
                      className="text-xs font-bold text-coral hover:underline"
                    >
                      Auto-Fill Code
                    </button>
                  </div>
                  <p className="text-[11px] text-muted leading-relaxed">
                    This verification code was generated for <span className="font-mono text-carbon font-semibold">{resetEmail}</span>. Enter it below to set your new password.
                  </p>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-carbon flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-coral" />
                    6-Digit Verification OTP
                  </label>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || isLoading}
                    className="text-[11px] font-semibold text-coral hover:underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>
                      {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend OTP"}
                    </span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-full px-3.5 py-2.5 bg-paper border border-divider rounded-xl text-lg font-mono font-black tracking-widest text-center text-coral focus:outline-none focus:border-coral focus:bg-editor transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-carbon block mb-1.5 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-coral" />
                  New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-paper border border-divider rounded-xl text-sm text-carbon placeholder-muted focus:outline-none focus:border-coral focus:bg-editor transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-carbon block mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-paper border border-divider rounded-xl text-sm text-carbon placeholder-muted focus:outline-none focus:border-coral focus:bg-editor transition"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                withArrow
                className="w-full mt-2"
              >
                Reset Password & Log In
              </Button>

              <div className="flex items-center justify-between text-xs pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setSuccessMsg(null);
                    setMode("FORGOT_REQUEST");
                  }}
                  className="text-muted hover:text-carbon font-medium transition"
                >
                  Change email ({resetEmail})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setSuccessMsg(null);
                    setMode("LOGIN");
                  }}
                  className="text-coral font-bold hover:underline transition"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}

          {mode === "LOGIN" && (
            <div className="pt-4 border-t border-divider text-center text-xs text-muted">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-coral font-bold hover:underline">
                Create an account
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
