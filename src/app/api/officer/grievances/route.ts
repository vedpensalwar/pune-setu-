import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { listOfficerGrievances } from "@/lib/db/repository";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "MUNICIPAL_OFFICER" && user.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized: Officer clearance required to view operational queue." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const priority = searchParams.get("priority") || undefined;
    const wardId = searchParams.get("wardId") || undefined;
    const departmentId = searchParams.get("departmentId") || undefined;
    const search = searchParams.get("search") || undefined;
    const overdueOnly = searchParams.get("overdueOnly") === "true";
    const nearDeadlineOnly = searchParams.get("nearDeadlineOnly") === "true";
    const sortBy = (searchParams.get("sortBy") as any) || undefined;
    const sortOrder = (searchParams.get("sortOrder") as any) || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const result = await listOfficerGrievances(user, {
      status,
      priority,
      wardId,
      departmentId,
      search,
      overdueOnly,
      nearDeadlineOnly,
      sortBy,
      sortOrder,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("Officer grievances error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load officer grievance queue." },
      { status: 500 }
    );
  }
}
