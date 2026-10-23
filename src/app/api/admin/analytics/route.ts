import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { getAdminAnalytics } from "@/lib/db/repository";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized: Administrator clearance required to view system analytics." },
        { status: 401 }
      );
    }

    const analytics = await getAdminAnalytics(user);

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (error: any) {
    console.error("Admin analytics error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load system analytics." },
      { status: 500 }
    );
  }
}
