/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Notification, { RecipientRole } from "@/lib/models/Notification";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * GET /api/notifications
 * Fetches notifications for the active user role/session with live counts.
 */
export async function GET(req: NextRequest) {
  try {
    const user = getCurrentUser();
    await dbConnect();

    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const filter = searchParams.get("filter") || "all"; // 'all' | 'unread' | 'critical'

    // Determine target roles based on active session
    let targetRoles: RecipientRole[] = ["ALL"];
    let targetRecipientIds: Array<string | undefined> = [
      undefined,
      null as unknown as undefined,
      "",
    ];

    if (user) {
      const roleUpper = user.role.toUpperCase();
      if (roleUpper === "GOV" || roleUpper === "ADMIN") {
        targetRoles = ["GOV", "ALL"];
        targetRecipientIds = [
          user.id,
          "gov_admin_nodal",
          undefined,
          null as unknown as undefined,
          "",
        ];
      } else if (roleUpper === "COLLEGE" || roleUpper === "RO") {
        targetRoles = ["RO", "ALL"];
        targetRecipientIds = [
          user.id,
          user.collegeId,
          "all_eligible_colleges",
          undefined,
          null as unknown as undefined,
          "",
        ];
      } else if (roleUpper === "INDUSTRY" || roleUpper === "CSR") {
        targetRoles = ["INDUSTRY", "ALL"];
        targetRecipientIds = [
          user.id,
          "all_csr_partners",
          undefined,
          null as unknown as undefined,
          "",
        ];
      }
    }

    // Build Mongo query
    const baseQuery: any = {
      $or: [
        { recipientRole: { $in: targetRoles } },
        { recipientId: { $in: targetRecipientIds.filter(Boolean) } },
      ],
    };

    if (filter === "unread") {
      baseQuery.read = false;
    } else if (filter === "critical") {
      baseQuery.priority = "CRITICAL";
    }

    const [notifications, unreadCount, criticalCount] = await Promise.all([
      Notification.find(baseQuery).sort({ createdAt: -1 }).limit(limit).lean(),
      Notification.countDocuments({
        $or: [
          { recipientRole: { $in: targetRoles } },
          { recipientId: { $in: targetRecipientIds.filter(Boolean) } },
        ],
        read: false,
      } as any),
      Notification.countDocuments({
        $or: [
          { recipientRole: { $in: targetRoles } },
          { recipientId: { $in: targetRecipientIds.filter(Boolean) } },
        ],
        priority: "CRITICAL",
        read: false,
      } as any),
    ]);

    return NextResponse.json({
      success: true,
      unreadCount,
      criticalCount,
      notifications,
    });
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error ? error.message : "Failed to fetch notifications";
    console.error("GET /api/notifications error:", error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/notifications
 * Marks specific notification or all notifications as read.
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = getCurrentUser();
    await dbConnect();

    const body = await req.json().catch(() => ({}));
    const { notificationId, markAll = false } = body;

    if (notificationId) {
      const updated = await Notification.findByIdAndUpdate(
        notificationId,
        { $set: { read: true } },
        { new: true },
      );
      return NextResponse.json({
        success: true,
        message: "Notification marked as read",
        notification: updated,
      });
    }

    if (markAll) {
      let targetRoles: RecipientRole[] = ["ALL"];
      let targetRecipientIds: Array<string | undefined> = [
        undefined,
        null as unknown as undefined,
        "",
      ];

      if (user) {
        const roleUpper = user.role.toUpperCase();
        if (roleUpper === "GOV") targetRoles = ["GOV", "ALL"];
        else if (roleUpper === "COLLEGE") targetRoles = ["RO", "ALL"];
        else if (roleUpper === "INDUSTRY") targetRoles = ["INDUSTRY", "ALL"];
        targetRecipientIds = [
          user.id,
          user.collegeId,
          undefined,
          null as unknown as undefined,
          "",
        ];
      }

      const result = await Notification.updateMany(
        {
          $or: [
            { recipientRole: { $in: targetRoles } },
            { recipientId: { $in: targetRecipientIds.filter(Boolean) } },
          ],
          read: false,
        } as any,
        { $set: { read: true } },
      );

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read",
        updatedCount: result.modifiedCount,
      });
    }

    return NextResponse.json(
      { success: false, error: "Must specify notificationId or markAll: true" },
      { status: 400 },
    );
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error
        ? error.message
        : "Failed to update notification state";
    console.error("PATCH /api/notifications error:", error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 },
    );
  }
}
