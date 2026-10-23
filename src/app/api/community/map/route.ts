import { NextResponse } from "next/server";
import { getMapMarkers } from "@/lib/db/repository";

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

    const category = searchParams.get("category") || undefined;
    const status = searchParams.get("status") || undefined;
    const priority = searchParams.get("priority") || undefined;
    const departmentId = searchParams.get("departmentId") || undefined;
    const wardId = searchParams.get("wardId") || undefined;
    const search = searchParams.get("search") || undefined;

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

    const { markers, unlocatedCount } = await getMapMarkers({
      category,
      status,
      priority,
      departmentId,
      wardId,
      search,
    });

    return NextResponse.json({
      success: true,
      markers,
      count: markers.length,
      unlocatedCount,
    });
  } catch (error) {
    console.error("Map markers error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while loading map markers." },
      { status: 500 }
    );
  }
}
