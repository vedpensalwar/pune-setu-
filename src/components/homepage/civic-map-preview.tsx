"use client";

import React, { useState } from "react";
import { MapPin, Info } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language/language-provider";
import { useRouter } from "next/navigation";

export interface DemoWardPoint {
  id: string;
  name: string;
  marathi: string;
  zone: "central" | "west" | "east";
  x: number; // percentage coordinate on SVG canvas
  y: number;
  activeDemoIssues: number;
  landmarks: string[];
  officeAddress: string;
  officer: string;
}

const PUNE_DEMO_WARDS: DemoWardPoint[] = [
  {
    id: "ward-07",
    name: "Ward 07 — Shivajinagar / Ghole Road",
    marathi: "प्रभाग क्र. ७ — शिवाजीनगर / घोले रोड",
    zone: "central",
    x: 48,
    y: 42,
    activeDemoIssues: 3,
    landmarks: ["PMC Main Headquarters", "Modern College Road", "FC Road & JM Road"],
    officeAddress: "Ghole Road Ward Office, Near Balgandharva Rangmandir, Shivajinagar, Pune 411005",
    officer: "Er. A. K. Kulkarni (Executive Engineer)",
  },
  {
    id: "ward-12",
    name: "Ward 12 — Kothrud / Bavdhan",
    marathi: "प्रभाग क्र. १२ — कोथरूड / बावधन",
    zone: "west",
    x: 32,
    y: 56,
    activeDemoIssues: 2,
    landmarks: ["Paud Road Flyover", "Chandani Chowk Junction", "MIT World Peace University"],
    officeAddress: "Kothrud Ward Office, Near Karve Statue, Kothrud, Pune 411038",
    officer: "Er. S. M. Deshpande (Ward Officer)",
  },
  {
    id: "ward-01",
    name: "Ward 01 — Aundh / Baner",
    marathi: "प्रभाग क्र. १ — औंध / बाणेर",
    zone: "west",
    x: 34,
    y: 28,
    activeDemoIssues: 2,
    landmarks: ["ITI Road Aundh", "Baner High Street", "Pune University Circle"],
    officeAddress: "Aundh Ward Office, DP Road, Aundh, Pune 411007",
    officer: "Er. V. R. Shinde (Executive Engineer)",
  },
  {
    id: "ward-04",
    name: "Ward 04 — Kasba Peth / Vishrambaug",
    marathi: "प्रभाग क्र. ४ — कसबा पेठ / विश्रामबाग",
    zone: "central",
    x: 52,
    y: 52,
    activeDemoIssues: 1,
    landmarks: ["Shaniwar Wada", "Laxmi Road Market", "Kasba Ganpati Precinct"],
    officeAddress: "Vishrambaug Wada, Sadashiv Peth, Pune 411030",
    officer: "Er. R. N. Joshi (Senior Sanitary Inspector)",
  },
  {
    id: "ward-15",
    name: "Ward 15 — Hadapsar / Mundhwa",
    marathi: "प्रभाग क्र. १५ — हडपसर / मुंढवा",
    zone: "east",
    x: 72,
    y: 58,
    activeDemoIssues: 2,
    landmarks: ["Magarpatta North Entrance", "Solapur Road Flyover", "Amanora Park Town"],
    officeAddress: "Hadapsar Ward Office, Pune-Solapur Road, Hadapsar, Pune 411028",
    officer: "Er. M. P. Patil (Executive Engineer)",
  },
];

