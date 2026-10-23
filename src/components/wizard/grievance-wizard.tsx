"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WizardStepper } from "./wizard-stepper";
import { StepEvidence, EvidenceItem } from "./step-evidence";
import { StepLocation, LocationData } from "./step-location";
import { StepDetails, DetailsData } from "./step-details";
import { StepDuplicates } from "./step-duplicates";
import { StepReview } from "./step-review";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ThumbsUp, ArrowRight } from "lucide-react";

const STORAGE_KEY = "punesetu_grievance_draft_v5";

function getInitialDraft() {
  if (typeof window === "undefined") return null;
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function GrievanceWizard() {
  const router = useRouter();
  const draft = getInitialDraft();

  const [currentStep, setCurrentStep] = useState<number>(draft?.currentStep || 1);
  const [completedSteps, setCompletedSteps] = useState<number[]>(draft?.completedSteps || []);

  // Form State
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>(draft?.evidenceList || []);
  const [locationData, setLocationData] = useState<LocationData>(
    draft?.locationData || {
      latitude: null,
      longitude: null,
      landmark: "",
      locationDescription: "",
      wardId: "",
    }
  );
  const [detailsData, setDetailsData] = useState<DetailsData>(
    draft?.detailsData || {
      title: "",
      description: "",
      category: "ROADS_POTHOLES",
      priority: "MEDIUM",
      departmentId: "",
    }
  );

  // Endorsed alternative outcome
  const [endorsedToken, setEndorsedToken] = useState<string | null>(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Save draft whenever state changes
  useEffect(() => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          evidenceList,
          locationData,
          detailsData,
          currentStep,
          completedSteps,
        })
      );
    } catch {
      // Ignore quota exceeded
    }
  }, [evidenceList, locationData, detailsData, currentStep, completedSteps]);

  const markStepComplete = (step: number) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps([...completedSteps, step]);
    }
  };

  const handleNext = () => {
    markStepComplete(currentStep);
    setCurrentStep((prev) => Math.min(5, prev + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleGoToStep = (step: number) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Alternative outcome: User endorses existing grievance instead of creating duplicate
  const handleEndorseSuccess = (token: string) => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
    setEndorsedToken(token);
  };

  // Final submission to backend
  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);

    const payload = {
      title: detailsData.title.trim(),
      description: detailsData.description.trim(),
      category: detailsData.category,
      priority: detailsData.priority,
      departmentId: detailsData.departmentId || null,
      wardId: locationData.wardId || null,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      landmark: locationData.landmark.trim() || null,
      locationDescription: locationData.locationDescription.trim() || null,
      evidence: evidenceList.map((e) => ({
        evidenceType: e.evidenceType,
        storageKey: e.storageKey,
        originalFilename: e.originalFilename,
        mimeType: e.mimeType,
        sizeBytes: e.sizeBytes,
        caption: e.caption || null,
      })),
    };

    try {
      const res = await fetch("/api/grievances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit grievance to the server.");
      }

      // Clear draft on successful persistence
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {}

      // Navigate to confirmation page
      router.push(`/grievances/confirmation/${data.trackingToken}`);
    } catch (err: any) {
      console.error("Submission error:", err);
      setSubmitError(err.message || "An unexpected error occurred during submission.");
      setSubmitting(false);
    }
  };

  // If user chose Option A in Step 4 and endorsed an existing grievance:
  if (endorsedToken) {
    return (
      <Card className="p-8 border-status-success/30 bg-surface shadow-elevated text-center space-y-4 max-w-xl mx-auto">
        <div className="w-16 h-16 rounded-full bg-status-success/10 text-status-success flex items-center justify-center mx-auto">
          <ThumbsUp className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <Badge variant="success" size="sm">
            Endorsement Recorded
          </Badge>
          <h2 className="text-xl font-bold text-content-primary">
            Thank you for supporting community redressal!
          </h2>
          <p className="text-xs text-content-secondary leading-relaxed max-w-md mx-auto">
            Your endorsement on grievance <strong className="font-mono text-brand">{endorsedToken}</strong> has been registered. This boosts the issue urgency score for PMC ward engineers without creating redundant duplicate cases.
          </p>
        </div>
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="primary"
            onClick={() => router.push("/citizen/dashboard")}
          >
            Go to Citizen Dashboard
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setEndorsedToken(null);
              setCurrentStep(1);
            }}
          >
            File Another Report
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 5-Step Stepper Header */}
      <WizardStepper
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={handleGoToStep}
      />

      {/* Step Container Card */}
      <Card className="p-6 sm:p-8 border-border bg-surface shadow-card">
        {currentStep === 1 && (
          <StepEvidence
            evidenceList={evidenceList}
            onChange={setEvidenceList}
            onNext={handleNext}
          />
        )}

        {currentStep === 2 && (
          <StepLocation
            data={locationData}
            onChange={setLocationData}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 3 && (
          <StepDetails
            data={detailsData}
            onChange={setDetailsData}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 4 && (
          <StepDuplicates
            latitude={locationData.latitude}
            longitude={locationData.longitude}
            category={detailsData.category}
            onNext={handleNext}
            onBack={handleBack}
            onEndorseSuccess={handleEndorseSuccess}
          />
        )}

        {currentStep === 5 && (
          <StepReview
            evidenceList={evidenceList}
            locationData={locationData}
            detailsData={detailsData}
            onGoToStep={handleGoToStep}
            onSubmit={handleSubmit}
            onBack={handleBack}
            submitting={submitting}
            submitError={submitError}
          />
        )}
      </Card>
    </div>
  );
}
