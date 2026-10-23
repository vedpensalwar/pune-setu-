"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  Briefcase,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { sanitizeRedirectUrl } from "@/lib/auth/validation";
import { useLanguage } from "@/components/language/language-provider";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const rawRedirect = searchParams.get("redirect") || "";

  // Sanitize redirect URL to prevent Open Redirect attacks
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
      setErrorMessage("Please enter both your email address and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, portal: "citizen" }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Authentication failed. Please check your credentials.");
        setLoading(false);
        return;
      }

      // Successful login -> Redirect to requested page or role dashboard
      const targetUrl = safeRedirect || data.redirectUrl || "/citizen/dashboard";
      router.push(targetUrl);
      router.refresh();
    } catch {
      setErrorMessage("Network error occurred. Please check your connection and try again.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="p-6 sm:p-8 border-border shadow-elevated bg-surface">
        {/* Header inside card */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand/10 text-brand mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <Badge variant="neutral" size="sm">
              Citizen Portal
            </Badge>
            <span className="text-[11px] font-semibold text-content-muted">
              नागरिक पोर्टल
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-content-primary">
            {t("auth.signInTitle")}
          </h1>
          <p className="text-xs text-content-secondary mt-1">
            {t("auth.signInSubtitle")}
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
            id="login-email"
            label={t("auth.email")}
            type="email"
            required
            autoComplete="email"
            placeholder={t("auth.emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <div className="space-y-1.5 text-left">
            <label
              htmlFor="login-password"
              className="block text-xs font-semibold text-content-primary tracking-wide"
            >
              {t("auth.password")} <span className="text-status-error">*</span>
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3 flex items-center pointer-events-none text-content-muted">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full h-10 pl-10 pr-10 rounded-base border border-border bg-surface text-content-primary placeholder:text-content-muted text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-focus focus:border-focus disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={0}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 p-1 text-content-muted hover:text-content-primary transition-colors focus:outline-none focus:ring-1 focus:ring-focus rounded"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full h-11 text-sm font-semibold justify-center"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" />
                  <span>{t("auth.signingIn")}</span>
                </span>
              ) : (
                t("auth.signInButton")
              )}
            </Button>
          </div>
        </form>

        {/* Registration Link */}
        <div className="mt-5 text-center text-xs text-content-secondary">
          <p>
            {t("auth.noAccount")}{" "}
            <Link
              href="/register"
              className="text-brand font-semibold hover:underline focus:outline-none focus:ring-1 focus:ring-focus rounded px-0.5"
            >
              {t("auth.signUpLink")}
            </Link>
          </p>
        </div>

        {/* Municipal Staff & Administration Section */}
        <div className="mt-6 pt-5 border-t border-border space-y-3.5">
          <div className="flex items-center gap-2">
            <div className="h-px bg-border flex-1" />
            <span className="text-[10px] font-bold tracking-wider uppercase text-content-muted">
              {t("auth.staffAccessHeading")}
            </span>
            <div className="h-px bg-border flex-1" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Municipal Officer Login Link */}
            <Link
              href={`/officer/login${safeRedirect ? `?redirect=${encodeURIComponent(safeRedirect)}` : ""}`}
              className="group flex items-center justify-between p-3 rounded-base border border-border bg-surface-muted/40 hover:bg-surface-muted hover:border-brand/50 transition-all text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded bg-brand/10 text-brand flex items-center justify-center shrink-0 group-hover:bg-brand group-hover:text-brand-contrast transition-colors">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-xs text-content-primary truncate group-hover:text-brand transition-colors">
                    {t("auth.officerPortalCard")}
                  </div>
                  <div className="text-[10px] text-content-muted truncate">
                    {t("auth.officerPortalDesc")}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-content-muted group-hover:text-brand group-hover:translate-x-0.5 transition-all shrink-0 ml-1.5" />
            </Link>

            {/* Administrator Login Link */}
            <Link
              href={`/admin/login${safeRedirect ? `?redirect=${encodeURIComponent(safeRedirect)}` : ""}`}
              className="group flex items-center justify-between p-3 rounded-base border border-border bg-surface-muted/40 hover:bg-surface-muted hover:border-accent/50 transition-all text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded bg-accent/10 text-accent flex items-center justify-center shrink-0 group-hover:bg-accent group-hover:text-white transition-colors">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-xs text-content-primary truncate group-hover:text-accent transition-colors">
                    {t("auth.adminPortalCard")}
                  </div>
                  <div className="text-[10px] text-content-muted truncate">
                    {t("auth.adminPortalDesc")}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-content-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0 ml-1.5" />
            </Link>
          </div>

          {/* Honest Explanation Notice */}
          <div className="p-2.5 rounded-base bg-surface-muted/60 border border-border text-[11px] text-content-secondary leading-relaxed text-left flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-brand shrink-0 mt-0.5" />
            <div>
              {t("auth.assignedCredentialsNotice")}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top back navigation */}
      <div className="max-w-md w-full mx-auto mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-content-secondary hover:text-brand transition-colors focus:outline-none focus:ring-1 focus:ring-focus rounded px-1 py-0.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to PuneSetu Home</span>
        </Link>
      </div>

      {/* Main content with Suspense for useSearchParams */}
      <Suspense
        fallback={
          <div className="w-full max-w-md mx-auto p-8 text-center text-content-muted">
            <Spinner size="md" className="mx-auto mb-2" />
            <p className="text-xs">Loading sign-in portal...</p>
          </div>
        }
      >
        <LoginForm />
      </Suspense>

      {/* Bottom civic disclaimer */}
      <div className="max-w-md w-full mx-auto mt-8 text-center text-[11px] text-content-muted">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Badge variant="neutral" size="sm">Neighborhood Hacks 2026</Badge>
          <span>•</span>
          <span>Pune, Maharashtra</span>
        </div>
        <p>PuneSetu Civic Redressal &amp; Municipal Engagement Platform</p>
      </div>
    </div>
  );
}
