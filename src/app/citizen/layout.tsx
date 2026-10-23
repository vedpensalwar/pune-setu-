import React from "react";
import { requireAuth } from "@/lib/auth/server";
import { PortalHeader } from "@/components/layout/portal-header";
import { Container } from "@/components/ui/container";

export default async function CitizenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Authoritative server-side authorization check
  const user = await requireAuth(["CITIZEN", "ADMIN"]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PortalHeader
        user={user}
        portalTitle="Citizen Portal"
        portalSubtitle="Pune Municipal Corporation — Nagarik Suvidha"
        badgeVariant="neutral"
      />
      <main className="flex-1 py-6 sm:py-8">
        <Container size="full">{children}</Container>
      </main>
      <footer className="border-t border-border py-4 bg-surface text-center text-xs text-content-muted">
        <p>PuneSetu Citizen Redressal Portal • Pune Municipal Corporation (PMC)</p>
      </footer>
    </div>
  );
}
