import React from "react";
import { requireAuth } from "@/lib/auth/server";
import { PortalHeader } from "@/components/layout/portal-header";
import { Container } from "@/components/ui/container";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Authoritative server-side authorization check: STRICTLY ADMIN ONLY
  const user = await requireAuth(["ADMIN"], "/admin/login");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PortalHeader
        user={user}
        portalTitle="PMC Command Center"
        portalSubtitle="Pune Municipal Corporation — Central Administration"
        badgeVariant="accent"
      />
      <main className="flex-1 py-6 sm:py-8">
        <Container size="full">{children}</Container>
      </main>
      <footer className="border-t border-border py-4 bg-surface text-center text-xs text-content-muted">
        <p>PuneSetu Administrative Command Center • High Security Zone • PMC Pune</p>
      </footer>
    </div>
  );
}
