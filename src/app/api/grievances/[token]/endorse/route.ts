import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { isValidTrackingToken } from "@/lib/civic/token";
import { toggleEndorsement } from "@/lib/db/repository";

export async function POST(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;

    if (!isValidTrackingToken(token)) {
      return NextResponse.json({ error: "Invalid tracking token format." }, { status: 400 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to endorse a civic grievance." },
        { status: 401 }
      );
    }

    const result = await toggleEndorsement(token, user.id);

    return NextResponse.json({
      success: true,
      message: result.endorsed ? "Grievance endorsed." : "Endorsement removed.",
      ...result,
    });
  } catch (error: any) {
    console.error("Endorse grievance error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process endorsement." },
      { status: 400 }
    );
  }
}
