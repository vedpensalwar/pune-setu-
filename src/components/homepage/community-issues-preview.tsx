"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Clock,
  ThumbsUp,
  ExternalLink,
  ShieldCheck,
  Camera,
  CheckCircle2,
  ArrowRight,
  Layers,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useLanguage } from "@/components/language/language-provider";
import { useToast } from "@/components/ui/toast";

export interface DemoCommunityIssue {
  id: string;
  category: "roads" | "drainage" | "lighting" | "water";
  categoryLabel: string;
  title: string;
  description: string;
  ward: string;
  timestamp: string;
  status: "submitted" | "in_progress" | "resolved";
  statusLabel: string;
  endorsements: number;
  assignedDept: string;
}

const INITIAL_DEMO_ISSUES: DemoCommunityIssue[] = [
  {
    id: "PS-PUN-2026-004128",
    category: "drainage",
    categoryLabel: "Drainage and Sewage",
    title: "Blocked storm drain causing water stagnation near Modern College Road",
    description: "Stormwater drain severely blocked by urban runoff debris, causing pedestrian sidewalk submergence.",
    ward: "Ward 07 — Shivajinagar / Ghole Road",
    timestamp: "18 Oct 2026 • 2 days ago",
    status: "in_progress",
    statusLabel: "In Progress",
    endorsements: 24,
    assignedDept: "Drainage Maintenance Wing",
  },
  {
    id: "PS-PUN-2026-004089",
    category: "roads",
    categoryLabel: "Roads and Potholes",
    title: "Deep asphalt crater on Paud Road junction near flyover pillar 14",
    description: "Subsurface bitumen failure resulting in a 10-inch pothole creating hazardous conditions for two-wheelers.",
    ward: "Ward 12 — Kothrud / Bavdhan",
    timestamp: "19 Oct 2026 • Yesterday",
    status: "submitted",
    statusLabel: "Registered",
    endorsements: 42,
    assignedDept: "Road & Asphalt Maintenance",
  },
  {
    id: "PS-PUN-2026-003954",
    category: "water",
    categoryLabel: "Water Supply",
    title: "Low municipal water pressure and turbid supply in ITI Road sector",
    description: "Residences reporting contaminated brownish tap supply and insufficient supply pressure during morning slots.",
    ward: "Ward 01 — Aundh / Baner",
    timestamp: "17 Oct 2026 • 3 days ago",
    status: "in_progress",
    statusLabel: "In Progress",
    endorsements: 18,
    assignedDept: "Water Supply & Pumping Dept",
  },
  {
    id: "PS-PUN-2026-003810",
    category: "lighting",
    categoryLabel: "Street Lighting",
    title: "Defective high-mast junction lighting at Magarpatta North entrance",
    description: "Four illumination fixtures dark on main roundabout, reducing visibility during late evening commute.",
    ward: "Ward 15 — Hadapsar / Mundhwa",
    timestamp: "15 Oct 2026 • 5 days ago",
    status: "resolved",
    statusLabel: "Resolved (Demo)",
    endorsements: 31,
    assignedDept: "Electrical Department",
  },
];

