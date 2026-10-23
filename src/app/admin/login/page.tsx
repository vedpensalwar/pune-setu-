"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldAlert,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  Building,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { sanitizeRedirectUrl } from "@/lib/auth/validation";
import { useLanguage } from "@/components/language/language-provider";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect") || "";
  const { t } = useLanguage();

  // Sanitize redirect URL to prevent Open Redirect vulnerabilities
  const safeRedirect = sanitizeRedirectUrl(rawRedirect);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both your administrator credentials.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          portal: "admin",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Authentication failed. High-security administrator credentials required.");
        setLoading(false);
        return;
      }

      // Successful login -> Redirect to requested page or admin dashboard
      const targetUrl = safeRedirect || data.redirectUrl || "/admin/dashboard";
      router.push(targetUrl);
      router.refresh();
    } catch {
      setErrorMessage("Network error connecting to PMC Command Center authentication service. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="p-6 sm:p-8 border-border shadow-elevated bg-surface">
        {/* Header badge & title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent text-white mb-3 shadow-subtle">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <Badge variant="accent" size="sm">
              {t("auth.badgeAdmin")}
            </Badge>
            <span className="text-[11px] font-semibold text-content-muted">
              Tier-1 Administrative Access
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-content-primary">
            {t("auth.adminLoginTitle")}
          </h1>
          <p className="text-xs text-content-secondary mt-1">
            {t("auth.adminLoginSubtitle")}
          </p>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-5 p-3 rounded-base bg-status-error/10 border border-status-error/30 flex items-start gap-2.5 text-xs text-status-error"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            id="admin-email"
            label={t("auth.email")}
            type="email"
            required
            autoComplete="email"
            placeholder={t("auth.adminEmailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <div className="space-y-1.5 text-left">
            <label
              htmlFor="admin-password"
              className="block text-xs font-semibold text-content-primary tracking-wide"
            >
              {t("auth.password")} <span className="text-status-error">*</span>
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3 flex items-center pointer-events-none text-content-muted">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder={t("auth.passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full h-10 pl-10 pr-10 rounded-base border border-border bg-surface text-content-primary placeholder:text-content-muted text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-focus focus:border-focus disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={0}
                aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                className="absolute right-3 p-1 text-content-muted hover:text-content-primary transition-colors focus:outline-none focus:ring-1 focus:ring-focus rounded"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="accent"
              className="w-full h-11 text-sm font-semibold justify-center shadow-subtle hover:shadow-card"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" />
                  <span>{t("auth.adminVerifying")}</span>
                </span>
              ) : (
                t("auth.adminSignInButton")
              )}
            </Button>
          </div>
        </form>

        {/* Security Notice */}
        <div className="mt-5 p-3 rounded-base bg-surface-muted border border-border text-[11px] text-content-secondary leading-relaxed text-left flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-content-primary">{t("auth.highSecurityZone")}</span>
            {" "}{t("auth.highSecurityNotice")}
          </div>
        </div>

        {/* Cross-portal Navigation Links */}
        <div className="mt-6 pt-5 border-t border-border space-y-2.5 text-center text-xs">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-content-secondary">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-brand font-medium hover:underline focus:outline-none focus:ring-1 focus:ring-focus rounded px-1 py-0.5"
            >
              <Building className="w-3.5 h-3.5" />
              <span>{t("auth.switchToCitizen")}</span>
            </Link>

            <Link
              href="/officer/login"
              className="inline-flex items-center gap-1 text-content-primary font-medium hover:text-brand hover:underline focus:outline-none focus:ring-1 focus:ring-focus rounded px-1 py-0.5"
            >
              <Briefcase className="w-3.5 h-3.5 text-brand" />
              <span>{t("auth.officerLogin")}</span>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function AdminLoginPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top back navigation */}
      <div className="max-w-md w-full mx-auto mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-content-secondary hover:text-brand transition-colors focus:outline-none focus:ring-1 focus:ring-focus rounded px-1 py-0.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t("auth.backToHome")}</span>
        </Link>
      </div>

      {/* Main content with Suspense for useSearchParams */}
      <Suspense
        fallback={
          <div className="w-full max-w-md mx-auto p-8 text-center text-content-muted">
            <Spinner size="md" className="mx-auto mb-2" />
            <p className="text-xs">{t("auth.loadingPortal")}</p>
          </div>
        }
      >
        <AdminLoginForm />
      </Suspense>

      {/* Bottom civic disclaimer */}
      <div className="max-w-md w-full mx-auto mt-8 text-center text-[11px] text-content-muted">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Badge variant="neutral" size="sm">Neighborhood Hacks 2026</Badge>
          <span>•</span>
          <span>Pune Municipal Corporation</span>
        </div>
        <p>PuneSetu Administrative Command Center • Strictly Authorized Personnel Only</p>
      </div>
    </div>
  );
}
