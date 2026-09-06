import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import IndustryPledge from "@/lib/models/IndustryPledge";
import Proposal from "@/lib/models/Proposal";
import { createNotifications } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * POST /api/pledges/[id]/release-milestone
 * Releases the funding tranche for a completed milestone
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = params;
    const body = await request.json();
    const { milestoneIndex } = body;

    if (milestoneIndex === undefined) {
      return NextResponse.json(
        { success: false, error: "milestoneIndex is required." },
        { status: 400 }
      );
    }

    const pledge = await IndustryPledge.findById(id);
    if (!pledge) {
      return NextResponse.json(
        { success: false, error: "Pledge record not found." },
        { status: 404 }
      );
    }

    const proposal = await Proposal.findById(pledge.proposal);
    if (!proposal) {
      return NextResponse.json(
        { success: false, error: "Linked proposal not found." },
        { status: 404 }
      );
    }

    const idx = Number(milestoneIndex);
    if (idx < 0 || idx >= proposal.milestones.length) {
      return NextResponse.json(
        { success: false, error: "Invalid milestone index." },
        { status: 400 }
      );
    }

    const targetMilestone = proposal.milestones[idx];

    // Check if milestone was completed by the college
    if (targetMilestone.status !== "Completed") {
      return NextResponse.json(
        {
          success: false,
          error: "Funds cannot be released yet: Milestone must first be marked 'Completed' by the college research team.",
        },
        { status: 400 }
      );
    }

    if (targetMilestone.fundingReleased) {
      return NextResponse.json(
        { success: false, error: "Funding for this milestone has already been released." },
        { status: 400 }
      );
    }

    const trancheAmount = targetMilestone.fundingReleaseAmount || 0;

    // 1. Mark milestone funding as released
    proposal.milestones[idx].fundingReleased = true;
    await proposal.save();

    // 2. Increment amountReleased on the pledge
    pledge.amountReleased = (pledge.amountReleased || 0) + trancheAmount;

    // Check if all milestones released
    const allReleased = proposal.milestones.every((m) => m.fundingReleased);
    if (allReleased) {
      pledge.status = "Completed";
    } else {
      pledge.status = "Milestone_Released";
    }

    await pledge.save();

    // Notify college and gov about the released funds
    await createNotifications([
      {
        recipientType: "college",
        recipientId: proposal.college.toString(),
        message: `Funding tranche of ₹${trancheAmount.toLocaleString("en-IN")} has been released for Milestone #${idx + 1}: "${targetMilestone.title}".`,
        relatedProposal: proposal._id,
      },
      {
        recipientType: "gov",
        recipientId: "gov",
        message: `Industry released ₹${trancheAmount.toLocaleString("en-IN")} for milestone ${idx + 1} of proposal "${proposal.title}".`,
        relatedProposal: proposal._id,
      },
    ]);

    return NextResponse.json({
      success: true,
      message: `Successfully released Tranche of ₹${trancheAmount.toLocaleString("en-IN")} for Milestone #${idx + 1}: ${targetMilestone.title}.`,
      data: {
        pledgeId: pledge._id,
        amountReleased: pledge.amountReleased,
        totalPledged: pledge.amountPledged,
        milestoneIndex: idx,
        fundingReleased: true,
      },
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Failed to release milestone funds";
    console.error("POST /api/pledges/[id]/release-milestone error:", error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
