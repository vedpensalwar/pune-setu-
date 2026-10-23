"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  BookmarkCheck,
  Bell,
  Search,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Calendar,
  Filter,
  PlusCircle,
  Eye,
  Check,
  ChevronRight,
  Shield,
  RefreshCw,
  FolderOpen,
  User,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { SafeUser } from "@/lib/auth/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStatusLabel, getCategoryLabel } from "@/lib/civic/display";
import { useLanguage } from "@/components/language/language-provider";

interface CitizenDashboardViewProps {
  user: SafeUser;
}

export function CitizenDashboardView({ user }: CitizenDashboardViewProps) {
  const { t, formatDate, formatNumber } = useLanguage();
  // Tabs: my-grievances | followed | notifications | services
  const [activeTab, setActiveTab] = useState<"my-grievances" | "followed" | "notifications" | "services">("my-grievances");

  // Grievances state
  const [grievances, setGrievances] = useState<any[]>([]);
  const [followed, setFollowed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Notifications state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);

  // Filters for My Grievances
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Load citizen's filed grievances
  const loadGrievances = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/grievances?citizenOnly=true&limit=50");
      if (!res.ok) throw new Error("Failed to load your grievances.");
      const data = await res.json();
      if (data.success) {
        setGrievances(data.grievances || []);
      } else {
        throw new Error(data.error || "Could not retrieve grievances.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load filed grievances.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load followed grievances
  const loadFollowed = useCallback(async () => {
    try {
      const res = await fetch("/api/grievances?followedOnly=true&limit=20");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setFollowed(data.grievances || []);
        }
      }
    } catch {
      // Non-blocking
    }
  }, []);

  // Load citizen notifications
  const loadNotifications = useCallback(async () => {
    try {
      setNotifLoading(true);
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      }
    } catch {
      // Non-blocking
    } finally {
      setNotifLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadGrievances();
    loadFollowed();
    loadNotifications();
  }, [loadGrievances, loadFollowed, loadNotifications]);

  // Re-sync notifications when events fire
  useEffect(() => {
    const handleSync = () => {
      loadNotifications();
    };
    window.addEventListener("punesetu:notification-change", handleSync);
    return () => {
      window.removeEventListener("punesetu:notification-change", handleSync);
    };
  }, [loadNotifications]);

  // Mark single notification as read
  const handleMarkNotificationRead = async (id: string) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        window.dispatchEvent(new CustomEvent("punesetu:notification-change"));
      }
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  // Mark all notifications as read
  const handleMarkAllNotificationsRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, read: true }))
        );
        setUnreadCount(0);
        window.dispatchEvent(new CustomEvent("punesetu:notification-change"));
      }
    } catch (err) {
      console.error("Failed to mark all notifications read:", err);
    }
  };

  // Calculated Metrics from real database records
  const stats = useMemo(() => {
    const total = grievances.length;
    const resolved = grievances.filter((g) => g.status === "RESOLVED").length;
    const inProgress = grievances.filter((g) =>
      ["IN_PROGRESS", "ASSIGNED"].includes(g.status)
    ).length;
    const submitted = grievances.filter((g) => g.status === "SUBMITTED").length;
    const breached = grievances.filter((g) => g.status === "SLA_BREACHED").length;
    return { total, resolved, inProgress, submitted, breached };
  }, [grievances]);

  // Filtered grievances list
  const filteredGrievances = useMemo(() => {
    return grievances.filter((g) => {
      if (statusFilter && g.status !== statusFilter) return false;
      if (categoryFilter && g.category !== categoryFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesToken = g.trackingToken?.toLowerCase().includes(q);
        const matchesTitle = g.title?.toLowerCase().includes(q);
        const matchesDesc = g.description?.toLowerCase().includes(q);
        const matchesWard = g.wardName?.toLowerCase().includes(q);
        const matchesLandmark = g.landmark?.toLowerCase().includes(q);
        if (!matchesToken && !matchesTitle && !matchesDesc && !matchesWard && !matchesLandmark) {
          return false;
        }
      }
      return true;
    });
  }, [grievances, statusFilter, categoryFilter, search]);

  const hasActiveFilters = Boolean(search || statusFilter || categoryFilter);

  return (
    <div className="space-y-6">
      {/* 0. Welcome Banner */}
      <div className="rounded-base border border-border bg-surface p-6 sm:p-8 shadow-subtle">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="brand" size="sm">
                {t("portal.verifiedCitizen")}
              </Badge>
              <span className="text-xs text-content-muted font-mono">• {t("portal.accountId")}: {user.id}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-content-primary">
              {t("portal.welcome")}, {user.name}
            </h1>
            <p className="text-xs sm:text-sm text-content-secondary mt-1">
              {t("citizen.dashboardSubtitle")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/grievances/new">
              <Button variant="accent" size="sm" leftIcon={<FileText className="w-3.5 h-3.5" />}>
                {t("citizen.fileGrievance")}
              </Button>
            </Link>
            <Link href="/#track-panel">
              <Button variant="outline" size="sm" leftIcon={<Search className="w-3.5 h-3.5" />}>
                {t("citizen.trackComplaint")}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Account Verification & Security Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 border-border bg-surface">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-base bg-brand/10 text-brand">
              <User className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-content-muted">Citizen Identity</p>
              <p className="text-sm font-bold text-content-primary truncate">{user.name}</p>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-content-secondary truncate">
                <Mail className="w-3.5 h-3.5 text-content-muted shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5 border-border bg-surface">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-base bg-status-success/10 text-status-success">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-content-muted">Security &amp; Role</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="neutral" size="sm">
                  {user.role}
                </Badge>
                <Badge variant="success" size="sm">
                  {user.status}
                </Badge>
              </div>
              <p className="text-[11px] text-content-muted mt-2">
                Session: HTTP-Only HMAC-SHA256
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5 border-border bg-surface">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-base bg-accent/10 text-accent">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-content-muted">Registration Date</p>
              <p className="text-sm font-bold text-content-primary">
                {user.createdAt ? formatDate(user.createdAt, { day: "numeric", month: "short", year: "numeric" }) : "Recently"}
              </p>
              <p className="text-[11px] text-content-muted mt-2">
                Active Citizen Member of PuneSetu
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* 1. Real Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 border-border bg-surface">
          <p className="text-[11px] font-medium text-content-muted uppercase tracking-wider">
            {t("citizen.totalFiled")}
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl sm:text-3xl font-bold text-content-primary">
              {formatNumber(stats.total)}
            </span>
            <FileText className="w-4 h-4 text-brand" />
          </div>
          <p className="text-[11px] text-content-secondary mt-1">Submitted reports</p>
        </Card>

        <Card className="p-4 border-border bg-surface">
          <p className="text-[11px] font-medium text-content-muted uppercase tracking-wider">
            {t("citizen.inAction")}
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl sm:text-3xl font-bold text-status-warning">
              {formatNumber(stats.inProgress + stats.submitted)}
            </span>
            <Clock className="w-4 h-4 text-status-warning" />
          </div>
          <p className="text-[11px] text-content-secondary mt-1">
            {stats.submitted} new, {stats.inProgress} active
          </p>
        </Card>

        <Card className="p-4 border-border bg-surface">
          <p className="text-[11px] font-medium text-content-muted uppercase tracking-wider">
            {t("citizen.resolved")}
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl sm:text-3xl font-bold text-status-success">
              {formatNumber(stats.resolved)}
            </span>
            <CheckCircle2 className="w-4 h-4 text-status-success" />
          </div>
          <p className="text-[11px] text-content-secondary mt-1">Verified resolutions</p>
        </Card>

        <Card className="p-4 border-border bg-surface">
          <p className="text-[11px] font-medium text-content-muted uppercase tracking-wider">
            {t("citizen.alerts")}
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl sm:text-3xl font-bold text-accent">
              {formatNumber(unreadCount)}
            </span>
            <Bell className="w-4 h-4 text-accent" />
          </div>
          <p className="text-[11px] text-content-secondary mt-1">
            {notifications.length} total updates
          </p>
        </Card>
      </div>

      {/* 2. Interactive Navigation Tabs */}
      <div className="border-b border-border flex items-center gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("my-grievances")}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === "my-grievances"
              ? "border-brand text-brand"
              : "border-transparent text-content-secondary hover:text-content-primary"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{t("citizen.tabMyGrievances")}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-surface-muted text-content-primary">
            {grievances.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("followed")}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === "followed"
              ? "border-brand text-brand"
              : "border-transparent text-content-secondary hover:text-content-primary"
          }`}
        >
          <BookmarkCheck className="w-4 h-4" />
          <span>{t("citizen.tabFollowed")}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-surface-muted text-content-primary">
            {followed.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("notifications")}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === "notifications"
              ? "border-brand text-brand"
              : "border-transparent text-content-secondary hover:text-content-primary"
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>{t("citizen.tabAlerts")}</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-status-danger text-white font-bold">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("services")}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === "services"
              ? "border-brand text-brand"
              : "border-transparent text-content-secondary hover:text-content-primary"
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>{t("citizen.tabHelplines")}</span>
        </button>
      </div>

      {/* 3. TAB CONTENT */}
      {/* ---------------- TAB 1: MY FILED GRIEVANCES ---------------- */}
      {activeTab === "my-grievances" && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="p-3 sm:p-4 rounded-base border border-border bg-surface flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
              <input
                type="text"
                placeholder={t("citizen.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-base border border-border bg-background text-content-primary focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-base border border-border bg-background text-content-primary focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="">{t("citizen.allStatuses")}</option>
                <option value="SUBMITTED">{getStatusLabel("SUBMITTED", t)}</option>
                <option value="ASSIGNED">{getStatusLabel("ASSIGNED", t)}</option>
                <option value="IN_PROGRESS">{getStatusLabel("IN_PROGRESS", t)}</option>
                <option value="RESOLVED">{getStatusLabel("RESOLVED", t)}</option>
                <option value="REJECTED">{getStatusLabel("REJECTED", t)}</option>
                <option value="ESCALATED">{getStatusLabel("ESCALATED", t)}</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-base border border-border bg-background text-content-primary focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="">{t("citizen.allCategories")}</option>
                <option value="ROADS_POTHOLES">{getCategoryLabel("ROADS_POTHOLES", t)}</option>
                <option value="SOLID_WASTE">{getCategoryLabel("SOLID_WASTE", t)}</option>
                <option value="WATER_SUPPLY">{getCategoryLabel("WATER_SUPPLY", t)}</option>
                <option value="STREET_LIGHTING">{getCategoryLabel("STREET_LIGHTING", t)}</option>
                <option value="SEWAGE_DRAINAGE">{getCategoryLabel("SEWAGE_DRAINAGE", t)}</option>
                <option value="TRAFFIC_TRANSPORT">{getCategoryLabel("TRAFFIC_TRANSPORT", t)}</option>
                <option value="ENCROACHMENT">{getCategoryLabel("ENCROACHMENT", t)}</option>
                <option value="GARDENS_PARKS">{getCategoryLabel("GARDENS_PARKS", t)}</option>
                <option value="HEALTH_SANITATION">{getCategoryLabel("HEALTH_SANITATION", t)}</option>
              </select>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("");
                    setCategoryFilter("");
                  }}
                  className="text-xs"
                >
                  {t("citizen.clearFilters")}
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={loadGrievances}
                leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />}
                className="text-xs"
              >
                {t("citizen.refresh")}
              </Button>
            </div>
          </div>

          {/* List or Empty State */}
          {loading ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-content-secondary">{t("citizen.loadingGrievances")}</p>
            </div>
          ) : error ? (
            <Card className="p-8 text-center border-border bg-surface space-y-3">
              <AlertCircle className="w-8 h-8 text-status-danger mx-auto" />
              <p className="text-sm font-semibold text-content-primary">{error}</p>
              <Button variant="outline" size="sm" onClick={loadGrievances}>
                {t("citizen.refresh")}
              </Button>
            </Card>
          ) : grievances.length === 0 ? (
            // Useful Empty State: No grievances submitted yet
            <Card className="p-8 sm:p-12 text-center border-border bg-surface shadow-subtle space-y-4">
              <div className="w-14 h-14 rounded-full bg-brand/10 text-brand flex items-center justify-center mx-auto">
                <FolderOpen className="w-7 h-7" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-base sm:text-lg font-bold text-content-primary">
                  {t("citizen.noGrievancesYet")}
                </h3>
                <p className="text-xs text-content-secondary leading-relaxed">
                  {t("citizen.noGrievancesDesc")}
                </p>
              </div>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <Link href="/grievances/new">
                  <Button variant="accent" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
                    {t("citizen.fileFirstGrievance")}
                  </Button>
                </Link>
                <Link href="/track">
                  <Button variant="outline" size="sm" leftIcon={<Search className="w-4 h-4" />}>
                    {t("citizen.trackByToken")}
                  </Button>
                </Link>
              </div>
            </Card>
          ) : filteredGrievances.length === 0 ? (
            // Empty State: Search filter mismatch
            <Card className="p-8 text-center border-border bg-surface space-y-3">
              <Search className="w-7 h-7 text-content-muted mx-auto" />
              <h4 className="text-sm font-semibold text-content-primary">
                {t("citizen.noMatchingGrievances")}
              </h4>
              <p className="text-xs text-content-secondary">
                {t("citizen.noMatchingDesc")}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("");
                  setCategoryFilter("");
                }}
              >
                {t("citizen.resetFilters")}
              </Button>
            </Card>
          ) : (
            // Cards Grid / List
            <div className="space-y-3">
              {filteredGrievances.map((item) => {
                const statusLabel = getStatusLabel(item.status, t);
                const categoryLabel = getCategoryLabel(item.category, t);

                const isResolved = item.status === "RESOLVED";
                const isBreached = item.status === "SLA_BREACHED";

                return (
                  <Card
                    key={item.id}
                    className="p-4 sm:p-5 border-border bg-surface hover:shadow-subtle transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Info */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-brand bg-brand/5 px-2 py-0.5 rounded">
                            {item.trackingToken}
                          </span>
                          <span className="text-content-muted text-xs">•</span>
                          <span className="text-xs font-medium text-content-secondary">
                            {categoryLabel}
                          </span>
                          <span className="text-content-muted text-xs">•</span>
                          <span className="text-xs text-content-muted">
                            {item.wardName || "Pune Ward"}
                          </span>

                          {/* Status Badge */}
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              isResolved
                                ? "bg-status-success/15 text-status-success"
                                : item.status === "IN_PROGRESS"
                                ? "bg-status-warning/15 text-status-warning"
                                : isBreached
                                ? "bg-status-error/15 text-status-error font-bold"
                                : "bg-brand/10 text-brand"
                            }`}
                          >
                            {statusLabel}
                          </span>
                        </div>

                        <h3 className="text-sm sm:text-base font-bold text-content-primary leading-snug">
                          {item.title}
                        </h3>

                        <p className="text-xs text-content-secondary line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-content-muted pt-1">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(item.submittedAt, {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          {item.landmark && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {item.landmark}
                            </span>
                          )}
                          {item.deadlineAt && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              Target: {formatDate(item.deadlineAt)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0">
                        <Link href={`/track/${item.trackingToken}`}>
                          <Button
                            variant="primary"
                            size="sm"
                            rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                            className="text-xs"
                          >
                            {t("citizen.viewFullDossier")}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 2: FOLLOWED GRIEVANCES ---------------- */}
      {activeTab === "followed" && (
        <div className="space-y-4">
          <div className="p-4 rounded-base border border-border bg-surface">
            <h3 className="text-sm font-bold text-content-primary">
              {t("citizen.communityIssuesFollowed")}
            </h3>
            <p className="text-xs text-content-secondary mt-0.5">
              {t("citizen.communityIssuesDesc")}
            </p>
          </div>

          {followed.length === 0 ? (
            <Card className="p-8 text-center border-border bg-surface space-y-3">
              <BookmarkCheck className="w-8 h-8 text-content-muted mx-auto" />
              <h4 className="text-sm font-semibold text-content-primary">
                {t("citizen.noFollowedYet")}
              </h4>
              <p className="text-xs text-content-secondary max-w-sm mx-auto">
                {t("citizen.noFollowedDesc")}
              </p>
              <div className="pt-2">
                <Link href="/community">
                  <Button variant="outline" size="sm" rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
                    {t("citizen.exploreCommunityFeed")}
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {followed.map((item) => (
                <Card
                  key={item.id}
                  className="p-4 sm:p-5 border-border bg-surface hover:shadow-subtle transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-brand">
                        {item.trackingToken}
                      </span>
                      <span className="text-xs text-content-muted">• {item.wardName}</span>
                      <Badge variant="neutral" size="sm">{getStatusLabel(item.status, t)}</Badge>
                    </div>
                    <h4 className="text-sm font-bold text-content-primary">{item.title}</h4>
                    <p className="text-xs text-content-secondary line-clamp-1">{item.description}</p>
                  </div>
                  <div>
                    <Link href={`/track/${item.trackingToken}`}>
                      <Button variant="outline" size="sm" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                        {t("citizen.viewDetails")}
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 3: NOTIFICATIONS ---------------- */}
      {activeTab === "notifications" && (
        <div className="space-y-4">
          <div className="p-4 rounded-base border border-border bg-surface flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-content-primary">
                {t("citizen.civicAlerts")}
              </h3>
              <p className="text-xs text-content-secondary mt-0.5">
                {t("citizen.communityIssuesDesc")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllNotificationsRead}
                  className="text-xs"
                >
                  {t("notifications.markAllRead")}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={loadNotifications}
                leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${notifLoading ? "animate-spin" : ""}`} />}
                className="text-xs"
              >
                {t("citizen.refresh")}
              </Button>
            </div>
          </div>

          {notifications.length === 0 ? (
            <Card className="p-8 text-center border-border bg-surface space-y-3">
              <CheckCircle2 className="w-8 h-8 text-status-success mx-auto opacity-70" />
              <h4 className="text-sm font-semibold text-content-primary">
                {t("citizen.allCaughtUp")}
              </h4>
              <p className="text-xs text-content-secondary">
                {t("citizen.allCaughtUpDesc")}
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {notifications.map((notif) => {
                const dossierUrl = notif.actionUrl || (notif.trackingToken ? `/track/${notif.trackingToken}` : null);
                return (
                  <Card
                    key={notif.id}
                    className={`p-4 border transition-colors flex items-start justify-between gap-3 ${
                      notif.read ? "border-border bg-surface" : "border-brand/30 bg-brand/5"
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className={`p-2 rounded-full shrink-0 ${
                          notif.read ? "bg-surface-muted text-content-muted" : "bg-brand/10 text-brand"
                        }`}
                      >
                        <Bell className="w-4 h-4" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-content-primary">{notif.title}</p>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-status-danger" />
                          )}
                        </div>
                        <p className="text-xs text-content-secondary leading-relaxed">
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-3 pt-1">
                          <span className="text-[10px] text-content-muted">
                            {formatDate(notif.createdAt, {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </span>
                          {dossierUrl && (
                            <Link
                              href={dossierUrl}
                              className="text-[11px] font-semibold text-brand hover:underline inline-flex items-center gap-0.5"
                            >
                              <span>{t("notifications.viewDossier")}</span>
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>

                    {!notif.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkNotificationRead(notif.id)}
                        className="text-xs shrink-0"
                        leftIcon={<Check className="w-3.5 h-3.5" />}
                      >
                        {t("citizen.markRead")}
                      </Button>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 4: WARD & HELPLINES ---------------- */}
      {activeTab === "services" && (
        <div className="space-y-4">
          <div className="p-4 rounded-base border border-border bg-surface">
            <h3 className="text-sm font-bold text-content-primary">
              {t("citizen.pmcDirectory")}
            </h3>
            <p className="text-xs text-content-secondary mt-0.5">
              {t("citizen.pmcDirectoryDesc")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="p-5 border-border bg-surface space-y-2">
              <div className="flex items-center gap-2 text-brand">
                <MapPin className="w-4 h-4" />
                <h4 className="text-sm font-bold text-content-primary">{t("citizen.fifteenWards")}</h4>
              </div>
              <p className="text-xs text-content-secondary">
                Aundh-Baner, Kothrud-Bavdhan, Shivajinagar, Kasba-Vishrambaug, Hadapsar-Mundhwa, and more.
              </p>
              <Link href="/#service-discovery" className="text-xs text-brand font-semibold hover:underline inline-flex items-center gap-1 pt-1">
                <span>View Ward Map &amp; Offices</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </Card>

            <Card className="p-5 border-border bg-surface space-y-2">
              <div className="flex items-center gap-2 text-status-warning">
                <Bell className="w-4 h-4" />
                <h4 className="text-sm font-bold text-content-primary">{t("citizen.tollFreeHelpline")}</h4>
              </div>
              <p className="text-xs text-content-secondary">
                Call PMC Central Grievance Helpline at <strong>1800-1030-222</strong> for emergency civic support.
              </p>
              <span className="text-[11px] text-content-muted">Operational round-the-clock</span>
            </Card>

            <Card className="p-5 border-border bg-surface space-y-2">
              <div className="flex items-center gap-2 text-accent">
                <Search className="w-4 h-4" />
                <h4 className="text-sm font-bold text-content-primary">{t("citizen.civicMapExplorer")}</h4>
              </div>
              <p className="text-xs text-content-secondary">
                Browse interactive geospatial map markers showing complaints across Pune wards.
              </p>
              <Link href="/map" className="text-xs text-brand font-semibold hover:underline inline-flex items-center gap-1 pt-1">
                <span>{t("citizen.openCivicMap")}</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
