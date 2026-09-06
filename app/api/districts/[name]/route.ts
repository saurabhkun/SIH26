import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Issue from "@/lib/models/Issue";
import College from "@/lib/models/College";
import Proposal from "@/lib/models/Proposal";
import IndustryPledge from "@/lib/models/IndustryPledge";
import { JHARKHAND_DISTRICTS } from "@/lib/data/districts";

export const dynamic = "force-dynamic";

interface AssignedCollegeRef {
  _id: string;
  name: string;
  tier: string;
  district: string;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    await connectDB();

    const decodedName = decodeURIComponent(params.name);

    // Find district metadata from official districts dataset
    const districtMeta = JHARKHAND_DISTRICTS.find(
      (d) => d.name.toLowerCase() === decodedName.toLowerCase()
    );

    const districtQuery = {
      district: { $regex: new RegExp(`^${decodedName}$`, "i") },
    };

    // 1. Fetch all issues in this district
    const issues = await Issue.find(districtQuery)
      .populate("assignedColleges", "name tier district")
      .sort({ createdAt: -1 })
      .lean();

    // 2. Fetch colleges physically located in this district
    const localColleges = await College.find(districtQuery).lean();

    // 3. Aggregate metrics
    const totalIssues = issues.length;
    const resolvedCount = issues.filter((i) => i.status === "Resolved").length;
    const inProgressCount = issues.filter((i) =>
      ["Assigned_HEI", "Proposal_Submitted", "Under_Prototyping", "Industry_Funded"].includes(i.status)
    ).length;
    const resolutionRate =
      totalIssues > 0 ? Math.round((resolvedCount / totalIssues) * 100) : 0;

    // 4. Determine distinct HEIs deployed on issues in this district
    const deployedCollegeIdSet = new Set<string>();
    localColleges.forEach((c) => deployedCollegeIdSet.add(c._id.toString()));
    issues.forEach((iss) => {
      if (iss.assignedColleges && Array.isArray(iss.assignedColleges)) {
        (iss.assignedColleges as unknown as AssignedCollegeRef[]).forEach((c) => {
          if (c?._id) deployedCollegeIdSet.add(c._id.toString());
        });
      }
    });

    // 5. Calculate Industry Capital Committed via Proposals on this district's issues
    const issueIds = issues.map((i) => i._id);
    const districtProposals = await Proposal.find({
      issue: { $in: issueIds },
    })
      .select("_id")
      .lean();

    const proposalIds = districtProposals.map((p) => p._id);
    const pledges = await IndustryPledge.find({
      proposal: { $in: proposalIds },
      status: {
        $in: ["Pledged", "Payment_Processing", "Funded", "Milestone_Released", "Completed"],
      },
    }).lean();

    const fundsCommitted = pledges.reduce(
      (sum, pl) => sum + (pl.amountPledged || 0),
      0
    );

    // Group issues by domain
    const domainCounts: Record<string, number> = {};
    issues.forEach((iss) => {
      domainCounts[iss.domain] = (domainCounts[iss.domain] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      district: {
        name: districtMeta ? districtMeta.name : decodedName,
        division: districtMeta ? districtMeta.division : "Jharkhand",
        headquarter: districtMeta?.headquarter || decodedName,
        col: districtMeta?.col,
        row: districtMeta?.row,
      },
      stats: {
        totalIssues,
        resolvedCount,
        inProgressCount,
        heisDeployed: deployedCollegeIdSet.size,
        fundsCommitted,
        resolutionRate,
        domainDistribution: domainCounts,
      },
      issues,
      colleges: localColleges,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Failed to fetch district detail";
    console.error("GET /api/districts/[name] error:", error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
