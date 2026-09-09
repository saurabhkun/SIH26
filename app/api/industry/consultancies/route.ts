import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Proposal from "@/lib/models/Proposal";
import { createNotification } from "@/lib/notifications";
import {
  EMPANELLED_CONSULTANCIES,
} from "@/lib/data/consultancies";

export const dynamic = "force-dynamic";

/**
 * GET /api/industry/consultancies
 * Returns the directory of Empanelled Technical Consultancies
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get("domain");
    const district = searchParams.get("district");
    const query = searchParams.get("q");

    let firms = [...EMPANELLED_CONSULTANCIES];

    if (domain && domain !== "all") {
      firms = firms.filter((f) =>
        f.domainExpertise.some((d) =>
          d.toLowerCase().includes(domain.toLowerCase()),
        ),
      );
    }

    if (district && district !== "all") {
      firms = firms.filter(
        (f) =>
          f.operatingDistricts.includes("All 24 Districts") ||
          f.operatingDistricts.some(
            (d) => d.toLowerCase() === district.toLowerCase(),
          ),
      );
    }

    if (query) {
      const q = query.toLowerCase();
      firms = firms.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.shortName.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q) ||
          f.domainExpertise.some((d) => d.toLowerCase().includes(q)),
      );
    }

    return NextResponse.json({
      success: true,
      count: firms.length,
      data: firms,
    });
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error ? error.message : "Failed to load consultancies";
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 },
    );
  }
}

/**
 * POST /api/industry/consultancies
 * Engages a consultancy for a third-party quality audit on a funded proposal
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const {
      consultancyId,
      proposalId,
      auditScope,
      auditTargetDate,
      auditRemarks,
    } = body;

    if (!consultancyId || !proposalId) {
      return NextResponse.json(
        { success: false, error: "consultancyId and proposalId are required." },
        { status: 400 },
      );
    }

    const firm = EMPANELLED_CONSULTANCIES.find((f) => f.id === consultancyId);
    if (!firm) {
      return NextResponse.json(
        { success: false, error: "Consultancy firm not found" },
        { status: 404 },
      );
    }

    const proposal = await Proposal.findById(proposalId)
      .populate("issue")
      .populate("college");
    if (!proposal) {
      return NextResponse.json(
        { success: false, error: "Proposal not found" },
        { status: 404 },
      );
    }

    // Attach third-party audit metadata into proposal outcomes
    proposal.outcomes = {
      ...(proposal.outcomes || {}),
      thirdPartyAudit: {
        engaged: true,
        consultancyId: firm.id,
        consultancyName: firm.name,
        auditScope:
          auditScope || "Field Pilot Compliance & Technical Quality Audit",
        auditTargetDate:
          auditTargetDate ||
          new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        status: "ENGAGED",
        pocName: firm.contactPOC.name,
        pocEmail: firm.contactPOC.email,
        engagedAt: new Date().toISOString(),
        remarks:
          auditRemarks ||
          "CSR Head third-party audit engagement confirmed for quality and field validation.",
      },
    };
    proposal.markModified("outcomes");
    await proposal.save();

    // Send notifications to college lead
    if (proposal.collegeId) {
      await createNotification({
        recipientType: "college",
        recipientId: proposal.collegeId.toString(),
        message: `🛡️ Third-Party Audit Assigned: Industry CSR Sponsor has engaged ${firm.shortName} to conduct third-party quality and field validation for "${proposal.title}".`,
        relatedProposal: proposal._id,
        relatedIssue: proposal.issueId || proposal.issue?._id,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully engaged ${firm.shortName} for third-party compliance audit on "${proposal.title}"!`,
      data: {
        proposalId: proposal._id,
        consultancy: firm,
        auditDetails: proposal.outcomes.thirdPartyAudit,
      },
    });
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error ? error.message : "Failed to engage consultancy";
    console.error("POST /api/industry/consultancies error:", error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 },
    );
  }
}
