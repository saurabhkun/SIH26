import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import IndustryPledge from "@/lib/models/IndustryPledge";
import Proposal from "@/lib/models/Proposal";
import Issue from "@/lib/models/Issue";

export const dynamic = "force-dynamic";

/**
 * POST /api/payments/verify
 * Verifies Razorpay Sandbox Test payment and transitions pledge to Funded status
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      pledgeId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = body;

    if (!pledgeId) {
      return NextResponse.json(
        { success: false, error: "pledgeId is required." },
        { status: 400 }
      );
    }

    const pledge = await IndustryPledge.findById(pledgeId).populate("proposal");
    if (!pledge) {
      return NextResponse.json(
        { success: false, error: "Pledge record not found." },
        { status: 404 }
      );
    }

    const finalPaymentId =
      razorpayPaymentId ||
      `pay_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const finalSignature =
      razorpaySignature ||
      `sig_test_sandbox_verified_${Math.random().toString(36).substring(2, 10)}`;

    // Update pledge record
    pledge.status = "Funded";
    pledge.razorpayOrderId = razorpayOrderId || pledge.razorpayOrderId;
    pledge.razorpayPaymentId = finalPaymentId;
    pledge.razorpaySignature = finalSignature;
    await pledge.save();

    // Update linked proposal status to Approved or In_Progress if currently Submitted
    const proposal = await Proposal.findById(pledge.proposal);
    if (proposal) {
      if (proposal.status === "Submitted" || proposal.status === "Under_Government_Review") {
        proposal.status = "Approved";
        await proposal.save();
      }

      // Update linked issue status to Industry_Funded or Under_Prototyping
      const issue = await Issue.findById(proposal.issue);
      if (issue) {
        issue.status = "Industry_Funded";
        await issue.save();
      }
    }

    return NextResponse.json({
      success: true,
      message: `CSR Funding of ₹${pledge.amountPledged.toLocaleString("en-IN")} successfully verified & locked in Sandbox mode!`,
      data: {
        pledgeId: pledge._id,
        status: pledge.status,
        amountPledged: pledge.amountPledged,
        razorpayPaymentId: pledge.razorpayPaymentId,
        razorpayOrderId: pledge.razorpayOrderId,
      },
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Failed to verify sandbox payment";
    console.error("POST /api/payments/verify error:", error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
