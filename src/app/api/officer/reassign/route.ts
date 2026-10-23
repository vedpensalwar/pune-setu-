import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { reassignGrievance } from "@/lib/db/repository";
import { z } from "zod";

const reassignSchema = z.object({
  trackingToken: z.string().min(1, "Tracking token is required"),
  targetDepartmentId: z.string().min(1, "Target department is required"),
  targetWardId: z.string().optional(),
  reason: z.string().min(10, "Justification must be at least 10 characters long"),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "MUNICIPAL_OFFICER" && user.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized: Officer clearance required to reassign grievances." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = reassignSchema.safeParse(body);
    if (!result.success) {
      const msg = result.error.issues[0]?.message || "Invalid reassignment request.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { trackingToken, targetDepartmentId, targetWardId, reason } = result.data;

    const opResult = await reassignGrievance(
      trackingToken,
      { targetDepartmentId, targetWardId, reason },
      user
    );

    return NextResponse.json({
      success: true,
      message: "Grievance successfully reassigned.",
      grievance: opResult.grievance,
    });
  } catch (error: any) {
    console.error("Grievance reassignment error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reassign grievance." },
      { status: 400 }
    );
  }
}
