"use client";

import React from "react";
import Image from "next/image";
import {
  ArrowRight,
  Search,
  Layers,
  MapPin,
  FileText,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language/language-provider";

interface HeroSectionProps {
  onReportClick: () => void;
  onTrackClick: () => void;
  onExploreClick: () => void;
}

export function HeroSection({
  onReportClick,
  onTrackClick,
  onExploreClick,
}: HeroSectionProps) {
  const { t } = useLanguage();

  return (
    <section id="home" className="relative py-12 sm:py-16 lg:py-20 bg-background text-content-primary transition-colors">
      <Container size="lg">
        {/* Editorial Hero Header */}
        <div className="max-w-3xl mx-auto text-center space-y-6">
          {/* Subtle Civic Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface border border-border shadow-subtle text-xs text-content-secondary">
            <span className="w-2 h-2 rounded-full bg-accent" aria-hidden="true" />
            <span className="font-semibold text-content-primary">Civic Redressal Platform</span>
            <span className="text-content-muted">•</span>
            <span className="font-sans font-medium text-brand">पुणे नागरिक सेतू</span>
          </div>

          {/* Clear, Authoritative Civic Heading (Contemporary Sans-Serif) */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.12] text-content-primary">
            <span>Your neighbourhood. </span>
            <span className="text-brand">Your voice. </span>
            <span className="text-accent">A better Pune.</span>
          </h1>

          {/* Honest, Clear Value Proposition */}
          <p className="text-base sm:text-lg text-content-secondary leading-relaxed max-w-2xl mx-auto font-normal">
            An open civic grievance platform for Pune residents. Report local municipal problems, follow timestamped department updates, and track verified resolutions in your neighbourhood.
          </p>

          {/* Obvious User Journey CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              variant="accent"
              size="lg"
              onClick={onReportClick}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="shadow-subtle hover:shadow-card font-semibold px-6"
            >
              {t("hero.cta.report")}
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={onTrackClick}
              leftIcon={<Search className="w-4 h-4 text-brand" />}
              className="font-medium bg-surface hover:bg-surface-hover"
            >
              {t("hero.cta.track")}
            </Button>

            <Button
              variant="ghost"
              size="lg"
              onClick={onExploreClick}
              leftIcon={<Layers className="w-4 h-4 text-content-secondary" />}
              className="text-content-secondary hover:text-content-primary"
            >
              {t("hero.cta.explore")}
            </Button>
          </div>
        </div>

        {/* Expansive Photographic Centerpiece (Authentic Pune Civic Streetscape) */}
        <div className="mt-12 sm:mt-16">
          <div className="relative rounded-2xl overflow-hidden border border-border bg-surface shadow-card">
            <div className="relative w-full aspect-[21/9] sm:aspect-[2.4/1] min-h-[280px] bg-surface-muted overflow-hidden group">
              <Image
                src="/images/pune_civic_hero.jpg"
                alt="Documentary photograph of Pune streetscape along Fergusson College Road, showing historic Deccan stone wada architecture, tree-lined avenue, and clean pedestrian walkways."
                fill
                priority
                className="object-cover object-center group-hover:scale-102 transition-transform duration-700 ease-out"
                sizes="(max-width: 1200px) 100vw, 1200px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand/70 via-transparent to-transparent pointer-events-none" />

              {/* Verified Location Identifier */}
              <div className="absolute top-4 left-4 bg-surface/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-border/80 shadow-subtle flex items-center gap-2 text-xs font-medium text-content-primary">
                <MapPin className="w-3.5 h-3.5 text-accent shrink-0" aria-hidden="true" />
                <span>Fergusson College Road Precinct • Shivajinagar</span>
              </div>

              {/* Photo Caption Strip */}
              <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-white text-xs">
                <p className="font-sans font-medium text-sm sm:text-base text-white/95">
                  &ldquo;A cleaner, safer city begins with active community participation.&rdquo;
                </p>
                <span className="text-[11px] text-white/75 shrink-0">
                  Pune Municipal Area • 15 Administrative Wards Reference
                </span>
              </div>
            </div>

            {/* 3-Column Honest Value Narrative */}
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border bg-surface text-left">
              <div className="p-6 sm:p-7 space-y-2">
                <div className="flex items-center gap-2 text-brand">
                  <div className="w-8 h-8 rounded-lg bg-brand-surface border border-brand/20 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-brand" />
                  </div>
                  <h2 className="text-sm sm:text-base font-bold text-content-primary">
                    1. Report Local Issues
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-content-secondary leading-relaxed">
                  Pinpoint road hazards, drainage blocks, or water leaks with photographic evidence and street location.
                </p>
              </div>

              <div className="p-6 sm:p-7 space-y-2">
                <div className="flex items-center gap-2 text-brand">
                  <div className="w-8 h-8 rounded-lg bg-brand-surface border border-brand/20 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-brand" />
                  </div>
                  <h2 className="text-sm sm:text-base font-bold text-content-primary">
                    2. Follow Ward Updates
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-content-secondary leading-relaxed">
                  Track timestamped audit updates as your report is routed to the designated municipal department desk.
                </p>
              </div>

              <div className="p-6 sm:p-7 space-y-2">
                <div className="flex items-center gap-2 text-brand">
                  <div className="w-8 h-8 rounded-lg bg-brand-surface border border-brand/20 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-status-success" />
                  </div>
                  <h2 className="text-sm sm:text-base font-bold text-content-primary">
                    3. Evidence-Backed Closure
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-content-secondary leading-relaxed">
                  Field personnel upload post-work photographs for citizen review before grievances are marked resolved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
