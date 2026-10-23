import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { isValidTrackingToken } from "@/lib/civic/token";
import { getGrievanceByTrackingToken, getGrievanceTrackingDetails } from "@/lib/db/repository";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;

    if (!isValidTrackingToken(token)) {
      return NextResponse.json(
        { error: "Invalid tracking token format. Tokens must follow PS-PUN-YYYY-XXXXXX." },
        { status: 400 }
      );
    }

    const viewer = await getCurrentUser();
    const tracking = await getGrievanceTrackingDetails(token, viewer);

    if (!tracking) {
      return NextResponse.json(
        { error: `Grievance with tracking token ${token} does not exist.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      grievance: tracking.grievance,
      tracking,
    });
  } catch (error) {
    console.error("Grievance lookup error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while retrieving the grievance record." },
      { status: 500 }
    );
  }
}
