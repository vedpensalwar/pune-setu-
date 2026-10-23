"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Users,
  Database,
  BarChart3,
  Building2,
  Lock,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  MessageSquare,
  FileText,
  Download,
  Filter,
  Search,
  RefreshCw,
  ExternalLink,
  Eye,
  EyeOff,
  Layers,
  ChevronRight,
  Shield,
  Star,
  ArrowRight,
  Info,
} from "lucide-react";
import { SafeUser } from "@/lib/auth/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { STATUS_LABELS, CATEGORY_LABELS, PRIORITY_LABELS, getStatusLabel, getCategoryLabel, getPriorityLabel } from "@/lib/civic/display";
import { useLanguage } from "@/components/language/language-provider";

interface AdminCommandCenterProps {
  user: SafeUser;
}

type TabType = "overview" | "grievances" | "departments" | "wards" | "escalations" | "moderation" | "audit" | "exports";

export function AdminCommandCenter({ user }: AdminCommandCenterProps) {
  const { t, formatDate, formatNumber } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Overview / Analytics state
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  // Departments state
  const [departments, setDepartments] = useState<any[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);

  // Wards state
  const [wards, setWards] = useState<any[]>([]);
  const [wardsLoading, setWardsLoading] = useState(false);
  const [wardZoneFilter, setWardZoneFilter] = useState<string>("ALL");

  // Escalations state
  const [escalations, setEscalations] = useState<any[]>([]);
  const [escalationsLoading, setEscalationsLoading] = useState(false);
  const [escalationStatusFilter, setEscalationStatusFilter] = useState<string>("ALL");
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedEscalation, setSelectedEscalation] = useState<any>(null);
  const [reviewRemarks, setReviewRemarks] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Moderation state
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [moderationModalOpen, setModerationModalOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState<any>(null);
  const [moderationAction, setModerationAction] = useState<"HIDE" | "RESTORE">("HIDE");
  const [moderationReason, setModerationReason] = useState("");
  const [submittingModeration, setSubmittingModeration] = useState(false);

  // Audit state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditActionFilter, setAuditActionFilter] = useState<string>("ALL");

  // General feedback
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // Reference datasets for assignment & filtering
  const [deptList, setDeptList] = useState<Array<{ id: string; name: string }>>([]);
  const [wardList, setWardList] = useState<Array<{ id: string; name: string; wardNumber: number }>>([]);

  // Grievances management state
  const [adminGrievances, setAdminGrievances] = useState<any[]>([]);
  const [adminGrievancesLoading, setAdminGrievancesLoading] = useState(false);
  const [adminGrievancesTotal, setAdminGrievancesTotal] = useState(0);
  const [grievanceSearch, setGrievanceSearch] = useState("");
  const [grievanceStatusFilter, setGrievanceStatusFilter] = useState("");
  const [grievanceDeptFilter, setGrievanceDeptFilter] = useState("");
  const [grievanceWardFilter, setGrievanceWardFilter] = useState("");
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedGrievanceForAssign, setSelectedGrievanceForAssign] = useState<any>(null);
  const [targetAssignDeptId, setTargetAssignDeptId] = useState("");
  const [targetAssignWardId, setTargetAssignWardId] = useState("");
  const [assignJustification, setAssignJustification] = useState("");
  const [submittingAssign, setSubmittingAssign] = useState(false);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [inspectedGrievance, setInspectedGrievance] = useState<any>(null);

  // Load Reference Datasets on Mount
  useEffect(() => {
    fetch("/api/departments")
      .then((r) => r.json())
      .then((d) => {
        if (d.departments) setDeptList(d.departments);
      })
      .catch(() => {});

    fetch("/api/wards")
      .then((r) => r.json())
      .then((d) => {
        if (d.wards) setWardList(d.wards);
      })
      .catch(() => {});
  }, []);

  // Fetch Grievances for Admin
  const loadAdminGrievances = useCallback(async () => {
    try {
      setAdminGrievancesLoading(true);
      const params = new URLSearchParams();
      params.set("limit", "50");
      if (grievanceSearch.trim()) params.set("search", grievanceSearch.trim());
      if (grievanceStatusFilter) params.set("status", grievanceStatusFilter);
      if (grievanceDeptFilter) params.set("departmentId", grievanceDeptFilter);
      if (grievanceWardFilter) params.set("wardId", grievanceWardFilter);

      const res = await fetch(`/api/grievances?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load platform grievances");
      const data = await res.json();
      if (data.success) {
        setAdminGrievances(data.grievances || []);
        setAdminGrievancesTotal(data.total || 0);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setAdminGrievancesLoading(false);
    }
  }, [grievanceSearch, grievanceStatusFilter, grievanceDeptFilter, grievanceWardFilter]);

  // 1. Fetch Analytics
  const loadAnalytics = useCallback(async () => {
    try {
      setAnalyticsLoading(true);
      setAnalyticsError(null);
      const res = await fetch("/api/admin/analytics");
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.analytics);
      } else {
        throw new Error(data.error || "Analytics unavailable");
      }
    } catch (err: any) {
      setAnalyticsError(err.message || "Failed to load system analytics.");
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  // 2. Fetch Departments
  const loadDepartments = useCallback(async () => {
    try {
      setDepartmentsLoading(true);
      const res = await fetch("/api/admin/departments");
      if (!res.ok) throw new Error("Failed to load department metrics");
      const data = await res.json();
      if (data.success) {
        setDepartments(data.departments);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setDepartmentsLoading(false);
    }
  }, []);

  // 3. Fetch Wards
  const loadWards = useCallback(async () => {
    try {
      setWardsLoading(true);
      const res = await fetch("/api/admin/wards");
      if (!res.ok) throw new Error("Failed to load ward metrics");
      const data = await res.json();
      if (data.success) {
        setWards(data.wards);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setWardsLoading(false);
    }
  }, []);

  // 4. Fetch Escalations
  const loadEscalations = useCallback(async () => {
    try {
      setEscalationsLoading(true);
      const res = await fetch("/api/admin/escalations");
      if (!res.ok) throw new Error("Failed to load escalations");
      const data = await res.json();
      if (data.success) {
        setEscalations(data.escalations);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setEscalationsLoading(false);
    }
  }, []);

  // 5. Fetch Comments
  const loadComments = useCallback(async () => {
    try {
      setCommentsLoading(true);
      const res = await fetch("/api/admin/moderation");
      if (!res.ok) throw new Error("Failed to load comments");
      const data = await res.json();
      if (data.success) {
        setComments(data.comments);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  // 6. Fetch Audit Logs
  const loadAuditLogs = useCallback(async (actionFilter = "ALL") => {
    try {
      setAuditLoading(true);
      const url = actionFilter !== "ALL"
        ? `/api/admin/audit?action=${encodeURIComponent(actionFilter)}&limit=100`
        : `/api/admin/audit?limit=100`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load audit logs");
      const data = await res.json();
      if (data.success) {
        setAuditLogs(data.logs);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setAuditLoading(false);
    }
  }, []);

  // Trigger loads based on active tab
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (activeTab === "overview") loadAnalytics();
    if (activeTab === "grievances") loadAdminGrievances();
    if (activeTab === "departments") loadDepartments();
    if (activeTab === "wards") loadWards();
    if (activeTab === "escalations") loadEscalations();
    if (activeTab === "moderation") loadComments();
    if (activeTab === "audit") loadAuditLogs(auditActionFilter);
  }, [activeTab, loadAnalytics, loadAdminGrievances, loadDepartments, loadWards, loadEscalations, loadComments, loadAuditLogs, auditActionFilter]);

  // Handle Grievance Assignment Submit
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGrievanceForAssign || !targetAssignDeptId || assignJustification.trim().length < 10) return;

    try {
      setSubmittingAssign(true);
      setActionErrorMsg(null);
      const res = await fetch("/api/officer/reassign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingToken: selectedGrievanceForAssign.trackingToken,
          targetDepartmentId: targetAssignDeptId,
          targetWardId: targetAssignWardId || undefined,
          reason: assignJustification.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Assignment failed");

      setActionSuccessMsg(`Grievance ${selectedGrievanceForAssign.trackingToken} assigned successfully.`);
      setAssignModalOpen(false);
      setSelectedGrievanceForAssign(null);
      setAssignJustification("");
      loadAdminGrievances();
      loadAnalytics();
    } catch (err: any) {
      setActionErrorMsg(err.message || "Failed to assign grievance.");
    } finally {
      setSubmittingAssign(false);
    }
  };

  // Handle Escalation Review Submit
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEscalation || !reviewRemarks.trim()) return;

    try {
      setSubmittingReview(true);
      setActionErrorMsg(null);
      const res = await fetch("/api/admin/escalations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          escalationId: selectedEscalation.id,
          remarks: reviewRemarks.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Review submission failed");

      setActionSuccessMsg(`Escalation #${selectedEscalation.id} reviewed successfully.`);
      setReviewModalOpen(false);
      setSelectedEscalation(null);
      setReviewRemarks("");
      loadEscalations();
    } catch (err: any) {
      setActionErrorMsg(err.message || "Failed to submit escalation review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Handle Moderation Submit
  const handleModerationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComment || !moderationReason.trim()) return;

    try {
      setSubmittingModeration(true);
      setActionErrorMsg(null);
      const res = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commentId: selectedComment.id,
          action: moderationAction,
          reason: moderationReason.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Moderation action failed");

      setActionSuccessMsg(`Comment ${moderationAction === "HIDE" ? "hidden" : "restored"} successfully.`);
      setModerationModalOpen(false);
      setSelectedComment(null);
      setModerationReason("");
      loadComments();
    } catch (err: any) {
      setActionErrorMsg(err.message || "Failed to moderate comment.");
    } finally {
      setSubmittingModeration(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Command Center Header */}
      <div className="rounded-base border border-border bg-surface p-6 sm:p-8 shadow-subtle">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="accent" size="sm">
                {t("admin.commandCenterBadge")}
              </Badge>
              <span className="text-xs text-content-muted">• Identity: {user.name}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-content-primary">
              {t("admin.grievanceOversight")}
            </h1>
            <p className="text-xs sm:text-sm text-content-secondary mt-1">
              {t("admin.grievanceOversightDesc")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="success" size="sm">
              {t("admin.systemAdminRole")}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (activeTab === "overview") loadAnalytics();
                if (activeTab === "grievances") loadAdminGrievances();
                if (activeTab === "departments") loadDepartments();
                if (activeTab === "wards") loadWards();
                if (activeTab === "escalations") loadEscalations();
                if (activeTab === "moderation") loadComments();
                if (activeTab === "audit") loadAuditLogs(auditActionFilter);
              }}
              className="gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {t("citizen.refresh")}
            </Button>
          </div>
        </div>

        {/* Action feedback */}
        {actionSuccessMsg && (
          <div className="mt-4 p-3 rounded-base bg-status-success/10 border border-status-success/30 text-xs text-status-success font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{actionSuccessMsg}</span>
            </div>
            <button onClick={() => setActionSuccessMsg(null)} className="underline hover:opacity-80">
              Dismiss
            </button>
          </div>
        )}

        {actionErrorMsg && (
          <div className="mt-4 p-3 rounded-base bg-status-error/10 border border-status-error/30 text-xs text-status-error font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{actionErrorMsg}</span>
            </div>
            <button onClick={() => setActionErrorMsg(null)} className="underline hover:opacity-80">
              Dismiss
            </button>
          </div>
        )}

        {/* Tab Strip */}
        <div className="flex items-center gap-1 overflow-x-auto border-b border-border mt-6 pt-2 scrollbar-none">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "overview"
                ? "border-accent text-accent"
                : "border-transparent text-content-secondary hover:text-content-primary"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            {t("admin.overviewAnalytics")}
          </button>
          <button
            onClick={() => setActiveTab("grievances")}
            className={`px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "grievances"
                ? "border-accent text-accent"
                : "border-transparent text-content-secondary hover:text-content-primary"
            }`}
          >
            <FileText className="w-4 h-4" />
            {t("admin.allGrievancesAssignment")}
          </button>
          <button
            onClick={() => setActiveTab("departments")}
            className={`px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "departments"
                ? "border-accent text-accent"
                : "border-transparent text-content-secondary hover:text-content-primary"
            }`}
          >
            <Building2 className="w-4 h-4" />
            {t("admin.deptBenchmarks")}
          </button>
          <button
            onClick={() => setActiveTab("wards")}
            className={`px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "wards"
                ? "border-accent text-accent"
                : "border-transparent text-content-secondary hover:text-content-primary"
            }`}
          >
            <MapPin className="w-4 h-4" />
            {t("admin.wardWorkloads")}
          </button>
          <button
            onClick={() => setActiveTab("escalations")}
            className={`px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "escalations"
                ? "border-accent text-accent"
                : "border-transparent text-content-secondary hover:text-content-primary"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            {t("admin.escalationDesk")}
          </button>
          <button
            onClick={() => setActiveTab("moderation")}
            className={`px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "moderation"
                ? "border-accent text-accent"
                : "border-transparent text-content-secondary hover:text-content-primary"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            {t("admin.communityModeration")}
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "audit"
                ? "border-accent text-accent"
                : "border-transparent text-content-secondary hover:text-content-primary"
            }`}
          >
            <Shield className="w-4 h-4" />
            {t("admin.auditTrail")}
          </button>
          <button
            onClick={() => setActiveTab("exports")}
            className={`px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "exports"
                ? "border-accent text-accent"
                : "border-transparent text-content-secondary hover:text-content-primary"
            }`}
          >
            <Download className="w-4 h-4" />
            {t("admin.dataExports")}
          </button>
        </div>
      </div>

      {/* 2. Tab Content Areas */}

      {/* TAB 1: OVERVIEW & ANALYTICS */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {analyticsLoading && !analytics ? (
            <Card className="p-8 text-center border-border bg-surface">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-accent mb-2" />
              <p className="text-xs text-content-secondary">Aggregating live grievance records...</p>
            </Card>
          ) : analyticsError ? (
            <Card className="p-6 border-status-error/30 bg-status-error/10 text-status-error">
              <p className="text-sm font-semibold">{analyticsError}</p>
            </Card>
          ) : analytics ? (
            <>
              {/* Primary Metric Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-5 border-border bg-surface">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-content-muted font-medium">{t("admin.totalComplaints")}</span>
                    <FileText className="w-4 h-4 text-brand" />
                  </div>
                  <div className="text-2xl font-bold text-content-primary">{formatNumber(analytics.totalGrievances)}</div>
                  <div className="text-[11px] text-content-secondary mt-1">{t("admin.totalCivicFilings")}</div>
                </Card>

                <Card className="p-5 border-border bg-surface">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-content-muted font-medium">{t("admin.activeRemediation")}</span>
                    <Clock className="w-4 h-4 text-brand" />
                  </div>
                  <div className="text-2xl font-bold text-brand">
                    {formatNumber(analytics.pendingReview + analytics.inProgress)}
                  </div>
                  <div className="text-[11px] text-content-secondary mt-1">
                    {formatNumber(analytics.pendingReview)} Pending • {formatNumber(analytics.inProgress)} In-Progress
                  </div>
                </Card>

                <Card className="p-5 border-border bg-surface">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-content-muted font-medium">{t("admin.resolvedCases")}</span>
                    <CheckCircle2 className="w-4 h-4 text-status-success" />
                  </div>
                  <div className="text-2xl font-bold text-status-success">{formatNumber(analytics.resolved)}</div>
                  <div className="text-[11px] text-content-secondary mt-1">
                    SLA Compliance: <span className="font-semibold text-content-primary">{formatNumber(analytics.slaComplianceRate)}%</span>
                  </div>
                </Card>

                <Card className="p-5 border-border bg-surface">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-content-muted font-medium">{t("admin.overdueBreaches")}</span>
                    <AlertTriangle className="w-4 h-4 text-status-error" />
                  </div>
                  <div className="text-2xl font-bold text-status-error">{formatNumber(analytics.overdue)}</div>
                  <div className="text-[11px] text-content-secondary mt-1">
                    Breach Rate: <span className="font-semibold text-status-error">{formatNumber(analytics.slaBreachRate)}%</span>
                  </div>
                </Card>
              </div>

              {/* Secondary Speed & Citizen Feedback Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="p-5 border-border bg-surface flex items-center gap-4">
                  <div className="p-3 rounded-base bg-brand/10 text-brand shrink-0">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-content-muted">{t("admin.avgResolutionVelocity")}</span>
                    <div className="text-xl font-bold text-content-primary mt-0.5">
                      {formatNumber(analytics.avgResolutionHours)} hours
                    </div>
                    <p className="text-[11px] text-content-secondary mt-0.5">
                      Derived from {formatNumber(analytics.resolved)} officially closed cases with before/after evidence
                    </p>
                  </div>
                </Card>

                <Card className="p-5 border-border bg-surface flex items-center gap-4">
                  <div className="p-3 rounded-base bg-accent/10 text-accent shrink-0">
                    <Star className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-content-muted">{t("admin.citizenSatisfaction")}</span>
                    <div className="text-xl font-bold text-content-primary mt-0.5 flex items-center gap-1.5">
                      <span>{analytics.citizenSatisfactionScore > 0 ? formatNumber(analytics.citizenSatisfactionScore) : "N/A"}</span>
                      {analytics.citizenSatisfactionScore > 0 && <span className="text-xs text-content-muted">/ 5.0</span>}
                    </div>
                    <p className="text-[11px] text-content-secondary mt-0.5">
                      {formatNumber(analytics.satisfactionFeedbackCount)} verified citizen feedback ratings submitted
                    </p>
                  </div>
                </Card>
              </div>

              {/* Workload Breakdowns (Real Database-derived Distributions) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Status Breakdown */}
                <Card className="p-5 border-border bg-surface">
                  <h3 className="text-sm font-bold text-content-primary mb-3">{t("admin.statusBreakdown")}</h3>
                  <div className="space-y-3">
                    {Object.entries(analytics.statusDistribution).map(([status, count]: [string, any]) => {
                      const total = analytics.totalGrievances || 1;
                      const pct = Math.round((count / total) * 100);
                      return (
                        <div key={status} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-content-secondary font-medium">
                              {getStatusLabel(status, t)}
                            </span>
                            <span className="font-semibold text-content-primary">
                              {formatNumber(count)} <span className="text-content-muted font-normal">({pct}%)</span>
                            </span>
                          </div>
                          <div className="w-full bg-surface-muted h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                status === "RESOLVED"
                                  ? "bg-status-success"
                                  : status === "REJECTED"
                                  ? "bg-status-error"
                                  : status === "IN_PROGRESS"
                                  ? "bg-brand"
                                  : "bg-accent"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* 2. Category Distribution */}
                <Card className="p-5 border-border bg-surface">
                  <h3 className="text-sm font-bold text-content-primary mb-3">{t("admin.topCivicCategories")}</h3>
                  <div className="space-y-3">
                    {Object.entries(analytics.categoryDistribution).map(([cat, count]: [string, any]) => {
                      const total = analytics.totalGrievances || 1;
                      const pct = Math.round((count / total) * 100);
                      return (
                        <div key={cat} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-content-secondary truncate max-w-[180px]">
                              {getCategoryLabel(cat, t)}
                            </span>
                            <span className="font-semibold text-content-primary shrink-0">
                              {formatNumber(count)} <span className="text-content-muted font-normal">({pct}%)</span>
                            </span>
                          </div>
                          <div className="w-full bg-surface-muted h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-brand" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* 3. Priority Distribution */}
                <Card className="p-5 border-border bg-surface">
                  <h3 className="text-sm font-bold text-content-primary mb-3">{t("admin.priorityDistribution")}</h3>
                  <div className="space-y-3">
                    {Object.entries(analytics.priorityDistribution).map(([prio, count]: [string, any]) => {
                      const total = analytics.totalGrievances || 1;
                      const pct = Math.round((count / total) * 100);
                      return (
                        <div key={prio} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-content-secondary font-medium">
                              {getPriorityLabel(prio, t)}
                            </span>
                            <span className="font-semibold text-content-primary">
                              {formatNumber(count)} <span className="text-content-muted font-normal">({pct}%)</span>
                            </span>
                          </div>
                          <div className="w-full bg-surface-muted h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                prio === "CRITICAL"
                                  ? "bg-status-error"
                                  : prio === "HIGH"
                                  ? "bg-accent"
                                  : prio === "MEDIUM"
                                  ? "bg-brand"
                                  : "bg-content-muted"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>

              {/* Directive Notice */}
              <div className="p-4 rounded-base bg-surface-muted border border-border text-xs text-content-secondary flex items-start gap-3">
                <Info className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                <p>
                  <strong className="text-content-primary">Verified Database Aggregate:</strong> All statistics above are computed on demand from persisted JSON repository records in PuneSetu. No simulated numbers, mock percentages, or hardcoded benchmarks are rendered.
                </p>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* TAB 1.5: ALL GRIEVANCES & ASSIGNMENT */}
      {activeTab === "grievances" && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="p-4 rounded-base border border-border bg-surface flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
              <input
                type="text"
                placeholder="Search by token, title, description, or landmark..."
                value={grievanceSearch}
                onChange={(e) => setGrievanceSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-base border border-border bg-background text-content-primary focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={grievanceDeptFilter}
                onChange={(e) => setGrievanceDeptFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-base border border-border bg-background text-content-primary focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="">All Departments</option>
                {deptList.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>

              <select
                value={grievanceWardFilter}
                onChange={(e) => setGrievanceWardFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-base border border-border bg-background text-content-primary focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="">All 15 Wards</option>
                {wardList.map((w) => (
                  <option key={w.id} value={w.id}>{w.wardNumber}. {w.name}</option>
                ))}
              </select>

              <select
                value={grievanceStatusFilter}
                onChange={(e) => setGrievanceStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-base border border-border bg-background text-content-primary focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="">All Statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="REJECTED">Rejected</option>
                <option value="ESCALATED">Escalated</option>
                <option value="SLA_BREACHED">SLA Breached</option>
              </select>

              {(grievanceSearch || grievanceStatusFilter || grievanceDeptFilter || grievanceWardFilter) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setGrievanceSearch("");
                    setGrievanceStatusFilter("");
                    setGrievanceDeptFilter("");
                    setGrievanceWardFilter("");
                  }}
                  className="text-xs"
                >
                  Clear
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={loadAdminGrievances}
                leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${adminGrievancesLoading ? "animate-spin" : ""}`} />}
                className="text-xs"
              >
                Refresh
              </Button>
            </div>
          </div>

          {/* Grievance Table / Cards */}
          {adminGrievancesLoading ? (
            <Card className="p-8 text-center border-border bg-surface">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand mb-2" />
              <p className="text-xs text-content-secondary">Loading platform grievances...</p>
            </Card>
          ) : adminGrievances.length === 0 ? (
            <Card className="p-8 text-center border-border bg-surface">
              <FileText className="w-8 h-8 text-content-muted mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-content-primary">No grievances match criteria</h4>
              <p className="text-xs text-content-secondary mt-1">Try adjusting search filters or clear selections.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-content-muted px-1">
                <span>Showing {adminGrievances.length} of {adminGrievancesTotal} platform complaints</span>
              </div>
              <div className="divide-y divide-border rounded-base border border-border bg-surface overflow-hidden">
                {adminGrievances.map((g) => {
                  return (
                    <div
                      key={g.id}
                      className="p-4 hover:bg-surface-muted/30 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-brand bg-brand/5 px-2 py-0.5 rounded">
                            {g.trackingToken}
                          </span>
                          <span className="text-xs text-content-muted">•</span>
                          <Badge variant="neutral" size="sm">
                            {CATEGORY_LABELS[g.category as keyof typeof CATEGORY_LABELS] || g.category}
                          </Badge>
                          <Badge variant={g.status === "RESOLVED" ? "success" : g.status === "SLA_BREACHED" ? "error" : "neutral"} size="sm">
                            {STATUS_LABELS[g.status as keyof typeof STATUS_LABELS] || g.status}
                          </Badge>
                          <span className="text-xs text-content-muted">•</span>
                          <span className="text-xs text-content-secondary font-medium">
                            {g.departmentName || "Unassigned Department"}
                          </span>
                          <span className="text-xs text-content-muted">•</span>
                          <span className="text-xs text-content-muted">
                            {g.wardName || "Ward"}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-content-primary">
                          {g.title}
                        </h3>

                        <p className="text-xs text-content-secondary line-clamp-1">
                          {g.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-content-muted">
                          <span>Filed: {new Date(g.submittedAt).toLocaleDateString()}</span>
                          {g.deadlineAt && (
                            <span>SLA Target: {new Date(g.deadlineAt).toLocaleDateString()}</span>
                          )}
                          {g.citizenName && (
                            <span>Citizen: {g.citizenName}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedGrievanceForAssign(g);
                            setTargetAssignDeptId(g.departmentId || "");
                            setTargetAssignWardId(g.wardId || "");
                            setAssignJustification("");
                            setAssignModalOpen(true);
                          }}
                          className="text-xs"
                        >
                          Assign / Reassign
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setInspectedGrievance(g);
                            setInspectModalOpen(true);
                          }}
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                          className="text-xs"
                        >
                          Inspect
                        </Button>

                        <Link href={`/track/${g.trackingToken}`} target="_blank">
                          <Button
                            variant="primary"
                            size="sm"
                            rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                            className="text-xs"
                          >
                            Dossier
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DEPARTMENT BENCHMARKS */}
      {activeTab === "departments" && (
        <Card className="border-border bg-surface overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-content-primary">
                Municipal Department Performance Benchmarks
              </h2>
              <p className="text-xs text-content-secondary mt-0.5">
                Evaluation across all 8 Pune Municipal Corporation administrative engineering departments
              </p>
            </div>
            <Badge variant="neutral" size="sm">
              8 Departments Configured
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-muted/60 text-content-secondary uppercase tracking-wider text-[10px] font-semibold border-b border-border">
                <tr>
                  <th className="px-4 py-3">Department Name &amp; Code</th>
                  <th className="px-4 py-3">Assigned</th>
                  <th className="px-4 py-3">In Progress</th>
                  <th className="px-4 py-3">Resolved</th>
                  <th className="px-4 py-3">Overdue</th>
                  <th className="px-4 py-3">Avg Resolution</th>
                  <th className="px-4 py-3">SLA Compliance</th>
                  <th className="px-4 py-3">Citizen Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {departmentsLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-content-muted">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-accent" />
                      Loading departmental records...
                    </td>
                  </tr>
                ) : departments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-content-muted">
                      No department data available.
                    </td>
                  </tr>
                ) : (
                  departments.map((dept) => (
                    <tr key={dept.departmentId} className="hover:bg-surface-hover/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-content-primary">{dept.departmentName}</div>
                        <div className="text-[11px] text-content-muted font-mono">{dept.departmentCode}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-content-primary">
                        {dept.assignedGrievances}
                      </td>
                      <td className="px-4 py-3 text-brand font-medium">
                        {dept.inProgressCases}
                      </td>
                      <td className="px-4 py-3 text-status-success font-medium">
                        {dept.resolvedCases}
                      </td>
                      <td className="px-4 py-3">
                        {dept.overdueCases > 0 ? (
                          <Badge variant="error" size="sm">
                            {dept.overdueCases} Overdue
                          </Badge>
                        ) : (
                          <span className="text-content-muted">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-content-secondary">
                        {dept.resolvedCases > 0 ? `${dept.avgResolutionHours} hrs` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${dept.slaCompliancePct >= 80 ? "text-status-success" : dept.slaCompliancePct > 0 ? "text-accent" : "text-content-muted"}`}>
                          {dept.slaCompliancePct}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {dept.satisfactionRating > 0 ? (
                          <div className="flex items-center gap-1 text-accent font-semibold">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span>{dept.satisfactionRating}</span>
                          </div>
                        ) : (
                          <span className="text-content-muted italic">No ratings</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: WARD WORKLOADS */}
      {activeTab === "wards" && (
        <Card className="border-border bg-surface overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-content-primary">
                Prabhag Ward Workload Analytics
              </h2>
              <p className="text-xs text-content-secondary mt-0.5">
                Civic workload and resolution performance across Pune&apos;s 15 administrative prabhags
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-content-muted">Zone:</span>
              <select
                value={wardZoneFilter}
                onChange={(e) => setWardZoneFilter(e.target.value)}
                className="h-8 rounded-base border border-border bg-surface px-2.5 text-xs text-content-primary focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="ALL">All Zones (15 Wards)</option>
                <option value="Central">Central Zone</option>
                <option value="East">East Zone</option>
                <option value="West">West Zone</option>
                <option value="North">North Zone</option>
                <option value="South">South Zone</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-muted/60 text-content-secondary uppercase tracking-wider text-[10px] font-semibold border-b border-border">
                <tr>
                  <th className="px-4 py-3">Ward Number &amp; Name</th>
                  <th className="px-4 py-3">Zone</th>
                  <th className="px-4 py-3">Total Complaints</th>
                  <th className="px-4 py-3">Active (Pending / Work)</th>
                  <th className="px-4 py-3">Resolved</th>
                  <th className="px-4 py-3">Resolution Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {wardsLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-content-muted">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-accent" />
                      Loading Prabhag ward metrics...
                    </td>
                  </tr>
                ) : (
                  wards
                    .filter((w) => wardZoneFilter === "ALL" || w.zone === wardZoneFilter)
                    .map((ward) => (
                      <tr key={ward.wardId} className="hover:bg-surface-hover/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-content-primary">
                            Ward {ward.wardNumber}: {ward.wardName}
                          </div>
                          <div className="text-[11px] text-content-muted">{ward.wardNameMarathi}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="neutral" size="sm">
                            {ward.zone} Zone
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-semibold text-content-primary">
                          {ward.totalGrievances}
                        </td>
                        <td className="px-4 py-3 text-brand font-medium">
                          {ward.activeCases}
                        </td>
                        <td className="px-4 py-3 text-status-success font-medium">
                          {ward.resolvedCases}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-semibold ${ward.resolutionRatePct >= 50 ? "text-status-success" : ward.totalGrievances === 0 ? "text-content-muted" : "text-accent"}`}>
                            {ward.resolutionRatePct}%
                          </span>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 4: ESCALATION DESK */}
      {activeTab === "escalations" && (
        <Card className="border-border bg-surface overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-content-primary">
                SLA Breach &amp; Escalation Management
              </h2>
              <p className="text-xs text-content-secondary mt-0.5">
                Formal grievance breaches, 48h deadline defaults, and citizen procedural appeals
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-content-muted">Filter:</span>
              <select
                value={escalationStatusFilter}
                onChange={(e) => setEscalationStatusFilter(e.target.value)}
                className="h-8 rounded-base border border-border bg-surface px-2.5 text-xs text-content-primary focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="ALL">All Escalations</option>
                <option value="TRIGGERED">Awaiting Review (Triggered)</option>
                <option value="REVIEWED">Reviewed by Admin</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-border">
            {escalationsLoading ? (
              <div className="p-8 text-center text-content-muted">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-accent" />
                Loading escalation registry...
              </div>
            ) : escalations.length === 0 ? (
              <div className="p-8 text-center text-content-muted">
                <CheckCircle2 className="w-8 h-8 mx-auto text-status-success mb-2" />
                <p className="text-xs font-medium text-content-primary">No active escalations recorded.</p>
                <p className="text-[11px] text-content-muted mt-0.5">All complaints are within target SLA parameters.</p>
              </div>
            ) : (
              escalations
                .filter((esc) => escalationStatusFilter === "ALL" || esc.status === escalationStatusFilter)
                .map((esc) => (
                  <div key={esc.id} className="p-4 sm:p-5 hover:bg-surface-hover/50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={esc.status === "TRIGGERED" ? "error" : "neutral"} size="sm">
                          {esc.status}
                        </Badge>
                        <span className="text-xs font-mono font-semibold text-brand">
                          Case #{esc.grievanceId}
                        </span>
                        <span className="text-xs text-content-muted">
                          • Triggered: {new Date(esc.triggeredAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div>
                        {esc.status === "TRIGGERED" ? (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              setSelectedEscalation(esc);
                              setReviewRemarks("");
                              setReviewModalOpen(true);
                            }}
                            className="text-xs h-7 px-3"
                          >
                            Record Admin Review
                          </Button>
                        ) : (
                          <span className="text-[11px] text-status-success font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Reviewed by {esc.reviewedByName || "Admin"}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-content-primary font-medium">{esc.reason}</p>

                    {esc.reviewRemarks && (
                      <div className="mt-2.5 p-3 rounded-base bg-surface-muted border border-border text-xs text-content-secondary">
                        <strong className="text-content-primary">Administrative Remarks:</strong> {esc.reviewRemarks}
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>
        </Card>
      )}

      {/* TAB 5: COMMUNITY CONTENT MODERATION */}
      {activeTab === "moderation" && (
        <Card className="border-border bg-surface overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-content-primary">
                Community Feedback Moderation
              </h2>
              <p className="text-xs text-content-secondary mt-0.5">
                Review and moderate citizen comments on public civic grievances
              </p>
            </div>
            <Badge variant="neutral" size="sm">
              Live Feed Moderation
            </Badge>
          </div>

          <div className="divide-y divide-border">
            {commentsLoading ? (
              <div className="p-8 text-center text-content-muted">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-accent" />
                Loading comments for moderation...
              </div>
            ) : comments.length === 0 ? (
              <div className="p-8 text-center text-content-muted">
                No community comments submitted yet.
              </div>
            ) : (
              comments.map((comm) => (
                <div key={comm.id} className="p-4 sm:p-5 hover:bg-surface-hover/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-content-primary">{comm.authorName}</span>
                        <span className="text-[11px] text-content-muted font-mono">• Case #{comm.grievanceId}</span>
                        <span className="text-[11px] text-content-muted">
                          • {new Date(comm.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {comm.isModerated ? (
                          <Badge variant="error" size="sm">Hidden</Badge>
                        ) : (
                          <Badge variant="success" size="sm">Live</Badge>
                        )}
                      </div>
                      <p className="text-xs text-content-secondary italic mt-1">&ldquo;{comm.content}&rdquo;</p>
                      {comm.isModerated && comm.moderationReason && (
                        <p className="text-[11px] text-status-error mt-1 font-medium">
                          Moderation Reason: {comm.moderationReason}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0">
                      {comm.isModerated ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedComment(comm);
                            setModerationAction("RESTORE");
                            setModerationReason("");
                            setModerationModalOpen(true);
                          }}
                          className="text-xs h-7 px-2.5 gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-status-success" />
                          Restore
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedComment(comm);
                            setModerationAction("HIDE");
                            setModerationReason("");
                            setModerationModalOpen(true);
                          }}
                          className="text-xs h-7 px-2.5 gap-1 text-status-error hover:bg-status-error/10"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                          Hide from Public
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* TAB 6: AUDIT TRAIL */}
      {activeTab === "audit" && (
        <Card className="border-border bg-surface overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-content-primary">
                System Security &amp; Operational Audit Trail
              </h2>
              <p className="text-xs text-content-secondary mt-0.5">
                Authoritative record of officer actions, reassignments, resolutions, and admin operations
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-content-muted">Action:</span>
              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="h-8 rounded-base border border-border bg-surface px-2.5 text-xs text-content-primary focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="ALL">All Actions</option>
                <option value="GRIEVANCE_REASSIGNED">Grievance Reassigned</option>
                <option value="GRIEVANCE_STATUS_CHANGED">Status Changed</option>
                <option value="GRIEVANCE_RESOLVED">Grievance Resolved</option>
                <option value="GRIEVANCE_REJECTED">Grievance Rejected</option>
                <option value="COMMENT_MODERATED">Comment Moderated</option>
                <option value="ADMIN_EXPORT_GENERATED">Export Generated</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-muted/60 text-content-secondary uppercase tracking-wider text-[10px] font-semibold border-b border-border">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Details / Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {auditLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-content-muted">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-accent" />
                      Loading audit entries...
                    </td>
                  </tr>
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-content-muted">
                      No matching audit records found.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-surface-hover/50 transition-colors">
                      <td className="px-4 py-3 text-content-muted whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-content-primary">{log.actorName || log.actorId}</div>
                        <div className="text-[10px] text-content-muted">{log.actorRole}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            log.action.includes("RESOLVED")
                              ? "success"
                              : log.action.includes("REJECTED")
                              ? "error"
                              : log.action.includes("REASSIGNED")
                              ? "accent"
                              : "neutral"
                          }
                          size="sm"
                        >
                          {log.action}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-content-secondary font-mono text-[11px]">
                        {log.targetType}: {log.targetId}
                      </td>
                      <td className="px-4 py-3 text-content-secondary">
                        {log.details ? (
                          <span className="truncate block max-w-xs">
                            {typeof log.details === "string" ? log.details : JSON.stringify(log.details)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 7: DATA EXPORTS (CSV) */}
      {activeTab === "exports" && (
        <div className="space-y-6">
          <Card className="p-6 border-border bg-surface">
            <h2 className="text-base font-bold text-content-primary mb-1">
              Authorized Municipal Data Exports
            </h2>
            <p className="text-xs text-content-secondary mb-6 leading-relaxed">
              Export authorized operational snapshots into RFC 4180 compliant CSV format.
              All export endpoints enforce strict OWASP Formula Injection defenses (special formula triggers like <code>=</code>, <code>+</code>, <code>-</code>, <code>@</code> are safely prefixed).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Export 1: Grievances */}
              <div className="p-4 rounded-base border border-border bg-surface-muted flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-brand">
                    <FileText className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Master Dataset</span>
                  </div>
                  <h3 className="text-sm font-bold text-content-primary">Grievances Register</h3>
                  <p className="text-xs text-content-secondary mt-1">
                    Complete listing of civic grievances with tracking tokens, category, status, priority, ward, and resolution timestamps.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border">
                  <a
                    href="/api/admin/export?type=grievances"
                    download
                    className="inline-flex items-center justify-center gap-1.5 w-full h-8 px-3 rounded-base bg-brand hover:bg-brand-hover text-white text-xs font-medium transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download CSV
                  </a>
                </div>
              </div>

              {/* Export 2: Departments */}
              <div className="p-4 rounded-base border border-border bg-surface-muted flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-accent">
                    <Building2 className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Departmental</span>
                  </div>
                  <h3 className="text-sm font-bold text-content-primary">Department Performance</h3>
                  <p className="text-xs text-content-secondary mt-1">
                    Workload, overdue counts, SLA compliance percentage, and citizen satisfaction ratings across 8 engineering departments.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border">
                  <a
                    href="/api/admin/export?type=departments"
                    download
                    className="inline-flex items-center justify-center gap-1.5 w-full h-8 px-3 rounded-base bg-brand hover:bg-brand-hover text-white text-xs font-medium transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download CSV
                  </a>
                </div>
              </div>

              {/* Export 3: Wards */}
              <div className="p-4 rounded-base border border-border bg-surface-muted flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-brand">
                    <MapPin className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Geographic</span>
                  </div>
                  <h3 className="text-sm font-bold text-content-primary">Ward Workload Summary</h3>
                  <p className="text-xs text-content-secondary mt-1">
                    Prabhag-level distribution of complaints, active versus resolved ratios across all 15 administrative wards.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border">
                  <a
                    href="/api/admin/export?type=wards"
                    download
                    className="inline-flex items-center justify-center gap-1.5 w-full h-8 px-3 rounded-base bg-brand hover:bg-brand-hover text-white text-xs font-medium transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download CSV
                  </a>
                </div>
              </div>

              {/* Export 4: Escalations */}
              <div className="p-4 rounded-base border border-border bg-surface-muted flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-status-error">
                    <ShieldAlert className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Compliance</span>
                  </div>
                  <h3 className="text-sm font-bold text-content-primary">Escalations &amp; SLA Breaches</h3>
                  <p className="text-xs text-content-secondary mt-1">
                    Historical record of SLA breaches, 48-hour default triggers, and administrative review remarks.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border">
                  <a
                    href="/api/admin/export?type=escalations"
                    download
                    className="inline-flex items-center justify-center gap-1.5 w-full h-8 px-3 rounded-base bg-brand hover:bg-brand-hover text-white text-xs font-medium transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download CSV
                  </a>
                </div>
              </div>

              {/* Export 5: Audit Trail */}
              <div className="p-4 rounded-base border border-border bg-surface-muted flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-brand">
                    <Shield className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Governance</span>
                  </div>
                  <h3 className="text-sm font-bold text-content-primary">System Audit Log</h3>
                  <p className="text-xs text-content-secondary mt-1">
                    Forensic log of officer reassignments, resolution verifications, comment moderations, and data exports.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border">
                  <a
                    href="/api/admin/export?type=audit"
                    download
                    className="inline-flex items-center justify-center gap-1.5 w-full h-8 px-3 rounded-base bg-brand hover:bg-brand-hover text-white text-xs font-medium transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download CSV
                  </a>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Review Escalation Modal */}
      <Dialog
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title={`Review Escalation — Case #${selectedEscalation?.grievanceId}`}
        description="Enter formal administrative review remarks or direct remedial actions."
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <div className="p-3 rounded-base bg-surface-muted border border-border text-xs text-content-secondary space-y-1">
            <p><strong>Breach Reason:</strong> {selectedEscalation?.reason}</p>
            <p><strong>Triggered At:</strong> {selectedEscalation?.triggeredAt}</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-content-primary mb-1">
              Administrative Review Remarks * (min 5 chars)
            </label>
            <textarea
              value={reviewRemarks}
              onChange={(e) => setReviewRemarks(e.target.value)}
              required
              rows={3}
              placeholder="e.g. Case reviewed with Ward Executive Engineer. Emergency road repair crew dispatched."
              className="w-full rounded-base border border-border bg-surface p-2.5 text-xs text-content-primary focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReviewModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={submittingReview || reviewRemarks.trim().length < 5}
            >
              {submittingReview ? "Recording..." : "Submit Review"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Moderate Comment Modal */}
      <Dialog
        isOpen={moderationModalOpen}
        onClose={() => setModerationModalOpen(false)}
        title={`${moderationAction === "HIDE" ? "Hide Comment from Public" : "Restore Comment to Public"}`}
        description={`Citizen comment by ${selectedComment?.authorName}`}
      >
        <form onSubmit={handleModerationSubmit} className="space-y-4">
          <div className="p-3 rounded-base bg-surface-muted border border-border text-xs text-content-secondary">
            &ldquo;{selectedComment?.content}&rdquo;
          </div>

          <div>
            <label className="block text-xs font-medium text-content-primary mb-1">
              Moderation Reason * (min 5 chars)
            </label>
            <textarea
              value={moderationReason}
              onChange={(e) => setModerationReason(e.target.value)}
              required
              rows={3}
              placeholder={
                moderationAction === "HIDE"
                  ? "e.g. Contains offensive language or personal identifying details."
                  : "e.g. Reviewed and verified acceptable for community feed."
              }
              className="w-full rounded-base border border-border bg-surface p-2.5 text-xs text-content-primary focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModerationModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={moderationAction === "HIDE" ? "destructive" : "primary"}
              size="sm"
              disabled={submittingModeration || moderationReason.trim().length < 5}
            >
              {submittingModeration
                ? "Processing..."
                : moderationAction === "HIDE"
                ? "Hide Comment"
                : "Restore Comment"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Assign / Reassign Grievance Modal */}
      <Dialog
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={`Administrative Assignment: ${selectedGrievanceForAssign?.trackingToken}`}
        description="Route or reassign grievance to authorized engineering department and Prabhag ward."
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4 text-left">
          <div className="p-3 rounded-base bg-surface-muted border border-border text-xs text-content-secondary space-y-1">
            <p><strong>Title:</strong> {selectedGrievanceForAssign?.title}</p>
            <p><strong>Current Department:</strong> {selectedGrievanceForAssign?.departmentName || "Unassigned"}</p>
            <p><strong>Current Ward:</strong> {selectedGrievanceForAssign?.wardName || "Unassigned"}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Target Engineering Department *
            </label>
            <select
              value={targetAssignDeptId}
              onChange={(e) => setTargetAssignDeptId(e.target.value)}
              required
              className="w-full h-10 px-3 rounded-base border border-border bg-background text-xs text-content-primary focus:outline-none focus:border-brand"
            >
              <option value="">Select Target Department</option>
              {deptList.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Target Prabhag Ward (Optional)
            </label>
            <select
              value={targetAssignWardId}
              onChange={(e) => setTargetAssignWardId(e.target.value)}
              className="w-full h-10 px-3 rounded-base border border-border bg-background text-xs text-content-primary focus:outline-none focus:border-brand"
            >
              <option value="">Keep Existing Ward</option>
              {wardList.map((w) => (
                <option key={w.id} value={w.id}>{w.wardNumber}. {w.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Administrative Justification * (min 10 chars)
            </label>
            <textarea
              rows={3}
              value={assignJustification}
              onChange={(e) => setAssignJustification(e.target.value)}
              placeholder="State formal administrative directive or jurisdictional reason for assignment…"
              className="w-full p-2.5 rounded-base border border-border bg-background text-xs text-content-primary placeholder:text-content-muted focus:outline-none focus:border-brand"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAssignModalOpen(false)}
              disabled={submittingAssign}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={submittingAssign || !targetAssignDeptId || assignJustification.trim().length < 10}
            >
              {submittingAssign ? "Executing Assignment…" : "Execute Assignment"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Inspect Grievance Modal */}
      <Dialog
        isOpen={inspectModalOpen}
        onClose={() => setInspectModalOpen(false)}
        title={`Grievance Oversight: ${inspectedGrievance?.trackingToken}`}
        description="Detailed grievance filing metadata, department assignment, and citizen information."
      >
        {inspectedGrievance && (
          <div className="space-y-4 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-brand bg-brand/5 px-2 py-0.5 rounded">
                {inspectedGrievance.trackingToken}
              </span>
              <Badge variant="neutral" size="sm">
                {CATEGORY_LABELS[inspectedGrievance.category as keyof typeof CATEGORY_LABELS] || inspectedGrievance.category}
              </Badge>
              <Badge variant="brand" size="sm">
                {STATUS_LABELS[inspectedGrievance.status as keyof typeof STATUS_LABELS] || inspectedGrievance.status}
              </Badge>
              <Badge variant="neutral" size="sm">
                Priority: {inspectedGrievance.priority}
              </Badge>
            </div>

            <div>
              <h4 className="text-sm font-bold text-content-primary mb-1">
                {inspectedGrievance.title}
              </h4>
              <p className="text-xs text-content-secondary leading-relaxed bg-surface-muted p-3 rounded-base border border-border">
                {inspectedGrievance.description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-surface p-3 rounded-base border border-border">
              <div>
                <p className="text-[11px] text-content-muted font-medium">Assigned Department</p>
                <p className="font-semibold text-content-primary mt-0.5">
                  {inspectedGrievance.departmentName || "Unassigned"}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-content-muted font-medium">Prabhag Ward</p>
                <p className="font-semibold text-content-primary mt-0.5">
                  {inspectedGrievance.wardName || "Not assigned"}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-content-muted font-medium">Reporting Citizen</p>
                <p className="text-content-secondary mt-0.5">
                  {inspectedGrievance.citizenName || inspectedGrievance.citizenId || "Anonymous"}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-content-muted font-medium">Filing Date</p>
                <p className="text-content-secondary mt-0.5">
                  {new Date(inspectedGrievance.submittedAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedGrievanceForAssign(inspectedGrievance);
                  setTargetAssignDeptId(inspectedGrievance.departmentId || "");
                  setTargetAssignWardId(inspectedGrievance.wardId || "");
                  setAssignJustification("");
                  setInspectModalOpen(false);
                  setAssignModalOpen(true);
                }}
                className="text-xs"
              >
                Assign / Reassign
              </Button>

              <div className="flex items-center gap-2">
                <Link href={`/track/${inspectedGrievance.trackingToken}`} target="_blank">
                  <Button
                    variant="primary"
                    size="sm"
                    rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                    className="text-xs"
                  >
                    Open Full Dossier
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setInspectModalOpen(false)}
                  className="text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
