import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Proposal from "@/lib/models/Proposal";
import IndustryPledge from "@/lib/models/IndustryPledge";

export const dynamic = "force-dynamic";

/**
 * GET /api/proposals/fundable
 * Returns curated feed of HEI Solution Proposals available for CSR / Industry sponsorship
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const domainFilter = searchParams.get("domain");
    const districtFilter = searchParams.get("district");

    // Query proposals that are Submitted, Approved, or In_Progress
    const query: Record<string, unknown> = {
      status: { $in: ["Submitted", "Approved", "In_Progress", "Testing"] },
    };

    const proposals = await Proposal.find(query)
      .populate(
        "issue",
        "title description trackingCode district domain severityScore citizenName address mediaUrls attachments",
      )
      .populate("college", "name district tier capabilities facilities")
      .sort({ createdAt: -1 })
      .lean();

    // Query all active pledges
    const pledges = await IndustryPledge.find({
      status: { $in: ["Funded", "Milestone_Released", "Completed"] },
    }).lean();

    const pledgeMap = new Map<string, (typeof pledges)[0][]>();
    pledges.forEach((p) => {
      const propId = (p.proposalId || p.proposal)?.toString();
      if (!propId) return;
      const existing = pledgeMap.get(propId) || [];
      existing.push(p);
      pledgeMap.set(propId, existing);
    });

    // Annotate proposals with CSR funding status
    const annotated = proposals.map((prop) => {
      const linkedPledges = pledgeMap.get(prop._id.toString()) || [];
      const totalPledged = linkedPledges.reduce(
        (sum, p) => sum + (p.amountPledged || 0),
        0,
      );
      const totalReleased = linkedPledges.reduce(
        (sum, p) => sum + (p.amountReleased || 0),
        0,
      );

      const completedUnreleasedMilestones = (prop.milestones || []).filter(
        (m) => m.status === "Completed" && !m.fundingReleased,
      );

      return {
        ...prop,
        linkedPledges,
        totalPledged,
        totalReleased,
        isFullyFunded: totalPledged >= (prop.budgetRequested || 0),
        fundingGap: Math.max(0, (prop.budgetRequested || 0) - totalPledged),
        completedUnreleasedMilestonesCount:
          completedUnreleasedMilestones.length,
      };
    });

    // Filter by domain or district if requested
    let filtered = annotated;
    if (domainFilter && domainFilter !== "all") {
      filtered = filtered.filter(
        (p) =>
          (p.issue as unknown as { domain?: string })?.domain === domainFilter,
      );
    }
    if (districtFilter && districtFilter !== "all") {
      filtered = filtered.filter(
        (p) =>
          (
            p.issue as unknown as { district?: string }
          )?.district?.toLowerCase() === districtFilter.toLowerCase(),
      );
    }

    return NextResponse.json({
      success: true,
      count: filtered.length,
      data: filtered,
    });
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error
        ? error.message
        : "Failed to load fundable proposals";
    console.error("GET /api/proposals/fundable error:", error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 },
    );
  }
}
