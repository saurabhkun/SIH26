/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Issue, { IssueDomain } from "@/lib/models/Issue";
import College from "@/lib/models/College";
import Proposal from "@/lib/models/Proposal";
import { getCurrentUser } from "@/lib/auth/session";
import { syncReportsToIssues } from "@/lib/utils/reportsAdapter";

export const dynamic = "force-dynamic";

/**
 * GET /api/issues/marketplace
 * Returns issues available for HEI claiming (status: Assigned_HEI or Reported),
 * annotated with college capability matching info.
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    await syncReportsToIssues();

    const { searchParams } = new URL(request.url);
    const domainFilter = searchParams.get("domain");
    const districtFilter = searchParams.get("district");

    // 1. Resolve logged-in college capabilities
    const sessionUser = getCurrentUser();
    let college = null;
    if (sessionUser?.collegeId) {
      try {
        college = await College.findById(sessionUser.collegeId);
      } catch {
        // ignore
      }
    }
    if (!college && sessionUser?.email) {
      college = await College.findOne({
        email: sessionUser.email.toLowerCase(),
      });
    }
    if (!college) {
      college = await College.findOne().sort({ createdAt: 1 });
    }
    if (!college) {
      college = await College.create({
        name: "Birla Institute of Technology, Mesra",
        district: "Ranchi",
        tier: "L1",
        capabilities: [
          "Water Resources",
          "Environment",
          "Agriculture",
          "Energy",
        ],
        facilities: [
          {
            name: "Environmental Engineering & Water Testing Lab",
            description:
              "Advanced spectrometry and heavy metal trace detection facility.",
            relatedDomains: ["Water Resources", "Environment"],
          },
        ],
        faculty: [
          {
            name: "Dr. Ananya Sen",
            department: "Civil & Environmental Engineering",
            specialization: "Groundwater Arsenic Remediation & Filtration",
            email: "director.rnd@bitmesra.ac.in",
          },
        ],
        email: "director.rnd@bitmesra.ac.in",
        contactPerson: "Dr. A. K. Sinha (Dean R&D)",
        contactPhone: "+91-651-2275444",
        maxConcurrentClaims: 5,
        verified: true,
      });
    }

    const collegeCapabilities: IssueDomain[] = (college?.capabilities ||
      []) as IssueDomain[];

    // 2. Query issues with status Assigned_HEI or Reported (or all non-resolved for testing)
    const query: Record<string, unknown> = {
      status: {
        $in: [
          "Reported",
          "Assigned_HEI",
          "Under_Review",
          "Proposal_Submitted",
          "Approved",
        ],
      },
    };

    if (domainFilter && domainFilter !== "all") {
      query.domain = domainFilter;
    }

    if (districtFilter && districtFilter !== "all") {
      query.district = { $regex: new RegExp(`^${districtFilter}$`, "i") };
    }

    const issues = await Issue.find(query)
      .populate("assignedColleges", "name tier district")
      .sort({ severityScore: -1, createdAt: -1 })
      .lean();

    // 3. Check proposals submitted by this college
    const collegeProposals = college
      ? await Proposal.find({ college: college._id })
          .select("issue status title")
          .lean()
      : [];

    const proposalMap = new Map(
      collegeProposals.map((p) => [p.issue.toString(), p]),
    );

    // 4. Annotate each issue with capability match and claim status
    const annotatedIssues = issues.map((issue) => {
      const isMatch = collegeCapabilities.includes(issue.domain as IssueDomain);
      const existingProposal = proposalMap.get(issue._id.toString());
      const isClaimedByThisCollege = !!existingProposal;

      // Find matching facility if any
      const matchingFacility = (college?.facilities as any[])?.find((f: any) =>
        f.relatedDomains?.includes(issue.domain),
      );

      return {
        ...issue,
        isCapabilityMatch: isMatch,
        matchingFacilityName: matchingFacility?.name,
        existingProposal: existingProposal || null,
        isClaimedByThisCollege,
      };
    });

    // Sort matching issues first, while keeping all available
    annotatedIssues.sort((a, b) => {
      if (a.isCapabilityMatch && !b.isCapabilityMatch) return -1;
      if (!a.isCapabilityMatch && b.isCapabilityMatch) return 1;
      return 0;
    });

    return NextResponse.json({
      success: true,
      college: college
        ? {
            id: college._id,
            name: college.name,
            capabilities: college.capabilities,
          }
        : null,
      count: annotatedIssues.length,
      data: annotatedIssues,
    });
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error
        ? error.message
        : "Failed to load challenge marketplace";
    console.error("GET /api/issues/marketplace error:", error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 },
    );
  }
}
