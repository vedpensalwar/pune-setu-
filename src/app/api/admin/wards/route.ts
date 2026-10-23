import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { getWardPerformance } from "@/lib/db/repository";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized: Administrator clearance required." },
        { status: 401 }
      );
    }

    const wards = await getWardPerformance(user);

    return NextResponse.json({
      success: true,
      wards,
    });
  } catch (error: any) {
    console.error("Admin ward performance error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load ward performance records." },
      { status: 500 }
    );
  }
}
