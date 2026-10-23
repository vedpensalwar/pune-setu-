"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, LogOut, User as UserIcon, Shield, ChevronDown, Home } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeSelector } from "@/components/theme/theme-selector";
import { LanguageSelector } from "@/components/language/language-selector";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { SafeUser } from "@/lib/auth/types";
import { useLanguage } from "@/components/language/language-provider";

interface PortalHeaderProps {
  user: SafeUser;
  portalTitle: string;
  portalSubtitle?: string;
  badgeVariant?: "neutral" | "brand" | "accent" | "success" | "warning" | "error" | "info";
}

export function PortalHeader({
  user,
  portalTitle,
  portalSubtitle = "Pune Municipal Corporation",
  badgeVariant = "neutral",
}: PortalHeaderProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setLoggingOut(true);
    const target =
      user.role === "MUNICIPAL_OFFICER"
        ? "/officer/login"
        : user.role === "ADMIN"
        ? "/admin/login"
        : "/login";
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      router.push(target);
      router.refresh();
    } catch {
      router.push(target);
    }
  };

  const localizedPortalTitle =
    user.role === "CITIZEN"
      ? t("portal.citizenPortal")
      : user.role === "MUNICIPAL_OFFICER"
      ? t("portal.officerPortal")
      : user.role === "ADMIN"
      ? t("portal.adminPortal")
      : portalTitle;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/95 backdrop-blur-md">
      <Container size="full">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Left Brand & Portal Title */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 group focus:outline-none focus:ring-2 focus:ring-focus rounded-base p-1"
              title="Return to Public Homepage"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-base bg-brand text-white shadow-subtle group-hover:bg-brand-hover transition-colors">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-content-primary tracking-tight">PuneSetu</span>
                  <span className="text-xs text-brand font-medium">(पुणे सेतू)</span>
                </div>
                <p className="text-[10px] text-content-muted leading-none hidden sm:block">
                  {portalSubtitle}
                </p>
              </div>
            </Link>

            <span className="text-border mx-1 hidden sm:inline" aria-hidden="true">|</span>

            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-semibold text-content-primary">
                {localizedPortalTitle}
              </span>
              <Badge variant={badgeVariant} size="sm">
                {user.role}
              </Badge>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="hidden md:inline-flex items-center gap-1 text-xs text-content-secondary hover:text-brand px-2 py-1.5 rounded transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>{t("portal.publicHome")}</span>
            </Link>

            <NotificationBell />
            <ThemeSelector variant="compact" />
            <LanguageSelector variant="dropdown" />

            {/* User Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-expanded={menuOpen}
                aria-haspopup="true"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-base border border-border bg-surface hover:bg-surface-hover transition-colors focus:outline-none focus:ring-2 focus:ring-focus text-left"
              >
                <div className="w-7 h-7 rounded-full bg-brand/10 text-brand flex items-center justify-center text-xs font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left leading-tight">
                  <p className="text-xs font-semibold text-content-primary max-w-[120px] truncate">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-content-muted max-w-[120px] truncate">
                    {user.email}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-content-muted ml-0.5" />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 mt-2 w-64 rounded-base border border-border bg-surface p-2 shadow-elevated z-50 animate-in fade-in-50 zoom-in-95">
                    <div className="px-3 py-2 border-b border-border mb-1">
                      <p className="text-xs font-bold text-content-primary">{user.name}</p>
                      <p className="text-[11px] text-content-muted truncate">{user.email}</p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <Badge variant="neutral" size="sm">
                          {user.role}
                        </Badge>
                        {user.department && (
                          <span className="text-[10px] text-content-muted">
                            • {user.department}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-1">
                      <button
                        type="button"
                        onClick={handleSignOut}
                        disabled={loggingOut}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-subtle text-xs font-semibold text-status-error hover:bg-status-error/10 transition-colors text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{loggingOut ? t("portal.signingOut") : t("portal.signOut")}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </Container>
    </header>
  );
}
