import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Issue from "@/lib/models/Issue";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

function mapToFlutterReport(issue: any) {
  return {
    _id: issue._id.toString(),
    id: issue.trackingCode,
    user_id: issue.citizenMobile,
    title: issue.title,
    description: issue.description,
    category: issue.domain.toLowerCase(),
    location: issue.address || issue.district,
    image_urls: issue.attachments?.map((a: any) => a.url) || [],
    status: issue.status === "Reported" ? "submitted" : issue.status === "Resolved" ? "resolved" : "in_progress",
    priority: issue.severityScore > 3 ? "high" : issue.severityScore === 3 ? "medium" : "low",
    consolidated_reports: issue.similarIssueIds?.length ? issue.similarIssueIds.length + 1 : 1,
    contact_number: issue.citizenMobile,
    coordinates: issue.location || { lat: 23.3441, lng: 85.3096 },
    admin_notes: issue.reviewedBy ? `Reviewed by ${issue.reviewedBy}` : "",
    created_at: issue.createdAt,
    updated_at: issue.updatedAt,
  };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    await connectDB();
    const { reportId } = params;
    const data = await req.json();

    // The flutter app might send trackingCode (id) or ObjectId (_id)
    const isObjectId = reportId.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: reportId } : { trackingCode: reportId };

    const issue = await Issue.findOne(query);

    if (!issue) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Map flutter statuses to our statuses
    if (data.status) {
      if (data.status === "in_progress") {
        issue.status = "Under_Prototyping";
      } else if (data.status === "resolved") {
        issue.status = "Resolved";
      } else if (data.status === "submitted") {
        issue.status = "Reported";
      }
    }

    if (data.priority) {
      issue.severityScore = data.priority === "high" || data.priority === "critical" ? 4 : data.priority === "medium" ? 3 : 2;
    }

    if (data.admin_notes) {
      // Just store it in reviewedBy for now as a simple mapping
      issue.reviewedBy = data.admin_notes;
    }

    await issue.save();

    if (data.status) {
      await createNotification({
        recipientType: "citizen",
        recipientId: issue.citizenMobile,
        message: `Your issue "${issue.title}" status has been updated to ${issue.status.replace(/_/g, " ")}.`,
        relatedIssue: issue._id,
      });
    }

    return NextResponse.json(mapToFlutterReport(issue));
  } catch (error: any) {
    console.error(`PATCH /api/reports/${params.reportId} Error:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
