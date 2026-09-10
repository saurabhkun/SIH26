import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Issue, { ISSUE_DOMAINS, FACING_SINCE_OPTIONS } from "@/lib/models/Issue";
import { generateDedupFingerprint } from "@/lib/utils/dedup";
import { createNotification } from "@/lib/notifications";
import {
  sanitizeMediaUrl,
  getContextualMediaUrl,
} from "@/lib/constants/civicMedia";

export const dynamic = "force-dynamic";

import {
  getAllUnifiedIssues,
  syncIssueToReport,
} from "@/lib/utils/reportsAdapter";
import { analyzeIssueCriticality } from "@/lib/aiTriage";

/**
 * GET /api/issues?district=X&status=Y&domain=Z
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const district = searchParams.get("district");
    const status = searchParams.get("status");
    const domain = searchParams.get("domain");

    let issues = await getAllUnifiedIssues();

    if (district && district !== "all") {
      const dLower = district.toLowerCase();
      issues = issues.filter(
        (i) => (i.district || "").toLowerCase() === dLower,
      );
    }

    if (status && status !== "all") {
      issues = issues.filter((i) => i.status === status);
    }

    if (domain && domain !== "all") {
      issues = issues.filter((i) => i.domain === domain);
    }

    return NextResponse.json({
      success: true,
      count: issues.length,
      data: issues,
    });
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error ? error.message : "Failed to fetch issues";
    console.error("GET /api/issues error:", error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 },
    );
  }
}

/**
 * POST /api/issues
 * Creates a citizen-reported civic issue with deduplication and repeat-submission tracking
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      title,
      description,
      domain,
      district,
      facingSince,
      citizenName,
      citizenMobile,
      pincode,
      address,
      location,
      severityScore = 3,
      attachments = [],
      mediaUrls = [],
      aiTags = [],
    } = body;

    // 1. Basic validation
    if (
      !title ||
      !description ||
      !domain ||
      !district ||
      !facingSince ||
      !citizenName ||
      !citizenMobile
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: title, description, domain, district, facingSince, citizenName, citizenMobile",
        },
        { status: 400 },
      );
    }

    if (!ISSUE_DOMAINS.includes(domain)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid domain. Must be one of: ${ISSUE_DOMAINS.join(", ")}`,
        },
        { status: 400 },
      );
    }

    if (!FACING_SINCE_OPTIONS.includes(facingSince)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid facingSince value. Must be one of: ${FACING_SINCE_OPTIONS.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // 2. Compute Deduplication Fingerprint
    const dedupFingerprint = generateDedupFingerprint(
      description,
      district,
      location,
    );

    // 3. Search for potential duplicates / similar issues
    // Check by identical fingerprint OR same district + domain
    const existingSimilar = await Issue.find({
      $or: [
        { dedupFingerprint },
        { district: district.trim(), domain },
      ],
    })
      .select("_id dedupFingerprint title trackingCode")
      .limit(5)
      .lean();

    const similarIssueIds = existingSimilar.map((item) => item._id);
    const hasExactDuplicate = existingSimilar.some(
      (item) => item.dedupFingerprint === dedupFingerprint,
    );

    // Initial status: Flag as 'Under_Review' if duplicate fingerprint or multiple matches exist, else 'Reported'
    const initialStatus =
      hasExactDuplicate || similarIssueIds.length > 0
        ? "Under_Review"
        : "Reported";

    // 4. Generate MongoDB _id first & derive unique trackingCode from its hex string
    let objectId = new Types.ObjectId();
    let hexSuffix = objectId.toString().slice(-6).toUpperCase();
    let trackingCode = `CR-JH-${hexSuffix}`; // e.g., CR-JH-24501A

    // 5. Repeat reporter check (Issues from this mobile number in last 24h)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentSubmissionsCount = await Issue.countDocuments({
      citizenMobile,
      createdAt: { $gte: twentyFourHoursAgo },
    });

    const submissionIndexForMobile = recentSubmissionsCount + 1;

    // 6. Sanitize & Prepare Attachments & Media URLs
    const rawMediaUrls = Array.isArray(mediaUrls) ? mediaUrls : [];
    const directMediaUrls = rawMediaUrls.filter(
      (u): u is string => typeof u === "string" && u.trim().length > 0,
    );

    const rawAttachments = Array.isArray(attachments) ? attachments : [];
    const sanitizedAttachments =
      rawAttachments.length > 0
        ? rawAttachments.map(
            (
              att: { url: string; type?: string; filename?: string },
              idx: number,
            ) => ({
              url: sanitizeMediaUrl(att.url, domain, idx),
              type: (att.type === "video" || att.type === "document"
                ? att.type
                : "photo") as "photo" | "video" | "document",
              filename: att.filename || `field_evidence_${idx + 1}.jpg`,
            }),
          )
        : directMediaUrls.length > 0
          ? directMediaUrls.map((u, idx) => ({
              url: u,
              type: "photo" as const,
              filename: `field_evidence_${idx + 1}.jpg`,
            }))
          : [
              {
                url: getContextualMediaUrl(domain, 0),
                type: "photo" as const,
                filename: "field_evidence.jpg",
              },
            ];

    const finalMediaUrls =
      directMediaUrls.length > 0
        ? directMediaUrls
        : sanitizedAttachments.map((a) => a.url);

    // 7. Run AI Criticality Detection & Star Triage
    const aiTriage = await analyzeIssueCriticality(
      title.trim(),
      description.trim(),
      domain,
      district.trim(),
    );

    const calculatedSeverity =
      aiTriage.severityScore ||
      Math.min(5, Math.max(1, Number(severityScore) || 3));

    // 8. Save Issue Document with Idempotency & Collision Retry Wrapper
    let newIssue;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        newIssue = await Issue.create({
          _id: objectId,
          title: title.trim(),
          description: description.trim(),
          attachments: sanitizedAttachments,
          mediaUrls: finalMediaUrls,
          domain,
          severityScore: calculatedSeverity,
          isStarred: Boolean(aiTriage.isStarred),
          priority: aiTriage.priority || "MEDIUM",
          aiAnalysisReason: aiTriage.aiAnalysisReason || "",
          suggestedDepartment: aiTriage.suggestedDepartment || "Higher & Technical Education",
          triageRationale: aiTriage.aiAnalysisReason,
          aiTags: Array.from(new Set([...(aiTags || []), ...(aiTriage.isStarred ? ["AI_CRITICAL_STAR", "URGENT_TRIAGE"] : [])])),
          district: district.trim(),
          pincode: pincode?.trim(),
          address: address?.trim(),
          location:
            location?.lat && location?.lng
              ? { lat: Number(location.lat), lng: Number(location.lng) }
              : undefined,
          facingSince,
          citizenName: citizenName.trim(),
          citizenMobile: citizenMobile.trim(),
          mobileVerified: false,
          trackingCode,
          dedupFingerprint,
          duplicateOf: hasExactDuplicate ? existingSimilar[0]._id : null,
          similarIssueIds,
          status: initialStatus,
          assignedColleges: [],
          submissionIndexForMobile,
        });
        break;
      } catch (err: unknown) {
        attempts++;
        const mongoErr = err as { code?: number; message?: string };
        if (
          (mongoErr?.code === 11000 || mongoErr?.message?.includes("E11000") || mongoErr?.message?.includes("trackingCode")) &&
          attempts < maxAttempts
        ) {
          console.warn(`[Tracking Code Collision] Code ${trackingCode} collided. Regenerating ObjectId and retrying (attempt ${attempts}/${maxAttempts})...`);
          objectId = new Types.ObjectId();
          hexSuffix = objectId.toString().slice(-6).toUpperCase();
          trackingCode = `CR-JH-${hexSuffix}`;
        } else {
          throw err;
        }
      }
    }

    if (!newIssue) {
      throw new Error("Failed to create civic issue after collision retries.");
    }

    await syncIssueToReport(newIssue);

    // 7. Fire citizen notification
    await createNotification({
      recipientType: "citizen",
      recipientId: citizenMobile.trim(),
      message: `Your issue "${newIssue.title}" has been registered with tracking code ${trackingCode}. Status: ${initialStatus.replace(/_/g, " ")}. Use your code to track progress.`,
      relatedIssue: newIssue._id,
    });
    // Notify gov of new submission
    await createNotification({
      recipientType: "gov",
      recipientId: "gov",
      message: `New citizen issue submitted: "${newIssue.title}" in ${district} (${domain}). Tracking: ${trackingCode}.`,
      relatedIssue: newIssue._id,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Civic issue successfully registered on CivicResolve",
        trackingCode: newIssue.trackingCode,
        isDuplicateFlagged: hasExactDuplicate || similarIssueIds.length > 0,
        submissionIndexForMobile,
        data: newIssue,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error ? error.message : "Failed to create issue";
    console.error("POST /api/issues error:", error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 },
    );
  }
}
