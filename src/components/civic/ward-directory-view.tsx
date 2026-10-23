"use client";

import React, { useState, useMemo } from "react";
import {
  Building2,
  Search,
  Phone,
  Mail,
  Clock,
  MapPin,
  ExternalLink,
  Filter,
  Check,
  Compass,
  Info,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language/language-provider";
import { PMC_PRABHAG_WARDS, type WardOfficeRecord } from "@/lib/civic/ward-directory-data";

export function WardDirectoryView() {
  const { language, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedZone, setSelectedZone] = useState("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const zones = useMemo(() => {
    const list = Array.from(new Set(PMC_PRABHAG_WARDS.map((w) => w.zone)));
    return ["ALL", ...list];
  }, []);

  const filteredWards = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return PMC_PRABHAG_WARDS.filter((ward) => {
      const matchesZone = selectedZone === "ALL" || ward.zone === selectedZone;
      if (!matchesZone) return false;

      if (!query) return true;

      const matchesName =
        ward.name.toLowerCase().includes(query) ||
        ward.nameMr.toLowerCase().includes(query) ||
        ward.nameHi.toLowerCase().includes(query);
      const matchesAddress =
        ward.officeAddress.toLowerCase().includes(query) ||
        ward.officeAddressMr.toLowerCase().includes(query) ||
        ward.officeAddressHi.toLowerCase().includes(query);
      const matchesNumber = ward.wardNumber.toString() === query;
      const matchesArea =
        ward.jurisdictionAreas.some((a) => a.toLowerCase().includes(query)) ||
        ward.jurisdictionAreasMr.some((a) => a.toLowerCase().includes(query)) ||
        ward.jurisdictionAreasHi.some((a) => a.toLowerCase().includes(query));

      return matchesName || matchesAddress || matchesNumber || matchesArea;
    });
  }, [searchQuery, selectedZone]);

  const handleCopyPhone = (ward: WardOfficeRecord) => {
    navigator.clipboard.writeText(ward.contactPhone);
    setCopiedId(ward.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-content-primary py-8 sm:py-12">
      <Container size="lg">
        {/* Header */}
        <div className="mb-8 border-b border-border pb-6">
          <div className="inline-flex items-center gap-2 mb-3">
            <Badge variant="brand" size="md">
              <Building2 className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
              {t("wards.badge")}
            </Badge>
            <span className="text-xs text-content-secondary">
              15 Administrative Prabhag Divisions
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-content-primary mb-2">
            {t("wards.title")}
          </h1>
          <p className="text-sm sm:text-base text-content-secondary max-w-3xl leading-relaxed">
            {t("wards.subtitle")}
          </p>

          {/* PCMC Disclaimer Callout */}
          <div className="mt-4 p-3 rounded-base bg-surface-muted border border-border flex items-start gap-2.5 text-xs">
            <Info className="w-4 h-4 text-brand shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <span className="text-content-secondary">{t("wards.pcmcNote")} </span>
              <a
                href="https://www.pcmcindia.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand font-semibold hover:underline inline-flex items-center gap-1 ml-1"
              >
                {t("wards.pcmcLink")} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Search & Zone Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("wards.searchPlaceholder")}
              aria-label={t("wards.searchPlaceholder")}
              className="w-full h-11 pl-10 pr-4 text-sm rounded-base border border-border bg-surface text-content-primary focus:outline-none focus:ring-2 focus:ring-focus-ring"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-content-muted shrink-0 hidden sm:block" aria-hidden="true" />
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              aria-label={t("wards.zoneFilter")}
              className="h-11 px-3 text-sm rounded-base border border-border bg-surface text-content-primary focus:outline-none focus:ring-2 focus:ring-focus-ring"
            >
              <option value="ALL">{t("wards.allZones")}</option>
              {zones.filter((z) => z !== "ALL").map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>

            {(searchQuery || selectedZone !== "ALL") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedZone("ALL");
                }}
                className="text-xs"
              >
                {t("common.reset")}
              </Button>
            )}
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-content-secondary mb-4">
          <span>Showing {filteredWards.length} of 15 Prabhag Ward Offices</span>
          <span className="text-[11px] text-content-muted">Official PMC Ward Master</span>
        </div>

        {/* Wards Grid */}
        {filteredWards.length === 0 ? (
          <div className="p-12 text-center rounded-base border border-dashed border-border bg-surface">
            <Compass className="w-8 h-8 mx-auto text-content-muted mb-3" aria-hidden="true" />
            <p className="text-sm font-semibold text-content-primary mb-1">{t("common.noResults")}</p>
            <p className="text-xs text-content-secondary mb-4">
              Try adjusting your search query or clearing zone filters.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedZone("ALL");
              }}
            >
              {t("common.clearFilters")}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredWards.map((ward) => (
              <Card
                key={ward.id}
                className="p-5 flex flex-col justify-between hover:shadow-card hover:border-brand/30 transition-all duration-150"
              >
                <div>
                  {/* Top Bar: Number & Zone */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge variant="brand" size="sm">
                      Ward {ward.wardNumber}
                    </Badge>
                    <span className="text-[11px] font-medium text-content-muted">
                      {language === "mr" ? ward.zoneNameMr : language === "hi" ? ward.zoneNameHi : ward.zone}
                    </span>
                  </div>

                  {/* Ward Name (Localized) */}
                  <h2 className="text-base font-bold text-content-primary mb-1">
                    {language === "mr" ? ward.nameMr : language === "hi" ? ward.nameHi : ward.name}
                  </h2>
                  <p className="text-xs text-content-secondary mb-3">
                    {ward.assistantCommissioner}
                  </p>

                  {/* Address */}
                  <div className="flex items-start gap-2 text-xs text-content-primary mb-3">
                    <MapPin className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="leading-relaxed">
                      {language === "mr" ? ward.officeAddressMr : language === "hi" ? ward.officeAddressHi : ward.officeAddress}
                    </span>
                  </div>

                  {/* Hours */}
                  <div className="flex items-start gap-2 text-[11px] text-content-secondary mb-3">
                    <Clock className="w-3.5 h-3.5 text-content-muted shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{ward.officeHours}</span>
                  </div>

                  {/* Jurisdiction Areas Tags */}
                  <div className="mb-4">
                    <p className="text-[10px] font-semibold text-content-muted uppercase tracking-wider mb-1.5">
                      Jurisdiction Localities
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {(language === "mr" ? ward.jurisdictionAreasMr : language === "hi" ? ward.jurisdictionAreasHi : ward.jurisdictionAreas).map((area) => (
                        <span
                          key={area}
                          className="px-2 py-0.5 rounded-subtle bg-surface-muted text-[11px] text-content-secondary border border-border-subtle"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                  <a
                    href={ward.callHref}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-base bg-brand text-brand-contrast text-xs font-semibold hover:bg-brand-hover transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{ward.contactPhone}</span>
                  </a>

                  <a
                    href={ward.directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-brand font-semibold hover:underline"
                  >
                    <span>{t("wards.directions")}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Provenance Footer */}
        <div className="mt-8 p-3 rounded-base bg-surface-muted/50 border border-border text-center text-xs text-content-muted">
          {t("wards.verifiedProvenance")} Last verified: October 2026.
        </div>
      </Container>
    </div>
  );
}
