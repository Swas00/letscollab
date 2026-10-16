"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "../../components/layout/AppLayout";
import { useSocket } from "../../context/SocketContext";
import { api } from "../../lib/api";
import {
  Bell,
  CheckCheck,
  Check,
  Mail,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { formatRelativeTime, cn } from "../../lib/utils";
import { Button } from "../../components/ui/Button";

export default function NotificationsPage() {
  const { unreadCount, setUnreadCount, socket } = useSocket();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");
  const [isLoading, setIsLoading] = useState(true);

  const fetchInvitations = async () => {
    const res = await api.projects.myInvitations();
    if (res.data?.invitations) {
      setPendingInvitations(res.data.invitations);
    }
  };

  const fetchNotifications = async () => {
    setIsLoading(true);
    const [notifRes, invRes] = await Promise.all([
      api.notifications.list(),
      api.projects.myInvitations(),
    ]);

    if (notifRes.data) {
      setNotifications(notifRes.data.notifications);
      setUnreadCount(notifRes.data.unreadCount);
    }
    if (invRes.data?.invitations) {
      setPendingInvitations(invRes.data.invitations);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Real-time notification updates
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notif: any) => {
      setNotifications((prev) => [notif, ...prev]);
      if (notif.type === "PROJECT_INVITE") {
        fetchInvitations();
      }
    };

    const handleInvitationReceived = () => {
      fetchInvitations();
    };

    socket.on("notification:new", handleNewNotification);
    socket.on("project:invitation_received", handleInvitationReceived);

    return () => {
      socket.off("notification:new", handleNewNotification);
      socket.off("project:invitation_received", handleInvitationReceived);
    };
  }, [socket]);

  const handleAcceptInvite = async (invitationId: string) => {
    setActionLoadingId(invitationId);
    const res = await api.projects.acceptInvitation(invitationId);
    setActionLoadingId(null);
    if (res.data?.success) {
      setPendingInvitations((prev) => prev.filter((i) => i.id !== invitationId));
      fetchNotifications();
    }
  };

  const handleDeclineInvite = async (invitationId: string) => {
    setActionLoadingId(invitationId);
    const res = await api.projects.declineInvitation(invitationId);
    setActionLoadingId(null);
    if (res.data?.success) {
      setPendingInvitations((prev) => prev.filter((i) => i.id !== invitationId));
    }
  };

  const handleMarkAsRead = async (id: string) => {
    const res = await api.notifications.markRead(id);
    if (res.data) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(res.data.unreadCount);
    }
  };

  const handleMarkAllRead = async () => {
    const res = await api.notifications.markAllRead();
    if (res.data) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    }
  };

  const displayedNotifs = notifications.filter((n) =>
    filter === "UNREAD" ? !n.isRead : true
  );

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-carbon tracking-tight">Notifications</h1>
              {unreadCount > 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-coral text-white font-bold">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <p className="text-xs text-muted">
              Task assignments, status changes, mentions, and project updates.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleMarkAllRead}
                icon={<CheckCheck className="w-4 h-4 text-coral" />}
              >
                Mark All Read
              </Button>
            )}
          </div>
        </div>

        {/* Pending Project Invitations Section */}
        {pendingInvitations.length > 0 && (
          <div className="p-5 bg-periwinkle/30 border border-[#bec5ea] rounded-3xl space-y-3 shadow-sm animate-activity-slide">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-carbon flex items-center gap-2">
                <Mail className="w-4 h-4 text-coral" />
                Project Collaboration Invitations ({pendingInvitations.length})
              </h2>
              <span className="text-xs text-muted">
                You have been invited to collaborate on these projects
              </span>
            </div>

            <div className="space-y-2.5 pt-1">
              {pendingInvitations.map((inv) => (
                <div
                  key={inv.id}
                  className="p-4 bg-editor border border-divider rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-paper border border-divider text-coral">
                        {inv.project?.key}
                      </span>
                      <h3 className="text-xs font-bold text-carbon">
                        {inv.project?.name}
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-periwinkle/20 border border-periwinkle/40 text-navy font-semibold">
                        Role: {inv.role?.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted">
                      Invited by <strong className="text-carbon">{inv.inviter?.name || inv.inviter?.email}</strong> &bull;{" "}
                      {formatRelativeTime(inv.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleAcceptInvite(inv.id)}
                      disabled={actionLoadingId === inv.id}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-coral hover:bg-[#d34628] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{actionLoadingId === inv.id ? "Accepting..." : "Accept"}</span>
                    </button>
                    <button
                      onClick={() => handleDeclineInvite(inv.id)}
                      disabled={actionLoadingId === inv.id}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-paper hover:bg-divider border border-divider text-muted hover:text-carbon text-xs font-semibold rounded-xl transition"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-editor border border-divider rounded-2xl w-fit shadow-xs">
          <button
            onClick={() => setFilter("ALL")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-140 select-none hover:-translate-y-0.5 active:scale-[0.98]",
              filter === "ALL"
                ? "bg-carbon text-paper shadow-xs"
                : "text-muted hover:text-carbon"
            )}
          >
            All Notifications
          </button>
          <button
            onClick={() => setFilter("UNREAD")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-140 select-none hover:-translate-y-0.5 active:scale-[0.98]",
              filter === "UNREAD"
                ? "bg-carbon text-paper shadow-xs"
                : "text-muted hover:text-carbon"
            )}
          >
            Unread Only ({unreadCount})
          </button>
        </div>

        {/* Notifications List */}
        <div className="bg-editor border border-divider rounded-3xl p-4 shadow-sm">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-muted">Loading notifications...</div>
          ) : (
            <div className="space-y-2.5">
              {displayedNotifs.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                  className={cn(
                    "p-4 rounded-2xl border transition-all duration-160 ease-out select-none hover:-translate-y-0.5 active:scale-[0.99] flex items-start justify-between gap-4 cursor-pointer animate-activity-slide",
                    notif.isRead
                      ? "bg-paper border-divider opacity-85 hover:opacity-100"
                      : "bg-periwinkle/30 border-[#bec5ea] hover:bg-periwinkle/40 shadow-xs"
                  )}
                >
                  <div className="flex items-start gap-3.5">
                    <img
                      src={
                        notif.actor?.avatarUrl ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${notif.actor?.name || "LetsCollab"}`
                      }
                      alt={notif.actor?.name || "Actor"}
                      className="w-8 h-8 rounded-full object-cover bg-paper border border-divider shrink-0 mt-0.5"
                    />

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-carbon">{notif.title}</span>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-coral animate-pulse" />
                        )}
                      </div>
                      <p className="text-xs text-carbon leading-relaxed">{notif.message}</p>
                      <span className="text-[10px] font-mono text-muted block pt-1">
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>
                  </div>

                  {!notif.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notif.id);
                      }}
                      title="Mark as read"
                      className="p-1.5 text-muted hover:text-coral hover:bg-paper rounded-lg transition"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              {displayedNotifs.length === 0 && (
                <div className="p-16 text-center text-xs text-muted italic space-y-2">
                  <Bell className="w-8 h-8 mx-auto text-muted" />
                  <p>No notifications to display.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
