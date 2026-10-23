import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { isValidTrackingToken } from "@/lib/civic/token";
import { addCommentSchema } from "@/lib/civic/validation";
import { addComment, listComments } from "@/lib/db/repository";

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
        { error: "Authentication required to post a comment." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = addCommentSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid comment content.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const comment = await addComment(token, result.data, user);

    return NextResponse.json(
      {
        success: true,
        message: "Comment added successfully.",
        comment,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Add comment error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add comment." },
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

    const viewer = await getCurrentUser();
    const comments = await listComments(token, viewer);

    return NextResponse.json({
      success: true,
      comments,
    });
  } catch (error: any) {
    console.error("List comments error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve comments." },
      { status: 500 }
    );
  }
}
