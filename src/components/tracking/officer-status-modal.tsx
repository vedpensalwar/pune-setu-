"use client";

import React, { useState } from "react";
import { X, CheckCircle2, AlertTriangle, Upload, Camera, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GrievanceStatus } from "@/lib/civic/types";

interface OfficerStatusModalProps {
  trackingToken: string;
  currentStatus: GrievanceStatus;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated: () => void;
}

export function OfficerStatusModal({
  trackingToken,
  currentStatus,
  isOpen,
  onClose,
  onStatusUpdated,
}: OfficerStatusModalProps) {
  const [targetStatus, setTargetStatus] = useState<GrievanceStatus>("IN_PROGRESS");
  const [notes, setNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [resolutionPhoto, setResolutionPhoto] = useState<{
    storageKey: string;
    originalFilename: string;
    mimeType: string;
    sizeBytes: number;
    caption: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Resolution evidence must be an image file (JPEG, PNG, WebP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("Image size exceeds 10MB limit.");
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload resolution photograph.");
      }

      setResolutionPhoto({
        storageKey: data.file.storageKey,
        originalFilename: data.file.originalFilename,
        mimeType: data.file.mimeType,
        sizeBytes: data.file.sizeBytes,
        caption: "Field Resolution Work Completion Photograph",
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload photo.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (targetStatus === "RESOLVED") {
      if (notes.trim().length < 10) {
        setErrorMsg("Formal closing remarks (minimum 10 characters) are required to mark as RESOLVED.");
        return;
      }
      if (!resolutionPhoto) {
        setErrorMsg("At least one verified resolution photograph is required to resolve a grievance.");
        return;
      }
    }

    if (targetStatus === "REJECTED") {
      const reason = rejectionReason.trim() || notes.trim();
      if (reason.length < 10) {
        setErrorMsg("A formal justification (minimum 10 characters) is required to reject a grievance.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        newStatus: targetStatus,
        notes: notes.trim() || undefined,
        changeReason: `Transitioned to ${targetStatus} by authorized officer`,
      };

      if (targetStatus === "RESOLVED" && resolutionPhoto) {
        payload.resolutionEvidence = [
          {
            evidenceType: "PHOTO",
            storageKey: resolutionPhoto.storageKey,
            originalFilename: resolutionPhoto.originalFilename,
            mimeType: resolutionPhoto.mimeType,
            sizeBytes: resolutionPhoto.sizeBytes,
            caption: resolutionPhoto.caption,
          },
        ];
      }

      if (targetStatus === "REJECTED") {
        payload.rejectionReason = rejectionReason.trim() || notes.trim();
      }

      const res = await fetch(`/api/grievances/${trackingToken}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to transition status.");
      }

      onStatusUpdated();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while updating status.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <Card className="w-full max-w-lg p-6 border-border bg-surface shadow-elevated space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <h3 className="text-base font-bold text-content-primary">
            Officer Action: Update Grievance Status
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-content-muted hover:text-content-primary p-1 rounded-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Status Select */}
          <div className="space-y-1.5">
            <label htmlFor="target-status" className="text-xs font-semibold text-content-primary block">
              Target Status *
            </label>
            <select
              id="target-status"
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value as GrievanceStatus)}
              className="w-full text-xs p-2.5 rounded-base border border-border bg-background focus:outline-none focus:ring-2 focus:ring-brand font-medium"
            >
              <option value="ASSIGNED">ASSIGNED (Dispatch to Ward Crew)</option>
              <option value="IN_PROGRESS">IN_PROGRESS (Work Order Executing)</option>
              <option value="RESOLVED">RESOLVED (Repairs Complete with Evidence)</option>
              <option value="REJECTED">REJECTED (Formal Justification Required)</option>
              <option value="ESCALATED">ESCALATED (Refer to Executive Engineer)</option>
            </select>
          </div>

          {/* If Resolved: Upload Resolution Evidence Photo */}
          {targetStatus === "RESOLVED" && (
            <div className="p-4 rounded-base bg-status-success/5 border border-status-success/30 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-status-success">
                <Camera className="w-4 h-4" />
                <span>Mandatory Resolution Photograph *</span>
              </div>
              <p className="text-[11px] text-content-secondary leading-relaxed">
                PMC audit policy mandates an after-repair on-site photograph before marking a civic ticket as RESOLVED.
              </p>

              {resolutionPhoto ? (
                <div className="p-2.5 rounded-base bg-surface border border-border flex items-center justify-between text-xs">
                  <span className="font-mono text-brand truncate max-w-xs">{resolutionPhoto.originalFilename}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setResolutionPhoto(null)}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    id="resolution-file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="resolution-file"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-base bg-surface border border-dashed border-brand text-xs font-semibold text-brand cursor-pointer hover:bg-brand/5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {isUploading ? "Uploading..." : "Upload Resolution Photo"}
                  </label>
                </div>
              )}
            </div>
          )}

          {/* If Rejected: Rejection Justification */}
          {targetStatus === "REJECTED" && (
            <div className="space-y-1.5">
              <label htmlFor="rejection-reason" className="text-xs font-semibold text-status-danger block">
                Formal Rejection Justification * (Minimum 10 characters):
              </label>
              <textarea
                id="rejection-reason"
                rows={2}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain the legal or jurisdictional reason why this grievance is rejected..."
                className="w-full text-xs p-2.5 rounded-base border border-border bg-background focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          )}

          {/* Closing Remarks / Notes */}
          <div className="space-y-1.5">
            <label htmlFor="officer-notes" className="text-xs font-semibold text-content-primary block">
              {targetStatus === "RESOLVED" ? "Formal Closing Remarks * (Minimum 10 characters)" : "Work Notes (Optional)"}
            </label>
            <textarea
              id="officer-notes"
              rows={3}
              required={targetStatus === "RESOLVED"}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                targetStatus === "RESOLVED"
                  ? "Describe the completed repair, asphalt volume used, or field action taken..."
                  : "Internal notes or progress status update for the citizen timeline..."
              }
              className="w-full text-xs p-3 rounded-base border border-border bg-background focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-base bg-status-danger/10 border border-status-danger/30 text-xs text-status-danger flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Confirm Status Transition
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
