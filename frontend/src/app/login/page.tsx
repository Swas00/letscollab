"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Layers, ArrowRight, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
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

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-6 antialiased selection:bg-periwinkle selection:text-carbon">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-coral flex items-center justify-center text-white shadow-md shadow-coral/20 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-black text-carbon tracking-tight">LetsCollab</span>
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

          <div className="pt-4 border-t border-divider text-center text-xs text-muted">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-coral font-bold hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
