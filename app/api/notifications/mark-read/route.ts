import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Notification from "@/lib/models/Notification";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

// POST /api/notifications/mark-read  { ids?: string[] }  — omit ids to mark all as read
export async function POST(req: NextRequest) {
  const user = getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  await dbConnect();

  const body = await req.json().catch(() => ({}));
  const ids: string[] | undefined = body.ids;

  const filter: Record<string, unknown> = {
    recipientType: user.role,
    recipientId: user.id,
    read: false,
  };

  if (ids && ids.length > 0) {
    filter._id = { $in: ids };
  }

  await Notification.updateMany(filter, { $set: { read: true } });

  return NextResponse.json({ ok: true });
}
