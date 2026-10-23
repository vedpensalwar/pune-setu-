import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { processOverdueGrievances } from "@/lib/db/repository";
import { overdueProcessingSchema } from "@/lib/civic/validation";

/**
 * Server-Side Overdue Processing Endpoint.
 * Can be triggered via scheduled cron task (Vercel cron, system crontab, or cloud scheduler)
 * or manually invoked by an authenticated Municipal Administrator.
 */
export async function POST(request: Request) {
  try {
    // 1. Authorization: Validate CRON_SECRET or Admin Session
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const isCronAuthorized = cronSecret && authHeader === `Bearer ${cronSecret}`;

    let isAuthorized = Boolean(isCronAuthorized);

    if (!isAuthorized) {
      const user = await getCurrentUser();
      if (user && user.role === "ADMIN") {
        isAuthorized = true;
      }
    }

    // In local development mode without secret, permit execution for manual verification
    if (!isAuthorized && process.env.NODE_ENV === "development") {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized. Valid CRON_SECRET bearer token or Admin authentication required." },
        { status: 401 }
      );
    }

    // 2. Parse optional query / body options
    let bodyOptions = {};
    try {
      const json = await request.json();
      bodyOptions = json || {};
    } catch {
      // Body may be empty on simple cron triggers
    }

    const validation = overdueProcessingSchema.safeParse(bodyOptions);
    const options = validation.success ? validation.data : { limit: 50, dryRun: false };

    // 3. Execute idempotent overdue processing
    const result = await processOverdueGrievances(options);

    return NextResponse.json({
      message: `Overdue SLA scan completed. Evaluated ${result.processedCount} overdue grievances, triggered ${result.escalatedCount} escalations, skipped ${result.skippedCount} already escalated.`,
      ...result,
    });
  } catch (error: any) {
    console.error("Cron overdue processing error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute server-side overdue processing." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  // Allow simple GET requests with query param ?key=<CRON_SECRET> for external ping schedulers
  const url = new URL(request.url);
  const keyParam = url.searchParams.get("key");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && keyParam !== cronSecret) {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized cron ping." }, { status: 401 });
    }
  }

  const result = await processOverdueGrievances({ limit: 50 });
  return NextResponse.json({
    message: "GET ping triggered overdue scan successfully.",
    ...result,
  });
}
