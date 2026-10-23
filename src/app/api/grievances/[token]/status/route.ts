import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { isValidTrackingToken } from "@/lib/civic/token";
import { updateStatusSchema } from "@/lib/civic/validation";
import { updateGrievanceStatus } from "@/lib/db/repository";

async function handleStatusUpdate(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;

    if (!isValidTrackingToken(token)) {
      return NextResponse.json(
        { error: "Invalid tracking token format." },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to update grievance status." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = updateStatusSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid status transition request.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const updated = await updateGrievanceStatus(token, result.data, user);

    return NextResponse.json({
      success: true,
      message: `Grievance status successfully updated to ${result.data.newStatus}.`,
      ...updated,
    });
  } catch (error: any) {
    console.error("Status transition error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update grievance status." },
      { status: 400 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  return handleStatusUpdate(request, context);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  return handleStatusUpdate(request, context);
}
