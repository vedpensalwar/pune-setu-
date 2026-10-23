"use client";

import React from "react";
import {
  FileCheck,
  Camera,
  Users,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { Container } from "@/components/ui/container";

export function TransparencySection() {
  const pillars = [
    {
      title: "Immutable Status History",
      icon: FileCheck,
      description:
        "Every change in complaint state is timestamped and logged with officer identification. Progress entries cannot be quietly overwritten or deleted.",
    },
    {
      title: "Evidence-Backed Closure",
      icon: Camera,
      description:
        "Cases cannot be formally closed with text remarks alone. Field personnel are required to submit post-work resolution photography for citizen review.",
    },
    {
      title: "Community Visibility",
      icon: Users,
      description:
        "Neighbourhood issues can be discovered by local residents, preventing duplicate filings and enabling community endorsement on critical public hazards.",
    },
    {
      title: "Data Privacy & Responsible Geocoding",
      icon: Lock,
      description:
        "Public issue feeds sanitize private resident contact information while preserving exact street-level coordinates necessary for municipal inspection.",
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-background text-content-primary transition-colors">
      <Container size="lg">
        <div className="space-y-12">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-surface border border-brand/15 text-brand text-xs font-semibold tracking-wide uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-brand" aria-hidden="true" />
              <span>Institutional Accountability</span>
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-content-primary tracking-tight">
              Transparency & Accountability Architecture
            </h2>
            <p className="text-sm sm:text-base text-content-secondary leading-relaxed font-normal max-w-xl mx-auto">
              Designed around institutional accountability rather than optimistic promises. We distinguish implemented functionality from planned milestones.
            </p>
          </div>

          {/* 4 Pillars Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.title}
                  className="p-6 rounded-2xl border border-border bg-surface flex flex-col justify-between space-y-4 shadow-subtle hover:border-brand/40 hover:shadow-card transition-all duration-200"
                >
                  <div className="space-y-3">
                    <div className="w-11 h-11 rounded-xl bg-brand-surface border border-brand/20 flex items-center justify-center text-brand shrink-0">
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <h3 className="text-base font-bold text-content-primary leading-snug">
                      {p.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-content-secondary leading-relaxed">
                      {p.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Objective Statement Callout */}
          <div className="p-5 rounded-2xl bg-surface-muted border border-border text-xs sm:text-sm text-content-secondary flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-3xl mx-auto shadow-subtle">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-brand mt-0.5 shrink-0" aria-hidden="true" />
              <span>
                <strong>Objective Statement:</strong> PuneSetu does not claim statutory legal resolution guarantees or official PMC endorsement. It provides a structured civic framework built for community evaluation and hackathon innovation (Neighborhood Hacks 2026).
              </span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
