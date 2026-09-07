/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Issue from "@/lib/models/Issue";
import { formatTrackingCode } from "@/lib/utils/dedup";
import { createNotification } from "@/lib/notifications";
import { getAllUnifiedIssues, mapToFlutterReport, mapCategoryToDomain } from "@/lib/utils/reportsAdapter";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    const allIssues = await getAllUnifiedIssues();
    let filtered = allIssues;

    if (userId) {
      filtered = allIssues.filter(
        (item) => item.citizenMobile === userId || item.user_id === userId || item.contact_number === userId
      );
    }

    const reports = filtered.map(mapToFlutterReport);
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

    // Also persist in native reports collection if direct collection insert is needed
    try {
      if (mongoose.connection?.db) {
        await mongoose.connection.db.collection("reports").insertOne({
          ...data,
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString(),
        });
      }
    } catch (insertErr) {
      console.warn("Could not insert directly into 'reports' collection:", insertErr);
    }

    // Find the latest issue for tracking code generation
    const lastIssue = await Issue.findOne({ citizenMobile: data.user_id })
      .sort({ submissionIndexForMobile: -1 })
      .select("submissionIndexForMobile");
      
    const submissionIndexForMobile = lastIssue ? lastIssue.submissionIndexForMobile + 1 : 1;
    const trackingCode = formatTrackingCode(data.user_id || "9999999999", submissionIndexForMobile);

    const attachments = data.image_urls?.map((url: string) => ({
      url,
      type: "photo",
      filename: "phone_upload.jpg",
    })) || [];

    const newIssue = new Issue({
      title: data.title || "Citizen Reported Challenge",
      description: data.description || "",
      attachments,
      domain: mapCategoryToDomain(data.category, data.title),
      severityScore: data.priority === "high" || data.priority === "critical" ? 4 : data.priority === "medium" ? 3 : 2,
      aiTags: [data.category || "mobile_app"],
      district: (data.location || "Ranchi").split(",")[0].trim() || "Ranchi",
      address: data.location || "Jharkhand",
      location: data.coordinates || { lat: 23.3441, lng: 85.3096 },
      facingSince: "<1 month",
      citizenName: data.user_id || "Mobile Citizen",
      citizenMobile: data.user_id || data.contact_number || "9999999999",
      trackingCode,
      status: "Reported",
      submissionIndexForMobile,
    });

    await newIssue.save();

    // Fire notifications
    await createNotification({
      recipientType: "citizen",
      recipientId: newIssue.citizenMobile || newIssue.citizenPhone || "citizen",
      message: `Your issue "${newIssue.title}" has been registered via Phone App with tracking code ${trackingCode}.`,
      relatedIssue: newIssue._id,
    });
    await createNotification({
      recipientType: "gov",
      recipientId: "gov",
      message: `New citizen issue submitted via Phone App: "${newIssue.title}" in ${newIssue.district}.`,
      relatedIssue: newIssue._id,
    });

    return NextResponse.json(mapToFlutterReport(newIssue), { status: 201 });
  } catch (error: any) {
    console.error("POST /api/reports Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
