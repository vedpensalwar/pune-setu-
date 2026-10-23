"use client";

import React from "react";
import Link from "next/link";
import {
  Briefcase,
  ShieldAlert,
  ArrowLeft,
  ArrowRight,
  Building,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language/language-provider";

export default function StaffPortalGatewayPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top back navigation */}
      <div className="max-w-2xl w-full mx-auto mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-content-secondary hover:text-brand transition-colors focus:outline-none focus:ring-1 focus:ring-focus rounded px-1 py-0.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t("auth.backToHome")}</span>
        </Link>
      </div>

      {/* Main Staff Portal Gateway Content */}
      <div className="max-w-2xl w-full mx-auto my-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand/10 text-brand mb-2">
            <Lock className="w-7 h-7" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="brand" size="sm">
              PMC Authorized Staff
            </Badge>
            <span className="text-xs font-semibold text-content-muted">
              Security Tier 2
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-content-primary tracking-tight">
            {t("auth.staffGatewayTitle")}
          </h1>
          <p className="text-xs sm:text-sm text-content-secondary max-w-lg mx-auto">
            {t("auth.staffGatewaySubtitle")}
          </p>
        </div>

        {/* Portal Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-2">
          {/* Card 1: Municipal Officer Portal */}
          <Card className="p-6 border-border hover:border-brand/50 hover:shadow-card transition-all duration-200 flex flex-col justify-between group bg-surface">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-base bg-brand/10 text-brand flex items-center justify-center group-hover:bg-brand group-hover:text-brand-contrast transition-colors">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Badge variant="brand" size="sm">
                    {t("auth.officerCardBadge")}
                  </Badge>
                </div>
                <h2 className="text-lg font-bold text-content-primary">
                  {t("auth.officerCardTitle")}
                </h2>
                <p className="text-xs text-content-secondary mt-1.5 leading-relaxed">
                  {t("auth.officerCardDesc")}
                </p>
              </div>
            </div>

            <div className="pt-6">
              <Link href="/officer/login" className="block w-full">
                <Button
                  variant="primary"
                  className="w-full justify-between h-11 text-xs font-semibold"
                  rightIcon={<ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
                >
                  {t("auth.officerCardButton")}
                </Button>
              </Link>
            </div>
          </Card>

          {/* Card 2: Administrator Portal */}
          <Card className="p-6 border-border hover:border-accent/50 hover:shadow-card transition-all duration-200 flex flex-col justify-between group bg-surface">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-base bg-accent/10 text-accent flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-colors">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Badge variant="accent" size="sm">
                    {t("auth.adminCardBadge")}
                  </Badge>
                </div>
                <h2 className="text-lg font-bold text-content-primary">
                  {t("auth.adminCardTitle")}
                </h2>
                <p className="text-xs text-content-secondary mt-1.5 leading-relaxed">
                  {t("auth.adminCardDesc")}
                </p>
              </div>
            </div>

            <div className="pt-6">
              <Link href="/admin/login" className="block w-full">
                <Button
                  variant="accent"
                  className="w-full justify-between h-11 text-xs font-semibold shadow-subtle hover:shadow-card"
                  rightIcon={<ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
                >
                  {t("auth.adminCardButton")}
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Security & Guidance Footer */}
        <div className="p-4 rounded-base bg-surface-muted border border-border text-xs text-content-secondary space-y-2 text-left">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-brand shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>{t("auth.officialCredentialsRequired")}</strong> {t("auth.officialCredentialsNotice")}
            </p>
          </div>
        </div>

        {/* Citizen Portal Return Link */}
        <div className="text-center pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:underline focus:outline-none focus:ring-1 focus:ring-focus rounded px-2 py-1"
          >
            <Building className="w-4 h-4" />
            <span>{t("auth.areYouCitizen")}</span>
          </Link>
        </div>
      </div>

      {/* Bottom civic disclaimer */}
      <div className="max-w-md w-full mx-auto mt-8 text-center text-[11px] text-content-muted">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Badge variant="neutral" size="sm">Neighborhood Hacks 2026</Badge>
          <span>•</span>
          <span>PMC Pune</span>
        </div>
        <p>PuneSetu Civic Redressal &amp; Municipal Engagement Platform</p>
      </div>
    </div>
  );
}
