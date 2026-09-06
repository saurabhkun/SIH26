import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Issue, { ISSUE_DOMAINS, FACING_SINCE_OPTIONS } from "@/lib/models/Issue";
import { generateDedupFingerprint, formatTrackingCode } from "@/lib/utils/dedup";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

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

    const query: Record<string, unknown> = {};

    if (district && district !== "all") {
      // Case-insensitive district match
      query.district = { $regex: new RegExp(`^${district}$`, "i") };
    }

    if (status && status !== "all") {
      query.status = status;
    }

    if (domain && domain !== "all") {
      query.domain = domain;
    }

    const issues = await Issue.find(query)
      .populate("assignedColleges", "name tier district")
      .populate("similarIssueIds", "trackingCode title status")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      count: issues.length,
      data: issues,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Failed to fetch issues";
    console.error("GET /api/issues error:", error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
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
      aiTags = [],
    } = body;

    // 1. Basic validation
    if (!title || !description || !domain || !district || !facingSince || !citizenName || !citizenMobile) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: title, description, domain, district, facingSince, citizenName, citizenMobile",
        },
        { status: 400 }
      );
    }

    if (!ISSUE_DOMAINS.includes(domain)) {
      return NextResponse.json(
        { success: false, error: `Invalid domain. Must be one of: ${ISSUE_DOMAINS.join(", ")}` },
        { status: 400 }
      );
    }

    if (!FACING_SINCE_OPTIONS.includes(facingSince)) {
      return NextResponse.json(
        { success: false, error: `Invalid facingSince value. Must be one of: ${FACING_SINCE_OPTIONS.join(", ")}` },
        { status: 400 }
      );
    }

    // 2. Compute Deduplication Fingerprint
    const dedupFingerprint = generateDedupFingerprint(description, district, location);

    // 3. Search for potential duplicates / similar issues
    // Check by identical fingerprint OR same district + domain
    const existingSimilar = await Issue.find({
      $or: [
        { dedupFingerprint },
        {
          district: { $regex: new RegExp(`^${district}$`, "i") },
          domain,
        },
      ],
    })
      .select("_id trackingCode title dedupFingerprint")
      .limit(5)
      .lean();

    const similarIssueIds = existingSimilar.map((item) => item._id);
    const hasExactDuplicate = existingSimilar.some((item) => item.dedupFingerprint === dedupFingerprint);

    // Initial status: Flag as 'Under_Review' if duplicate fingerprint or multiple matches exist, else 'Reported'
    const initialStatus = hasExactDuplicate || similarIssueIds.length > 0 ? "Under_Review" : "Reported";

    // 4. Sequence number & Tracking Code generation
    const currentYear = new Date().getFullYear();
    const countThisYear = await Issue.countDocuments({
      createdAt: {
        $gte: new Date(currentYear, 0, 1),
      },
    });

    const sequenceNum = countThisYear + 101; // start from 000101
    const trackingCode = formatTrackingCode(currentYear, sequenceNum);

    // 5. Repeat reporter check (Issues from this mobile number in last 24h)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentSubmissionsCount = await Issue.countDocuments({
      citizenMobile,
      createdAt: { $gte: twentyFourHoursAgo },
    });

    const submissionIndexForMobile = recentSubmissionsCount + 1;

    // 6. Save Issue Document
    const newIssue = await Issue.create({
      title: title.trim(),
      description: description.trim(),
      attachments,
      domain,
      severityScore: Math.min(5, Math.max(1, Number(severityScore) || 3)),
      aiTags,
      district: district.trim(),
      pincode: pincode?.trim(),
      address: address?.trim(),
      location: location?.lat && location?.lng ? { lat: Number(location.lat), lng: Number(location.lng) } : undefined,
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
      { status: 201 }
    );
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Failed to create issue";
    console.error("POST /api/issues error:", error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
