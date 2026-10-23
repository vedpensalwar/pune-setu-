"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Building2, Lock, Eye } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ThemeSelector } from "@/components/theme/theme-selector";
import { useLanguage } from "@/components/language/language-provider";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function PublicFooter() {
  const { t } = useLanguage();
  const [activePolicyModal, setActivePolicyModal] = useState<"privacy" | "accessibility" | null>(null);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <footer className="border-t border-border bg-surface text-content-primary text-xs">
        {/* Main Footer Links & Info */}
        <div className="py-12 sm:py-16">
          <Container size="lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
              {/* Col 1: Brand & Identity */}
              <div className="lg:col-span-2 space-y-4 text-left">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-base bg-brand flex items-center justify-center text-brand-contrast shrink-0">
                    <Building2 className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-base text-content-primary tracking-tight">
                      PuneSetu
                    </span>
                    <span className="text-sm font-semibold text-accent font-sans">
                      पुणे सेतू
                    </span>
                  </div>
                </div>

                <p className="text-content-secondary leading-relaxed max-w-sm">
                  Connecting Citizens. Empowering Communities. Improving Pune. A modern, transparent civic grievance redressal and municipal operations platform.
                </p>

                <div className="pt-2 flex items-center gap-3">
                  <span className="text-[11px] text-content-muted">{t("footer.appearance")}</span>
                  <ThemeSelector variant="compact" />
                </div>
              </div>

              {/* Col 2: Public Navigation */}
              <div className="space-y-3 text-left">
                <h4 className="text-xs font-bold text-content-primary uppercase tracking-wider">
                  {t("footer.platform")}
                </h4>
                <ul className="space-y-2 text-content-secondary">
                  <li>
                    <button
                      type="button"
                      onClick={() => scrollTo("home")}
                      className="hover:text-brand transition-colors"
                    >
                      {t("nav.home")}
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => scrollTo("track-panel")}
                      className="hover:text-brand transition-colors"
                    >
                      {t("nav.track")}
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => scrollTo("community-feed")}
                      className="hover:text-brand transition-colors"
                    >
                      {t("nav.feed")}
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => scrollTo("civic-map")}
                      className="hover:text-brand transition-colors"
                    >
                      {t("nav.map")}
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => scrollTo("categories")}
                      className="hover:text-brand transition-colors"
                    >
                      {t("nav.categories")}
                    </button>
                  </li>
                </ul>
              </div>

              {/* Col 3: Municipal Domains */}
              <div className="space-y-3 text-left">
                <h4 className="text-xs font-bold text-content-primary uppercase tracking-wider">
                  {t("footer.domains")}
                </h4>
                <ul className="space-y-2 text-content-secondary">
                  <li>
                    <button
                      type="button"
                      onClick={() => scrollTo("categories")}
                      className="hover:text-brand transition-colors"
                    >
                      {t("category.roads")}
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => scrollTo("categories")}
                      className="hover:text-brand transition-colors"
                    >
                      {t("category.waste")}
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => scrollTo("categories")}
                      className="hover:text-brand transition-colors"
                    >
                      {t("category.water")}
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => scrollTo("categories")}
                      className="hover:text-brand transition-colors"
                    >
                      {t("category.lighting")}
                    </button>
                  </li>
                  <li>
                    <Link
                      href="/services/wards"
                      className="hover:text-brand transition-colors"
                    >
                      {t("nav.wardInfo")}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/services/charter"
                      className="hover:text-brand transition-colors"
                    >
                      {t("nav.charter")}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/services/emergency"
                      className="hover:text-brand transition-colors"
                    >
                      {t("nav.emergency")}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/services/etapaal"
                      className="hover:text-brand transition-colors"
                    >
                      {t("nav.etapaal")}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/services/assistant"
                      className="hover:text-brand transition-colors"
                    >
                      Civic Knowledge Assistant
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Col 4: Governance & Portals */}
              <div className="space-y-3 text-left">
                <h4 className="text-xs font-bold text-content-primary uppercase tracking-wider">
                  Portals &amp; Governance
                </h4>
                <ul className="space-y-2 text-content-secondary">
                  <li>
                    <Link
                      href="/login"
                      className="hover:text-brand transition-colors flex items-center gap-1.5"
                    >
                      <Building2 className="w-3 h-3 text-brand" aria-hidden="true" />
                      <span>Citizen Portal</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/officer/login"
                      className="hover:text-brand transition-colors flex items-center gap-1.5"
                    >
                      <Lock className="w-3 h-3 text-brand" aria-hidden="true" />
                      <span>Municipal Officer Portal</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/admin/login"
                      className="hover:text-brand transition-colors flex items-center gap-1.5"
                    >
                      <Lock className="w-3 h-3 text-accent" aria-hidden="true" />
                      <span>PMC Command Center</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/staff/login"
                      className="hover:text-brand transition-colors text-[11px] text-content-muted"
                    >
                      Staff Portal Gateway
                    </Link>
                  </li>
                  <li className="pt-1 border-t border-border/50">
                    <button
                      type="button"
                      onClick={() => setActivePolicyModal("privacy")}
                      className="hover:text-brand transition-colors flex items-center gap-1.5"
                    >
                      <Lock className="w-3 h-3 text-brand" aria-hidden="true" />
                      <span>Privacy Statement</span>
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => setActivePolicyModal("accessibility")}
                      className="hover:text-brand transition-colors flex items-center gap-1.5"
                    >
                      <Eye className="w-3 h-3 text-brand" aria-hidden="true" />
                      <span>Accessibility (WCAG AAA)</span>
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </Container>
        </div>

        {/* Bottom Legal Disclaimer Strip */}
        <div className="py-6 border-t border-border-subtle bg-surface-muted/60 text-[11px] text-content-secondary">
          <Container size="lg">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
              <p className="max-w-3xl leading-relaxed">
                <strong>Legal Disclaimer:</strong> PuneSetu (पुणे सेतू) is an independent civic technology research and demonstration platform developed for the Neighborhood Hacks hackathon. It is not an official government portal of Pune Municipal Corporation (PMC) or Pimpri-Chinchwad Municipal Corporation (PCMC).
              </p>
              <p className="shrink-0 text-content-muted">
                © {new Date().getFullYear()} PuneSetu. All rights reserved.
              </p>
            </div>
          </Container>
        </div>
      </footer>

      {/* Privacy Policy Dialog */}
      <Dialog
        isOpen={activePolicyModal === "privacy"}
        onClose={() => setActivePolicyModal(null)}
        title="Privacy & Geodata Protection Statement"
        description="PuneSetu Civic Technology Platform"
        footer={
          <Button variant="primary" size="sm" onClick={() => setActivePolicyModal(null)}>
            Close Statement
          </Button>
        }
      >
        <div className="space-y-3 text-xs text-content-secondary leading-relaxed">
          <p>
            PuneSetu is committed to citizen data protection and responsible civic geocoding.
          </p>
          <ul className="space-y-1.5 list-disc pl-4">
            <li><strong>Residential Location Sanitization:</strong> Public issue feeds generalize residential coordinate accuracy to street intersections to prevent private property exposure.</li>
            <li><strong>Contact Protection:</strong> Citizen mobile numbers and email addresses are never exposed in public feeds or search results.</li>
            <li><strong>Audit Logging:</strong> All municipal actions and resolution records are timestamped for accountability.</li>
          </ul>
        </div>
      </Dialog>

      {/* Accessibility Statement Dialog */}
      <Dialog
        isOpen={activePolicyModal === "accessibility"}
        onClose={() => setActivePolicyModal(null)}
        title="Accessibility Commitment — WCAG AAA"
        description="Universal access for all Pune residents."
        footer={
          <Button variant="primary" size="sm" onClick={() => setActivePolicyModal(null)}>
            Close Statement
          </Button>
        }
      >
        <div className="space-y-3 text-xs text-content-secondary leading-relaxed">
          <p>
            PuneSetu is built to ensure equal digital access regardless of visual, motor, or cognitive abilities:
          </p>
          <ul className="space-y-1.5 list-disc pl-4">
            <li><strong>High-Contrast Mode:</strong> Pure black backgrounds, forced 2px solid high-contrast borders, and WCAG AAA yellow/cyan status accents.</li>
            <li><strong>Keyboard Operability:</strong> Complete focus trapping on dialogs, visible `:focus-visible` rings, and Escape key dismissal.</li>
            <li><strong>Screen Reader Semantics:</strong> ARIA labels, live alert regions on toasts and inputs, and zero reliance on color alone.</li>
            <li><strong>Reduced Motion:</strong> Full respect for operating system <code>prefers-reduced-motion</code> preferences.</li>
          </ul>
        </div>
      </Dialog>
    </>
  );
}
