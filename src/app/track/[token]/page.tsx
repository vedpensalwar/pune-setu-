import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { isValidTrackingToken } from "@/lib/civic/token";
import { getGrievanceTrackingDetails } from "@/lib/db/repository";
import { Container } from "@/components/ui/container";
import { TopInfoStrip } from "@/components/layout/top-info-strip";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Search, ArrowLeft } from "lucide-react";
import { TrackView } from "./track-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return {
    title: `Track Grievance ${token} | PuneSetu (पुणे सेतू)`,
    description: `Official grievance audit trail, application SLA countdown, and resolution timeline for ${token}.`,
  };
}

export default async function GrievanceTrackPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!isValidTrackingToken(token)) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-content-primary">
        <div className="print:hidden">
          <TopInfoStrip />
          <PublicHeader />
        </div>

        <main className="flex-1 py-12">
          <Container size="md">
            <Card className="p-8 text-center border-border bg-surface shadow-card space-y-4 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-full bg-status-danger/10 text-status-danger flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h1 className="text-lg font-bold text-content-primary">
                  Invalid Tracking Token Format
                </h1>
                <p className="text-xs text-content-secondary leading-relaxed">
                  The token <strong className="font-mono text-brand">{token}</strong> is not recognized. Standard PuneSetu tokens follow the format <code className="font-mono bg-surface-subtle px-1 rounded">PS-PUN-YYYY-XXXXXX</code>.
                </p>
              </div>
              <div className="pt-2">
                <Link href="/track">
                  <Button variant="primary" size="sm" leftIcon={<Search className="w-4 h-4" />}>
                    Search Valid Token
                  </Button>
                </Link>
              </div>
            </Card>
          </Container>
        </main>

        <div className="print:hidden">
          <PublicFooter />
        </div>
      </div>
    );
  }

  const viewer = await getCurrentUser();
  const trackingDetails = await getGrievanceTrackingDetails(token, viewer);

  return (
    <div className="min-h-screen flex flex-col bg-background text-content-primary">
      <div className="print:hidden">
        <TopInfoStrip />
        <PublicHeader />
      </div>

      <main className="flex-1 py-8 sm:py-12 print:p-0 print:m-0">
        <Container size="lg">
          {trackingDetails ? (
            <TrackView initialDetails={trackingDetails} />
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
                  No registered grievance matches tracking token <strong className="font-mono text-brand">{token}</strong> in the PuneSetu database. Please verify the code on your receipt and try again.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-2">
                <Link href="/track">
                  <Button variant="outline" size="sm" leftIcon={<Search className="w-4 h-4" />}>
                    Try Another Token
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                    Home
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
