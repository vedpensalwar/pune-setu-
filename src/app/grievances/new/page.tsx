import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { Container } from "@/components/ui/container";
import { GrievanceWizard } from "@/components/wizard/grievance-wizard";
import { TopInfoStrip } from "@/components/layout/top-info-strip";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";

export const metadata = {
  title: "Report Civic Grievance | PuneSetu (पुणे सेतू)",
  description:
    "File a municipal grievance with photo evidence, GPS geotagging, and automated ward routing across Pune Municipal Corporation.",
};

export default async function NewGrievancePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/grievances/new");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-content-primary">
      <TopInfoStrip />
      <PublicHeader />

      <main className="flex-1 py-8 sm:py-12">
        <Container size="md">
          <GrievanceWizard />
        </Container>
      </main>

      <PublicFooter />
    </div>
  );
}
