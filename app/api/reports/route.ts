/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Issue from "@/lib/models/Issue";
import { formatTrackingCode } from "@/lib/utils/dedup";
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

function mapCategoryToDomain(category: string) {
  const c = category.toLowerCase();
  if (c.includes("water") || c.includes("plumbing")) return "Water Resources";
  if (c.includes("health") || c.includes("medical")) return "Healthcare";
  if (c.includes("edu") || c.includes("school")) return "Education";
  if (c.includes("agri") || c.includes("farm")) return "Agriculture";
  if (c.includes("clean") || c.includes("sanitation") || c.includes("garbage")) return "Sanitation";
  if (c.includes("env") || c.includes("tree")) return "Environment";
  if (c.includes("energy") || c.includes("power") || c.includes("electricity")) return "Energy";
  if (c.includes("road") || c.includes("street") || c.includes("urban") || c.includes("infrastructure")) return "Urban Development";
  return "Public Administration";
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    const query = userId ? { citizenMobile: userId } : {};
    const issues = await Issue.find(query).sort({ createdAt: -1 }).lean();

    const reports = issues.map(mapToFlutterReport);

    return NextResponse.json(reports);
  } catch (error: any) {
    console.error("GET /api/reports Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const data = await req.json();

    // Find the latest issue for tracking code generation
    const lastIssue = await Issue.findOne({ citizenMobile: data.user_id })
      .sort({ submissionIndexForMobile: -1 })
      .select("submissionIndexForMobile");
      
    const submissionIndexForMobile = lastIssue ? lastIssue.submissionIndexForMobile + 1 : 1;
    const trackingCode = formatTrackingCode(data.user_id, submissionIndexForMobile);

    const attachments = data.image_urls?.map((url: string) => ({
      url,
      type: "photo",
    })) || [];

    const newIssue = new Issue({
      title: data.title,
      description: data.description,
      attachments,
      domain: mapCategoryToDomain(data.category),
      severityScore: data.priority === "high" || data.priority === "critical" ? 4 : data.priority === "medium" ? 3 : 2,
      aiTags: [data.category],
      district: data.location.split(",")[0].trim() || "Ranchi", // Simple fallback parsing
      address: data.location,
      location: data.coordinates,
      facingSince: "<1 month", // Default for now
      citizenName: data.user_id, // Default to user_id for name if not provided
      citizenMobile: data.user_id || data.contact_number,
      trackingCode,
      status: "Reported",
      submissionIndexForMobile,
    });

    await newIssue.save();

    // Fire notifications
    await createNotification({
      recipientType: "citizen",
      recipientId: newIssue.citizenMobile,
      message: `Your issue "${newIssue.title}" has been registered via Flutter App with tracking code ${trackingCode}.`,
      relatedIssue: newIssue._id,
    });
    await createNotification({
      recipientType: "gov",
      recipientId: "gov",
      message: `New citizen issue submitted via Flutter App: "${newIssue.title}" in ${newIssue.district}.`,
      relatedIssue: newIssue._id,
    });

    return NextResponse.json(mapToFlutterReport(newIssue), { status: 201 });
  } catch (error: any) {
    console.error("POST /api/reports Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
