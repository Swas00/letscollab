"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../lib/api";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FolderGit2,
  UserCheck,
  ArrowRight,
  LogOut,
  Clock,
  Sparkles,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { formatDate } from "../../../lib/utils";

export default function InvitationAcceptancePage() {
  const params = useParams();
  const token = params.token as string;
  const router = useRouter();
  const { user, logout } = useAuth();

  const [invitation, setInvitation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [isDeclined, setIsDeclined] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchInvitation = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await api.projects.getInvitationByToken(token);

      if (res.data?.invitation) {
        setInvitation(res.data.invitation);
        if (res.data.invitation.status === "ACCEPTED") {
          setIsAccepted(true);
        } else if (res.data.invitation.status === "DECLINED") {
          setIsDeclined(true);
        }
      } else {
        setErrorMsg(res.error || "Invitation not found or link has expired.");
      }
      setIsLoading(false);
    };

    fetchInvitation();
  }, [token]);

  const handleAccept = async () => {
    setIsAccepting(true);
    setActionError(null);

    const res = await api.projects.acceptInvitationByToken(token);
    setIsAccepting(false);

    if (res.data?.success) {
      setIsAccepted(true);
      const targetProjectId = res.data.project?.id || invitation?.project?.id;
      setTimeout(() => {
        router.push(targetProjectId ? `/projects/${targetProjectId}` : "/projects");
      }, 1200);
    } else {
      setActionError(res.error || "Failed to accept invitation.");
    }
  };

  const handleDecline = async () => {
    if (!confirm("Are you sure you want to decline this invitation?")) return;

    setIsDeclining(true);
    setActionError(null);

    const res = await api.projects.declineInvitationByToken(token);
    setIsDeclining(false);

    if (res.data?.success) {
      setIsDeclined(true);
    } else {
      setActionError(res.error || "Failed to decline invitation.");
    }
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-coral mx-auto" />
          <p className="text-sm text-carbon font-semibold">Verifying invitation link...</p>
        </div>
      </div>
    );
  }

  // 2. Invalid / Not Found State
  if (errorMsg || !invitation) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-editor border border-divider rounded-3xl p-8 shadow-xl text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-coral/10 border border-coral/20 flex items-center justify-center mx-auto text-coral">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-black text-carbon">Invalid Invitation Link</h1>
            <p className="text-xs text-muted mt-2 leading-relaxed">
              {errorMsg || "This invitation link does not exist, was mistyped, or has been removed."}
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-coral hover:bg-[#d34628] text-white text-xs font-bold rounded-xl transition shadow-md shadow-coral/20"
            >
              <span>Go to Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isExpired = invitation.isExpired || invitation.status === "EXPIRED";
  const isRevoked = invitation.status === "REVOKED";
  const userMatchesEmail =
    user && user.email.toLowerCase() === invitation.email.toLowerCase();

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-lg w-full bg-editor border border-divider rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Top Accent Header */}
        <div className="bg-[#1A202C] px-6 py-6 text-center text-white relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-coral text-[11px] font-bold tracking-wider uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>LetsCollab Invitation</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Join Project Collaboration
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            You've been invited to team up and collaborate in real-time.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Action Error Banner */}
          {actionError && (
            <div className="p-3.5 bg-coral/15 border border-coral/30 rounded-2xl flex items-start gap-2.5 text-xs text-coral font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Project Details Card */}
          <div className="p-5 bg-paper border border-divider rounded-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-coral/10 border border-coral/20 flex items-center justify-center text-coral shrink-0">
                  <FolderGit2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-editor border border-divider text-coral">
                      {invitation.project?.key}
                    </span>
                    <h2 className="text-sm font-bold text-carbon">
                      {invitation.project?.name}
                    </h2>
                  </div>
                  {invitation.project?.organization && (
                    <p className="text-[11px] text-muted mt-0.5">
                      Organization: <strong className="text-carbon font-semibold">{invitation.project.organization.name}</strong>
                    </p>
                  )}
                </div>
              </div>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-periwinkle/20 border border-periwinkle/30 text-navy font-bold">
                {invitation.role?.replace("_", " ")}
              </span>
            </div>

            {invitation.project?.description && (
              <p className="text-xs text-muted leading-relaxed border-t border-divider pt-3">
                {invitation.project.description}
              </p>
            )}

            {/* Inviter Info */}
            <div className="border-t border-divider pt-3 flex items-center justify-between text-xs text-muted">
              <span className="text-[11px]">Invited by:</span>
              <div className="flex items-center gap-2">
                <img
                  src={
                    invitation.inviter?.avatarUrl ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${invitation.inviter?.name}`
                  }
                  alt={invitation.inviter?.name}
                  className="w-5 h-5 rounded-full object-cover bg-paper border border-divider"
                />
                <span className="font-medium text-carbon text-xs">
                  {invitation.inviter?.name}
                </span>
              </div>
            </div>

            <div className="border-t border-divider pt-3 flex items-center justify-between text-[11px] text-muted">
              <span>Invited Email:</span>
              <span className="font-mono font-medium text-carbon">
                {invitation.email}
              </span>
            </div>

            {invitation.expiresAt && !isExpired && (
              <div className="flex items-center gap-1.5 text-[11px] text-amber-700 font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Expires on {formatDate(invitation.expiresAt)}</span>
              </div>
            )}
          </div>

          {/* Conditional Workflow States */}
          {/* Case C1: Expired */}
          {isExpired && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center mx-auto text-amber-700">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-bold text-amber-900">This Invitation Has Expired</h3>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Invitation links are valid for 7 days. Please ask the project owner to resend the invitation to your email.
              </p>
            </div>
          )}

          {/* Case C2: Revoked */}
          {isRevoked && (
            <div className="p-4 bg-coral/10 border border-coral/30 rounded-2xl text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-coral/15 flex items-center justify-center mx-auto text-coral">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-bold text-coral">Invitation Revoked</h3>
              <p className="text-[11px] text-muted leading-relaxed">
                This invitation was revoked by the project owner. If you believe this is an error, please contact the project administrator.
              </p>
            </div>
          )}

          {/* Case C3: Declined */}
          {isDeclined && (
            <div className="p-4 bg-paper border border-divider rounded-2xl text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-muted/20 flex items-center justify-center mx-auto text-muted">
                <XCircle className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-bold text-carbon">Invitation Declined</h3>
              <p className="text-[11px] text-muted">
                You have declined this project invitation.
              </p>
              <div className="pt-2">
                <Link
                  href="/dashboard"
                  className="inline-block px-4 py-2 bg-paper border border-divider hover:border-carbon/30 text-xs font-bold text-carbon rounded-xl transition"
                >
                  Return to Dashboard
                </Link>
              </div>
            </div>
          )}

          {/* Already Accepted */}
          {isAccepted && !isExpired && !isRevoked && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-emerald-800">You're on the Team! 🎉</h3>
                <p className="text-[11px] text-emerald-700 mt-1">
                  You are an active collaborator on {invitation.project?.name}.
                </p>
              </div>
              <div className="pt-1">
                <Link
                  href={`/projects/${invitation.project?.id}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-600/20"
                >
                  <span>Open Project Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* Case A & B: Pending & Not Expired/Revoked/Declined/Accepted */}
          {!isExpired && !isRevoked && !isDeclined && !isAccepted && (
            <>
              {/* If user is NOT logged in: Prompt to Sign in or Register */}
              {!user ? (
                <div className="space-y-4 pt-2">
                  <div className="p-4 bg-paper border border-divider rounded-2xl text-center space-y-1">
                    <p className="text-xs text-carbon font-semibold">
                      To accept this invitation, sign in or create an account with:
                    </p>
                    <p className="font-mono text-xs font-bold text-coral">{invitation.email}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Link
                      href={`/login?redirect=/invite/${token}&email=${encodeURIComponent(invitation.email)}`}
                      className="flex items-center justify-center gap-2 py-3 px-4 bg-coral hover:bg-[#d34628] text-white text-xs font-bold rounded-xl transition shadow-md shadow-coral/20"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Sign In to Accept</span>
                    </Link>
                    <Link
                      href={`/register?redirect=/invite/${token}&email=${encodeURIComponent(invitation.email)}`}
                      className="flex items-center justify-center gap-2 py-3 px-4 bg-editor border border-divider hover:border-carbon/40 text-carbon text-xs font-bold rounded-xl transition"
                    >
                      <span>Create Account</span>
                    </Link>
                  </div>
                </div>
              ) : !userMatchesEmail ? (
                /* User is logged in, but with a DIFFERENT email */
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-900 leading-relaxed">
                      <p className="font-bold">Account Mismatch</p>
                      <p className="mt-1">
                        You are currently signed in as <strong className="font-mono font-bold text-carbon">{user.email}</strong>.
                        However, this invitation was issued to <strong className="font-mono font-bold text-carbon">{invitation.email}</strong>.
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      onClick={logout}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-editor border border-divider hover:border-amber-600/40 text-carbon text-xs font-bold rounded-xl transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out & Switch Account</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Case A: User is logged in with matching email -> Accept or Decline */
                <div className="space-y-3 pt-2">
                  <button
                    onClick={handleAccept}
                    disabled={isAccepting || isDeclining}
                    className="w-full py-3.5 px-5 bg-coral hover:bg-[#d34628] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-coral/25 flex items-center justify-center gap-2"
                  >
                    {isAccepting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Accepting Invitation...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Accept Invitation & Join Project</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDecline}
                    disabled={isAccepting || isDeclining}
                    className="w-full py-2.5 px-4 bg-transparent hover:bg-paper text-muted hover:text-carbon text-xs font-medium rounded-xl transition"
                  >
                    {isDeclining ? "Declining..." : "Decline Invitation"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
