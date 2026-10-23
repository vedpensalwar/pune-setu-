"use client";

import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/language/language-provider";

export interface WizardStep {
  id: number;
  titleKey: string;
  shortTitle: string;
  description: string;
}

export const WIZARD_STEPS: WizardStep[] = [
  { id: 1, titleKey: "wizard.stepEvidence", shortTitle: "Evidence", description: "Photos, videos, or documents" },
  { id: 2, titleKey: "wizard.stepLocation", shortTitle: "Location", description: "GPS or map & Prabhag ward" },
  { id: 3, titleKey: "wizard.stepDetails", shortTitle: "Details", description: "Category, urgency & description" },
  { id: 4, titleKey: "wizard.stepDuplicates", shortTitle: "Duplicates", description: "Search within 500 metres" },
  { id: 5, titleKey: "wizard.stepReview", shortTitle: "Review", description: "Verify information & file" },
];

interface WizardStepperProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
  completedSteps: number[];
}

export function WizardStepper({ currentStep, onStepClick, completedSteps }: WizardStepperProps) {
  const { t } = useLanguage();
  return (
    <div className="w-full bg-surface border border-border rounded-base p-4 sm:p-5 shadow-card" aria-label="Grievance Submission Steps">
      <nav aria-label="Progress">
        <ol className="flex items-center justify-between gap-2 sm:gap-4">
          {WIZARD_STEPS.map((step, index) => {
            const isCurrent = step.id === currentStep;
            const isCompleted = completedSteps.includes(step.id);
            const isClickable = isCompleted || step.id <= currentStep;

            return (
              <li key={step.id} className="flex-1 min-w-0">
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onStepClick?.(step.id)}
                  className={cn(
                    "group w-full flex flex-col items-center sm:items-start text-left focus:outline-none rounded-subtle p-1.5 transition-colors",
                    isClickable ? "cursor-pointer hover:bg-surface-hover" : "cursor-not-allowed opacity-60"
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  <div className="flex items-center gap-2.5 w-full">
                    {/* Step Icon / Number Indicator */}
                    <div
                      className={cn(
                        "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all",
                        isCompleted
                          ? "bg-status-success text-white shadow-sm"
                          : isCurrent
                          ? "bg-brand text-white ring-4 ring-brand/20 shadow-sm"
                          : "bg-surface-subtle border border-border text-content-muted"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4 stroke-[3]" aria-hidden="true" />
                      ) : (
                        <span>{step.id}</span>
                      )}
                    </div>

                    {/* Step Title on desktop */}
                    <div className="hidden sm:block flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-xs font-bold truncate",
                          isCurrent ? "text-brand" : isCompleted ? "text-content-primary" : "text-content-muted"
                        )}
                      >
                        {t(step.titleKey)}
                      </p>
                      <p className="text-[10px] text-content-muted truncate">{step.description}</p>
                    </div>
                  </div>

                  {/* Mobile Short Label */}
                  <span
                    className={cn(
                      "sm:hidden text-[11px] font-medium mt-1 truncate max-w-[60px] text-center",
                      isCurrent ? "text-brand font-bold" : "text-content-muted"
                    )}
                  >
                    {step.shortTitle}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
