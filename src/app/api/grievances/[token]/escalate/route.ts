import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { isValidTrackingToken } from "@/lib/civic/token";
import { escalationRequestSchema } from "@/lib/civic/validation";
import { requestCitizenEscalation } from "@/lib/db/repository";

export async function POST(
  request: Request,
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

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to request an escalation. Please sign in." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = escalationRequestSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid escalation request parameters.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { grievance, escalation } = await requestCitizenEscalation(token, result.data, user);

    return NextResponse.json({
      success: true,
      message: "Grievance has been successfully escalated to the Prabhag Ward supervisor.",
      grievance,
      escalation,
    });
  } catch (error: any) {
    console.error("Citizen escalation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process citizen escalation request." },
      { status: 400 }
    );
  }
}
