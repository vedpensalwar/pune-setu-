"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Printer,
  Copy,
  Check,
  MapPin,
  Calendar,
  Building2,
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Paperclip,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QRCode } from "@/components/ui/qr-code";
import { GrievanceTrackingDetails } from "@/lib/db/repository";
import { SLACountdown } from "@/components/tracking/sla-countdown";
import { AudioDossier } from "@/components/tracking/audio-dossier";
import { StatusTimeline } from "@/components/tracking/status-timeline";
import { CitizenFeedbackCard } from "@/components/tracking/citizen-feedback-card";
import { CitizenEscalateModal } from "@/components/tracking/citizen-escalate-modal";
import { OfficerStatusModal } from "@/components/tracking/officer-status-modal";
import { CommunityEngagementBar } from "@/components/community/community-engagement-bar";
import { CommunityComments } from "@/components/community/community-comments";
import { GrievanceStatus } from "@/lib/civic/types";
import { ComplaintImage } from "@/components/civic/complaint-image";
import { getEvidenceUrl } from "@/lib/civic/evidence-url";
import { getStatusLabel, getCategoryLabel } from "@/lib/civic/display";
import { useLanguage } from "@/components/language/language-provider";

interface TrackViewProps {
  initialDetails: GrievanceTrackingDetails;
}

