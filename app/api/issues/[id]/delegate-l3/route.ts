import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Issue from "@/lib/models/Issue";
import College from "@/lib/models/College";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * POST /api/issues/[id]/delegate-l3
 * Subcontracts regional ground tasks to an L3R (Research-capable) or L3G (Ground Execution) institution
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connectDB();
    const issueId = params.id;
    const body = await request.json();
    const {
      collegeId,
      collegeName,
      type,
      scopeOfWork,
      agreedStipend,
      distanceKm,
    } = body;

    if (!collegeId || !type) {
      return NextResponse.json(
        {
          success: false,
          error: "collegeId and type ('L3R' | 'L3G') are required.",
        },
        { status: 400 },
      );
    }

    const [issue, subCollege] = await Promise.all([
      Issue.findById(issueId),
      College.findById(collegeId),
    ]);

    if (!issue) {
      return NextResponse.json(
        { success: false, error: "Issue not found" },
        { status: 404 },
      );
    }

    const subName =
      subCollege?.name || collegeName || "Regional Partner College";

    // Set L3 delegation
    issue.subContractedL3 = {
      collegeId: subCollege ? subCollege._id : collegeId,
      collegeName: subName,
      type,
      scopeOfWork: scopeOfWork || [
        "Regional field monitoring & citizen survey",
      ],
      agreedStipend: agreedStipend || 25000,
      distanceKm: distanceKm || 15,
      status: "PENDING",
    };

    if (issue.status === "ASSIGNED") {
      issue.status = "L3_DELEGATED";
    }

    await issue.save();

    await createNotification({
      recipientType: "college",
      recipientId: subCollege?._id.toString() || collegeId.toString(),
      message: `Subcontract Proposed (${type === "L3R" ? "Research & Sampling" : "Ground Logistics"}): Lead institution has dispatched a ground collaboration offer for "${issue.title}". Stipend: ₹${(agreedStipend || 25000).toLocaleString("en-IN")}.`,
      relatedIssue: issue._id,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully delegated ground tasks to ${subName} (${type}).`,
      data: issue.subContractedL3,
    });
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error
        ? error.message
        : "Failed to delegate L3 subcontract";
    console.error("POST /api/issues/[id]/delegate-l3 error:", error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 },
    );
  }
}
