import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Issue from "@/lib/models/Issue";
import College from "@/lib/models/College";
import IndustryPledge from "@/lib/models/IndustryPledge";
import { JHARKHAND_DISTRICTS } from "@/lib/data/districts";

export const dynamic = "force-dynamic";

interface DistrictIssueAgg {
  _id: string;
  totalIssues: number;
  resolvedCount: number;
  underReviewCount: number;
  assignedCount: number;
}

interface DistrictCollegeAgg {
  _id: string;
  collegeCount: number;
}

interface PopulatedPledge {
  amountPledged: number;
  proposal?: {
    issue?: {
      district?: string;
    };
  };
}

export async function GET() {
  try {
    await connectDB();

    // 1. Group issues by district
    const issueAgg: DistrictIssueAgg[] = await Issue.aggregate([
      {
        $group: {
          _id: "$district",
          totalIssues: { $sum: 1 },
          resolvedCount: {
            $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] },
          },
          underReviewCount: {
            $sum: { $cond: [{ $eq: ["$status", "Under_Review"] }, 1, 0] },
          },
          assignedCount: {
            $sum: {
              $cond: [
                {
                  $in: [
                    "$status",
                    ["Assigned_HEI", "Proposal_Submitted", "Under_Prototyping", "Industry_Funded"],
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    // 2. Group colleges by district
    const collegeAgg: DistrictCollegeAgg[] = await College.aggregate([
      {
        $group: {
          _id: "$district",
          collegeCount: { $sum: 1 },
        },
      },
    ]);

    // 3. Find funds committed per district via proposals & pledges
    const rawPledges = await IndustryPledge.find({
      status: { $in: ["Pledged", "Payment_Processing", "Funded", "Milestone_Released", "Completed"] },
    })
      .populate({
        path: "proposal",
        select: "issue",
        populate: {
          path: "issue",
          select: "district",
        },
      })
      .lean();

    const pledges = rawPledges as unknown as PopulatedPledge[];

    const fundsByDistrict: Record<string, number> = {};
    for (const pledge of pledges) {
      const issueDistrict = pledge.proposal?.issue?.district;
      if (issueDistrict) {
        fundsByDistrict[issueDistrict] =
          (fundsByDistrict[issueDistrict] || 0) + (pledge.amountPledged || 0);
      }
    }

    // Map aggregates to a fast lookup
    const issueStatsMap: Record<string, DistrictIssueAgg> = {};
    let maxIssues = 1;

    issueAgg.forEach((item) => {
      issueStatsMap[item._id] = item;
      if (item.totalIssues > maxIssues) {
        maxIssues = item.totalIssues;
      }
    });

    const collegeStatsMap: Record<string, number> = {};
    collegeAgg.forEach((item) => {
      collegeStatsMap[item._id] = item.collegeCount;
    });

    // Build the 24-district comprehensive response
    const summaryByDistrict: Record<
      string,
      {
        name: string;
        division: string;
        totalIssues: number;
        resolvedCount: number;
        underReviewCount: number;
        assignedCount: number;
        resolutionRate: number;
        collegesEngaged: number;
        fundsCommitted: number;
        density: number; // 0 - 100 for choropleth
      }
    > = {};

    const summaryList = JHARKHAND_DISTRICTS.map((dist) => {
      const stats = issueStatsMap[dist.name] || {
        _id: dist.name,
        totalIssues: 0,
        resolvedCount: 0,
        underReviewCount: 0,
        assignedCount: 0,
      };

      const totalIssues = stats.totalIssues;
      const resolvedCount = stats.resolvedCount;
      const resolutionRate =
        totalIssues > 0 ? Math.round((resolvedCount / totalIssues) * 100) : 0;
      const collegesEngaged = collegeStatsMap[dist.name] || 0;
      const fundsCommitted = fundsByDistrict[dist.name] || 0;

      // Relative density calculation (clamped 10 to 100 if has issues, or 0)
      const density =
        totalIssues > 0
          ? Math.min(100, Math.max(12, Math.round((totalIssues / maxIssues) * 100)))
          : 0;

      const record = {
        name: dist.name,
        division: dist.division,
        totalIssues,
        resolvedCount,
        underReviewCount: stats.underReviewCount,
        assignedCount: stats.assignedCount,
        resolutionRate,
        collegesEngaged,
        fundsCommitted,
        density,
      };

      summaryByDistrict[dist.name] = record;
      return record;
    });

    return NextResponse.json({
      success: true,
      totalDistricts: JHARKHAND_DISTRICTS.length,
      data: summaryByDistrict,
      list: summaryList,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Failed to fetch districts summary";
    console.error("GET /api/districts/summary error:", error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