export function CommunityIssuesPreview() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [issues, setIssues] = useState<DemoCommunityIssue[]>(INITIAL_DEMO_ISSUES);
  const [endorsedIds, setEndorsedIds] = useState<Set<string>>(new Set());
  const [activeDetailsIssue, setActiveDetailsIssue] = useState<DemoCommunityIssue | null>(null);

  const filteredIssues = issues.filter((item) => {
    if (selectedFilter === "all") return true;
    return item.category === selectedFilter;
  });

  const handleEndorse = (id: string) => {
    const isAlready = endorsedIds.has(id);
    const newSet = new Set(endorsedIds);

    setIssues((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            endorsements: isAlready ? item.endorsements - 1 : item.endorsements + 1,
          };
        }
        return item;
      })
    );

    if (isAlready) {
      newSet.delete(id);
      toast({
        type: "info",
        title: "Endorsement Withdrawn",
        message: "Your citizen vote on this demonstration record has been removed.",
      });
    } else {
      newSet.add(id);
      toast({
        type: "success",
        title: "Issue Endorsed",
        message: "Your citizen endorsement helps prioritize critical community grievances.",
      });
    }
    setEndorsedIds(newSet);
  };

  return (
    <section id="community-feed" className="py-16 sm:py-24 bg-surface text-content-primary border-b border-border transition-colors">
      <Container size="lg">
        <div className="space-y-12">
          {/* Editorial Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-surface border border-brand/15 text-brand text-xs font-semibold tracking-wide uppercase">
                <ShieldCheck className="w-3.5 h-3.5 text-brand" aria-hidden="true" />
                <span>Neighbourhood Transparency</span>
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-content-primary tracking-tight">
                {t("feed.title")}
              </h2>
              <p className="text-sm sm:text-base text-content-secondary max-w-xl font-normal">
                {t("feed.subtitle")}
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 rounded-full border border-border bg-background shadow-subtle overflow-x-auto">
              {[
                { id: "all", label: "All Issues" },
                { id: "roads", label: "Roads" },
                { id: "drainage", label: "Drainage" },
                { id: "water", label: "Water" },
                { id: "lighting", label: "Lighting" },
              ].map((f) => {
                const isActive = selectedFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFilter(f.id)}
                    aria-pressed={isActive}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                      isActive
                        ? "bg-brand text-brand-contrast shadow-subtle"
                        : "text-content-secondary hover:text-content-primary hover:bg-surface-hover"
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Editorial Photographic Evidence Spotlight */}
          <div className="rounded-2xl border border-border bg-surface-muted/50 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0 shadow-subtle">
            <div className="lg:col-span-6 relative aspect-[16/10] sm:aspect-[16/9] lg:aspect-auto min-h-[260px]">
              <Image
                src="/images/pune_civic_resolution.jpg"
                alt="Documentary photograph of completed asphalt road surfacing and pedestrian sidewalk repair in Pune, Maharashtra, showing clean streetscape, municipal workers, and Marathi civic signage."
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute top-3 left-3 bg-surface/90 backdrop-blur-md px-3 py-1 rounded-full border border-border/80 text-[11px] font-semibold text-content-primary flex items-center gap-1.5 shadow-subtle">
                <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
                <span>Resolution Evidence Architecture</span>
              </div>
            </div>

            <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-center space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-accent">
                  Platform Verification Protocol
                </span>
                <span className="text-content-muted">•</span>
                <span className="text-xs text-content-muted">Civic Redressal Standard</span>
              </div>
              <h3 className="font-sans font-bold text-xl sm:text-2xl text-content-primary leading-snug">
                Resolution workflows require verifiable proof of completion.
              </h3>
              <p className="text-xs sm:text-sm text-content-secondary leading-relaxed">
                In PuneSetu, grievance resolution rules require that field closing remarks be accompanied by verified post-work photographs before a case can be transitioned to resolved status.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-brand font-medium">
                <span className="flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-accent" />
                  <span>Post-Repair Photographic Upload</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-status-success" />
                  <span>Citizen Review & Rating</span>
                </span>
              </div>
            </div>
          </div>

          {/* Issue Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredIssues.map((issue) => {
              const hasEndorsed = endorsedIds.has(issue.id);
              const statusBadgeVariant =
                issue.status === "resolved"
                  ? "success"
                  : issue.status === "in_progress"
                  ? "warning"
                  : "brand";

              return (
                <div
                  key={issue.id}
                  className="p-4 sm:p-6 rounded-2xl border border-border bg-surface hover:border-brand/40 hover:shadow-card transition-all duration-200 flex flex-col justify-between space-y-4 w-full min-w-0 overflow-hidden"
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-brand bg-brand-surface px-2.5 py-1 rounded-md border border-brand/15 break-all shrink-0">
                        {issue.id}
                      </span>
                      <Badge variant={statusBadgeVariant} dot size="sm" className="shrink-0">
                        {issue.statusLabel}
                      </Badge>
                    </div>

                    <h3 className="text-base font-bold text-content-primary leading-snug break-words">
                      {issue.title}
                    </h3>

                    <p className="text-xs text-content-secondary line-clamp-2 leading-relaxed break-words">
                      {issue.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-border-subtle">
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-content-secondary">
                      <span className="flex items-center gap-1 text-[11px] break-words">
                        <MapPin className="w-3.5 h-3.5 text-accent shrink-0" aria-hidden="true" />
                        {issue.ward}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] shrink-0">
                        <Clock className="w-3.5 h-3.5 text-content-muted shrink-0" aria-hidden="true" />
                        {issue.timestamp}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleEndorse(issue.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                          hasEndorsed
                            ? "bg-brand text-brand-contrast border-brand"
                            : "bg-surface-muted text-content-primary border-border hover:bg-surface-hover"
                        }`}
                        title="Endorse this civic issue"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{hasEndorsed ? "Endorsed" : "Endorse"} ({issue.endorsements})</span>
                      </button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveDetailsIssue(issue)}
                        rightIcon={<ExternalLink className="w-3 h-3" />}
                        className="text-xs"
                      >
                        Inspect Case
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Feed & Map Call-to-Action */}
          <div className="p-6 rounded-2xl border border-brand/20 bg-brand-surface/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-status-success animate-pulse" />
                <span className="text-xs font-bold text-brand uppercase tracking-wider">Live Municipal Data</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-content-primary">
                Explore the Community Civic Feed & Interactive GIS Map
              </h3>
              <p className="text-xs text-content-secondary max-w-2xl">
                Browse real civic issues submitted across Pune&apos;s 15 Prabhag Wards. Endorse issues that affect your neighbourhood, track resolution milestones, and engage directly.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Link href="/community">
                <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Open Civic Feed
                </Button>
              </Link>
              <Link href="/community/map">
                <Button variant="secondary" size="sm" leftIcon={<MapPin className="w-3.5 h-3.5 text-accent" />}>
                  Explore GIS Map
                </Button>
              </Link>
            </div>
          </div>

          {/* Honest Demo Disclaimer Strip */}
          <div className="p-3.5 rounded-xl bg-surface-muted border border-border text-xs text-content-secondary flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent" aria-hidden="true" />
              <span>
                <strong>Demonstration Feed:</strong> Displays representative civic records for interface evaluation. Live citizen grievances filed via the portal persist to the secure database store.
              </span>
            </span>
            <span className="font-mono text-[11px] text-content-muted shrink-0">
              Showing {filteredIssues.length} sample cases
            </span>
          </div>
        </div>
      </Container>

      {/* Case Details Modal */}
      {activeDetailsIssue && (
        <Dialog
          isOpen={true}
          onClose={() => setActiveDetailsIssue(null)}
          title={`Case Reference: ${activeDetailsIssue.id}`}
          description={activeDetailsIssue.ward}
          footer={
            <Button variant="primary" size="sm" onClick={() => setActiveDetailsIssue(null)}>
              Close Case Summary
            </Button>
          }
        >
          <div className="space-y-4 text-xs text-content-secondary leading-relaxed">
            <div>
              <p className="text-sm font-bold text-content-primary">
                {activeDetailsIssue.title}
              </p>
              <p className="mt-1 text-content-secondary">
                {activeDetailsIssue.description}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-muted border border-border space-y-2">
              <div className="flex justify-between">
                <span className="font-bold text-content-primary">Category:</span>
                <span>{activeDetailsIssue.categoryLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-content-primary">Assigned Department:</span>
                <span>{activeDetailsIssue.assignedDept}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-content-primary">Public Status:</span>
                <span className="font-semibold text-brand">{activeDetailsIssue.statusLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-content-primary">Community Endorsements:</span>
                <span className="font-bold text-accent">{activeDetailsIssue.endorsements} Citizens</span>
              </div>
            </div>

            <p className="text-[11px] text-content-muted">
              [Demonstration Record — Full citizen comment threads, officer attachments, and verification logs will be supported in Version 7.]
            </p>
          </div>
        </Dialog>
      )}
    </section>
  );
}
