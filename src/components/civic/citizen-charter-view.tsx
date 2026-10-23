"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Clock,
  FileText,
  AlertTriangle,
  Scale,
  ArrowRight,
  ExternalLink,
  HelpCircle,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language/language-provider";
import {
  STATUTORY_NOTIFIED_SERVICES,
  PUNESETU_SLA_BENCHMARKS,
} from "@/lib/civic/charter-data";

export function CitizenCharterView() {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"distinction" | "sla" | "rts" | "escalation">("distinction");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Audio accessibility readout
  const handleToggleAudio = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported by your browser.");
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    const script =
      language === "mr"
        ? "पुणे सेतू नागरिक सनद आणि लोकसेवा हक्क. महाराष्ट्र लोकसेवा हक्क अधिनियम २०१५ अंतर्गत अधिसूचित सेवा आणि पुणे सेतू सेवा मुदत मानके. आणीबाणी सेवा २४ तास, उच्च प्राधान्य ४८ तास, मध्यम ७२ तास आणि कमी प्राधान्य ७ दिवस. मुदत संपल्यास वरिष्ठांकडे दाद मागण्याचा नागरिकांना पूर्ण अधिकार आहे."
        : language === "hi"
        ? "पुणे सेतु नागरिक घोषणापत्र और लोक सेवा अधिकार। महाराष्ट्र लोक सेवा अधिकार अधिनियम २०१५ के अंतर्गत अधिसूचित सेवाएं और पुणे सेतु सेवा लक्ष्य। आपातकालीन सेवा २४ घंटे, उच्च प्राथमिकता ४८ घंटे, मध्यम ७२ घंटे और सामान्य ७ दिन। समय-सीमा बीतने पर उच्च स्तर पर अपील का अधिकार।"
        : "PuneSetu Citizen Charter and Civic Rights Overview. Under the Maharashtra Right to Public Services Act 2015, citizens have statutory rights to notified services. PuneSetu defines municipal resolution targets: Emergency 24 hours, High Priority 48 hours, Medium Priority 72 hours, and Low Priority 7 days. Escalation is guaranteed when deadlines are breached.";

    const utterance = new SpeechSynthesisUtterance(script);
    utterance.lang = language === "mr" ? "mr-IN" : language === "hi" ? "hi-IN" : "en-IN";
    utterance.rate = 0.95;
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsPlayingAudio(true);
  };

  return (
    <div className="min-h-screen bg-background text-content-primary py-8 sm:py-12">
      <Container size="lg">
        {/* Page Header */}
        <div className="mb-8 border-b border-border pb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <div className="inline-flex items-center gap-2">
              <Badge variant="brand" size="md">
                <Scale className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                {t("charter.badge")}
              </Badge>
              <span className="text-xs text-content-secondary hidden sm:inline">
                Govt of Maharashtra • PMC
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleAudio}
              leftIcon={isPlayingAudio ? <VolumeX className="w-4 h-4 text-status-warning" /> : <Volume2 className="w-4 h-4 text-brand" />}
              className="text-xs"
              aria-label={isPlayingAudio ? t("a11y.stopAudio") : t("a11y.listenText")}
            >
              {isPlayingAudio ? t("a11y.stopAudio") : t("a11y.listenText")}
            </Button>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-content-primary mb-2">
            {t("charter.title")}
          </h1>
          <p className="text-sm sm:text-base text-content-secondary max-w-3xl leading-relaxed">
            {t("charter.subtitle")}
          </p>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex flex-wrap gap-2 border-b border-border mb-8 pb-2" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "distinction"}
            onClick={() => setActiveTab("distinction")}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-base transition-colors ${
              activeTab === "distinction"
                ? "bg-brand text-brand-contrast shadow-subtle"
                : "text-content-secondary hover:text-content-primary hover:bg-surface-hover"
            }`}
          >
            {language === "mr" ? "१. कायदेशीर फरक (RTS विरुद्ध सेतू)" : language === "hi" ? "१. कानूनी भेद (RTS बनाम सेतु)" : "1. Legal Distinction"}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "sla"}
            onClick={() => setActiveTab("sla")}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-base transition-colors ${
              activeTab === "sla"
                ? "bg-brand text-brand-contrast shadow-subtle"
                : "text-content-secondary hover:text-content-primary hover:bg-surface-hover"
            }`}
          >
            {language === "mr" ? "२. पुणे सेतू सेवा मुदत मानके (SLA)" : language === "hi" ? "२. सेवा लक्ष्य (SLA)" : "2. PuneSetu SLA Targets"}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "rts"}
            onClick={() => setActiveTab("rts")}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-base transition-colors ${
              activeTab === "rts"
                ? "bg-brand text-brand-contrast shadow-subtle"
                : "text-content-secondary hover:text-content-primary hover:bg-surface-hover"
            }`}
          >
            {language === "mr" ? "३. अधिसूचित सेवा (RTS महाराष्ट्र)" : language === "hi" ? "३. अधिसूचित सेवाएं (RTS)" : "3. Notified RTS Services"}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "escalation"}
            onClick={() => setActiveTab("escalation")}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-base transition-colors ${
              activeTab === "escalation"
                ? "bg-brand text-brand-contrast shadow-subtle"
                : "text-content-secondary hover:text-content-primary hover:bg-surface-hover"
            }`}
          >
            {language === "mr" ? "४. वरिष्ठांकडे दाद (Escalations)" : language === "hi" ? "४. एस्केलेशन व अपील" : "4. Escalation Rights"}
          </button>
        </div>

        {/* TAB 1: LEGAL DISTINCTION */}
        {activeTab === "distinction" && (
          <div className="space-y-6">
            <div className="p-4 sm:p-6 rounded-base border-2 border-brand/20 bg-surface shadow-subtle">
              <div className="flex items-start gap-3.5 mb-3">
                <Scale className="w-6 h-6 text-brand shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-content-primary">
                    {t("charter.distinction.title")}
                  </h2>
                  <p className="text-xs sm:text-sm text-content-secondary mt-1">
                    Understanding the jurisdictional and legal boundary between statutory notified services and physical civic complaints.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 rounded-base border border-border bg-surface-muted/50">
                  <Badge variant="info" size="sm" className="mb-2">
                    Statutory Notified Services (RTS)
                  </Badge>
                  <h3 className="text-sm font-bold text-content-primary mb-1">
                    Maharashtra Right to Public Services Act, 2015
                  </h3>
                  <p className="text-xs text-content-secondary leading-relaxed mb-3">
                    {t("charter.distinction.statutory")}
                  </p>
                  <ul className="text-xs text-content-primary space-y-1 list-disc list-inside">
                    <li>Birth & Death Certificates</li>
                    <li>Water & Sewer Connection Sanctions</li>
                    <li>Trade Licenses & Building Plan NOCs</li>
                    <li>Statutory First & Second Appellate Tribunal</li>
                  </ul>
                  <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-[11px] text-content-muted">
                    <span>Governing Body: MCRPS</span>
                    <a
                      href="https://aaplesarkar.mahaonline.gov.in"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-brand hover:underline font-medium"
                    >
                      Aaple Sarkar Portal <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                </div>

                <div className="p-4 rounded-base border border-border bg-surface-muted/50">
                  <Badge variant="warning" size="sm" className="mb-2">
                    Municipal Civic Grievances (PuneSetu)
                  </Badge>
                  <h3 className="text-sm font-bold text-content-primary mb-1">
                    Physical Municipal Infrastructure Operations
                  </h3>
                  <p className="text-xs text-content-secondary leading-relaxed mb-3">
                    {t("charter.distinction.internal")}
                  </p>
                  <ul className="text-xs text-content-primary space-y-1 list-disc list-inside">
                    <li>Road Potholes & Asphalt Maintenance</li>
                    <li>Solid Waste & Overflowing Community Bins</li>
                    <li>Sewer Line Blockage & Stormwater Drainage</li>
                    <li>Streetlight Failures & Live Electrical Hazards</li>
                  </ul>
                  <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-[11px] text-content-muted">
                    <span>Enforcement: PuneSetu SLA Timer</span>
                    <Link
                      href="/grievances/new"
                      className="inline-flex items-center text-accent hover:underline font-medium"
                    >
                      Report Civic Issue <ArrowRight className="w-3 h-3 ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <Card className="p-5">
              <h3 className="text-sm font-bold text-content-primary mb-2 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-brand" aria-hidden="true" />
                Frequently Asked Legal Questions
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <p className="font-semibold text-content-primary">Q: Is every civic complaint guaranteed to be solved in 21 days under RTS?</p>
                  <p className="text-content-secondary mt-0.5">
                    No. The RTS Act strictly applies to specific legally notified services (such as certificates and permits). Physical grievances (e.g. repaving a damaged road or replacing a sewer line) are municipal works governed by Pune Municipal Corporation internal SLA targets and engineering work orders.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-content-primary">Q: What happens if an official ignores a PuneSetu grievance?</p>
                  <p className="text-content-secondary mt-0.5">
                    PuneSetu enforces automated SLA deadline tracking. Once an issue breaches its target resolution window by 48 hours, it is automatically flagged for Administrative Review in the Municipal Command Center, and the citizen gains the right to file an official escalation appeal.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 2: PUNESETU SLA BENCHMARKS */}
        {activeTab === "sla" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-content-primary mb-1">
                {t("charter.sla.heading")}
              </h2>
              <p className="text-xs sm:text-sm text-content-secondary mb-4">
                Internal resolution targets configured for Pune Municipal Corporation engineering divisions across all 15 administrative prabhags.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PUNESETU_SLA_BENCHMARKS.map((bench) => (
                <div
                  key={bench.priority}
                  className="p-5 rounded-base border border-border bg-surface shadow-subtle hover:border-brand/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge
                      variant={
                        bench.priority === "EMERGENCY"
                          ? "error"
                          : bench.priority === "HIGH"
                          ? "warning"
                          : bench.priority === "MEDIUM"
                          ? "info"
                          : "neutral"
                      }
                      size="md"
                    >
                      <Clock className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                      {bench.targetHours < 48 ? `${bench.targetHours} Hours` : `${Math.floor(bench.targetHours / 24)} Days`} Target
                    </Badge>
                    <span className="text-xs font-bold text-content-primary">
                      {language === "mr" ? bench.labelMr : language === "hi" ? bench.labelHi : bench.label}
                    </span>
                  </div>

                  <p className="text-xs text-content-secondary mb-3">
                    <strong className="text-content-primary font-medium">Examples: </strong>
                    {language === "mr" ? bench.examplesMr : language === "hi" ? bench.examplesHi : bench.examples}
                  </p>

                  <div className="text-[11px] text-content-muted pt-2 border-t border-border-subtle flex items-center justify-between">
                    <span>Priority Code: {bench.priority}</span>
                    <span>Clock starts upon submission</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-base bg-surface-muted/50 border border-border text-xs text-content-secondary">
              <strong className="text-content-primary">Resolution Evidence Guarantee: </strong>
              Under PuneSetu engineering protocols, an officer cannot mark a grievance as resolved without providing photographic evidence of the completed repair alongside minimum 10-character closing remarks.
            </div>
          </div>
        )}

        {/* TAB 3: STATUTORY NOTIFIED SERVICES (RTS) */}
        {activeTab === "rts" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-content-primary mb-1">
                {t("charter.statutoryList.title")}
              </h2>
              <p className="text-xs sm:text-sm text-content-secondary mb-4">
                Services officially notified under the Maharashtra Right to Public Services Act, 2015 delivered via Pune Municipal Corporation ward offices.
              </p>
            </div>

            <div className="overflow-x-auto rounded-base border border-border bg-surface">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface-muted/60 text-content-primary font-bold">
                    <th className="p-3">Notified Public Service</th>
                    <th className="p-3">Department</th>
                    <th className="p-3 whitespace-nowrap">Statutory Limit</th>
                    <th className="p-3">Designated Officer</th>
                    <th className="p-3">Appellate Authorities</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {STATUTORY_NOTIFIED_SERVICES.map((srv) => (
                    <tr key={srv.id} className="hover:bg-surface-hover/50 transition-colors">
                      <td className="p-3">
                        <p className="font-bold text-content-primary">
                          {language === "mr" ? srv.nameMr : language === "hi" ? srv.nameHi : srv.name}
                        </p>
                        <p className="text-[11px] text-content-secondary mt-0.5">
                          {srv.requiredDocuments.join(" • ")}
                        </p>
                      </td>
                      <td className="p-3 text-content-secondary">
                        {language === "mr" ? srv.departmentMr : srv.department}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <Badge variant="brand" size="sm">
                          {srv.timelineDays} Days
                        </Badge>
                      </td>
                      <td className="p-3 text-content-secondary">
                        {srv.designatedOfficer}
                      </td>
                      <td className="p-3 text-content-muted text-[11px]">
                        <p>1st: {srv.firstAppellateAuthority}</p>
                        <p>2nd: {srv.secondAppellateAuthority}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 rounded-base bg-surface-muted/30 border border-border text-[11px] text-content-muted flex items-center justify-between">
              <span>{t("charter.source")}</span>
              <a
                href="https://aaplesarkar.mahaonline.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand hover:underline font-medium inline-flex items-center"
              >
                MCRPS Official Gazette <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
          </div>
        )}

        {/* TAB 4: ESCALATION & CITIZEN RIGHTS */}
        {activeTab === "escalation" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-content-primary mb-1">
                {t("charter.escalation.heading")}
              </h2>
              <p className="text-xs sm:text-sm text-content-secondary mb-4">
                How citizens can escalate unresolved complaints within the municipal oversight framework.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-base border border-border bg-surface shadow-subtle">
                <span className="text-xl font-bold text-brand">1</span>
                <h3 className="text-sm font-bold text-content-primary mt-1 mb-1">
                  Automatic SLA Default
                </h3>
                <p className="text-xs text-content-secondary leading-relaxed">
                  {t("charter.escalation.p1")}
                </p>
              </div>

              <div className="p-4 rounded-base border border-border bg-surface shadow-subtle">
                <span className="text-xl font-bold text-accent">2</span>
                <h3 className="text-sm font-bold text-content-primary mt-1 mb-1">
                  Citizen Appeal Trigger
                </h3>
                <p className="text-xs text-content-secondary leading-relaxed">
                  {t("charter.escalation.p2")}
                </p>
              </div>

              <div className="p-4 rounded-base border border-border bg-surface shadow-subtle">
                <span className="text-xl font-bold text-status-success">3</span>
                <h3 className="text-sm font-bold text-content-primary mt-1 mb-1">
                  Administrator Reassignment
                </h3>
                <p className="text-xs text-content-secondary leading-relaxed">
                  Central administrators inspect the case dossier, examine field officer notes, and can order cross-department reassignment or immediate contractor intervention.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-base border border-border bg-surface flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-content-primary">Have a complaint pending past its deadline?</h4>
                <p className="text-xs text-content-secondary">Enter your tracking token to review the audit trail and submit an escalation request.</p>
              </div>
              <Link href="/track">
                <Button variant="accent" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  {t("hero.cta.track")}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
