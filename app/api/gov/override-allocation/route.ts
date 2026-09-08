import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Issue from "@/lib/models/Issue";
import College from "@/lib/models/College";
import { getCurrentUser } from "@/lib/auth/session";
import { createNotification } from "@/lib/notifications";
import { syncIssueToReport } from "@/lib/utils/reportsAdapter";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

const OVERRIDE_JUSTIFICATIONS = [
  "Stage 4: Escalation Direct Nomination",
  "Disaster / Public Safety Immediate Directive",
  "Nodal Discretionary Assignment",
] as const;

/**
 * GET /api/gov/override-allocation
 * Returns list of open/unclaimed issues and verified registered institutions for the dropdowns
 */
export async function GET() {
  try {
    await dbConnect();

    const [issues, colleges] = await Promise.all([
      Issue.find({
        status: { $nin: ["Resolved", "Duplicate", "Rejected"] },
      })
        .select("_id trackingCode title domain district status severityScore escalationStage urgencyTrack createdAt")
        .sort({ severityScore: -1, createdAt: -1 })
        .lean(),
      College.find()
        .select("_id name code tier district verified capabilities facilities researchSpecializations reputationScore")
        .sort({ name: 1 })
        .lean(),
    ]);

    return NextResponse.json({
      success: true,
      issues: issues || [],
      colleges: colleges || [],
      justifications: OVERRIDE_JUSTIFICATIONS,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Failed to load allocation data";
    console.error("GET /api/gov/override-allocation error:", error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

/**
 * POST /api/gov/override-allocation
 * Administrative direct assignment of an institution to a civic problem
 */
export async function POST(req: NextRequest) {
  try {
    const user = getCurrentUser();
    if (user && user.role !== "gov") {
      return NextResponse.json({ success: false, error: "Unauthorized. Government access required." }, { status: 403 });
    }

    await dbConnect();

    const body = await req.json();
    const { issueId, collegeId, reason, remarks } = body;

    if (!issueId || !collegeId || !reason) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: issueId, collegeId, and override reason are mandatory.",
        },
        { status: 400 }
      );
    }

    const [issue, college] = await Promise.all([
      Issue.findById(issueId),
      College.findById(collegeId),
    ]);

    if (!issue) {
      return NextResponse.json({ success: false, error: "Target Issue record not found." }, { status: 404 });
    }
    if (!college) {
      return NextResponse.json({ success: false, error: "Target Institution not found." }, { status: 404 });
    }

    // 1. Update issue state machine
    issue.status = "DIRECTLY_ALLOCATED";
    issue.assignedLeadCollege = college._id;
    
    // Add college to assigned list if not already present
    const collegeObjId = new mongoose.Types.ObjectId(college._id.toString());
    const existingList = (issue.assignedColleges || []).map((id: mongoose.Types.ObjectId) => id.toString());
    if (!existingList.includes(college._id.toString())) {
      issue.assignedColleges = [...(issue.assignedColleges || []), collegeObjId];
    }

    // Record direct nomination metadata
    issue.directNomination = {
      collegeId: collegeObjId,
      collegeName: college.name,
      nominatedAt: new Date(),
      status: "ACCEPTED",
    };

    if (remarks) {
      const existingRationale = issue.triageRationale ? `${issue.triageRationale}\n` : "";
      issue.triageRationale = `${existingRationale}[Gov Override: ${reason}] ${remarks.trim()}`;
    }

    await issue.save();

    // Sync to unified reports adapter
    try {
      await syncIssueToReport(issue);
    } catch (syncErr) {
      console.warn("Report sync warning:", syncErr);
    }

    const isCritical = reason.includes("Disaster") || issue.urgencyTrack === "DISASTER_FAST_TRACK";

    // 2. Dispatch Immediate Priority Notification to the Institution
    await createNotification({
      recipientRole: "RO",
      recipientType: "college",
      recipientId: college._id.toString(),
      title: isCritical ? "CRITICAL: Immediate Government Allocation Directive" : "Direct Project Allocation Override",
      message: `Directive (${reason}): Issue "${issue.title}" (${issue.trackingCode}) in ${issue.district} has been directly assigned to ${college.name} by the State Nodal Review Office.${
        remarks ? ` Officer remarks: "${remarks.trim()}"` : ""
      }`,
      type: isCritical ? "CIRCUIT_BREAKER_DISASTER" : "DIRECT_NOMINATION_REQUEST",
      priority: isCritical ? "CRITICAL" : "HIGH",
      relatedIssueId: issue._id,
      actionUrl: `/dashboard/college/marketplace`,
    });

    // 3. Dispatch Notification to Citizen
    if (issue.citizenMobile || issue.citizenPhone) {
      const phone = issue.citizenMobile || issue.citizenPhone;
      await createNotification({
        recipientRole: "CITIZEN",
        recipientType: "citizen",
        recipientId: phone,
        recipientPhone: phone,
        title: "Grievance Direct Allocation Update",
        message: `Your grievance (${issue.trackingCode}) in ${issue.district} has been assigned directly to ${college.name} for solution prototyping under government mandate.`,
        type: "CITIZEN_STATUS_UPDATE",
        priority: "NORMAL",
        relatedIssueId: issue._id,
      });
    }

    // 4. Audit Trail notification for Government team
    await createNotification({
      recipientRole: "GOV",
      recipientType: "gov",
      title: `Allocation Override Executed: ${issue.trackingCode}`,
      message: `Officer ${user?.name || "Nodal Review Desk"} overrode standard bidding and assigned ${issue.trackingCode} to ${college.name}. Reason: ${reason}.`,
      type: "PANEL_DECISION",
      priority: "NORMAL",
      relatedIssueId: issue._id,
      actionUrl: `/dashboard/gov/allocations`,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully assigned issue ${issue.trackingCode} to ${college.name} (${issue.status}).`,
      data: {
        issueId: issue._id,
        trackingCode: issue.trackingCode,
        issueTitle: issue.title,
        status: issue.status,
        collegeId: college._id,
        collegeName: college.name,
        reason,
      },
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Failed to execute allocation override";
    console.error("POST /api/gov/override-allocation error:", error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
