import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Issue from "@/lib/models/Issue";
import Proposal from "@/lib/models/Proposal";
import IndustryPledge from "@/lib/models/IndustryPledge";
import { getCurrentUser } from "@/lib/auth/session";
import { JHARKHAND_DISTRICTS } from "@/lib/constants/districts";
import { syncReportsToIssues } from "@/lib/utils/reportsAdapter";

export const dynamic = "force-dynamic";

// GET /api/gov/analytics
export async function GET() {
  const user = getCurrentUser();
  if (!user || user.role !== "gov") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await dbConnect();
  await syncReportsToIssues();

  // 1. Issues by domain
  const issuesByDomain = await Issue.aggregate([
    { $group: { _id: "$domain", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // 2. Issues by district
  const issuesByDistrict = await Issue.aggregate([
    { $group: { _id: "$district", count: { $sum: 1 } } },
  ]);

  // 3. Resolution rate over time (monthly)
  const resolutionOverTime = await Issue.aggregate([
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        total: { $sum: 1 },
        resolved: {
          $sum: {
            $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0],
          },
        },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
    { $limit: 12 },
  ]);

  // 4. Industry capital by district (pledges with status Funded+)
  const capitalByDistrict = await IndustryPledge.aggregate([
    {
      $match: {
        status: { $in: ["Funded", "Milestone_Released", "Completed"] },
      },
    },
    {
      $lookup: {
        from: "proposals",
        localField: "proposal",
        foreignField: "_id",
        as: "proposal",
      },
    },
    { $unwind: "$proposal" },
    {
      $lookup: {
        from: "issues",
        localField: "proposal.issue",
        foreignField: "_id",
        as: "issue",
      },
    },
    { $unwind: "$issue" },
    {
      $group: {
        _id: "$issue.district",
        totalCapital: { $sum: "$amountPledged" },
      },
    },
    { $sort: { totalCapital: -1 } },
  ]);

  // 5. Proposal status funnel
  const proposalFunnel = await Proposal.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // 6. Summary counts
  const [totalIssues, totalResolved, totalProposals, totalFunded] =
    await Promise.all([
      Issue.countDocuments(),
      Issue.countDocuments({ status: "Resolved" }),
      Proposal.countDocuments(),
      IndustryPledge.countDocuments({
        status: { $in: ["Funded", "Milestone_Released", "Completed"] },
      }),
    ]);

  // 7. Build district map data — merge issue counts + capital data
  const districtMap: Record<string, { issues: number; capital: number }> = {};
  for (const d of JHARKHAND_DISTRICTS) {
    districtMap[d] = { issues: 0, capital: 0 };
  }
  for (const item of issuesByDistrict) {
    if (item._id && districtMap[item._id] !== undefined) {
      districtMap[item._id].issues = item.count;
    }
  }
  for (const item of capitalByDistrict) {
    if (item._id && districtMap[item._id] !== undefined) {
      districtMap[item._id].capital = item.totalCapital;
    }
  }

  return NextResponse.json({
    summary: { totalIssues, totalResolved, totalProposals, totalFunded },
    issuesByDomain: issuesByDomain.map((d) => ({
      domain: d._id,
      count: d.count,
    })),
    issuesByDistrict: Object.entries(districtMap).map(([district, v]) => ({
      district,
      issues: v.issues,
      capital: v.capital,
    })),
    resolutionOverTime: resolutionOverTime.map((r) => ({
      label: `${r._id.year}-${String(r._id.month).padStart(2, "0")}`,
      total: r.total,
      resolved: r.resolved,
      rate: r.total > 0 ? Math.round((r.resolved / r.total) * 100) : 0,
    })),
    capitalByDistrict: capitalByDistrict.map((d) => ({
      district: d._id || "Unknown",
      capital: d.totalCapital,
    })),
    proposalFunnel: proposalFunnel.map((p) => ({
      status: p._id,
      count: p.count,
    })),
  });
}
