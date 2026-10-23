import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { listAuditLogs } from "@/lib/db/repository";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized: Administrator clearance required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const logs = await listAuditLogs(user, { action, limit });

    return NextResponse.json({
      success: true,
      logs,
    });
  } catch (error: any) {
    console.error("Admin audit logs error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load audit logs." },
      { status: 500 }
    );
  }
}
