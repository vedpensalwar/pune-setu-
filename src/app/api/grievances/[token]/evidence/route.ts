import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { isValidTrackingToken } from "@/lib/civic/token";
import { evidenceMetadataSchema } from "@/lib/civic/validation";
import { addEvidenceMetadata, listEvidenceForGrievance } from "@/lib/db/repository";

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
        { error: "Authentication required to attach evidence metadata." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = evidenceMetadataSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid evidence metadata.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const evidence = await addEvidenceMetadata(token, result.data, user);

    return NextResponse.json(
      {
        success: true,
        message: "Evidence metadata recorded successfully.",
        evidence,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Add evidence metadata error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to record evidence metadata." },
      { status: 400 }
    );
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;

    if (!isValidTrackingToken(token)) {
      return NextResponse.json({ error: "Invalid tracking token format." }, { status: 400 });
    }

    const evidence = await listEvidenceForGrievance(token);

    return NextResponse.json({
      success: true,
      evidence,
    });
  } catch (error: any) {
    console.error("List evidence error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve evidence." },
      { status: 500 }
    );
  }
}
