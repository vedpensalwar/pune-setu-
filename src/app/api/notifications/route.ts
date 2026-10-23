import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import {
  listNotificationsForUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/db/repository";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const notifications = await listNotificationsForUser(user.id);
    const unreadCount = notifications.filter((n) => !n.read).length;

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Notifications list error:", error);
    return NextResponse.json({ error: "Failed to retrieve notifications." }, { status: 500 });
  }
}

async function handleMarkRead(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { id, all } = body;

    // Handle Mark All as Read
    if (all === true || id === "ALL") {
      const count = await markAllNotificationsAsRead(user.id);
      return NextResponse.json({ success: true, count, message: "All notifications marked as read." });
    }

    // Handle single notification mark as read
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Notification ID is required." }, { status: 400 });
    }

    const updated = await markNotificationAsRead(id, user.id);
    if (!updated) {
      return NextResponse.json(
        { error: "Notification not found or access unauthorized." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notification update error:", error);
    return NextResponse.json({ error: "Failed to update notification." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  return handleMarkRead(request);
}

export async function POST(request: Request) {
  return handleMarkRead(request);
}
