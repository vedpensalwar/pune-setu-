"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  Briefcase,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  X,
} from "lucide-react";
import { Notification, NotificationType } from "@/lib/civic/types";
import { useLanguage } from "@/components/language/language-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function NotificationBell({
  className = "",
}: {
  className?: string;
}) {
  const router = useRouter();
  const { t, formatDate, formatNumber } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "unread">("all");
  const panelRef = useRef<HTMLDivElement>(null);

  // Fetch notifications from server
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount ?? data.notifications.filter((n: Notification) => !n.read).length);
      }
    } catch {
      // Offline or network error fallback
    }
  }, []);

  // Initial load and periodic refresh
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();

    // Re-fetch on window focus
    const handleFocus = () => {
      fetchNotifications();
    };
    window.addEventListener("focus", handleFocus);

    // Sync across components on custom notification event
    const handleSync = () => {
      fetchNotifications();
    };
    window.addEventListener("punesetu:notification-change", handleSync);

    // Polling interval every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("punesetu:notification-change", handleSync);
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  // Close panel on outside click or ESC key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const toggleOpen = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  // Mark single notification as read
  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));

      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      window.dispatchEvent(new CustomEvent("punesetu:notification-change"));
    } catch {
      fetchNotifications();
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true);
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);

      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });

      window.dispatchEvent(new CustomEvent("punesetu:notification-change"));
    } catch {
      fetchNotifications();
    } finally {
      setLoading(false);
    }
  };

  // Handle click on notification card
  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.read) {
      await handleMarkAsRead(notif.id);
    }
    setIsOpen(false);
    if (notif.actionUrl) {
      router.push(notif.actionUrl);
    } else if (notif.trackingToken) {
      router.push(`/track/${notif.trackingToken}`);
    }
  };

  const filteredNotifications =
    activeFilter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case "STATUS_CHANGE":
        return <Clock className="w-3.5 h-3.5 text-brand" />;
      case "ASSIGNED":
        return <Briefcase className="w-3.5 h-3.5 text-status-warning" />;
      case "COMMENT_ADDED":
        return <MessageSquare className="w-3.5 h-3.5 text-accent" />;
      case "ESCALATED":
        return <AlertTriangle className="w-3.5 h-3.5 text-status-error" />;
      case "RESOLUTION_VERIFIED":
        return <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-brand" />;
    }
  };

  const getTypeBadgeLabel = (type: NotificationType) => {
    switch (type) {
      case "STATUS_CHANGE":
        return t("notifications.typeStatusChange");
      case "ASSIGNED":
        return t("notifications.typeAssigned");
      case "COMMENT_ADDED":
        return t("notifications.typeCommentAdded");
      case "ESCALATED":
        return t("notifications.typeEscalated");
      case "RESOLUTION_VERIFIED":
        return t("notifications.typeResolutionVerified");
      default:
        return "Update";
    }
  };

  return (
    <div className={`relative ${className}`} ref={panelRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={toggleOpen}
        aria-label={
          unreadCount > 0
            ? `${unreadCount} unread civic notifications`
            : t("notifications.title")
        }
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="relative p-2 rounded-base border border-border bg-surface hover:bg-surface-hover text-content-secondary hover:text-content-primary transition-colors focus:outline-none focus:ring-2 focus:ring-focus"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-status-error text-[10px] font-bold text-white shadow-subtle animate-in zoom-in-75">
            {unreadCount > 9 ? "9+" : formatNumber(unreadCount)}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label={t("notifications.title")}
          className="absolute right-0 mt-2 w-[340px] sm:w-[400px] max-h-[85vh] flex flex-col rounded-base border border-border bg-surface shadow-elevated z-50 animate-in fade-in-50 zoom-in-95"
        >
          {/* Header */}
          <div className="p-3.5 border-b border-border flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-brand/10 text-brand flex items-center justify-center">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-content-primary">
                  {t("notifications.title")}
                </h3>
                {unreadCount > 0 ? (
                  <p className="text-[10px] text-brand font-medium">
                    {formatNumber(unreadCount)} {t("notifications.unread")}
                  </p>
                ) : (
                  <p className="text-[10px] text-content-muted">
                    {t("notifications.allRead")}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  disabled={loading}
                  title={t("notifications.markAllRead")}
                  className="px-2 py-1 rounded text-[11px] font-semibold text-brand hover:bg-brand/10 transition-colors flex items-center gap-1 focus:outline-none focus:ring-1 focus:ring-focus"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t("notifications.markAllRead")}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => fetchNotifications()}
                title="Refresh notifications"
                className="p-1 rounded text-content-muted hover:text-content-primary hover:bg-surface-muted transition-colors focus:outline-none"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close panel"
                className="p-1 rounded text-content-muted hover:text-content-primary hover:bg-surface-muted transition-colors focus:outline-none"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="px-3 py-1.5 border-b border-border bg-surface-muted/50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  activeFilter === "all"
                    ? "bg-brand text-brand-contrast"
                    : "text-content-secondary hover:text-content-primary"
                }`}
              >
                {t("notifications.all")} ({formatNumber(notifications.length)})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("unread")}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  activeFilter === "unread"
                    ? "bg-brand text-brand-contrast"
                    : "text-content-secondary hover:text-content-primary"
                }`}
              >
                {t("notifications.unread")} ({formatNumber(unreadCount)})
              </button>
            </div>
          </div>

          {/* Scrollable Notification Items List */}
          <div className="overflow-y-auto max-h-[380px] divide-y divide-border/60">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-surface-muted text-content-muted mx-auto flex items-center justify-center">
                  <Check className="w-5 h-5 text-status-success" />
                </div>
                <p className="text-xs font-bold text-content-primary">
                  {t("notifications.empty")}
                </p>
                <p className="text-[11px] text-content-muted max-w-[240px] mx-auto leading-relaxed">
                  {t("notifications.emptyDesc")}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const hasAction = Boolean(notif.actionUrl || notif.trackingToken);
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3 transition-colors flex items-start gap-2.5 cursor-pointer hover:bg-surface-hover ${
                      notif.read ? "bg-surface opacity-80" : "bg-brand/5 border-l-2 border-brand"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0 p-1.5 rounded-full bg-surface-muted shadow-subtle">
                      {getTypeIcon(notif.type)}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-semibold text-content-muted uppercase tracking-wider">
                          {getTypeBadgeLabel(notif.type)}
                        </span>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-brand shrink-0" />
                        )}
                      </div>

                      <p className="text-xs font-bold text-content-primary leading-snug">
                        {notif.title}
                      </p>

                      <p className="text-[11px] text-content-secondary leading-relaxed line-clamp-2">
                        {notif.message}
                      </p>

                      <div className="flex items-center justify-between gap-2 pt-1 text-[10px] text-content-muted">
                        <span>
                          {formatDate(notif.createdAt, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>

                        <div className="flex items-center gap-2">
                          {!notif.read && (
                            <button
                              type="button"
                              onClick={(e) => handleMarkAsRead(notif.id, e)}
                              title={t("notifications.markRead")}
                              className="text-brand hover:underline inline-flex items-center gap-0.5"
                            >
                              <Check className="w-3 h-3" />
                              <span>{t("notifications.markRead")}</span>
                            </button>
                          )}
                          {hasAction && (
                            <span className="text-brand inline-flex items-center gap-0.5 font-medium">
                              <span>{t("notifications.viewDetails")}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
