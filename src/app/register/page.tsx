"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Eye, EyeOff, Lock, Mail, User, ArrowLeft, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useLanguage } from "@/components/language/language-provider";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter.");
      return;
    }
    if (!agreedTerms) {
      setErrorMessage("Please accept the PuneSetu Citizen Portal terms of use.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Registration failed. Please check your information.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      // Wait a moment then redirect to citizen dashboard
      setTimeout(() => {
        router.push("/citizen/dashboard");
        router.refresh();
      }, 1000);
    } catch {
      setErrorMessage("Network error occurred during registration. Please try again.");
      setLoading(false);
    }
  };

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

      <div className="w-full max-w-md mx-auto">
        <Card className="p-6 sm:p-8 border-border shadow-elevated bg-surface">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand/10 text-brand mb-3">
              <Building2 className="w-6 h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-content-primary">
              {t("auth.registerTitle")}
            </h1>
            <p className="text-xs text-content-secondary mt-1">
              {t("auth.registerSubtitle")}
            </p>
            <div className="mt-3 flex justify-center">
              <Badge variant="brand" size="sm">
                {t("auth.registerBadge")}
              </Badge>
            </div>
          </div>

          {/* Success Banner */}
          {success && (
            <div
              role="status"
              className="mb-5 p-3.5 rounded-base bg-status-success/10 border border-status-success/30 flex items-start gap-2.5 text-xs text-status-success"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{t("auth.accountCreatedSuccess")}</p>
                <p className="text-[11px] opacity-90">{t("auth.redirectingDashboard")}</p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-5 p-3 rounded-base bg-status-error/10 border border-status-error/30 flex items-start gap-2.5 text-xs text-status-error"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{errorMessage}</p>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              id="register-name"
              label={t("auth.fullName")}
              type="text"
              required
              autoComplete="name"
              placeholder={t("auth.fullNamePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading || success}
              leftIcon={<User className="w-4 h-4" />}
            />

            <Input
              id="register-email"
              label={t("auth.emailLabel")}
              type="email"
              required
              autoComplete="email"
              placeholder={t("auth.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || success}
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <div className="space-y-1.5 text-left">
              <label
                htmlFor="register-password"
                className="block text-xs font-semibold text-content-primary tracking-wide"
              >
                {t("auth.passwordLabel")} <span className="text-status-error">*</span>
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 flex items-center pointer-events-none text-content-muted">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder={t("auth.passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || success}
                  className="w-full h-10 pl-10 pr-10 rounded-base border border-border bg-surface text-content-primary placeholder:text-content-muted text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-focus focus:border-focus disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                  className="absolute right-3 p-1 text-content-muted hover:text-content-primary transition-colors focus:outline-none focus:ring-1 focus:ring-focus rounded"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-content-muted">{t("auth.passwordHelp")}</p>
            </div>

            <div className="space-y-1.5 text-left">
              <label
                htmlFor="register-confirm-password"
                className="block text-xs font-semibold text-content-primary tracking-wide"
              >
                {t("auth.confirmPassword")} <span className="text-status-error">*</span>
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 flex items-center pointer-events-none text-content-muted">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="register-confirm-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder={t("auth.confirmPasswordPlaceholder")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading || success}
                  className="w-full h-10 pl-10 pr-3 rounded-base border border-border bg-surface text-content-primary placeholder:text-content-muted text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-focus focus:border-focus disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="pt-1 flex items-start gap-2.5">
              <input
                id="register-terms"
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                disabled={loading || success}
                className="mt-0.5 h-4 w-4 rounded border-border text-brand focus:ring-focus focus:ring-offset-background"
              />
              <label htmlFor="register-terms" className="text-xs text-content-secondary leading-normal">
                {t("auth.agreeTerms")}
              </label>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                className="w-full h-11 text-sm font-semibold justify-center"
                disabled={loading || success}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" />
                    <span>{t("auth.creatingAccount")}</span>
                  </span>
                ) : (
                  t("auth.registerButton")
                )}
              </Button>
            </div>
          </form>

          {/* Role disclaimer & login link */}
          <div className="mt-6 pt-5 border-t border-border space-y-3 text-center text-xs text-content-secondary">
            <p>
              {t("auth.alreadyRegistered")}{" "}
              <Link
                href="/login"
                className="text-brand font-semibold hover:underline focus:outline-none focus:ring-1 focus:ring-focus rounded px-0.5"
              >
                {t("auth.signInToPortal")}
              </Link>
            </p>

            <div className="p-2.5 rounded-base bg-surface-muted/50 border border-border text-[11px] text-content-muted leading-relaxed text-left flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-brand shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-content-primary">{t("auth.officerAdminNotice")}</span>
                {" "}{t("auth.officerAdminNoticeText")}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom civic disclaimer */}
      <div className="max-w-md w-full mx-auto mt-8 text-center text-[11px] text-content-muted">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Badge variant="neutral" size="sm">Neighborhood Hacks 2026</Badge>
          <span>•</span>
          <span>Pune, Maharashtra</span>
        </div>
        <p>Pune Municipal Corporation Civic Infrastructure Initiative</p>
      </div>
    </div>
  );
}
