"use client";

import React, { useState } from "react";
import { TopInfoStrip } from "@/components/layout/top-info-strip";
import { PublicHeader } from "@/components/layout/public-header";
import { HeroSection } from "@/components/homepage/hero-section";
import { TrackingPanel } from "@/components/homepage/tracking-panel";
import { CategoriesSection } from "@/components/homepage/categories-section";
import { HowItWorks } from "@/components/homepage/how-it-works";
import { CommunityIssuesPreview } from "@/components/homepage/community-issues-preview";
import { CivicMapPreview } from "@/components/homepage/civic-map-preview";
import { TransparencySection } from "@/components/homepage/transparency-section";
import { ServiceDiscovery } from "@/components/homepage/service-discovery";
import { PublicFooter } from "@/components/layout/public-footer";
import { FoundationShowcase } from "@/components/foundation/foundation-showcase";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [showFoundationInspector, setShowFoundationInspector] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-content-primary">
      {/* 1. Top Verified Information Strip */}
      <TopInfoStrip />

      {/* 2. Public Desktop & Mobile Navigation Header */}
      <PublicHeader />

      {/* 3. Main Application Flow */}
      <main className="flex-1">
        {/* Section A: Hero with Editorial Layout & Case Lifecycle Snapshot */}
        <HeroSection
          onReportClick={() => router.push("/grievances/new")}
          onTrackClick={() => scrollTo("track-panel")}
          onExploreClick={() => scrollTo("community-feed")}
        />

        {/* Section B: Prominent Complaint Tracking Form with Format Validation */}
        <TrackingPanel />

        {/* Section C: 3-Step Lifecycle (Report -> Track -> Review Resolution) */}
        <HowItWorks />

        {/* Section D: 9 Civic Issue Categories with Responsible Ward Departments */}
        <CategoriesSection />

        {/* Section E: Filterable Community Issues Feed Preview */}
        <CommunityIssuesPreview />

        {/* Section F: Interactive Illustrative Civic Map of Pune Wards */}
        <CivicMapPreview />

        {/* Section G: Institutional Transparency & Accountability Pillars */}
        <TransparencySection />

        {/* Section H: Civic Services & 15 Wards Directory */}
        <ServiceDiscovery />

        {/* Section I: Engineering & Design System Audit Drawer (Preserving Version 1 Verification) */}
        <section aria-labelledby="foundation-heading" className="py-10 bg-background border-t border-border">
          <Container size="lg">
            <div className="p-5 sm:p-6 rounded-base border border-border bg-surface shadow-subtle space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="brand" size="sm">
                      Engineering Architecture
                    </Badge>
                    <span className="text-xs font-mono font-bold text-content-muted">
                      v1.0 & v2.0 Audit
                    </span>
                  </div>
                  <h2 id="foundation-heading" className="text-base sm:text-lg font-bold text-content-primary">
                    Design Tokens & Reusable UI Component Showcase
                  </h2>
                  <p className="text-xs text-content-secondary">
                    Inspect foundational buttons, inputs, dialogs, toasts, and WCAG AAA tokens created in Version 1.
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFoundationInspector(!showFoundationInspector)}
                  rightIcon={
                    showFoundationInspector ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )
                  }
                  className="shrink-0"
                >
                  {showFoundationInspector ? "Hide Inspector" : "Open UI Component Inspector"}
                </Button>
              </div>

              {showFoundationInspector && (
                <div className="pt-4 border-t border-border-subtle animate-in fade-in duration-200">
                  <FoundationShowcase />
                </div>
              )}
            </div>
          </Container>
        </section>
      </main>

      {/* 4. Official Public Footer with Policies and Affiliation Disclaimer */}
      <PublicFooter />

      {/* Report a Civic Issue Status Dialog */}
      <Dialog
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="Grievance Reporting Wizard — Version 5"
        description="Structured multi-step civic issue filing for Pune citizens."
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setReportModalOpen(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setReportModalOpen(false);
                scrollTo("track-panel");
              }}
            >
              Go to Tracking Panel
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs text-content-secondary leading-relaxed">
          <div className="p-3.5 rounded-base bg-brand-surface border border-brand/20 text-content-primary space-y-1">
            <div className="flex items-center gap-1.5 text-brand font-bold">
              <ShieldCheck className="w-4 h-4 text-brand shrink-0" aria-hidden="true" />
              <span>Full Guided Filing Wizard Scheduled for Version 5</span>
            </div>
            <p className="text-content-secondary">
              Following persistent database schema deployment in Version 4, the full multi-step reporting wizard (geocoding, categorization, evidence upload, and token generation) will be activated.
            </p>
          </div>
          <p>
            In Version 2, please explore the <strong>Issue Categories</strong>, <strong>Community Feed</strong>, and <strong>Complaint Tracking Panel</strong> above.
          </p>
        </div>
      </Dialog>
    </div>
  );
}
