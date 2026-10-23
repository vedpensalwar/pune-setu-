import React from "react";
import { requireAuth } from "@/lib/auth/server";
import { PortalHeader } from "@/components/layout/portal-header";
import { Container } from "@/components/ui/container";

export default async function OfficerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Authoritative server-side authorization check: Only Officers & Admins permitted
  const user = await requireAuth(["MUNICIPAL_OFFICER", "ADMIN"], "/officer/login");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PortalHeader
        user={user}
        portalTitle="Municipal Officer Portal"
        portalSubtitle="Pune Municipal Corporation — Departmental Operations"
        badgeVariant="brand"
      />
      <main className="flex-1 py-6 sm:py-8">
        <Container size="full">{children}</Container>
      </main>
      <footer className="border-t border-border py-4 bg-surface text-center text-xs text-content-muted">
        <p>PuneSetu Municipal Operations Gateway • Official Government Personnel Only</p>
      </footer>
    </div>
  );
}
