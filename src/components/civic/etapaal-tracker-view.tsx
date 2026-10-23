"use client";

import React, { useState } from "react";
import {
  FileText,
  Search,
  AlertCircle,
  Building,
  User,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Info,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language/language-provider";
import {
  lookupETapaalRecord,
  DEMO_ETAPAAL_RECORDS,
  type ETapaalRecord,
} from "@/lib/civic/etapaal-data";

export function ETapaalTrackerView() {
  const { language, t } = useLanguage();
  const [tokenInput, setTokenInput] = useState("ET-PMC-2026-08912");
  const [activeRecord, setActiveRecord] = useState<ETapaalRecord | null>(() =>
    lookupETapaalRecord("ET-PMC-2026-08912")
  );
  const [hasSearched, setHasSearched] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSearch = (token: string) => {
    const clean = token.trim();
    if (!clean) return;

    setErrorMsg(null);
    setHasSearched(true);
    const found = lookupETapaalRecord(clean);

    if (found) {
      setActiveRecord(found);
    } else {
      setActiveRecord(null);
      setErrorMsg(`${t("etapaal.notFound")} '${clean}'. ${t("etapaal.notFoundDesc")}`);
    }
  };

  return (
    <div className="min-h-screen bg-background text-content-primary py-8 sm:py-12">
      <Container size="lg">
        {/* Header */}
        <div className="mb-8 border-b border-border pb-6">
          <div className="inline-flex items-center gap-2 mb-3">
            <Badge variant="brand" size="md">
              <FileText className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
              {t("etapaal.badge")}
            </Badge>
            <Badge variant="warning" size="sm">
              Demonstration Mode
            </Badge>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-content-primary mb-2">
            {t("etapaal.title")}
          </h1>
          <p className="text-sm sm:text-base text-content-secondary max-w-3xl leading-relaxed">
            {t("etapaal.subtitle")}
          </p>

          {/* Honest Demonstration Mode Callout */}
          <div className="mt-5 p-4 rounded-base bg-surface-muted border-2 border-border flex items-start gap-3">
            <Info className="w-5 h-5 text-status-warning shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-xs leading-relaxed">
              <p className="font-bold text-content-primary mb-0.5">
                {t("etapaal.disclaimer.title")}
              </p>
              <p className="text-content-secondary">
                {t("etapaal.disclaimer.desc")}
              </p>
            </div>
          </div>
        </div>

        {/* Search Panel */}
        <div className="p-6 rounded-base border border-border bg-surface shadow-subtle mb-8">
          <label htmlFor="tapaal-token-input" className="block text-xs font-bold text-content-primary mb-2">
            {t("etapaal.inputLabel")}
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted" aria-hidden="true" />
              <input
                id="tapaal-token-input"
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch(tokenInput)}
                placeholder={t("etapaal.placeholder")}
                className="w-full h-11 pl-10 pr-4 text-sm font-mono rounded-base border border-border bg-background text-content-primary focus:outline-none focus:ring-2 focus:ring-focus-ring"
              />
            </div>
            <Button
              variant="accent"
              size="md"
              onClick={() => handleSearch(tokenInput)}
              className="font-bold text-xs"
            >
              {t("etapaal.trackButton")}
            </Button>
          </div>

          {/* Sample Token Buttons */}
          <div className="mt-4 pt-3 border-t border-border-subtle flex flex-wrap items-center gap-2">
            <span className="text-xs text-content-secondary">{t("etapaal.demoTokens")}</span>
            {DEMO_ETAPAAL_RECORDS.map((demo) => (
              <button
                key={demo.inwardNumber}
                type="button"
                onClick={() => {
                  setTokenInput(demo.inwardNumber);
                  handleSearch(demo.inwardNumber);
                }}
                className="px-2.5 py-1 text-xs font-mono font-semibold rounded-subtle bg-surface-muted hover:bg-surface-hover border border-border text-brand transition-colors"
              >
                {demo.inwardNumber}
              </button>
            ))}
          </div>
        </div>

        {/* Not Found Error State */}
        {errorMsg && (
          <div className="p-8 text-center rounded-base border border-dashed border-status-error/40 bg-status-error/5 mb-8">
            <AlertCircle className="w-8 h-8 mx-auto text-status-error mb-2" aria-hidden="true" />
            <h3 className="text-sm font-bold text-content-primary mb-1">Record Not Found</h3>
            <p className="text-xs text-content-secondary max-w-md mx-auto">{errorMsg}</p>
          </div>
        )}

        {/* Active Record Display */}
        {activeRecord && (
          <div className="space-y-6">
            {/* Record Particulars Card */}
            <Card className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-border pb-4">
                <div>
                  <span className="text-xs text-content-muted uppercase tracking-wider">Tapaal Inward Number</span>
                  <h2 className="text-xl font-bold font-mono text-content-primary">{activeRecord.inwardNumber}</h2>
                </div>
                <Badge
                  variant={
                    activeRecord.currentStatus === "DISPATCHED"
                      ? "success"
                      : activeRecord.currentStatus === "APPROVAL_STAGE"
                      ? "warning"
                      : "info"
                  }
                  size="md"
                >
                  {language === "mr" ? activeRecord.currentStatusLabelMr : language === "hi" ? activeRecord.currentStatusLabelHi : activeRecord.currentStatusLabel}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-content-muted block mb-1">{t("etapaal.subject")}:</span>
                  <p className="font-semibold text-content-primary text-sm leading-relaxed">
                    {language === "mr" ? activeRecord.subjectMr : language === "hi" ? activeRecord.subjectHi : activeRecord.subject}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-content-muted block mb-0.5">{t("etapaal.department")}:</span>
                    <span className="font-semibold text-content-primary">
                      {language === "mr" ? activeRecord.departmentMr : language === "hi" ? activeRecord.departmentHi : activeRecord.department}
                    </span>
                  </div>

                  <div>
                    <span className="text-content-muted block mb-0.5">Administrative Ward:</span>
                    <span className="font-semibold text-content-primary">
                      {language === "mr" ? activeRecord.wardNameMr : language === "hi" ? activeRecord.wardNameHi : activeRecord.wardName}
                    </span>
                  </div>

                  <div>
                    <span className="text-content-muted block mb-0.5">{t("etapaal.inwardDate")}:</span>
                    <span className="font-semibold text-content-primary font-mono">{activeRecord.inwardDate}</span>
                  </div>

                  <div>
                    <span className="text-content-muted block mb-0.5">{t("etapaal.currentDesk")}:</span>
                    <span className="font-semibold text-brand">
                      {language === "mr" ? activeRecord.currentDeskMr : language === "hi" ? activeRecord.currentDeskHi : activeRecord.currentDesk}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Movement Timeline */}
            <div className="p-6 rounded-base border border-border bg-surface">
              <h3 className="text-base font-bold text-content-primary mb-6 flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand" aria-hidden="true" />
                {t("etapaal.movementTimeline")}
              </h3>

              <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-border">
                {activeRecord.movementSteps.map((step) => (
                  <div key={step.stepIndex} className="relative flex items-start gap-4">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 text-xs font-bold ${
                        step.status === "COMPLETED"
                          ? "bg-status-success text-white"
                          : step.status === "ACTIVE"
                          ? "bg-brand text-brand-contrast ring-4 ring-brand/20"
                          : "bg-surface-muted text-content-muted border border-border"
                      }`}
                    >
                      {step.status === "COMPLETED" ? <CheckCircle2 className="w-4 h-4" /> : step.stepIndex}
                    </div>

                    <div className="flex-1 p-4 rounded-base border border-border bg-surface-muted/40 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-sm text-content-primary">
                          {language === "mr" ? step.deskNameMr : language === "hi" ? step.deskNameHi : step.deskName}
                        </span>
                        <span className="text-[11px] text-content-muted font-mono">{step.actionDate}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-content-secondary mb-2">
                        <User className="w-3.5 h-3.5 text-content-muted" />
                        <span className="font-medium">
                          {language === "mr" ? step.officerDesignationMr : language === "hi" ? step.officerDesignationHi : step.officerDesignation}
                        </span>
                      </div>

                      <p className="text-content-primary leading-relaxed">
                        {language === "mr" ? step.actionTakenMr : language === "hi" ? step.actionTakenHi : step.actionTaken}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
