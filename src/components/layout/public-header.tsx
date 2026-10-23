"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  ChevronDown,
  Menu,
  X,
  FileSpreadsheet,
  MapPin,
  Search,
  LogIn,
  ShieldCheck,
  Compass,
  Layers,
  LayoutDashboard,
  PlusCircle,
  HelpCircle,
  PhoneCall,
  User,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { ThemeSelector } from "@/components/theme/theme-selector";
import { LanguageSelector } from "@/components/language/language-selector";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { useLanguage } from "@/components/language/language-provider";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function PublicHeader() {
  const router = useRouter();
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Authenticated user state
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data?.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  // Modals for roadmap and emergency information
  const [generalComingSoon, setGeneralComingSoon] = useState<{
    title: string;
    desc: string;
    version: string;
  } | null>(null);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside of dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle Escape key for mobile menu and dropdowns
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveDropdown(null);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const scrollToSection = (id: string) => {
    setActiveDropdown(null);
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    } else {
      if (id === "track-panel") {
        router.push("/track");
      } else {
        router.push(`/#${id}`);
      }
    }
  };

  const emergencyContacts = [
    { service: "Integrated Emergency Helpline", number: "112", desc: "Police, Fire, Medical Services" },
    { service: "Police Control Room (Pune City)", number: "100 / 020-26126296", desc: "Law enforcement" },
    { service: "Fire Brigade Control Room", number: "101 / 020-26451707", desc: "Rescue & fire safety" },
    { service: "Medical Ambulance Helpline", number: "108", desc: "Government emergency medical" },
    { service: "PMC Central Disaster Management", number: "020-25501269", desc: "Monsoon flood & disaster control" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur-md transition-colors">
        <Container size="lg">
          <div className="flex h-16 items-center justify-between gap-2 sm:gap-4">
            {/* Brand Logo & Name */}
            <Link
              href="/"
              className="flex items-center gap-2 rounded-base p-0.5 sm:p-1 focus-visible:ring-2 focus-visible:ring-focus-ring shrink-0 group min-w-0"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-base bg-brand flex items-center justify-center text-brand-contrast shadow-subtle shrink-0 group-hover:bg-brand-hover transition-colors">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
              </div>
              <div className="flex flex-col leading-none min-w-0">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <span className="font-extrabold text-sm sm:text-base md:text-lg text-content-primary tracking-tight">
                    PuneSetu
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-accent font-sans hidden min-[375px]:inline">
                    पुणे सेतू
                  </span>
                </div>
                <span className="text-[10px] text-content-secondary mt-0.5 tracking-tight hidden sm:block">
                  {t("brand.subtitle")}
                </span>
              </div>
            </Link>

            {/* Streamlined Desktop Navigation Links */}
            <nav
              ref={dropdownRef}
              aria-label="Main Navigation"
              className="hidden lg:flex items-center gap-1"
            >
              {/* Home */}
              <Link
                href="/"
                className="px-3 py-2 text-xs font-semibold text-content-primary hover:text-brand hover:bg-surface-hover rounded-base transition-colors"
              >
                {t("nav.home")}
              </Link>

              {/* Track Complaint Quick Link */}
              <button
                type="button"
                onClick={() => scrollToSection("track-panel")}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-content-primary hover:text-brand hover:bg-surface-hover rounded-base transition-colors"
              >
                <Search className="w-3.5 h-3.5 text-content-muted" aria-hidden="true" />
                <span>{t("nav.track")}</span>
              </button>

              {/* Civic Feed Link */}
              <Link
                href="/community"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-content-primary hover:text-brand hover:bg-surface-hover rounded-base transition-colors"
              >
                <Layers className="w-3.5 h-3.5 text-content-muted" aria-hidden="true" />
                <span>{t("nav.feed")}</span>
              </Link>

              {/* Interactive Map Link */}
              <Link
                href="/community/map"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-content-primary hover:text-brand hover:bg-surface-hover rounded-base transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-content-muted" aria-hidden="true" />
                <span>{t("nav.map")}</span>
              </Link>

              {/* How it Works Link */}
              <button
                type="button"
                onClick={() => scrollToSection("how-it-works")}
                className="px-3 py-2 text-xs font-semibold text-content-primary hover:text-brand hover:bg-surface-hover rounded-base transition-colors"
              >
                {t("nav.howItWorks")}
              </button>

              {/* Civic Services Hub Link */}
              <Link
                href="/services"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-content-primary hover:text-brand hover:bg-surface-hover rounded-base transition-colors"
              >
                <span>{t("nav.services")}</span>
              </Link>

              {/* Civic Resources Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === "resources" ? null : "resources")}
                  aria-expanded={activeDropdown === "resources"}
                  aria-haspopup="true"
                  className={cn(
                    "inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-base transition-colors",
                    "text-content-primary hover:text-brand hover:bg-surface-hover",
                    activeDropdown === "resources" && "bg-surface-hover text-brand"
                  )}
                >
                  <span>{t("nav.resources")}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-content-muted" aria-hidden="true" />
                </button>

                {activeDropdown === "resources" && (
                  <div className="absolute left-0 mt-1.5 w-72 rounded-base border border-border bg-surface p-2 shadow-elevated z-50 animate-in fade-in zoom-in-95 duration-100">
                    <Link
                      href="/services/charter"
                      onClick={() => setActiveDropdown(null)}
                      className="w-full text-left p-2 rounded-subtle hover:bg-surface-hover flex items-start gap-2.5 transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4 text-status-success mt-0.5 shrink-0" aria-hidden="true" />
                      <div>
                        <p className="text-xs font-bold text-content-primary">{t("nav.charter")}</p>
                        <p className="text-[11px] text-content-secondary">RTS Maharashtra statutory standards & SLAs</p>
                      </div>
                    </Link>

                    <Link
                      href="/services/wards"
                      onClick={() => setActiveDropdown(null)}
                      className="w-full text-left p-2 rounded-subtle hover:bg-surface-hover flex items-start gap-2.5 transition-colors"
                    >
                      <Building2 className="w-4 h-4 text-brand mt-0.5 shrink-0" aria-hidden="true" />
                      <div>
                        <p className="text-xs font-bold text-content-primary">{t("nav.wardInfo")}</p>
                        <p className="text-[11px] text-content-secondary">15 PMC Prabhags, offices & phone lines</p>
                      </div>
                    </Link>

                    <Link
                      href="/services/emergency"
                      onClick={() => setActiveDropdown(null)}
                      className="w-full text-left p-2 rounded-subtle hover:bg-surface-hover flex items-start gap-2.5 transition-colors"
                    >
                      <PhoneCall className="w-4 h-4 text-status-warning mt-0.5 shrink-0" aria-hidden="true" />
                      <div>
                        <p className="text-xs font-bold text-content-primary">{t("nav.emergency")}</p>
                        <p className="text-[11px] text-content-secondary">Disaster 020-25501269, ERSS 112, Police, Fire</p>
                      </div>
                    </Link>

                    <Link
                      href="/services/etapaal"
                      onClick={() => setActiveDropdown(null)}
                      className="w-full text-left p-2 rounded-subtle hover:bg-surface-hover flex items-start gap-2.5 transition-colors"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-status-info mt-0.5 shrink-0" aria-hidden="true" />
                      <div>
                        <p className="text-xs font-bold text-content-primary">{t("nav.etapaal")}</p>
                        <p className="text-[11px] text-content-secondary">Municipal inward application file tracker</p>
                      </div>
                    </Link>

                    <Link
                      href="/services/assistant"
                      onClick={() => setActiveDropdown(null)}
                      className="w-full text-left p-2 rounded-subtle hover:bg-surface-hover flex items-start gap-2.5 transition-colors"
                    >
                      <HelpCircle className="w-4 h-4 text-accent mt-0.5 shrink-0" aria-hidden="true" />
                      <div>
                        <p className="text-xs font-bold text-content-primary">{t("nav.assistant")}</p>
                        <p className="text-[11px] text-content-secondary">Grounded municipal knowledge assistant</p>
                      </div>
                    </Link>

                    <div className="my-1 border-t border-border-subtle" />

                    <Link
                      href="/services"
                      onClick={() => setActiveDropdown(null)}
                      className="w-full text-left p-2 rounded-subtle hover:bg-surface-hover flex items-center justify-between text-xs font-bold text-brand transition-colors"
                    >
                      <span>{t("nav.allServices")}</span>
                      <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-content-muted" />
                    </Link>
                  </div>
                )}
              </div>
            </nav>

            {/* Desktop Action Controls (Aligned and clean) */}
            <div className="hidden lg:flex items-center gap-2">
              <LanguageSelector variant="dropdown" />
              <ThemeSelector variant="compact" />

              <div className="h-5 w-px bg-border mx-1" aria-hidden="true" />

              {currentUser ? (
                <div className="flex items-center gap-2">
                  <NotificationBell />
                  <Link
                    href={
                    currentUser.role === "ADMIN"
                      ? "/admin/dashboard"
                      : currentUser.role === "MUNICIPAL_OFFICER"
                      ? "/officer/dashboard"
                      : "/citizen/dashboard"
                  }
                >
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<LayoutDashboard className="w-3.5 h-3.5 text-brand" />}
                    className="font-medium text-xs"
                  >
                    <span>{currentUser.name}</span>
                    <Badge variant="brand" size="sm" className="ml-1 text-[10px] py-0 px-1.5">
                      {currentUser.role === "MUNICIPAL_OFFICER" ? "OFFICER" : currentUser.role}
                    </Badge>
                  </Button>
                </Link>
              </div>
              ) : (
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<LogIn className="w-3.5 h-3.5" />}
                    className="text-xs"
                  >
                    {t("nav.signIn")}
                  </Button>
                </Link>
              )}

              {/* Primary Action Button */}
              <Link href="/grievances/new">
                <Button
                  variant="accent"
                  size="sm"
                  leftIcon={<PlusCircle className="w-4 h-4" />}
                  className="shadow-subtle hover:shadow-card font-semibold text-xs"
                >
                  {t("nav.reportIssue")}
                </Button>
              </Link>
            </div>

            {/* Mobile Controls & Hamburger Toggle */}
            <div className="flex lg:hidden items-center gap-1.5 sm:gap-2 shrink-0">
              <LanguageSelector variant="dropdown" />
              <ThemeSelector variant="compact" />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-expanded={mobileMenuOpen}
                aria-label="Toggle navigation menu"
                className="p-1.5 sm:p-2 rounded-base border border-border bg-surface text-content-primary hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-focus-ring min-h-[38px] min-w-[38px] sm:min-h-[40px] sm:min-w-[40px] flex items-center justify-center"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <Menu className="w-5 h-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </Container>
      </header>

      {/* Mobile Drawer Navigation (Designed for touch and clarity) */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Drawer"
          className="lg:hidden fixed inset-0 top-16 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileMenuOpen(false);
          }}
        >
          <div className="w-full max-w-sm bg-surface border-b border-border shadow-elevated p-5 space-y-5 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-brand text-brand-contrast flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-content-primary uppercase tracking-wide">
                  {t("nav.menu")}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded text-content-secondary hover:text-content-primary"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Primary Links */}
            <div className="space-y-1">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-base text-sm font-semibold text-content-primary hover:bg-surface-hover transition-colors min-h-[44px]"
              >
                <span>{t("nav.home")}</span>
              </Link>
              <button
                type="button"
                onClick={() => scrollToSection("track-panel")}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-base text-sm font-semibold text-content-primary hover:bg-surface-hover text-left transition-colors min-h-[44px]"
              >
                <Search className="w-4 h-4 text-brand" />
                <span>{t("nav.track")}</span>
              </button>
              <Link
                href="/community"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-base text-sm font-semibold text-content-primary hover:bg-surface-hover text-left transition-colors min-h-[44px]"
              >
                <Layers className="w-4 h-4 text-brand" />
                <span>{t("nav.feed")}</span>
              </Link>
              <Link
                href="/community/map"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-base text-sm font-semibold text-content-primary hover:bg-surface-hover text-left transition-colors min-h-[44px]"
              >
                <MapPin className="w-4 h-4 text-accent" />
                <span>{t("nav.map")}</span>
              </Link>
              <button
                type="button"
                onClick={() => scrollToSection("how-it-works")}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-base text-sm font-semibold text-content-primary hover:bg-surface-hover text-left transition-colors min-h-[44px]"
              >
                <HelpCircle className="w-4 h-4 text-brand" />
                <span>{t("nav.howItWorks")}</span>
              </button>
            </div>

            {/* Mobile Civic Resources Sub-section */}
            <div className="pt-3 border-t border-border space-y-1">
              <span className="text-[11px] font-bold text-content-muted uppercase tracking-wider px-3 block mb-1">
                {t("nav.services")}
              </span>
              <Link
                href="/services"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-base text-xs font-semibold text-content-primary hover:bg-surface-hover text-left min-h-[40px]"
              >
                <Compass className="w-4 h-4 text-brand" />
                <span>{t("nav.allServices")}</span>
              </Link>
              <Link
                href="/services/charter"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-base text-xs font-medium text-content-secondary hover:text-content-primary hover:bg-surface-hover text-left min-h-[40px]"
              >
                <ShieldCheck className="w-4 h-4 text-status-success" />
                <span>{t("nav.charter")}</span>
              </Link>
              <Link
                href="/services/wards"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-base text-xs font-medium text-content-secondary hover:text-content-primary hover:bg-surface-hover text-left min-h-[40px]"
              >
                <Building2 className="w-4 h-4 text-brand" />
                <span>{t("nav.wardInfo")}</span>
              </Link>
              <Link
                href="/services/emergency"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-base text-xs font-medium text-content-secondary hover:text-content-primary hover:bg-surface-hover text-left min-h-[40px]"
              >
                <PhoneCall className="w-4 h-4 text-status-warning" />
                <span>{t("nav.emergency")}</span>
              </Link>
              <Link
                href="/services/etapaal"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-base text-xs font-medium text-content-secondary hover:text-content-primary hover:bg-surface-hover text-left min-h-[40px]"
              >
                <FileSpreadsheet className="w-4 h-4 text-status-info" />
                <span>{t("nav.etapaal")}</span>
              </Link>
              <Link
                href="/services/assistant"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-base text-xs font-medium text-content-secondary hover:text-content-primary hover:bg-surface-hover text-left min-h-[40px]"
              >
                <HelpCircle className="w-4 h-4 text-accent" />
                <span>{t("nav.assistant")}</span>
              </Link>
            </div>

            {/* Mobile Actions & Auth */}
            <div className="pt-4 border-t border-border space-y-2.5">
              <Link href="/grievances/new" onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant="accent"
                  className="w-full justify-center min-h-[44px] font-semibold"
                  leftIcon={<PlusCircle className="w-4 h-4" />}
                >
                  {t("nav.reportIssue")}
                </Button>
              </Link>

              {currentUser ? (
                <Link
                  href={
                    currentUser.role === "ADMIN"
                      ? "/admin/dashboard"
                      : currentUser.role === "MUNICIPAL_OFFICER"
                      ? "/officer/dashboard"
                      : "/citizen/dashboard"
                  }
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full justify-center min-h-[44px]"
                    leftIcon={<LayoutDashboard className="w-4 h-4" />}
                  >
                    Open Portal ({currentUser.role})
                  </Button>
                </Link>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-center min-h-[44px]"
                        leftIcon={<LogIn className="w-4 h-4" />}
                      >
                        {t("nav.signIn")}
                      </Button>
                    </Link>
                    <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full justify-center min-h-[44px]"
                        leftIcon={<User className="w-4 h-4" />}
                      >
                        Register
                      </Button>
                    </Link>
                  </div>
                  <Link
                    href="/staff/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-base bg-surface-muted border border-border text-xs font-semibold text-content-secondary hover:text-brand transition-colors min-h-[38px]"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-brand" />
                    <span>Municipal Staff &amp; Officer Portal</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Emergency Contacts Dialog */}
      <Dialog
        isOpen={emergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
        title="Verified Emergency & Disaster Helplines — Pune"
        description="Public safety and verified emergency contacts for Pune citizens. For active life-threatening emergencies, dial 112 immediately."
        footer={
          <Button variant="primary" size="sm" onClick={() => setEmergencyModalOpen(false)}>
            Close Emergency Directory
          </Button>
        }
      >
        <div className="space-y-3">
          <div className="p-3 rounded-base bg-status-warning-surface border border-status-warning-border text-xs text-status-warning flex items-start gap-2">
            <PhoneCall className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              PuneSetu is for non-emergency municipal grievances. In active crises, fires, or medical emergencies, call the verified numbers below directly.
            </span>
          </div>

          <div className="divide-y divide-border border border-border rounded-base overflow-hidden">
            {emergencyContacts.map((c) => (
              <div key={c.service} className="p-3 bg-surface hover:bg-surface-muted flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-content-primary">{c.service}</p>
                  <p className="text-[11px] text-content-secondary">{c.desc}</p>
                </div>
                <a
                  href={`tel:${c.number.split(" ")[0].replace(/[^0-9]/g, "")}`}
                  className="px-2.5 py-1 rounded bg-brand-surface text-brand font-mono font-bold text-xs hover:bg-brand hover:text-brand-contrast transition-colors shrink-0"
                >
                  {c.number}
                </a>
              </div>
            ))}
          </div>
        </div>
      </Dialog>

      {/* Roadmap / Coming Soon Dialog */}
      {generalComingSoon && (
        <Dialog
          isOpen={true}
          onClose={() => setGeneralComingSoon(null)}
          title={generalComingSoon.title}
          description={`Scheduled implementation: ${generalComingSoon.version}`}
          footer={
            <Button variant="primary" size="sm" onClick={() => setGeneralComingSoon(null)}>
              Close
            </Button>
          }
        >
          <div className="p-3.5 rounded-base bg-surface-muted border border-border text-xs text-content-secondary leading-relaxed">
            <p>{generalComingSoon.desc}</p>
          </div>
        </Dialog>
      )}
    </>
  );
}
