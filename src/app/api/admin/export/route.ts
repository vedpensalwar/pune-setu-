import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { generateAdminExportCSV } from "@/lib/db/repository";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized: Administrator clearance required for data export." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = (searchParams.get("type") || "grievances") as
      | "grievances"
      | "departments"
      | "wards"
      | "escalations"
      | "audit";

    const validTypes = ["grievances", "departments", "wards", "escalations", "audit"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid report type. Allowed: [${validTypes.join(", ")}]` },
        { status: 400 }
      );
    }

    const csvContent = await generateAdminExportCSV(type, user);
    const filename = `punesetu_${type}_export_${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("Admin export error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate export report." },
      { status: 500 }
    );
  }
}
