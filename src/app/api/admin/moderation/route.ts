import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { listModerationComments, moderateComment } from "@/lib/db/repository";
import { z } from "zod";

const moderationSchema = z.object({
  commentId: z.string().min(1, "Comment ID is required"),
  action: z.enum(["HIDE", "RESTORE"]),
  reason: z.string().min(5, "Moderation reason must be at least 5 characters long"),
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

    const comments = await listModerationComments(user);

    return NextResponse.json({
      success: true,
      comments,
    });
  } catch (error: any) {
    console.error("Admin moderation list error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load comments for moderation." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized: Administrator clearance required." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = moderationSchema.safeParse(body);
    if (!result.success) {
      const msg = result.error.issues[0]?.message || "Invalid moderation request.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    await moderateComment(result.data.commentId, {
      action: result.data.action,
      reason: result.data.reason,
    }, user);

    return NextResponse.json({
      success: true,
      message: `Comment successfully ${result.data.action === "HIDE" ? "hidden" : "restored"}.`,
    });
  } catch (error: any) {
    console.error("Admin moderate comment error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to moderate comment." },
      { status: 400 }
    );
  }
}
