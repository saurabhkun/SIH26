import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Notification from "@/lib/models/Notification";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

// GET /api/notifications?limit=20
export async function GET(req: NextRequest) {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  await dbConnect();

  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "30", 10);

  const notifications = await Notification.find({
    recipientType: user.role,
    recipientId: user.id,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const unreadCount = await Notification.countDocuments({
    recipientType: user.role,
    recipientId: user.id,
    read: false,
  });

  return NextResponse.json({ notifications, unreadCount });
}