export function CivicMapPreview() {
  const router = useRouter();
  const { t } = useLanguage();
  const [activeZone, setActiveZone] = useState<"all" | "central" | "west" | "east">("all");
  const [selectedWard, setSelectedWard] = useState<DemoWardPoint>(PUNE_DEMO_WARDS[0]);

  const visibleWards = PUNE_DEMO_WARDS.filter((w) => {
    if (activeZone === "all") return true;
    return w.zone === activeZone;
  });

  return (
    <section id="civic-map" className="py-14 sm:py-16 bg-background text-content-primary">
      <Container size="lg">
        <div className="space-y-8">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2 text-left">
              <div className="flex items-center gap-2">
                <Badge variant="brand" size="sm">
                  Geographic Intelligence
                </Badge>
                <Badge variant="accent" size="sm">
                  Interactive Preview
                </Badge>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-content-primary tracking-tight">
                {t("map.title")}
              </h2>
              <p className="text-sm text-content-secondary max-w-xl">
                {t("map.subtitle")}
              </p>
            </div>

            {/* Zone Filter */}
            <div className="flex items-center gap-1.5 p-1 rounded-base border border-border bg-surface shadow-subtle">
              {[
                { id: "all", label: "All Zones" },
                { id: "central", label: "Central" },
                { id: "west", label: "West" },
                { id: "east", label: "East" },
              ].map((z) => {
                const isActive = activeZone === z.id;
                return (
                  <button
                    key={z.id}
                    type="button"
                    onClick={() => setActiveZone(z.id as typeof activeZone)}
                    aria-pressed={isActive}
                    className={`px-3 py-1.5 rounded-subtle text-xs font-semibold transition-colors ${
                      isActive
                        ? "bg-brand text-brand-contrast shadow-subtle"
                        : "text-content-secondary hover:text-content-primary hover:bg-surface-hover"
                    }`}
                  >
                    {z.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Demonstration Notice */}
          <div className="p-3 rounded-base bg-surface-muted border border-border-subtle text-xs text-content-secondary flex items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-brand shrink-0" aria-hidden="true" />
              <span>
                <strong>Ward Activity Map:</strong> Interactive overview of ward offices across Pune municipal sectors. For live geo-tagged grievance markers with Leaflet &amp; OpenStreetMap, visit the <strong>Live Community Map</strong>.
              </span>
            </div>
          </div>

          {/* Interactive Map Layout: Canvas + Ward Inspection Details */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Illustrative SVG Ward Canvas */}
            <div className="lg:col-span-7 rounded-base border border-border bg-surface p-6 shadow-subtle relative min-h-[360px] sm:min-h-[420px] flex flex-col justify-between overflow-hidden">
              {/* Map Canvas Background Grid */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--border-subtle)_1px,transparent_1px)] [background-size:24px_24px] opacity-70 pointer-events-none" />

              {/* Decorative Municipal Outline */}
              <svg
                viewBox="0 0 100 100"
                className="absolute inset-0 w-full h-full text-brand/10 pointer-events-none"
                preserveAspectRatio="none"
              >
                <path
                  d="M 30,20 Q 50,15 70,25 Q 85,40 80,65 Q 65,85 45,80 Q 25,75 20,50 Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeDasharray="2,2"
                />
                {/* Mutha River stylized curve */}
                <path
                  d="M 22,78 Q 42,55 52,48 Q 65,40 78,32"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="text-status-info/20"
                />
              </svg>

              {/* Waterway Label */}
              <div className="relative z-10 text-[10px] text-content-muted font-medium flex items-center gap-1.5 mb-2">
                <span className="w-2.5 h-0.5 bg-status-info rounded-full" />
                <span>Mula-Mutha River Corridor Reference</span>
              </div>

              {/* Interactive Ward Pins */}
              <div className="relative w-full h-[280px] sm:h-[320px] z-20">
                {visibleWards.map((ward) => {
                  const isSelected = selectedWard.id === ward.id;
                  return (
                    <button
                      key={ward.id}
                      type="button"
                      onClick={() => setSelectedWard(ward)}
                      style={{ left: `${ward.x}%`, top: `${ward.y}%` }}
                      aria-label={`Select ${ward.name}`}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all duration-200 group focus-visible:ring-2 focus-visible:ring-focus-ring ${
                        isSelected
                          ? "bg-brand text-brand-contrast scale-125 z-30 shadow-elevated"
                          : "bg-surface border border-brand text-brand hover:bg-brand-surface shadow-subtle z-20"
                      }`}
                    >
                      <MapPin className="w-4 h-4" aria-hidden="true" />
                      <span className="sr-only">{ward.name}</span>

                      {/* Tooltip on hover */}
                      <span className="absolute left-1/2 -top-8 -translate-x-1/2 px-2 py-1 bg-brand text-brand-contrast text-[10px] font-bold rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-elevated">
                        {ward.name.split("—")[1]?.trim() || ward.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Map Footer Note */}
              <div className="relative z-10 pt-2 border-t border-border-subtle flex items-center justify-between text-[11px] text-content-secondary">
                <span>Click pins to inspect ward jurisdiction details</span>
                <span className="font-mono text-brand font-semibold">Pune Municipal Area</span>
              </div>
            </div>

            {/* Right: Selected Ward Details Panel */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-card space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-accent">
                    Ward Jurisdiction Dossier
                  </span>
                  <Badge variant="accent" size="sm">
                    {selectedWard.activeDemoIssues} Demo Issues
                  </Badge>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-content-primary leading-snug">
                    {selectedWard.name}
                  </h3>
                  <p className="text-xs text-brand font-sans font-semibold mt-0.5">
                    {selectedWard.marathi}
                  </p>
                </div>

                <div className="space-y-3 text-xs text-content-secondary">
                  <div>
                    <span className="text-[11px] font-bold text-content-primary uppercase tracking-wide block mb-1">
                      Key Neighbourhood Sectors & Landmarks:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedWard.landmarks.map((l, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-md bg-surface-muted border border-border-subtle text-content-primary font-medium text-[11px]">
                          {l}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-surface-muted border border-border-subtle space-y-1.5">
                    <span className="text-[11px] font-bold text-content-primary block">
                      Assigned Municipal Officer:
                    </span>
                    <p className="font-semibold text-brand text-xs">
                      {selectedWard.officer}
                    </p>
                    <span className="text-[11px] font-bold text-content-primary block pt-1">
                      Administrative Office:
                    </span>
                    <p className="text-[11px] text-content-secondary leading-normal">
                      {selectedWard.officeAddress}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border-subtle flex flex-wrap items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        router.push("/community/map");
                      }}
                      className="font-semibold text-xs"
                    >
                      Open Live GIS Map
                    </Button>
                    <Button
                      variant="accent"
                      size="sm"
                      onClick={() => {
                        router.push("/grievances/new");
                      }}
                      className="font-semibold text-xs"
                    >
                      Report in this Ward
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
