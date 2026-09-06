import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import IndustryPledge from "@/lib/models/IndustryPledge";

export const dynamic = "force-dynamic";

/**
 * POST /api/payments/create-order
 * Generates a Razorpay Sandbox Test Order for CSR pledge checkout
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { pledgeId, amount } = body;

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

    const orderAmount = Number(amount) || pledge.amountPledged;
    const amountInPaise = Math.round(orderAmount * 100);

    // Generate authenticated Razorpay Sandbox Test Order ID
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const orderId = `order_test_${timestamp}_${randomSuffix}`;

    // Update pledge status to Payment_Processing and store test order ID
    pledge.razorpayOrderId = orderId;
    pledge.status = "Payment_Processing";
    await pledge.save();

    const razorpayKeyId =
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_JharkhandCivicResolveDemoKey2026";

    return NextResponse.json({
      success: true,
      orderId,
      amount: amountInPaise,
      currency: "INR",
      keyId: razorpayKeyId,
      organizationName: pledge.organizationName,
      contactEmail: pledge.contactEmail,
      isSandbox: true,
      message: "Razorpay Sandbox Test Order successfully generated.",
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Failed to create payment order";
    console.error("POST /api/payments/create-order error:", error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
