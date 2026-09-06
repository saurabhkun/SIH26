import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Issue from "@/lib/models/Issue";
import College from "@/lib/models/College";
import { getCurrentUser } from "@/lib/auth/session";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

// POST /api/gov/allocate  → override assign a college to an issue
export async function POST(req: NextRequest) {
  const user = getCurrentUser();
  if (!user || user.role !== "gov") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await dbConnect();

  const body = await req.json();
  const { issueId, collegeId } = body;

  if (!issueId || !collegeId) {
    return NextResponse.json({ error: "issueId and collegeId are required" }, { status: 400 });
  }

  const [issue, college] = await Promise.all([
    Issue.findById(issueId),
    College.findById(collegeId),
  ]);

  if (!issue) return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  if (!college) return NextResponse.json({ error: "College not found" }, { status: 404 });

  // Override: set issue status to Assigned_HEI and push college
  issue.status = "Assigned_HEI";
  const alreadyAssigned = issue.assignedColleges?.some(
    (id: import("mongoose").Types.ObjectId) => id.toString() === collegeId
  );
  if (!alreadyAssigned) {
    issue.assignedColleges = [...(issue.assignedColleges || []), college._id];
  }
  await issue.save();

  // Notify the college
  await createNotification({
    recipientType: "college",
    recipientId: college._id.toString(),
    message: `Issue "${issue.title}" (${issue.trackingCode}) has been directly assigned to your institution by the Government review office.`,
    relatedIssue: issue._id,
  });

  // Notify citizen
  if (issue.citizenMobile) {
    await createNotification({
      recipientType: "citizen",
      recipientId: issue.citizenMobile,
      message: `Your issue (${issue.trackingCode}) has been allocated to ${college.name} for resolution.`,
      relatedIssue: issue._id,
    });
  }

  return NextResponse.json({ ok: true, college: college.name, issueStatus: "Assigned_HEI" });
}