export function TrackView({ initialDetails }: TrackViewProps) {
  const { t, formatDate } = useLanguage();
  const [details, setDetails] = useState<GrievanceTrackingDetails>(initialDetails);
  const [copied, setCopied] = useState(false);
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
  const [isOfficerModalOpen, setIsOfficerModalOpen] = useState(false);

  const grievance = details.grievance;

  const handleCopy = () => {
    navigator.clipboard.writeText(grievance.trackingToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReload = async () => {
    try {
      const res = await fetch(`/api/grievances/${grievance.trackingToken}`);
      const data = await res.json();
      if (res.ok && data.tracking) {
        setDetails(data.tracking);
      }
    } catch (err) {
      console.error("Failed to refresh tracking details:", err);
    }
  };

  const formattedSubmitted = new Date(grievance.submittedAt).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const getStatusBadgeVariant = (status: GrievanceStatus): "success" | "warning" | "error" | "brand" | "neutral" => {
    switch (status) {
      case "RESOLVED":
        return "success";
      case "REJECTED":
        return "neutral";
      case "ESCALATED":
      case "SLA_BREACHED":
        return "error";
      case "IN_PROGRESS":
      case "ASSIGNED":
        return "brand";
      case "REOPENED":
        return "warning";
      case "SUBMITTED":
      default:
        return "neutral";
    }
  };

  const trackingUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/track/${grievance.trackingToken}`
      : `https://punesetu.gov.in/track/${grievance.trackingToken}`;

  return (
    <div className="space-y-6">
      {/* 1. Header Card (Screen-Only Controls) */}
      <div className="print:hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full min-w-0">
          <div className="space-y-1 min-w-0 w-full">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-sm sm:text-base font-extrabold text-brand break-all">
                {grievance.trackingToken}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-content-muted hover:text-content-primary p-1 rounded-sm transition-colors shrink-0"
                title={t("tracking.copyTokenTooltip")}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-content-primary break-words">
              {grievance.title}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4 shrink-0">
            <QRCode value={trackingUrl} size={60} className="hidden md:inline-block shadow-xs" />
            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                leftIcon={<Printer className="w-4 h-4" />}
              >
                {t("tracking.printDossier")}
              </Button>

            {details.viewerPermissions.canEscalate && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsEscalateModalOpen(true)}
                leftIcon={<ShieldAlert className="w-4 h-4" />}
              >
                {t("tracking.escalateCase")}
              </Button>
            )}

            {details.viewerPermissions.canUpdateStatus && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsOfficerModalOpen(true)}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                {t("officer.updateStatus")}
              </Button>
            )}
            </div>
          </div>
        </div>

        {/* Status & Category Strip */}
        <div className="p-4 rounded-base bg-surface border border-border shadow-subtle flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={getStatusBadgeVariant(grievance.status as GrievanceStatus)}>
              {getStatusLabel(grievance.status, t)}
            </Badge>
            <Badge variant="neutral">
              {getCategoryLabel(grievance.category, t)}
            </Badge>
            <span className="text-xs text-content-secondary flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{t("tracking.filedOn")}: {formatDate(grievance.submittedAt)}</span>
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-content-primary">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-brand" />
              <span>{grievance.departmentName || t("officer.allDepartments")}</span>
            </div>
            {grievance.wardName && (
              <div className="flex items-center gap-1.5 text-content-secondary">
                <MapPin className="w-4 h-4 text-content-muted" />
                <span>{t("tracking.prabhagWardPrefix")} {grievance.wardNumber ? `${grievance.wardNumber}. ` : ""}{grievance.wardName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Community Endorsements & Follow Bar */}
        <div className="print:hidden">
          <CommunityEngagementBar
            trackingToken={grievance.trackingToken}
            initialEndorsementsCount={details.endorsementsCount || 0}
            initialFollowersCount={details.followersCount || 0}
            onUpdate={handleReload}
          />
        </div>
      </div>

      {/* 2. SLA Countdown & Operational Benchmark */}
      <div className="print:hidden">
        <SLACountdown
          initialSLA={details.slaStatus}
          deadlineAt={grievance.deadlineAt}
          status={grievance.status as GrievanceStatus}
        />
      </div>

      {/* 3. Accessible Audio Dossier */}
      <div className="print:hidden">
        <AudioDossier
          trackingToken={grievance.trackingToken}
          title={grievance.title}
          category={grievance.category}
          status={grievance.status}
          departmentName={grievance.departmentName}
          wardName={grievance.wardName}
          landmark={grievance.landmark}
          submittedAt={grievance.submittedAt}
          deadlineAt={grievance.deadlineAt}
          latestNote={details.timeline[details.timeline.length - 1]?.notes}
        />
      </div>

      {/* 4. Main Complaint Details & Timeline Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details, Timeline, Resolution, Feedback */}
        <div className="lg:col-span-2 space-y-6">
          {/* Complaint Description Card */}
          <Card className="p-5 sm:p-6 border-border bg-surface shadow-subtle space-y-3">
            <h2 className="text-sm font-bold text-content-primary uppercase tracking-wider">
              {t("tracking.grievanceDescription")}
            </h2>
            <p className="text-xs sm:text-sm text-content-secondary leading-relaxed whitespace-pre-line">
              {grievance.description}
            </p>
            {grievance.landmark && (
              <div className="pt-2 border-t border-border flex items-center gap-1.5 text-xs text-content-muted">
                <MapPin className="w-3.5 h-3.5 text-brand" />
                <span>{t("tracking.landmark")}: <strong className="text-content-primary">{grievance.landmark}</strong></span>
              </div>
            )}
          </Card>

          {/* Resolution Details Card (when resolved) */}
          {grievance.status === "RESOLVED" && (
            <Card className="p-5 sm:p-6 border-status-success/30 bg-status-success/5 shadow-subtle space-y-3">
              <div className="flex items-center gap-2 text-status-success">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="text-base font-bold">
                  {t("tracking.officialResolutionProof")}
                </h3>
              </div>
              <p className="text-xs text-content-primary leading-relaxed bg-surface p-3 rounded-base border border-border">
                {grievance.resolutionNotes || "Work completed and verified on-site by Prabhag Ward maintenance team."}
              </p>
              {grievance.resolvedAt && (
                <span className="text-[11px] font-mono text-content-muted block">
                  Closed on: {formatDate(grievance.resolvedAt)}
                </span>
              )}
            </Card>
          )}

          {/* Citizen Feedback Form (if resolved & viewer is owner) */}
          {details.viewerPermissions.isOwner && grievance.status === "RESOLVED" && (
            <CitizenFeedbackCard
              trackingToken={grievance.trackingToken}
              existingFeedback={details.feedback}
              onFeedbackSaved={(fb) => {
                setDetails((prev) => ({ ...prev, feedback: fb }));
              }}
            />
          )}

          {/* Auditable Status Timeline */}
          <StatusTimeline
            timeline={details.timeline}
            currentStatus={grievance.status as GrievanceStatus}
          />

          {/* Public Discussion & Comments Thread */}
          <div className="print:hidden">
            <CommunityComments trackingToken={grievance.trackingToken} />
          </div>
        </div>

        {/* Right Col: Evidence, QR Code, Ward Office Info */}
        <div className="space-y-6">
          {/* Evidence Attachments */}
          <Card className="p-5 border-border bg-surface shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-content-primary uppercase tracking-wider flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-brand" />
                {t("tracking.submittedEvidence")}
              </h3>
              <Badge variant="neutral" size="sm">
                {(details.evidence.length || 0) + (details.resolutionEvidence.length || 0)} Total
              </Badge>
            </div>

            {/* Resolution Evidence */}
            {details.resolutionEvidence.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-status-success block">
                  {t("tracking.officialResolutionProof")}
                </span>
                <div className="space-y-2">
                  {details.resolutionEvidence.map((ev) => {
                    const isImage = ev.evidenceType === "PHOTO" || ev.mimeType?.startsWith("image/");
                    const targetUrl = getEvidenceUrl(ev.storageKey) || (ev.storageKey.startsWith("/") ? ev.storageKey : `/${ev.storageKey}`);
                    return (
                      <div
                        key={ev.id}
                        className="p-2.5 rounded-base bg-status-success/5 border border-status-success/20 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          {isImage && (
                            <ComplaintImage
                              src={targetUrl}
                              alt={ev.caption || ev.originalFilename || "Resolution Photo"}
                              className="w-12 h-12"
                              compact
                            />
                          )}
                          <div className="min-w-0">
                            <span className="font-semibold text-content-primary truncate block">
                              {ev.caption || ev.originalFilename}
                            </span>
                            <span className="text-[10px] text-content-muted block">
                              {(ev.sizeBytes / 1024).toFixed(0)} KB • {ev.evidenceType}
                            </span>
                          </div>
                        </div>
                        <a
                          href={targetUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-brand hover:underline shrink-0"
                        >
                          View
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Initial Evidence */}
            {details.evidence.length > 0 ? (
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-content-muted block">
                  Citizen Submission Attachments
                </span>
                <div className="space-y-2">
                  {details.evidence.map((ev) => {
                    const isImage = ev.evidenceType === "PHOTO" || ev.mimeType?.startsWith("image/");
                    const targetUrl = getEvidenceUrl(ev.storageKey) || (ev.storageKey.startsWith("/") ? ev.storageKey : `/${ev.storageKey}`);
                    return (
                      <div
                        key={ev.id}
                        className="p-2.5 rounded-base bg-surface-subtle border border-border flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          {isImage && (
                            <ComplaintImage
                              src={targetUrl}
                              alt={ev.caption || ev.originalFilename || "Evidence File"}
                              className="w-12 h-12"
                              compact
                            />
                          )}
                          <div className="min-w-0">
                            <span className="font-semibold text-content-primary truncate block">
                              {ev.caption || ev.originalFilename || "Evidence File"}
                            </span>
                            <span className="text-[10px] text-content-muted block">
                              {(ev.sizeBytes / 1024).toFixed(0)} KB • {ev.evidenceType}
                            </span>
                          </div>
                        </div>
                        <a
                          href={targetUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-brand hover:underline shrink-0"
                        >
                          View
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              details.resolutionEvidence.length === 0 && (
                <p className="text-xs text-content-muted italic">
                  No photographs or documents attached.
                </p>
              )
            )}
          </Card>

          {/* QR Code Card */}
          <Card className="p-5 border-border bg-surface shadow-subtle text-center space-y-3">
            <div className="flex justify-center">
              <QRCode value={trackingUrl} size={110} />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-brand block">
                {grievance.trackingToken}
              </span>
              <p className="text-[10px] text-content-muted leading-tight">
                Scan with any smartphone camera to inspect this live case audit record.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* 5. Printable Official Slip (Only visible on print) */}
      <div className="hidden print:block space-y-6">
        <div className="border-b-2 border-black pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-black">PuneSetu (पुणे सेतू)</h1>
            <p className="text-xs text-black">Official Grievance Audit &amp; Status Slip</p>
          </div>
          <div className="flex items-center gap-4 text-right">
            <div>
              <span className="font-mono text-base font-bold text-black block">{grievance.trackingToken}</span>
              <span className="text-xs text-black block">Status: {grievance.status}</span>
            </div>
            <QRCode value={trackingUrl} size={64} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs text-black">
          <div>
            <strong>Subject:</strong> {grievance.title}
          </div>
          <div>
            <strong>Category:</strong> {grievance.category}
          </div>
          <div>
            <strong>Department:</strong> {grievance.departmentName || "Municipal Maintenance"}
          </div>
          <div>
            <strong>Ward:</strong> {grievance.wardName || "Central Desk"}
          </div>
          <div>
            <strong>Submitted:</strong> {formattedSubmitted}
          </div>
          <div>
            <strong>Landmark:</strong> {grievance.landmark || "Coordinates on file"}
          </div>
        </div>

        <div className="text-xs text-black border-t border-black pt-3">
          <strong>Citizen Description:</strong>
          <p className="mt-1">{grievance.description}</p>
        </div>

        {grievance.resolutionNotes && (
          <div className="text-xs text-black border-t border-black pt-3">
            <strong>Resolution Notes:</strong>
            <p className="mt-1">{grievance.resolutionNotes}</p>
          </div>
        )}

        <div className="text-[10px] text-black border-t border-black pt-4">
          <p>This document is an electronic tracking slip generated by the PuneSetu municipal portal.</p>
          <p>For official inquiries or verification, visit punesetu.gov.in and search token {grievance.trackingToken}.</p>
        </div>
      </div>

      {/* 6. Modals */}
      <CitizenEscalateModal
        trackingToken={grievance.trackingToken}
        isOpen={isEscalateModalOpen}
        onClose={() => setIsEscalateModalOpen(false)}
        onEscalationSuccess={handleReload}
      />

      <OfficerStatusModal
        trackingToken={grievance.trackingToken}
        currentStatus={grievance.status as GrievanceStatus}
        isOpen={isOfficerModalOpen}
        onClose={() => setIsOfficerModalOpen(false)}
        onStatusUpdated={handleReload}
      />
    </div>
  );
}
