import React from "react";
import { connectDB } from "@/lib/mongodb";
import Issue from "@/lib/models/Issue";
import College from "@/lib/models/College";
import Proposal from "@/lib/models/Proposal";
import IndustryPledge from "@/lib/models/IndustryPledge";
import { JHARKHAND_DISTRICTS } from "@/lib/data/districts";
import DistrictDashboardView from "@/components/DistrictDashboardView";

export const dynamic = "force-dynamic";

interface DistrictPageProps {
  params: {
    districtName: string;
  };
}

interface AssignedCollegeRef {
  _id: string;
  name: string;
  tier: string;
}

interface IssueDocumentResult {
  _id: string;
  trackingCode: string;
  title: string;
  description: string;
  domain: string;
  severityScore: number;
  district: string;
  status: string;
  facingSince: string;
  citizenName: string;
  createdAt: string;
  assignedColleges?: AssignedCollegeRef[];
}

export default async function DistrictPage({ params }: DistrictPageProps) {
  const decodedName = decodeURIComponent(params.districtName);

  const districtMeta = JHARKHAND_DISTRICTS.find(
    (d) => d.name.toLowerCase() === decodedName.toLowerCase()
  );

  const targetName = districtMeta ? districtMeta.name : decodedName;

  let issues: IssueDocumentResult[] = [];
  let totalIssues = 0;
  let resolvedCount = 0;
  let inProgressCount = 0;
  let heisDeployed = 0;
  let fundsCommitted = 0;
  let resolutionRate = 0;

  try {
    await connectDB();

    const districtQuery = {
      district: { $regex: new RegExp(`^${targetName}$`, "i") },
    };

    // 1. Fetch issues in this district
    const rawIssues = await Issue.find(districtQuery)
      .populate("assignedColleges", "name tier district")
      .sort({ createdAt: -1 })
      .lean();

    issues = JSON.parse(JSON.stringify(rawIssues));

    // 2. Fetch colleges physically located in this district
    const localColleges = await College.find(districtQuery).select("_id").lean();

    totalIssues = issues.length;
    resolvedCount = issues.filter((i) => i.status === "Resolved").length;
    inProgressCount = issues.filter((i) =>
      ["Assigned_HEI", "Proposal_Submitted", "Under_Prototyping", "Industry_Funded"].includes(i.status)
    ).length;
    resolutionRate =
      totalIssues > 0 ? Math.round((resolvedCount / totalIssues) * 100) : 0;

    // 3. Count distinct HEIs deployed
    const deployedCollegeSet = new Set<string>();
    localColleges.forEach((c) => deployedCollegeSet.add(c._id.toString()));
    issues.forEach((iss) => {
      if (iss.assignedColleges && Array.isArray(iss.assignedColleges)) {
        iss.assignedColleges.forEach((c) => {
          if (c?._id) deployedCollegeSet.add(c._id.toString());
        });
      }
    });
    heisDeployed = deployedCollegeSet.size;

    // 4. Calculate Industry Capital Committed
    const issueIds = issues.map((i) => i._id);
    if (issueIds.length > 0) {
      const proposals = await Proposal.find({ issue: { $in: issueIds } }).select("_id").lean();
      const proposalIds = proposals.map((p) => p._id);
      if (proposalIds.length > 0) {
        const pledges = await IndustryPledge.find({
          proposal: { $in: proposalIds },
          status: { $in: ["Pledged", "Payment_Processing", "Funded", "Milestone_Released", "Completed"] },
        }).lean();

        fundsCommitted = pledges.reduce((sum, pl) => sum + (pl.amountPledged || 0), 0);
      }
    }
  } catch (error) {
    console.error("Failed to load district data in Server Component:", error);
  }

  return (
    <DistrictDashboardView
      districtName={targetName}
      division={districtMeta ? districtMeta.division : "Jharkhand State"}
      headquarter={districtMeta?.headquarter || targetName}
      stats={{
        totalIssues,
        resolvedCount,
        inProgressCount,
        heisDeployed,
        fundsCommitted,
        resolutionRate,
      }}
      initialIssues={issues}
    />
  );
}
