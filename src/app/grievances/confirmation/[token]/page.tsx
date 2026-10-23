import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGrievanceByTrackingToken } from "@/lib/db/repository";
import { Container } from "@/components/ui/container";
import { TopInfoStrip } from "@/components/layout/top-info-strip";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { ConfirmationView } from "./confirmation-view";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Search } from "lucide-react";

export const metadata = {
  title: "Grievance Confirmation Receipt | PuneSetu (पुणे सेतू)",
  description: "Official registration acknowledgment slip and tracking token receipt.",
};

export default async function GrievanceConfirmationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const grievance = await getGrievanceByTrackingToken(token);

  return (
    <div className="min-h-screen flex flex-col bg-background text-content-primary">
      <div className="print:hidden">
        <TopInfoStrip />
        <PublicHeader />
      </div>

      <main className="flex-1 py-8 sm:py-12 print:p-0 print:m-0">
        <Container size="md">
          {grievance ? (
            <ConfirmationView grievance={grievance} />
          ) : (
            <Card className="p-8 text-center border-border bg-surface shadow-card space-y-4 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-full bg-status-danger/10 text-status-danger flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h1 className="text-lg font-bold text-content-primary">
                  Grievance Record Not Found
                </h1>
                <p className="text-xs text-content-secondary leading-relaxed">
                  No registered grievance matches tracking token <strong className="font-mono text-brand">{token}</strong>. Please check your token and try again.
                </p>
              </div>
              <div className="pt-2">
                <Link href="/#track-panel">
                  <Button variant="primary" size="sm" leftIcon={<Search className="w-4 h-4" />}>
                    Search Tracking Panel
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </Container>
      </main>

      <div className="print:hidden">
        <PublicFooter />
      </div>
    </div>
  );
}
