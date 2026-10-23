import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { getOfficerStats } from "@/lib/db/repository";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "MUNICIPAL_OFFICER" && user.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized: Officer clearance required to view operational statistics." },
        { status: 401 }
      );
    }

    const stats = await getOfficerStats(user);

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error("Officer stats error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load officer operational statistics." },
      { status: 500 }
    );
  }
}
