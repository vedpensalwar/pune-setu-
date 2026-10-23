import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { listAdminEscalations, reviewAdminEscalation } from "@/lib/db/repository";
import { z } from "zod";

const reviewSchema = z.object({
  escalationId: z.string().min(1, "Escalation ID is required"),
  remarks: z.string().min(5, "Review remarks must be at least 5 characters long"),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized: Administrator clearance required." },
        { status: 401 }
      );
    }

    const escalations = await listAdminEscalations(user);

    return NextResponse.json({
      success: true,
      escalations,
    });
  } catch (error: any) {
    console.error("Admin escalations error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load escalations." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized: Administrator clearance required to review escalations." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = reviewSchema.safeParse(body);
    if (!result.success) {
      const msg = result.error.issues[0]?.message || "Invalid review data.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    await reviewAdminEscalation(result.data.escalationId, { remarks: result.data.remarks }, user);

    return NextResponse.json({
      success: true,
      message: "Escalation review recorded successfully.",
    });
  } catch (error: any) {
    console.error("Review escalation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to record escalation review." },
      { status: 400 }
    );
  }
}
