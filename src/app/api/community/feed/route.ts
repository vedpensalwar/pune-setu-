import { NextResponse } from "next/server";
import { listPublicFeed } from "@/lib/db/repository";

const VALID_CATEGORIES = [
  "ROADS_POTHOLES", "SOLID_WASTE", "WATER_SUPPLY", "STREET_LIGHTING",
  "SEWAGE_DRAINAGE", "TRAFFIC_TRANSPORT", "ENCROACHMENT", "GARDENS_PARKS",
  "HEALTH_SANITATION", "OTHER",
];
const VALID_STATUSES = [
  "SUBMITTED", "ASSIGNED", "IN_PROGRESS", "RESOLVED",
  "REJECTED", "ESCALATED", "SLA_BREACHED", "REOPENED",
];
const VALID_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "EMERGENCY"];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || undefined;
    const category = searchParams.get("category") || undefined;
    const status = searchParams.get("status") || undefined;
    const priority = searchParams.get("priority") || undefined;
    const departmentId = searchParams.get("departmentId") || undefined;
    const wardId = searchParams.get("wardId") || undefined;
    const pageStr = searchParams.get("page") || "1";
    const limitStr = searchParams.get("limit") || "20";
    const sortByParam = searchParams.get("sortBy");
    const sortBy = sortByParam === "most_endorsed" ? "most_endorsed" : "newest";

    // Validate enum params
    if (category && !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "Invalid category filter." }, { status: 400 });
    }
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status filter." }, { status: 400 });
    }
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json({ error: "Invalid priority filter." }, { status: 400 });
    }

    const page = Math.max(1, parseInt(pageStr, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(limitStr, 10) || 20));

    const result = await listPublicFeed({
      search,
      category,
      status,
      priority,
      departmentId,
      wardId,
      sortBy,
      page,
      limit,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Community feed error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while loading the community feed." },
      { status: 500 }
    );
  }
}
