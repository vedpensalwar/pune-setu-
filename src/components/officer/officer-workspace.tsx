"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Briefcase,
  Building,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  ArrowRight,
  Shield,
  FileText,
  RotateCcw,
  Send,
  UploadCloud,
  Layers,
  ChevronRight,
  MessageSquare,
  AlertCircle,
  ExternalLink,
  Eye,
} from "lucide-react";
import { SafeUser } from "@/lib/auth/types";
import { OfficerGrievanceItem } from "@/lib/db/repository";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { STATUS_LABELS, CATEGORY_LABELS, PRIORITY_LABELS, getStatusLabel, getCategoryLabel, getPriorityLabel } from "@/lib/civic/display";
import { useLanguage } from "@/components/language/language-provider";

interface OfficerWorkspaceProps {
  user: SafeUser;
}

export function OfficerWorkspace({ user }: OfficerWorkspaceProps) {
  const { t, formatDate, formatNumber } = useLanguage();
  // State
  const [stats, setStats] = useState<{
    assignedTotal: number;
    inProgress: number;
    nearDeadline: number;
    overdue: number;
    resolved: number;
    departmentName: string;
  } | null>(null);

  const [items, setItems] = useState<OfficerGrievanceItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [wardFilter, setWardFilter] = useState("");
  const [nearDeadlineOnly, setNearDeadlineOnly] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [sortBy, setSortBy] = useState("");

  // Reference datasets
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [wards, setWards] = useState<Array<{ id: string; name: string; wardNumber: number }>>([]);

  // Active Dialog state
  const [activeDialog, setActiveDialog] = useState<"status" | "reassign" | "note" | "inspect" | null>(null);
  const [selectedGrievance, setSelectedGrievance] = useState<OfficerGrievanceItem | null>(null);

  // Dialog Form inputs
  const [targetStatus, setTargetStatus] = useState("IN_PROGRESS");
  const [actionNotes, setActionNotes] = useState("");
  const [resolutionPhoto, setResolutionPhoto] = useState<File | null>(null);
  const [targetDepartmentId, setTargetDepartmentId] = useState("");
  const [targetWardId, setTargetWardId] = useState("");
  const [dialogSubmitting, setDialogSubmitting] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load Reference Data
  useEffect(() => {
    fetch("/api/departments")
      .then((r) => r.json())
      .then((d) => {
        if (d.departments) setDepartments(d.departments);
      })
      .catch(() => {});

    fetch("/api/wards")
      .then((r) => r.json())
      .then((d) => {
        if (d.wards) setWards(d.wards);
      })
      .catch(() => {});
  }, []);

  // Fetch Stats
  const loadStats = useCallback(async () => {
    try {
      const res = await fetch("/api/officer/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch {
      // Handled gracefully in UI
    }
  }, []);

  // Fetch Operational Queue
  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter) params.set("status", statusFilter);
      if (priorityFilter) params.set("priority", priorityFilter);
      if (wardFilter) params.set("wardId", wardFilter);
      if (nearDeadlineOnly) params.set("nearDeadlineOnly", "true");
      if (overdueOnly) params.set("overdueOnly", "true");
      if (sortBy) params.set("sortBy", sortBy);
      params.set("page", page.toString());
      params.set("limit", "15");

      const res = await fetch(`/api/officer/grievances?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } else {
        setError(data.error || "Failed to load grievance queue.");
      }
    } catch {
      setError("Unable to connect to PuneSetu municipal gateway.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter, wardFilter, nearDeadlineOnly, overdueOnly, sortBy, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadQueue();
  }, [loadQueue]);

  // Show transient toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Dialog Handlers
  const openStatusDialog = (item: OfficerGrievanceItem) => {
    setSelectedGrievance(item);
    setTargetStatus(item.status === "SUBMITTED" ? "ASSIGNED" : item.status === "ASSIGNED" ? "IN_PROGRESS" : "RESOLVED");
    setActionNotes("");
    setResolutionPhoto(null);
    setDialogError(null);
    setActiveDialog("status");
  };

  const openReassignDialog = (item: OfficerGrievanceItem) => {
    setSelectedGrievance(item);
    setTargetDepartmentId("");
    setTargetWardId(item.wardId || "");
    setActionNotes("");
    setDialogError(null);
    setActiveDialog("reassign");
  };

  const openNoteDialog = (item: OfficerGrievanceItem) => {
    setSelectedGrievance(item);
    setActionNotes("");
    setDialogError(null);
    setActiveDialog("note");
  };

  const openInspectDialog = (item: OfficerGrievanceItem) => {
    setSelectedGrievance(item);
    setActiveDialog("inspect");
  };

  // Submit Status Update
  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGrievance) return;

    if (targetStatus === "RESOLVED" && actionNotes.trim().length < 10) {
      setDialogError("Formal closing remarks (minimum 10 characters) are required to resolve a grievance.");
      return;
    }
    if (targetStatus === "REJECTED" && actionNotes.trim().length < 10) {
      setDialogError("Formal municipal justification (minimum 10 characters) is required to reject a grievance.");
      return;
    }

    setDialogSubmitting(true);
    setDialogError(null);

    try {
      let resolutionEvidence: any[] = [];

      // If resolving with photograph, upload first
      if (targetStatus === "RESOLVED" && resolutionPhoto) {
        const formData = new FormData();
        formData.append("file", resolutionPhoto);
        const uploadRes = await fetch("/api/uploads", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadData.success) {
          throw new Error(uploadData.error || "Failed to upload resolution evidence photo.");
        }
        resolutionEvidence = [
          {
            evidenceType: "PHOTO",
            storageKey: uploadData.storageKey,
            originalFilename: resolutionPhoto.name,
            mimeType: resolutionPhoto.type,
            sizeBytes: resolutionPhoto.size,
            caption: "Official Field Resolution Evidence",
          },
        ];
      }

      const res = await fetch(`/api/grievances/${selectedGrievance.trackingToken}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newStatus: targetStatus,
          notes: actionNotes.trim(),
          resolutionEvidence: resolutionEvidence.length > 0 ? resolutionEvidence : undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to update grievance status.");
      }

      showToast(`Case ${selectedGrievance.trackingToken} transitioned to ${targetStatus}.`);
      setActiveDialog(null);
      loadStats();
      loadQueue();
    } catch (err: any) {
      setDialogError(err.message || "An unexpected error occurred.");
    } finally {
      setDialogSubmitting(false);
    }
  };

  // Submit Reassignment
  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGrievance) return;

    if (!targetDepartmentId) {
      setDialogError("Please select a target municipal department.");
      return;
    }
    if (actionNotes.trim().length < 10) {
      setDialogError("Reassignment justification (minimum 10 characters) is required.");
      return;
    }

    setDialogSubmitting(true);
    setDialogError(null);

    try {
      const res = await fetch("/api/officer/reassign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingToken: selectedGrievance.trackingToken,
          targetDepartmentId,
          targetWardId: targetWardId || undefined,
          reason: actionNotes.trim(),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to reassign grievance.");
      }

      showToast(`Case ${selectedGrievance.trackingToken} successfully reassigned.`);
      setActiveDialog(null);
      loadStats();
      loadQueue();
    } catch (err: any) {
      setDialogError(err.message || "An unexpected error occurred.");
    } finally {
      setDialogSubmitting(false);
    }
  };

  // Submit Progress Note
  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGrievance) return;

    if (!actionNotes.trim()) {
      setDialogError("Please enter progress note content.");
      return;
    }

    setDialogSubmitting(true);
    setDialogError(null);

    try {
      const res = await fetch(`/api/grievances/${selectedGrievance.trackingToken}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: actionNotes.trim(),
          isInternal: true,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to save operational note.");
      }

      showToast("Internal operational note saved to audit record.");
      setActiveDialog(null);
      loadQueue();
    } catch (err: any) {
      setDialogError(err.message || "An unexpected error occurred.");
    } finally {
      setDialogSubmitting(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setPriorityFilter("");
    setWardFilter("");
    setNearDeadlineOnly(false);
    setOverdueOnly(false);
    setSortBy("");
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    search || statusFilter || priorityFilter || wardFilter || nearDeadlineOnly || overdueOnly || sortBy
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-left">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-brand text-white px-4 py-3 rounded-base shadow-lg border border-brand/20 flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-accent" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* 1. Officer Header & Context */}
      <div className="rounded-base border border-border bg-surface p-6 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand/10 text-brand border border-brand/20">
              <Shield className="w-3.5 h-3.5" />
              {t("officer.operationsDesk")}
            </span>
            <span className="text-xs text-content-muted font-mono">• {user.id}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-content-primary tracking-tight">
            {t("officer.fieldOfficer")}: {user.name}
          </h1>
          <p className="text-xs sm:text-sm text-content-secondary">
            {user.department || t("officer.allDepartments")} • {t("officer.primaryJurisdiction")}: {user.ward || t("officer.puneMunicipalHq")}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link href="/map">
            <Button variant="outline" size="sm" leftIcon={<MapPin className="w-3.5 h-3.5" />}>
              {t("officer.openGisMap")}
            </Button>
          </Link>
          <Button variant="primary" size="sm" onClick={() => { loadStats(); loadQueue(); }} leftIcon={<RotateCcw className="w-3.5 h-3.5" />}>
            {t("officer.refreshQueue")}
          </Button>
        </div>
      </div>

      {/* 2. Operational Status Strip (Compact, actionable metric row) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          onClick={() => { setStatusFilter(""); setNearDeadlineOnly(false); setOverdueOnly(false); }}
          className={`p-3.5 rounded-base border text-left transition-all ${
            !statusFilter && !nearDeadlineOnly && !overdueOnly
              ? "border-brand bg-brand/5 shadow-sm"
              : "border-border bg-surface hover:border-brand/40"
          }`}
        >
          <p className="text-[11px] font-medium text-content-muted">{t("officer.totalAssigned")}</p>
          <p className="text-xl font-bold text-content-primary mt-0.5">{stats ? formatNumber(stats.assignedTotal) : "…"}</p>
          <p className="text-[10px] text-content-muted mt-1">{t("officer.departmentQueue")}</p>
        </button>

        <button
          onClick={() => { setStatusFilter("IN_PROGRESS"); setNearDeadlineOnly(false); setOverdueOnly(false); }}
          className={`p-3.5 rounded-base border text-left transition-all ${
            statusFilter === "IN_PROGRESS"
              ? "border-brand bg-brand/5 shadow-sm"
              : "border-border bg-surface hover:border-brand/40"
          }`}
        >
          <p className="text-[11px] font-medium text-content-muted">{t("officer.inProgress")}</p>
          <p className="text-xl font-bold text-status-warning mt-0.5">{stats ? formatNumber(stats.inProgress) : "…"}</p>
          <p className="text-[10px] text-content-muted mt-1">{t("officer.fieldRepairActive")}</p>
        </button>

        <button
          onClick={() => { setNearDeadlineOnly(!nearDeadlineOnly); setOverdueOnly(false); }}
          className={`p-3.5 rounded-base border text-left transition-all ${
            nearDeadlineOnly
              ? "border-accent bg-accent/10 shadow-sm"
              : "border-border bg-surface hover:border-accent/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-content-muted">{t("officer.nearDeadline")}</p>
            <Clock className="w-3.5 h-3.5 text-accent" />
          </div>
          <p className="text-xl font-bold text-accent mt-0.5">{stats ? formatNumber(stats.nearDeadline) : "…"}</p>
          <p className="text-[10px] text-content-muted mt-1">{t("officer.hoursRemainingLabel")}</p>
        </button>

        <button
          onClick={() => { setOverdueOnly(!overdueOnly); setNearDeadlineOnly(false); }}
          className={`p-3.5 rounded-base border text-left transition-all ${
            overdueOnly
              ? "border-status-error bg-status-error/10 shadow-sm"
              : "border-border bg-surface hover:border-status-error/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-content-muted">{t("officer.overdueSla")}</p>
            <AlertTriangle className="w-3.5 h-3.5 text-status-error" />
          </div>
          <p className="text-xl font-bold text-status-error mt-0.5">{stats ? formatNumber(stats.overdue) : "…"}</p>
          <p className="text-[10px] text-content-muted mt-1">{t("officer.actionRequired")}</p>
        </button>

        <button
          onClick={() => { setStatusFilter("RESOLVED"); setNearDeadlineOnly(false); setOverdueOnly(false); }}
          className={`p-3.5 rounded-base border text-left transition-all ${
            statusFilter === "RESOLVED"
              ? "border-status-success bg-status-success/10 shadow-sm"
              : "border-border bg-surface hover:border-status-success/40"
          }`}
        >
          <p className="text-[11px] font-medium text-content-muted">{t("citizen.resolved")}</p>
          <p className="text-xl font-bold text-status-success mt-0.5">{stats ? formatNumber(stats.resolved) : "…"}</p>
          <p className="text-[10px] text-content-muted mt-1">{t("officer.resolvedProofAttached")}</p>
        </button>
      </div>

      {/* 3. Operational Queue Toolbar */}
      <div className="rounded-base border border-border bg-surface p-4 shadow-subtle space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
            <input
              type="text"
              placeholder={t("officer.searchCasesPlaceholder")}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full h-10 pl-9 pr-3 rounded-base border border-border bg-background text-xs text-content-primary placeholder:text-content-muted focus:outline-none focus:border-brand"
            />
          </div>

          {/* Compact Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="h-10 px-2.5 rounded-base border border-border bg-background text-xs text-content-primary focus:outline-none focus:border-brand"
            >
              <option value="">{t("officer.statusAll")}</option>
              {Object.keys(STATUS_LABELS).map((val) => (
                <option key={val} value={val}>{getStatusLabel(val, t)}</option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
              className="h-10 px-2.5 rounded-base border border-border bg-background text-xs text-content-primary focus:outline-none focus:border-brand"
            >
              <option value="">{t("officer.priorityAll")}</option>
              {Object.keys(PRIORITY_LABELS).map((val) => (
                <option key={val} value={val}>{getPriorityLabel(val, t)}</option>
              ))}
            </select>

            <select
              value={wardFilter}
              onChange={(e) => { setWardFilter(e.target.value); setPage(1); }}
              className="h-10 px-2.5 rounded-base border border-border bg-background text-xs text-content-primary focus:outline-none focus:border-brand max-w-[150px] truncate"
            >
              <option value="">{t("officer.wardAll")}</option>
              {wards.map((w) => (
                <option key={w.id} value={w.id}>{w.wardNumber}. {w.name}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="h-10 px-2.5 rounded-base border border-border bg-background text-xs text-content-primary focus:outline-none focus:border-brand"
            >
              <option value="">{t("officer.sortUrgency")}</option>
              <option value="deadline">{t("officer.sortApproachingDeadline")}</option>
              <option value="submitted">{t("officer.sortSubmissionDate")}</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-content-muted hover:text-accent font-medium px-2 py-1 transition-colors"
              >
                {t("officer.clearFilters")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Grievance Operational Queue Table / List */}
      <div className="rounded-base border border-border bg-surface overflow-hidden shadow-subtle">
        <div className="p-4 border-b border-border bg-surface-muted/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-brand" />
            <h2 className="text-sm font-bold text-content-primary">
              {t("officer.operationalCaseQueue")} ({formatNumber(total)})
            </h2>
          </div>
          <span className="text-xs text-content-muted">
            {t("officer.pageOf", { page: formatNumber(page), totalPages: formatNumber(totalPages) })}
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-content-secondary">{t("citizen.loadingGrievances")}</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-2">
            <AlertCircle className="w-6 h-6 text-status-error mx-auto" />
            <p className="text-sm font-semibold text-content-primary">{error}</p>
            <Button variant="outline" size="sm" onClick={loadQueue}>{t("citizen.refresh")}</Button>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-status-success mx-auto opacity-70" />
            <h3 className="text-sm font-bold text-content-primary">{t("officer.noMatchingCases")}</h3>
            <p className="text-xs text-content-secondary max-w-sm mx-auto">
              {t("officer.noMatchingCasesDesc")}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="mt-2">
                {t("officer.clearFilters")}
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((item) => {
              const statusInfo = getStatusLabel(item.status, t);
              const isOverdue = item.isOverdue && item.status !== "RESOLVED" && item.status !== "REJECTED";
              const isNearDeadline =
                item.hoursRemaining !== null &&
                item.hoursRemaining > 0 &&
                item.hoursRemaining <= 48 &&
                item.status !== "RESOLVED" &&
                item.status !== "REJECTED";

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 hover:bg-surface-muted/30 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Left Column: Complaint Details */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-brand">{item.trackingToken}</span>
                      <span className="text-content-muted text-xs">•</span>
                      <span className="text-xs text-content-muted">
                        {getCategoryLabel(item.category, t)}
                      </span>
                      <span className="text-content-muted text-xs">•</span>
                      <span className="text-xs text-content-muted">{item.wardName || "Pune Ward"}</span>

                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          item.status === "RESOLVED"
                            ? "bg-status-success/15 text-status-success"
                            : item.status === "IN_PROGRESS"
                            ? "bg-status-warning/15 text-status-warning"
                            : item.status === "SUBMITTED"
                            ? "bg-brand/10 text-brand"
                            : "bg-status-error/15 text-status-error"
                        }`}
                      >
                        {statusInfo}
                      </span>

                      {/* Overdue / Deadline Warning */}
                      {isOverdue && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-status-error text-white">
                          <AlertTriangle className="w-3 h-3" />
                          {t("officer.slaBreachedBadge")}
                        </span>
                      )}
                      {isNearDeadline && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-accent/15 text-accent">
                          <Clock className="w-3 h-3" />
                          {formatNumber(item.hoursRemaining || 0)}{t("officer.hoursRemainingBadge")}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-content-primary leading-snug">
                      {item.title}
                    </h3>

                    <p className="text-xs text-content-secondary line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-content-muted pt-1">
                      <span>Submitted: {formatDate(item.submittedAt)}</span>
                      {item.deadlineAt && (
                        <span>Deadline: {formatDate(item.deadlineAt)}</span>
                      )}
                      {item.landmark && (
                        <span>Landmark: {item.landmark}</span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openInspectDialog(item)}
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                      className="text-xs"
                    >
                      {t("officer.inspect")}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openStatusDialog(item)}
                      className="text-xs"
                    >
                      {t("officer.updateStatus")}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openReassignDialog(item)}
                      className="text-xs"
                    >
                      {t("officer.reassign")}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openNoteDialog(item)}
                      className="text-xs"
                    >
                      {t("officer.addNote")}
                    </Button>

                    <Link href={`/track/${item.trackingToken}`}>
                      <Button
                        variant="primary"
                        size="sm"
                        rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                        className="text-xs"
                      >
                        {t("officer.dossier")}
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border bg-surface-muted/30 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {t("officer.previous")}
            </Button>
            <span className="text-xs text-content-muted">
              {t("officer.pageOf", { page: formatNumber(page), totalPages: formatNumber(totalPages) })}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              {t("officer.next")}
            </Button>
          </div>
        )}
      </div>

      {/* 5. Dialog: Update Status */}
      <Dialog
        isOpen={activeDialog === "status"}
        onClose={() => setActiveDialog(null)}
        title={`Update Case: ${selectedGrievance?.trackingToken}`}
        description="Transition grievance lifecycle state with mandatory operational remarks."
      >
        <form onSubmit={handleStatusSubmit} className="space-y-4 text-left">
          {dialogError && (
            <div className="p-3 rounded-base bg-status-error/10 border border-status-error/30 text-xs text-status-error">
              {dialogError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Target Lifecycle Status
            </label>
            <select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value)}
              className="w-full h-10 px-3 rounded-base border border-border bg-background text-xs text-content-primary focus:outline-none focus:border-brand"
            >
              <option value="ASSIGNED">ASSIGNED (Awaiting Inspection)</option>
              <option value="IN_PROGRESS">IN_PROGRESS (Remediation Underway)</option>
              <option value="RESOLVED">RESOLVED (Completed with Proof)</option>
              <option value="REJECTED">REJECTED (Formal Rejection)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Formal Remarks / Operational Justification *
            </label>
            <textarea
              rows={3}
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              placeholder={
                targetStatus === "RESOLVED"
                  ? "Describe completion details, contractor action, and field measurements (min 10 chars)…"
                  : targetStatus === "REJECTED"
                  ? "Provide formal municipal justification explaining non-actionable reason (min 10 chars)…"
                  : "Enter inspection status notes…"
              }
              className="w-full p-2.5 rounded-base border border-border bg-background text-xs text-content-primary placeholder:text-content-muted focus:outline-none focus:border-brand"
            />
            <p className="text-[11px] text-content-muted mt-1">
              Minimum 10 characters required for RESOLVED and REJECTED status.
            </p>
          </div>

          {targetStatus === "RESOLVED" && (
            <div className="space-y-1.5 p-3 rounded-base border border-border bg-surface-muted/30">
              <label className="block text-xs font-semibold text-content-primary">
                Attach Resolution Evidence Photograph
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setResolutionPhoto(e.target.files?.[0] || null)}
                className="text-xs text-content-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded-base file:border-0 file:text-xs file:font-semibold file:bg-brand file:text-white hover:file:bg-brand-hover"
              />
              <p className="text-[10px] text-content-muted">
                Official policy requires verified resolution photograph proof.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActiveDialog(null)}
              disabled={dialogSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={dialogSubmitting}
            >
              {dialogSubmitting ? "Updating…" : "Apply Status Change"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* 6. Dialog: Reassign Grievance */}
      <Dialog
        isOpen={activeDialog === "reassign"}
        onClose={() => setActiveDialog(null)}
        title={`Reassign Grievance: ${selectedGrievance?.trackingToken}`}
        description="Reroute misfiled complaints to the appropriate PMC department or Prabhag Ward."
      >
        <form onSubmit={handleReassignSubmit} className="space-y-4 text-left">
          {dialogError && (
            <div className="p-3 rounded-base bg-status-error/10 border border-status-error/30 text-xs text-status-error">
              {dialogError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Target Department *
            </label>
            <select
              value={targetDepartmentId}
              onChange={(e) => setTargetDepartmentId(e.target.value)}
              className="w-full h-10 px-3 rounded-base border border-border bg-background text-xs text-content-primary focus:outline-none focus:border-brand"
              required
            >
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Target Prabhag Ward (Optional)
            </label>
            <select
              value={targetWardId}
              onChange={(e) => setTargetWardId(e.target.value)}
              className="w-full h-10 px-3 rounded-base border border-border bg-background text-xs text-content-primary focus:outline-none focus:border-brand"
            >
              <option value="">Keep Existing Ward</option>
              {wards.map((w) => (
                <option key={w.id} value={w.id}>{w.wardNumber}. {w.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Reassignment Justification *
            </label>
            <textarea
              rows={3}
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              placeholder="State why this complaint falls under the target department's jurisdiction (min 10 chars)…"
              className="w-full p-2.5 rounded-base border border-border bg-background text-xs text-content-primary placeholder:text-content-muted focus:outline-none focus:border-brand"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActiveDialog(null)}
              disabled={dialogSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={dialogSubmitting}
            >
              {dialogSubmitting ? "Reassigning…" : "Execute Reassignment"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* 7. Dialog: Add Operational Note */}
      <Dialog
        isOpen={activeDialog === "note"}
        onClose={() => setActiveDialog(null)}
        title={`Add Operational Note: ${selectedGrievance?.trackingToken}`}
        description="Internal engineer notes recorded in immutable audit log (hidden from public citizen view)."
      >
        <form onSubmit={handleNoteSubmit} className="space-y-4 text-left">
          {dialogError && (
            <div className="p-3 rounded-base bg-status-error/10 border border-status-error/30 text-xs text-status-error">
              {dialogError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Internal Progress Note *
            </label>
            <textarea
              rows={4}
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              placeholder="Record field measurements, contractor dispatch status, material requests, or escalation notes…"
              className="w-full p-2.5 rounded-base border border-border bg-background text-xs text-content-primary placeholder:text-content-muted focus:outline-none focus:border-brand"
              required
            />
            <p className="text-[11px] text-content-muted mt-1">
              This note is marked as internal and only accessible to authorized municipal personnel.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActiveDialog(null)}
              disabled={dialogSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={dialogSubmitting}
            >
              {dialogSubmitting ? "Saving…" : "Save Operational Note"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* 8. Dialog: Inspect Grievance Details */}
      <Dialog
        isOpen={activeDialog === "inspect"}
        onClose={() => setActiveDialog(null)}
        title={`Grievance Dossier: ${selectedGrievance?.trackingToken}`}
        description="Comprehensive grievance details, field evidence, location data, and SLA metrics."
      >
        {selectedGrievance && (
          <div className="space-y-4 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-brand bg-brand/5 px-2 py-0.5 rounded">
                {selectedGrievance.trackingToken}
              </span>
              <Badge variant="neutral" size="sm">
                {CATEGORY_LABELS[selectedGrievance.category as keyof typeof CATEGORY_LABELS] || selectedGrievance.category}
              </Badge>
              <Badge variant="brand" size="sm">
                {selectedGrievance.status}
              </Badge>
              <Badge variant="neutral" size="sm">
                Priority: {selectedGrievance.priority}
              </Badge>
            </div>

            <div>
              <h4 className="text-sm font-bold text-content-primary mb-1">
                {selectedGrievance.title}
              </h4>
              <p className="text-xs text-content-secondary leading-relaxed bg-surface-muted p-3 rounded-base border border-border">
                {selectedGrievance.description}
              </p>
            </div>

            {/* Location & Ward */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-surface p-3 rounded-base border border-border">
              <div>
                <p className="text-[11px] text-content-muted font-medium">Prabhag Ward</p>
                <p className="font-semibold text-content-primary mt-0.5">
                  {selectedGrievance.wardName || "Pune Municipal Ward"}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-content-muted font-medium">Landmark / Street</p>
                <p className="font-semibold text-content-primary mt-0.5">
                  {selectedGrievance.landmark || "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-content-muted font-medium">Submission Timestamp</p>
                <p className="text-content-secondary mt-0.5">
                  {new Date(selectedGrievance.submittedAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-content-muted font-medium">SLA Resolution Target</p>
                <p className="text-content-secondary mt-0.5">
                  {selectedGrievance.deadlineAt
                    ? new Date(selectedGrievance.deadlineAt).toLocaleString()
                    : "Standard SLA"}
                </p>
              </div>
            </div>

            {/* Evidence Thumbnail if present */}
            {selectedGrievance.thumbnailUrl && (
              <div className="space-y-1.5">
                <p className="text-[11px] text-content-muted font-medium">Submitted Photographic Evidence</p>
                <div className="relative w-full max-w-xs h-36 rounded-base overflow-hidden border border-border bg-black/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedGrievance.thumbnailUrl}
                    alt="Evidence photograph"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Quick Actions Bar */}
            <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openStatusDialog(selectedGrievance)}
                  className="text-xs"
                >
                  Update Status
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openReassignDialog(selectedGrievance)}
                  className="text-xs"
                >
                  Reassign
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openNoteDialog(selectedGrievance)}
                  className="text-xs"
                >
                  Add Note
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/track/${selectedGrievance.trackingToken}`} target="_blank">
                  <Button
                    variant="primary"
                    size="sm"
                    rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                    className="text-xs"
                  >
                    Open Public Dossier
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveDialog(null)}
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
