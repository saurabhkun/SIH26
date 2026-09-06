import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Issue from "@/lib/models/Issue";
import { getCurrentUser } from "@/lib/auth/session";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

// GET /api/gov/review-queue  → issues with status Under_Review or with similarIssueIds
export async function GET() {
  const user = getCurrentUser();
  if (!user || user.role !== "gov") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await dbConnect();

  const issues = await Issue.find({
    $or: [
      { status: "Under_Review" },
      { similarIssueIds: { $exists: true, $not: { $size: 0 } } },
    ],
  })
    .populate("similarIssueIds", "trackingCode title domain district status")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return NextResponse.json({ issues });
}

// POST /api/gov/review-queue  → process a review decision
export async function POST(req: NextRequest) {
  const user = getCurrentUser();
  if (!user || user.role !== "gov") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await dbConnect();

  const body = await req.json();
  const { issueId, action, duplicateOf } = body;

  if (!issueId || !action) {
    return NextResponse.json({ error: "Missing issueId or action" }, { status: 400 });
  }

  const issue = await Issue.findById(issueId);
  if (!issue) return NextResponse.json({ error: "Issue not found" }, { status: 404 });

  if (action === "mark_duplicate") {
    if (!duplicateOf) {
      return NextResponse.json({ error: "duplicateOf required for mark_duplicate" }, { status: 400 });
    }
    issue.status = "Duplicate";
    issue.duplicateOf = duplicateOf;
    await issue.save();

    // Notify the citizen reporter
    if (issue.citizenMobile) {
      await createNotification({
        recipientType: "citizen",
        recipientId: issue.citizenMobile,
        message: `Your issue "${issue.title}" (${issue.trackingCode}) has been marked as a duplicate of an existing issue.`,
        relatedIssue: issue._id,
      });
    }
    // Notify gov
    await createNotification({
      recipientType: "gov",
      recipientId: user.id,
      message: `Issue ${issue.trackingCode} marked as Duplicate and linked.`,
      relatedIssue: issue._id,
    });

    return NextResponse.json({ ok: true, status: "Duplicate" });
  }

  if (action === "confirm_distinct") {
    issue.status = "Assigned_HEI";
    // Clear duplicate link if it was wrongly set
    issue.duplicateOf = undefined;
    await issue.save();

    if (issue.citizenMobile) {
      await createNotification({
        recipientType: "citizen",
        recipientId: issue.citizenMobile,
        message: `Your issue "${issue.title}" (${issue.trackingCode}) has been confirmed as a distinct issue and forwarded for college assignment.`,
        relatedIssue: issue._id,
      });
    }

    return NextResponse.json({ ok: true, status: "Assigned_HEI" });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
