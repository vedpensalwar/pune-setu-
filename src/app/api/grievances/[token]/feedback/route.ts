import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { isValidTrackingToken } from "@/lib/civic/token";
import { feedbackSchema } from "@/lib/civic/validation";
import { submitSatisfactionFeedback } from "@/lib/db/repository";

export async function POST(
  request: Request,
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
        { error: "Authentication required to submit satisfaction feedback." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = feedbackSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid feedback data.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const feedback = await submitSatisfactionFeedback(token, result.data, user);

    return NextResponse.json(
      {
        success: true,
        message: "Thank you for rating the grievance resolution.",
        feedback,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Satisfaction feedback error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit satisfaction feedback." },
      { status: 400 }
    );
  }
}
