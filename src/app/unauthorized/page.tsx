"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowLeft, LogOut, Home, LayoutDashboard } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SafeUser } from "@/lib/auth/types";
import { getRoleDashboardUrl } from "@/lib/auth/session";

export default function UnauthorizedPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SafeUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  const dashboardUrl = currentUser ? getRoleDashboardUrl(currentUser.role) : "/login";

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top back navigation */}
      <div className="max-w-lg w-full mx-auto mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-content-secondary hover:text-brand transition-colors focus:outline-none focus:ring-1 focus:ring-focus rounded px-1 py-0.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to PuneSetu Home</span>
        </Link>
      </div>

      <div className="w-full max-w-lg mx-auto">
        <Card className="p-6 sm:p-8 border-border shadow-elevated bg-surface text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-status-error/10 text-status-error mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <Badge variant="error" size="sm" className="mb-3">
            Access Restricted (403)
          </Badge>

          <h1 className="text-xl sm:text-2xl font-bold text-content-primary mb-2">
            Insufficient Permissions
          </h1>

          <p className="text-xs sm:text-sm text-content-secondary mb-6 leading-relaxed">
            You do not have the required administrative or departmental clearance to view this section of PuneSetu.
          </p>

          {/* User state box */}
          {!loading && currentUser && (
            <div className="mb-6 p-3.5 rounded-base bg-surface-muted/50 border border-border text-left text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-content-muted">Signed In As:</span>
                <span className="font-semibold text-content-primary">{currentUser.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-content-muted">Email:</span>
                <span className="text-content-primary font-mono text-[11px]">{currentUser.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-content-muted">Assigned Role:</span>
                <Badge variant="neutral" size="sm">{currentUser.role}</Badge>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="primary"
              onClick={() => router.push(dashboardUrl)}
              leftIcon={<LayoutDashboard className="w-4 h-4" />}
            >
              Go to My Portal
            </Button>

            <Button
              variant="outline"
              onClick={handleSignOut}
              leftIcon={<LogOut className="w-4 h-4" />}
            >
              Sign In with Another Account
            </Button>
          </div>
        </Card>
      </div>

      {/* Footer */}
      <div className="max-w-lg w-full mx-auto mt-8 text-center text-[11px] text-content-muted">
        <p>PuneSetu Civic Redressal &amp; Municipal Engagement Platform • PMC Pune</p>
      </div>
    </div>
  );
}
