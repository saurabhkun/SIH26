import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Issue from "@/lib/models/Issue";
import College from "@/lib/models/College";
import { getCurrentUser } from "@/lib/auth/session";
import { createNotification } from "@/lib/notifications";
import { syncIssueToReport } from "@/lib/utils/reportsAdapter";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

// POST /api/gov/allocate  → override assign a college to an issue
export async function POST(req: NextRequest) {
  const user = getCurrentUser();
  if (user && user.role !== "gov") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await dbConnect();

  const body = await req.json();
  const {
    issueId,
    collegeId,
    reason = "Nodal Discretionary Assignment",
    remarks = "",
  } = body;

  if (!issueId || !collegeId) {
    return NextResponse.json(
      { error: "issueId and collegeId are required" },
      { status: 400 },
    );
  }

  const [issue, college] = await Promise.all([
    Issue.findById(issueId),
    College.findById(collegeId),
  ]);

  if (!issue)
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  if (!college)
    return NextResponse.json({ error: "College not found" }, { status: 404 });

  // Override: set issue status to DIRECTLY_ALLOCATED and push college
  issue.status = "DIRECTLY_ALLOCATED";
  issue.assignedLeadCollege = college._id;
  const collegeObjId = new mongoose.Types.ObjectId(college._id.toString());
  const existingList = (issue.assignedColleges || []).map(
    (id: mongoose.Types.ObjectId) => id.toString(),
  );
  if (!existingList.includes(college._id.toString())) {
    issue.assignedColleges = [...(issue.assignedColleges || []), collegeObjId];
  }
  issue.directNomination = {
    collegeId: collegeObjId,
    collegeName: college.name,
    nominatedAt: new Date(),
    status: "ACCEPTED",
  };
  if (remarks) {
    issue.triageRationale = `${issue.triageRationale ? `${issue.triageRationale}\n` : ""}[Gov Override: ${reason}] ${remarks}`;
  }
  await issue.save();

  try {
    await syncIssueToReport(issue);
  } catch (e) {
    console.warn("Report sync warning:", e);
  }

  // Notify the college
  await createNotification({
    recipientRole: "RO",
    recipientType: "college",
    recipientId: college._id.toString(),
    title: "Direct Project Allocation Override",
    message: `Issue "${issue.title}" (${issue.trackingCode}) has been directly assigned to your institution by the Government review office. Reason: ${reason}.`,
    type: "DIRECT_NOMINATION_REQUEST",
    priority: "HIGH",
    relatedIssueId: issue._id,
    actionUrl: `/dashboard/college/marketplace`,
  });

  // Notify citizen
  if (issue.citizenMobile || issue.citizenPhone) {
    await createNotification({
      recipientRole: "CITIZEN",
      recipientType: "citizen",
      recipientId: issue.citizenMobile || issue.citizenPhone,
      message: `Your issue (${issue.trackingCode}) has been allocated to ${college.name} for resolution.`,
      type: "CITIZEN_STATUS_UPDATE",
      relatedIssueId: issue._id,
    });
  }

  return NextResponse.json({
    ok: true,
    college: college.name,
    issueStatus: "DIRECTLY_ALLOCATED",
  });
}
