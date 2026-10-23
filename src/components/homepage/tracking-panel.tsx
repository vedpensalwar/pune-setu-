"use client";

import React, { useState } from "react";
import { Search, AlertCircle, ArrowRight, CheckCircle2, Clock, MapPin, Building2, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/language/language-provider";
import { useRouter } from "next/navigation";
import { isValidTrackingToken } from "@/lib/civic/token";
import Link from "next/link";

interface FoundGrievanceSummary {
  token: string;
  category: string;
  title: string;
  ward: string;
  department: string;
  status: string;
  submittedAt: string;
  isDemo?: boolean;
}

export function TrackingPanel() {
  const router = useRouter();
  const { t } = useLanguage();
  const [tokenInput, setTokenInput] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<FoundGrievanceSummary | null>(null);

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanToken = tokenInput.trim().toUpperCase();

    if (!cleanToken) {
      setInputError("Please enter a tracking token.");
      setLookupResult(null);
      setBackendError(null);
      return;
    }

    // Token format validation: PS-PUN-YYYY-XXXXXX
    if (!isValidTrackingToken(cleanToken)) {
      setInputError(
        "Invalid format. Standard tokens follow format PS-PUN-YYYY-XXXXXX (e.g. PS-PUN-2026-621771)."
      );
      setLookupResult(null);
      setBackendError(null);
      return;
    }

    setInputError(null);
    setBackendError(null);
    setIsLoading(true);

    try {
      // Query the authoritative grievance lookup endpoint
      const res = await fetch(`/api/grievances/${encodeURIComponent(cleanToken)}`);
      
      if (res.ok) {
        const data = await res.json();
        if (data?.grievance) {
          setLookupResult({
            token: cleanToken,
            category: data.grievance.category || "General Civic",
            title: data.grievance.title,
            ward: data.grievance.ward || "Pune Municipal Ward",
            department: data.grievance.department || "Municipal Operations",
            status: data.grievance.status,
            submittedAt: data.grievance.createdAt
              ? new Date(data.grievance.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "Recently filed",
          });
          setIsLoading(false);
          return;
        }
      }

      if (res.status === 404) {
        // Honest error reporting: never fake a successful result for nonexistent tokens
        setBackendError(
          `Grievance record not found. No registered complaint matches token ${cleanToken} in the PuneSetu database. Please verify the number on your receipt or submit a new grievance.`
        );
        setLookupResult(null);
      } else {
        const errData = await res.json().catch(() => ({}));
        setBackendError(
          errData?.error || "An unexpected error occurred while checking the grievance tracking database."
        );
        setLookupResult(null);
      }
    } catch {
      // In case of network interruption or server issue, navigate to canonical route for full SSR handling
      router.push(`/track/${cleanToken}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickToken = (token: string) => {
    setTokenInput(token);
    setInputError(null);
    setBackendError(null);
  };

  return (
    <section id="track-panel" className="py-14 sm:py-20 bg-surface-muted/40 border-y border-border transition-colors">
      <Container size="md">
        <div className="space-y-8 max-w-2xl mx-auto text-center">
          {/* Section Header */}
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-surface border border-brand/15 text-brand text-xs font-semibold tracking-wide uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-brand" aria-hidden="true" />
              <span>Grievance Audit & Tracking</span>
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-content-primary tracking-tight">
              {t("track.title")}
            </h2>
            <p className="text-sm sm:text-base text-content-secondary leading-relaxed max-w-lg mx-auto">
              {t("track.subtitle")}
            </p>
          </div>

          {/* Tracking Form Card */}
          <div className="p-6 sm:p-8 rounded-2xl border border-border bg-surface shadow-card text-left space-y-4 transition-colors">
            <form onSubmit={handleTrackSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="hp-tracking-input" className="block text-xs font-bold text-content-primary">
                  Complaint Tracking Token <span className="text-status-error">*</span>
                </label>
                <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                  <div className="relative flex-1">
                    <input
                      id="hp-tracking-input"
                      type="text"
                      required
                      placeholder="e.g. PS-PUN-2026-621771"
                      value={tokenInput}
                      onChange={(e) => {
                        setTokenInput(e.target.value.toUpperCase());
                        if (inputError) setInputError(null);
                        if (backendError) setBackendError(null);
                      }}
                      maxLength={20}
                      className="w-full h-11 text-sm font-mono px-3.5 pl-10 rounded-base border border-border bg-background focus:outline-none focus:ring-2 focus:ring-brand uppercase placeholder:normal-case placeholder:font-sans transition-colors"
                    />
                    <Search className="w-4 h-4 text-content-muted absolute left-3.5 top-3.5" aria-hidden="true" />
                  </div>

                  <Button
                    type="submit"
                    variant="accent"
                    size="md"
                    isLoading={isLoading}
                    loadingText="Checking Record..."
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    className="shrink-0 font-semibold px-5 shadow-subtle"
                  >
                    {t("track.button")}
                  </Button>
                </div>
                <p className="text-[11px] text-content-muted">
                  Issued upon grievance filing in <code className="font-mono text-brand font-semibold">PS-PUN-YYYY-XXXXXX</code> format.
                </p>
              </div>

              {/* Client-side Validation Error Feedback */}
              {inputError && (
                <div
                  role="alert"
                  className="p-3 rounded-base bg-status-error-surface border border-status-error-border text-xs text-status-error flex items-start gap-2 animate-in fade-in duration-150"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{inputError}</span>
                </div>
              )}

              {/* Authoritative Backend Error Presentation */}
              {backendError && (
                <div
                  role="alert"
                  className="p-3.5 rounded-base bg-status-error-surface border border-status-error-border text-xs text-status-error space-y-1.5 animate-in fade-in duration-150"
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Record Verification Notice</span>
                  </div>
                  <p className="text-content-secondary leading-relaxed">
                    {backendError}
                  </p>
                </div>
              )}

              {/* Demonstration Tokens Helper */}
              <div className="pt-2 border-t border-border-subtle flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-[11px] text-content-muted font-medium">
                  Try verified demonstration tokens:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickToken("PS-PUN-2026-621771")}
                    className="font-mono text-[11px] text-brand hover:text-brand-hover bg-brand-surface/70 px-2 py-0.5 rounded border border-brand/20 transition-colors"
                  >
                    PS-PUN-2026-621771
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickToken("PS-PUN-2026-444444")}
                    className="font-mono text-[11px] text-brand hover:text-brand-hover bg-brand-surface/70 px-2 py-0.5 rounded border border-brand/20 transition-colors"
                  >
                    PS-PUN-2026-444444
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Result Card: Verified Persistent Record Found */}
          {lookupResult && (
            <div className="p-6 rounded-xl border border-border bg-surface shadow-card text-left space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-content-primary">
                    {lookupResult.token}
                  </span>
                  <Badge variant="brand" size="sm">
                    Verified Case
                  </Badge>
                </div>
                <Badge
                  variant={
                    lookupResult.status === "RESOLVED"
                      ? "success"
                      : lookupResult.status === "IN_PROGRESS"
                      ? "warning"
                      : "neutral"
                  }
                  size="sm"
                  className="uppercase font-semibold text-[10px]"
                >
                  {lookupResult.status.replace("_", " ")}
                </Badge>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-content-secondary">
                  <span className="font-semibold text-brand">{lookupResult.category}</span>
                  <span>•</span>
                  <span>{lookupResult.ward}</span>
                  <span>•</span>
                  <span>Filed {lookupResult.submittedAt}</span>
                </div>
                <h3 className="text-base font-bold text-content-primary">
                  {lookupResult.title}
                </h3>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border-subtle">
                <div className="text-xs text-content-secondary flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-brand" />
                  <span>{lookupResult.department}</span>
                </div>

                <Link href={`/track/${lookupResult.token}`}>
                  <Button
                    variant="primary"
                    size="sm"
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    className="w-full sm:w-auto font-semibold"
                  >
                    Inspect Full Official Audit Trail
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
