import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { createGrievanceSchema, listGrievancesQuerySchema } from "@/lib/civic/validation";
import { createGrievance, listGrievances, sanitizeGrievanceForPublic } from "@/lib/db/repository";

export async function POST(request: Request) {
  try {
    // 1. Authenticate user server-side
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to file a municipal grievance. Please sign in." },
        { status: 401 }
      );
    }

    // 2. Validate input body
    const body = await request.json();
    const result = createGrievanceSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid grievance submission data.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    // 3. Create grievance in persistence layer
    const { grievance, trackingToken } = await createGrievance(result.data, user);

    return NextResponse.json(
      {
        success: true,
        message: "Grievance submitted successfully.",
        trackingToken,
        grievance,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Grievance submission error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while saving the grievance. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQuery = {
      status: searchParams.get("status") || undefined,
      category: searchParams.get("category") || undefined,
      priority: searchParams.get("priority") || undefined,
      departmentId: searchParams.get("departmentId") || undefined,
      wardId: searchParams.get("wardId") || undefined,
      citizenOnly: searchParams.get("citizenOnly") || undefined,
      followedOnly: searchParams.get("followedOnly") || undefined,
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
    };

    const queryResult = listGrievancesQuerySchema.safeParse(rawQuery);
    if (!queryResult.success) {
      const errorMsg = queryResult.error.issues[0]?.message || "Invalid query parameters.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const viewer = await getCurrentUser();
    const result = await listGrievances(queryResult.data, viewer);

    // Privileged viewers (officers/admins) receive full scoped records.
    // Public viewers and citizens receive privacy-masked records: exact GPS
    // coordinates and citizen identifiers are scrubbed to prevent PII leakage
    // through the public list endpoint.
    const isPrivilegedViewer = Boolean(
      viewer && (viewer.role === "MUNICIPAL_OFFICER" || viewer.role === "ADMIN"),
    );
    const grievances = await Promise.all(
      result.grievances.map((g) =>
        isPrivilegedViewer ? g : sanitizeGrievanceForPublic(g, viewer),
      ),
    );

    return NextResponse.json({
      success: true,
      grievances,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    });
  } catch (error) {
    console.error("Grievance list error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while retrieving grievances." },
      { status: 500 }
    );
  }
}
