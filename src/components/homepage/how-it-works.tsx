"use client";

import React from "react";
import {
  FileEdit,
  Search,
  CheckCircle,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/language/language-provider";

export function HowItWorks() {
  const { t } = useLanguage();

  const steps = [
    {
      number: "01",
      title: "Report with Geotag & Photo",
      marathi: "पुरावा आणि स्थानासह नोंदणी",
      icon: FileEdit,
      description:
        "Select your Prabhag ward, pinpoint the street location, select the responsible category, and upload photographic evidence directly from your device.",
      milestone: "Unique token issued (PS-PUN-YYYY-XXXXXX)",
    },
    {
      number: "02",
      title: "Track Assigned Department Action",
      marathi: "विभागीय कारवाईचा पारदर्शक पाठपुरावा",
      icon: Search,
      description:
        "Follow milestone transitions as your report is routed to the verified ward engineer and monitored against our 21-day application SLA target.",
      milestone: "Audited status timeline & SLA tracking",
    },
    {
      number: "03",
      title: "Inspect Photographic Resolution",
      marathi: "निवारण पुराव्यांची तपासणी",
      icon: CheckCircle,
      description:
        "Review verified post-repair photographs and formal remarks uploaded by field personnel before submitting citizen satisfaction feedback.",
      milestone: "Mandatory photo proof & case closure",
    },
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-24 bg-surface border-y border-border text-content-primary transition-colors">
      <Container size="lg">
        <div className="space-y-14">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-surface border border-accent/20 text-accent text-xs font-semibold tracking-wide uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
              <span>Civic Action Lifecycle</span>
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-content-primary tracking-tight">
              {t("howItWorks.title")}
            </h2>
            <p className="text-sm sm:text-base text-content-secondary leading-relaxed max-w-xl mx-auto font-normal">
              From on-street reporting to verified field resolution in three transparent, accountable steps.
            </p>
          </div>

          {/* 3 Steps Process Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.number}
                  className="p-7 rounded-2xl border border-border bg-background relative flex flex-col justify-between space-y-6 shadow-subtle hover:border-brand/50 hover:shadow-card transition-all duration-300 group"
                >
                  <div className="space-y-5">
                    {/* Step Number & Icon Header */}
                    <div className="flex items-center justify-between">
                      <span className="font-sans font-extrabold text-2xl text-brand tracking-tight group-hover:text-accent transition-colors">
                        Step {step.number}
                      </span>
                      <div className="w-11 h-11 rounded-xl bg-brand-surface border border-brand/20 flex items-center justify-center text-brand group-hover:bg-accent-surface group-hover:text-accent group-hover:border-accent/30 transition-colors">
                        <Icon className="w-5 h-5" aria-hidden="true" />
                      </div>
                    </div>

                    {/* Step Titles */}
                    <div className="space-y-1">
                      <h3 className="text-base sm:text-lg font-bold text-content-primary leading-snug">
                        {step.title}
                      </h3>
                      <p className="text-xs text-accent font-sans font-semibold">
                        {step.marathi}
                      </p>
                    </div>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-content-secondary leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Milestone Badge Footer */}
                  <div className="pt-4 border-t border-border-subtle flex items-center gap-2 text-xs font-medium text-brand">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" aria-hidden="true" />
                    <span>{step.milestone}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
