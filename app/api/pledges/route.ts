import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import IndustryPledge from "@/lib/models/IndustryPledge";
import Proposal from "@/lib/models/Proposal";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * GET /api/pledges
 * Lists industry pledges with populated proposal, issue, and HEI college details
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const proposalId = searchParams.get("proposalId");
    const status = searchParams.get("status");
    const org = searchParams.get("org");

    const query: Record<string, unknown> = {};

    if (proposalId) {
      query.proposal = proposalId;
    }

    if (status && status !== "all") {
      query.status = status;
    }

    if (org) {
      query.organizationName = { $regex: new RegExp(`^${org}$`, "i") };
    }

    const pledges = await IndustryPledge.find(query)
      .populate({
        path: "proposal",
        populate: [
          {
            path: "issue",
            select: "title trackingCode district domain severityScore",
          },
          { path: "college", select: "name district tier" },
        ],
      })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      count: pledges.length,
      data: pledges,
    });
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error ? error.message : "Failed to fetch pledges";
    console.error("GET /api/pledges error:", error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 },
    );
  }
}

/**
 * POST /api/pledges
 * Creates an initial Industry Pledge
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      proposalId,
      companyName,
      organizationName,
      contactEmail,
      csrEmail,
      isCSR,
      amountPledged,
      pledgedAmount,
      fundingAmount,
      mentorshipOffered,
      mentorshipNotes,
      section135Mandate,
      isSection135,
    } = body;

    const parsedAmount = Number(
      pledgedAmount ?? amountPledged ?? fundingAmount ?? 0,
    );

    if (!proposalId || isNaN(parsedAmount) || parsedAmount < 1000) {
      return NextResponse.json(
        {
          success: false,
          error:
            "proposalId and a valid pledged amount (minimum ₹1,000) are required.",
        },
        { status: 400 },
      );
    }

    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
      return NextResponse.json(
        { success: false, error: "Target proposal not found." },
        { status: 404 },
      );
    }

    const sessionUser = getCurrentUser();
    const rawOrg =
      companyName ||
      organizationName ||
      sessionUser?.organizationName ||
      "Tata Steel Foundation";
    const finalOrgName = String(rawOrg).trim();

    const rawEmail =
      contactEmail || csrEmail || sessionUser?.email || "csr.head@tatasteel.com";
    const finalEmail = String(rawEmail).trim().toLowerCase();

    const isCsrFlag =
      isCSR !== false || section135Mandate === true || isSection135 === true;

    const newPledge = await IndustryPledge.create({
      proposal: proposal._id,
      proposalId: proposal._id,
      companyName: finalOrgName,
      organizationName: finalOrgName,
      contactEmail: finalEmail,
      isCSR: isCsrFlag,
      pledgedAmount: parsedAmount,
      amountPledged: parsedAmount,
      amountReleased: 0,
      escrowBalance: 0,
      status: "Pledged",
      mentorshipOffered: !!mentorshipOffered,
      mentorshipNotes: mentorshipNotes?.trim() || "",
    });

    const formattedAmount = (
      newPledge.amountPledged ??
      newPledge.pledgedAmount ??
      parsedAmount
    ).toLocaleString("en-IN");

    return NextResponse.json({
      success: true,
      message: `CSR funding pledge of ₹${formattedAmount} initiated for '${proposal.title}'.`,
      data: newPledge,
    });
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error ? error.message : "Failed to create pledge";
    console.error("POST /api/pledges error:", error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 },
    );
  }
}
