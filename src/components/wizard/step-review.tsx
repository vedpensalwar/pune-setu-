"use client";

import React, { useState } from "react";
import {
  FileText,
  MapPin,
  Clock,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Edit2,
  ShieldCheck,
  Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EvidenceItem } from "./step-evidence";
import { LocationData } from "./step-location";
import { DetailsData } from "./step-details";
import { ComplaintImage } from "@/components/civic/complaint-image";
import { useLanguage } from "@/components/language/language-provider";

interface StepReviewProps {
  evidenceList: EvidenceItem[];
  locationData: LocationData;
  detailsData: DetailsData;
  onGoToStep: (step: number) => void;
  onSubmit: () => Promise<void>;
  onBack: () => void;
  submitting: boolean;
  submitError: string | null;
}

export function StepReview({
  evidenceList,
  locationData,
  detailsData,
  onGoToStep,
  onSubmit,
  onBack,
  submitting,
  submitError,
}: StepReviewProps) {
  const { t } = useLanguage();
  const [agreed, setAgreed] = useState(true);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="brand" size="sm">
            Step 5 of 5
          </Badge>
          <span className="text-xs text-content-muted">Final Review &amp; Submission</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-content-primary">
          Verify Grievance Information
        </h2>
        <p className="text-xs sm:text-sm text-content-secondary mt-1">
          Please review your civic report before final submission. Once submitted, an official tracking token (<code className="font-mono text-brand">PS-PUN-YYYY-XXXXXX</code>) will be generated.
        </p>
      </div>

      {/* Submission Error Alert */}
      {submitError && (
        <div className="p-4 rounded-base bg-status-danger/10 border border-status-danger/30 flex items-start gap-3 text-xs text-status-danger">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Submission Failed</p>
            <p className="leading-relaxed">{submitError}</p>
          </div>
        </div>
      )}

      {/* 1. Issue Overview Card */}
      <Card className="p-4 sm:p-5 border-border bg-surface shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand" />
            <h3 className="text-xs font-bold text-content-primary uppercase tracking-wide">
              1. Issue Details
            </h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onGoToStep(3)}
            leftIcon={<Edit2 className="w-3 h-3" />}
            className="text-xs text-content-muted hover:text-brand"
          >
            Edit
          </Button>
        </div>

        <div className="space-y-2">
          <h4 className="text-base sm:text-lg font-bold text-content-primary leading-snug">
            {detailsData.title}
          </h4>
          <p className="text-xs text-content-secondary whitespace-pre-wrap leading-relaxed">
            {detailsData.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-border-subtle">
          <Badge variant="brand">
            Category: {detailsData.category.replace(/_/g, " ")}
          </Badge>
          <Badge
            variant={
              detailsData.priority === "EMERGENCY"
                ? "error"
                : detailsData.priority === "HIGH"
                ? "warning"
                : "neutral"
            }
          >
            Urgency: {detailsData.priority}
          </Badge>
          {detailsData.departmentName && (
            <Badge variant="neutral">
              Dept: {detailsData.departmentName}
            </Badge>
          )}
        </div>
      </Card>

      {/* 2. Location & Jurisdiction Card */}
      <Card className="p-4 sm:p-5 border-border bg-surface shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand" />
            <h3 className="text-xs font-bold text-content-primary uppercase tracking-wide">
              2. Location &amp; Prabhag Ward
            </h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onGoToStep(2)}
            leftIcon={<Edit2 className="w-3 h-3" />}
            className="text-xs text-content-muted hover:text-brand"
          >
            Edit
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-content-muted">Prabhag Ward Jurisdiction:</p>
            <p className="font-bold text-content-primary mt-0.5">
              {locationData.wardName
                ? `Ward ${locationData.wardNumber || ""}: ${locationData.wardName}`
                : "No ward selected (Will be routed via coordinates)"}
            </p>
          </div>

          <div>
            <p className="text-content-muted">Nearby Landmark:</p>
            <p className="font-bold text-content-primary mt-0.5">
              {locationData.landmark || "Not specified"}
            </p>
          </div>

          <div>
            <p className="text-content-muted">Geographic Coordinates:</p>
            <p className="font-mono font-bold text-brand mt-0.5">
              {locationData.latitude !== null && locationData.longitude !== null
                ? `${locationData.latitude}°N, ${locationData.longitude}°E`
                : "Not geotagged"}
            </p>
          </div>

          <div>
            <p className="text-content-muted">Location Details:</p>
            <p className="font-medium text-content-primary mt-0.5 truncate">
              {locationData.locationDescription || "None provided"}
            </p>
          </div>
        </div>
      </Card>

      {/* 3. Evidence Attached Card */}
      <Card className="p-4 sm:p-5 border-border bg-surface shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-brand" />
            <h3 className="text-xs font-bold text-content-primary uppercase tracking-wide">
              3. Supporting Evidence ({evidenceList.length})
            </h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onGoToStep(1)}
            leftIcon={<Edit2 className="w-3 h-3" />}
            className="text-xs text-content-muted hover:text-brand"
          >
            Edit
          </Button>
        </div>

        {evidenceList.length === 0 ? (
          <p className="text-xs text-content-muted italic">
            No files attached. Grievance will be filed with text and location descriptions only.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {evidenceList.map((item) => (
              <div
                key={item.id}
                className="rounded-base border border-border bg-surface-subtle p-2 space-y-1.5 overflow-hidden"
              >
                <div className="w-full h-20 rounded bg-surface border border-border overflow-hidden flex items-center justify-center">
                  {item.mimeType.startsWith("image/") ? (
                    <ComplaintImage
                      src={item.url}
                      alt={item.originalFilename}
                      className="w-full h-full"
                    />
                  ) : (
                    <FileText className="w-6 h-6 text-brand" />
                  )}
                </div>
                <p className="text-[11px] font-bold text-content-primary truncate">
                  {item.originalFilename}
                </p>
                <span className="text-[10px] text-content-muted block">
                  {(item.sizeBytes / 1024).toFixed(0)} KB
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Declaration Checkbox */}
      <div className="p-4 rounded-base bg-surface-subtle border border-border flex items-start gap-3">
        <input
          type="checkbox"
          id="declaration-cb"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-border text-brand focus:ring-brand"
        />
        <label htmlFor="declaration-cb" className="text-xs text-content-secondary leading-relaxed cursor-pointer">
          I confirm that this grievance represents a genuine civic problem observed in the Pune Municipal Corporation area. I understand that false or misleading reports impede municipal staff and emergency response.
        </label>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={submitting}
        >
          Back to Duplicate Check
        </Button>
        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={onSubmit}
          disabled={submitting || !agreed}
          leftIcon={submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
        >
          {submitting ? t("wizard.submittingGrievance") : t("wizard.submitGrievance")}
        </Button>
      </div>
    </div>
  );
}
