import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { getUserEngagementState, getGrievanceByTrackingToken } from "@/lib/db/repository";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ endorsed: false, following: false, authenticated: false });
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Token is required." }, { status: 400 });
    }

    const grievance = await getGrievanceByTrackingToken(token);
    if (!grievance) {
      return NextResponse.json({ error: "Grievance not found." }, { status: 404 });
    }

    const state = await getUserEngagementState(grievance.id, user.id);

    return NextResponse.json({
      ...state,
      authenticated: true,
      userId: user.id,
    });
  } catch (error) {
    console.error("Engagement state error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve engagement state." },
      { status: 500 }
    );
  }
}
