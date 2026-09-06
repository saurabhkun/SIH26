import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Proposal, { MilestoneStatus } from "@/lib/models/Proposal";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/proposals/[id]/milestones
 * Updates milestone status (Completed, In_Progress, Delayed, Pending)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = params;
    const body = await request.json();
    const { milestoneIndex, status } = body;

    if (milestoneIndex === undefined || !status) {
      return NextResponse.json(
        { success: false, error: "milestoneIndex and status are required." },
        { status: 400 }
      );
    }

    const proposal = await Proposal.findById(id);
    if (!proposal) {
      return NextResponse.json(
        { success: false, error: "Proposal not found." },
        { status: 404 }
      );
    }

    const index = Number(milestoneIndex);
    if (index < 0 || index >= proposal.milestones.length) {
      return NextResponse.json(
        { success: false, error: "Invalid milestone index." },
        { status: 400 }
      );
    }

    proposal.milestones[index].status = status as MilestoneStatus;
    if (status === "Completed") {
      proposal.milestones[index].completedAt = new Date();
    } else if (status !== "Completed") {
      proposal.milestones[index].completedAt = undefined;
    }

    // Auto-advance proposal overall status if all milestones completed
    const allCompleted = proposal.milestones.every((m) => m.status === "Completed");
    if (allCompleted) {
      proposal.status = "Completed";
    } else if (proposal.status === "Approved" || proposal.status === "Submitted") {
      const anyActive = proposal.milestones.some((m) => m.status === "In_Progress" || m.status === "Completed");
      if (anyActive) {
        proposal.status = "In_Progress";
      }
    }

    await proposal.save();

    // Notify gov when milestone is completed (eligible for fund release)
    if (status === "Completed") {
      await createNotification({
        recipientType: "gov",
        recipientId: "gov",
        message: `Milestone #${index + 1} of proposal "${proposal.title}" has been marked Completed and is eligible for fund release.`,
        relatedProposal: proposal._id,
      });
      // Notify industry (use generic id — industry portal polls)
      await createNotification({
        recipientType: "industry",
        recipientId: "industry",
        message: `A milestone is ready for fund release on proposal "${proposal.title}". Review your pledges to release the next tranche.`,
        relatedProposal: proposal._id,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Milestone #${index + 1} status updated to ${status}.`,
      data: proposal,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Failed to update milestone";
    console.error("PATCH /api/proposals/[id]/milestones error:", error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
