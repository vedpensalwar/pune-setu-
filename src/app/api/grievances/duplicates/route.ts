import { NextResponse } from "next/server";
import { duplicateCheckSchema } from "@/lib/civic/validation";
import { findNearbyDuplicates } from "@/lib/db/repository";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = duplicateCheckSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid duplicate check parameters.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { latitude, longitude, category, radiusMeters } = result.data;
    const duplicates = await findNearbyDuplicates(latitude, longitude, category, radiusMeters);

    return NextResponse.json({
      success: true,
      count: duplicates.length,
      radiusMeters,
      duplicates,
    });
  } catch (error: any) {
    console.error("Duplicate check error:", error);
    return NextResponse.json(
      { error: "Failed to perform duplicate check." },
      { status: 500 }
    );
  }
}
