"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, AlertCircle, ArrowRight, ShieldCheck, Clock, FileText } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TopInfoStrip } from "@/components/layout/top-info-strip";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { isValidTrackingToken } from "@/lib/civic/token";

export default function TrackSearchPortalPage() {
  const router = useRouter();
  const [tokenInput, setTokenInput] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = tokenInput.trim().toUpperCase();

    if (!clean) {
      setErrorMsg("Please enter a tracking token.");
      return;
    }

    if (!isValidTrackingToken(clean)) {
      setErrorMsg("Invalid token format. Tokens follow format PS-PUN-YYYY-XXXXXX (e.g. PS-PUN-2026-621771).");
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);
    router.push(`/track/${clean}`);
  };

  const setSampleToken = (sample: string) => {
    setTokenInput(sample);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-content-primary">
      <TopInfoStrip />
      <PublicHeader />

      <main className="flex-1 py-12 sm:py-16">
        <Container size="md">
          <div className="space-y-8 max-w-xl mx-auto text-center">
            <div className="space-y-2">
              <span className="text-xs uppercase font-extrabold text-brand tracking-wider block">
                Public Redressal Auditing
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-content-primary tracking-tight">
                Track Municipal Grievance
              </h1>
              <p className="text-xs sm:text-sm text-content-secondary leading-relaxed">
                Enter your canonical tracking token to inspect live case milestones, department assignment, application SLA countdown, and resolution evidence.
              </p>
            </div>

            <Card className="p-6 sm:p-8 border-border bg-surface shadow-elevated text-left space-y-4">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="token-input" className="text-xs font-bold text-content-primary block">
                    Public Tracking Token *
                  </label>
                  <div className="relative">
                    <input
                      id="token-input"
                      type="text"
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                      placeholder="PS-PUN-2026-XXXXXX"
                      maxLength={20}
                      className="w-full text-sm font-mono p-3 pl-10 rounded-base border border-border bg-background focus:outline-none focus:ring-2 focus:ring-brand uppercase"
                    />
                    <Search className="w-4 h-4 text-content-muted absolute left-3.5 top-3.5" />
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-base bg-status-danger/10 border border-status-danger/30 text-xs text-status-danger flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full justify-center"
                  isLoading={isSubmitting}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Inspect Case Audit Trail
                </Button>
              </form>

              {/* Verified Examples Bar */}
              <div className="pt-3 border-t border-border space-y-2">
                <span className="text-[11px] font-semibold text-content-muted block">
                  Try demonstration tokens:
                </span>
                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setSampleToken("PS-PUN-2026-621771")}
                    className="font-mono text-brand hover:underline p-1.5 bg-brand/5 rounded-subtle border border-brand/20"
                  >
                    PS-PUN-2026-621771
                  </button>
                  <button
                    type="button"
                    onClick={() => setSampleToken("PS-PUN-2026-444444")}
                    className="font-mono text-brand hover:underline p-1.5 bg-brand/5 rounded-subtle border border-brand/20"
                  >
                    PS-PUN-2026-444444
                  </button>
                </div>
              </div>
            </Card>

            {/* Explanatory Policy Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              <div className="p-4 rounded-base bg-surface border border-border space-y-1">
                <Clock className="w-4 h-4 text-brand" />
                <h4 className="text-xs font-bold text-content-primary">21-Day SLA Benchmark</h4>
                <p className="text-[11px] text-content-secondary leading-relaxed">
                  Every civic ticket is tracked against an operational application benchmark to ensure timely municipal attention.
                </p>
              </div>

              <div className="p-4 rounded-base bg-surface border border-border space-y-1">
                <ShieldCheck className="w-4 h-4 text-status-success" />
                <h4 className="text-xs font-bold text-content-primary">Privacy by Design</h4>
                <p className="text-[11px] text-content-secondary leading-relaxed">
                  Exact residential GPS coordinates and citizen contact details are masked for general public audit visitors.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </main>

      <PublicFooter />
    </div>
  );
}
