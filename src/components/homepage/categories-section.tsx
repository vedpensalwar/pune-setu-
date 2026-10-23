"use client";

import React, { useState } from "react";
import {
  Route,
  Trash2,
  Droplets,
  Waves,
  Lightbulb,
  Ban,
  HeartPulse,
  Trees,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language/language-provider";
import { useRouter } from "next/navigation";

export interface CivicCategory {
  id: string;
  name: string;
  marathi: string;
  icon: React.ElementType;
  dept: string;
  description: string;
  examples: string[];
}

export const CIVIC_CATEGORIES: CivicCategory[] = [
  {
    id: "roads",
    name: "Roads and Potholes",
    marathi: "रस्ते आणि खड्डे",
    icon: Route,
    dept: "Road & Infrastructure Department",
    description: "Potholes, surface erosion, damaged speed breakers, missing pavers, asphalt failure.",
    examples: ["Deep pothole on main transit lane", "Damaged asphalt causing two-wheeler skid", "Broken footpath curb stones"],
  },
  {
    id: "waste",
    name: "Solid Waste Management",
    marathi: "घनकचरा व्यवस्थापन",
    icon: Trash2,
    dept: "Solid Waste Management Department",
    description: "Overflowing community bins, missed doorstep collection, open garbage dumping.",
    examples: ["Garbage dump near public school", "Missed morning waste collection", "Broken community trash container"],
  },
  {
    id: "water",
    name: "Water Supply",
    marathi: "पाणी पुरवठा",
    icon: Droplets,
    dept: "Water Supply & Pumping Department",
    description: "Pipeline bursts, low pressure, contaminated municipal supply, unannounced cutoffs.",
    examples: ["Main pipeline fracture leaking drinking water", "Turbid tap water supply", "Zero supply for 48 hours without notice"],
  },
  {
    id: "drainage",
    name: "Drainage and Sewage",
    marathi: "ड्रेनेज आणि मलनिस्सारण",
    icon: Waves,
    dept: "Drainage & Sewerage Department",
    description: "Blocked sewer lines, open manholes, rainwater backflow, broken chamber lids.",
    examples: ["Missing manhole lid on road", "Sewage line overflow into residential lane", "Choked stormwater culvert"],
  },
  {
    id: "lighting",
    name: "Street Lighting",
    marathi: "रस्त्यावरील दिवे",
    icon: Lightbulb,
    dept: "Electrical Department",
    description: "Defective streetlights, dark stretches, loose exposed electrical wiring, timer issues.",
    examples: ["Entire street dark for 3 days", "Flickering high-mast junction light", "Exposed live wiring at pole base"],
  },
  {
    id: "encroachment",
    name: "Encroachment",
    marathi: "अतिक्रमण",
    icon: Ban,
    dept: "Encroachment Eradication Department",
    description: "Illegal road-side stalls blocking traffic, unauthorized structures, sidewalk choking.",
    examples: ["Permanent steel shed blocking footpath", "Illegal vehicle parking blocking emergency exit", "Unauthorized commercial dumping"],
  },
  {
    id: "health",
    name: "Public Health",
    marathi: "सार्वजनिक आरोग्य",
    icon: HeartPulse,
    dept: "Health & Sanitation Department",
    description: "Stagnant mosquito breeding pools, stray animal hazards, unsanitary public toilets.",
    examples: ["Mosquito breeding in open construction pond", "Unmaintained public toilet block", "Stray animal aggression on lane"],
  },
  {
    id: "parks",
    name: "Parks and Gardens",
    marathi: "उद्याने आणि बागा",
    icon: Trees,
    dept: "Gardens & Tree Authority Department",
    description: "Dangerous overgrown tree branches, broken children play equipment, withered green cover.",
    examples: ["Heavy tree branch threatening electrical wires", "Damaged children swing set in ward garden", "Non-functional park lighting"],
  },
  {
    id: "other",
    name: "Other Civic Issues",
    marathi: "इतर नागरी समस्या",
    icon: HelpCircle,
    dept: "General Municipal Administration",
    description: "Noise pollution, public property defacement, unclassified civic inconveniences.",
    examples: ["Illegal advertisement hoardings", "Commercial noise pollution beyond permitted hours", "Defaced municipal signboards"],
  },
];

interface CategoriesSectionProps {
  onSelectCategory?: (categoryId: string) => void;
}

export function CategoriesSection({ onSelectCategory }: CategoriesSectionProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<CivicCategory | null>(null);

  return (
    <section id="categories" className="py-14 sm:py-16 bg-background text-content-primary">
      <Container size="lg">
        <div className="space-y-10">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-surface border border-brand/15 text-brand text-xs font-semibold tracking-wide uppercase">
              <span>Municipal Jurisdictions</span>
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-content-primary tracking-tight">
              {t("categories.title")}
            </h2>
            <p className="text-sm sm:text-base text-content-secondary leading-relaxed max-w-xl mx-auto">
              {t("categories.subtitle")}
            </p>
          </div>

          {/* 9-Card Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {CIVIC_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat);
                    if (onSelectCategory) onSelectCategory(cat.id);
                  }}
                  className="p-6 rounded-2xl border border-border bg-surface text-left transition-all duration-200 hover:border-brand/40 hover:shadow-card hover:-translate-y-0.5 group focus-visible:ring-2 focus-visible:ring-focus-ring flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="w-11 h-11 rounded-xl bg-brand-surface border border-brand/20 flex items-center justify-center text-brand group-hover:bg-accent-surface group-hover:text-accent group-hover:border-accent/30 transition-colors shrink-0">
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-base font-bold text-content-primary group-hover:text-brand transition-colors">
                          {cat.name}
                        </h3>
                      </div>
                      <p className="text-xs text-accent font-sans font-semibold mt-0.5">
                        {cat.marathi}
                      </p>
                    </div>
                    <p className="text-xs text-content-secondary leading-relaxed line-clamp-2">
                      {cat.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-border-subtle flex items-center justify-between text-[11px]">
                    <span className="text-content-muted font-medium truncate max-w-[200px]">
                      {cat.dept}
                    </span>
                    <span className="text-brand font-semibold flex items-center gap-1 shrink-0 group-hover:translate-x-0.5 transition-transform">
                      Details <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </Container>

      {/* Category Details Dialog */}
      {selectedCategory && (
        <Dialog
          isOpen={true}
          onClose={() => setSelectedCategory(null)}
          title={selectedCategory.name}
          description={`Assigned Jurisdiction: ${selectedCategory.dept}`}
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedCategory(null)}>
                Close
              </Button>
              <Button
                variant="accent"
                size="sm"
                onClick={() => {
                  setSelectedCategory(null);
                  router.push("/grievances/new");
                }}
              >
                File Grievance in this Category
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs text-content-secondary leading-relaxed">
            <div className="p-3.5 rounded-xl bg-surface-muted border border-border">
              <div className="flex items-center justify-between">
                <span className="font-bold text-content-primary">Marathi Title:</span>
                <span className="font-semibold text-accent font-sans">{selectedCategory.marathi}</span>
              </div>
              <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-border-subtle">
                <span className="font-bold text-content-primary">Responsible Wing:</span>
                <span className="font-medium text-content-primary">{selectedCategory.dept}</span>
              </div>
            </div>

            <div>
              <p className="font-bold text-content-primary mb-1.5">Common Grievance Scenarios:</p>
              <ul className="space-y-1.5 pl-4 list-disc text-content-secondary">
                {selectedCategory.examples.map((ex, i) => (
                  <li key={i}>{ex}</li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-brand-surface border border-brand/20 text-content-primary">
              <p className="font-semibold text-brand mb-0.5">Municipal Routing Standard:</p>
              <p className="text-[11px] text-content-secondary">
                Reports filed under <strong>{selectedCategory.name}</strong> are geolocated to your Prabhag ward and routed directly to the {selectedCategory.dept} with standard 21-day SLA benchmark tracking.
              </p>
            </div>
          </div>
        </Dialog>
      )}
    </section>
  );
}
