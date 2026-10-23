import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { getDepartmentPerformance } from "@/lib/db/repository";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized: Administrator clearance required." },
        { status: 401 }
      );
    }

    const departments = await getDepartmentPerformance(user);

    return NextResponse.json({
      success: true,
      departments,
    });
  } catch (error: any) {
    console.error("Admin department performance error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load department performance records." },
      { status: 500 }
    );
  }
}
