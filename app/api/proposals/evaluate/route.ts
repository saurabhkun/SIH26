import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Issue from "@/lib/models/Issue";
import Proposal from "@/lib/models/Proposal";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * POST /api/proposals/evaluate
 * Finalizes Human Panel Determination for an issue: sets 1 Winner and 2 Designated Runners-Up
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const {
      issueId,
      winnerProposalId,
      runnerUp1ProposalId,
      runnerUp2ProposalId,
      panelRemarks,
      reviewedBy = "State Nodal Officer & Domain Expert Panel",
    } = body;

    if (!issueId || !winnerProposalId) {
      return NextResponse.json(
        { success: false, error: "issueId and winnerProposalId are required." },
        { status: 400 },
      );
    }

    const [issue, winningProposal] = await Promise.all([
      Issue.findById(issueId),
      Proposal.findById(winnerProposalId).populate("collegeId"),
    ]);

    if (!issue) {
      return NextResponse.json(
        { success: false, error: "Issue not found" },
        { status: 404 },
      );
    }
    if (!winningProposal) {
      return NextResponse.json(
        { success: false, error: "Winning proposal not found" },
        { status: 404 },
      );
    }

    // 1. Update Winning Proposal
    winningProposal.humanPanelReview = {
      reviewedBy,
      comments: panelRemarks,
      verifiedAt: new Date(),
      finalVerdict: "WINNER",
    };
    winningProposal.status = "Approved";
    await winningProposal.save();

    // 2. Update Backup Runners-Up
    const backupRunnersUp: Array<{
      proposalId: unknown;
      collegeId?: unknown;
      rank: 1 | 2;
    }> = [];

    if (runnerUp1ProposalId) {
      const prop1 = await Proposal.findById(runnerUp1ProposalId);
      if (prop1) {
        prop1.humanPanelReview = {
          reviewedBy,
          comments: panelRemarks,
          verifiedAt: new Date(),
          finalVerdict: "RUNNER_UP_1",
        };
        await prop1.save();
        backupRunnersUp.push({
          proposalId: prop1._id,
          collegeId: prop1.collegeId || prop1.college,
          rank: 1,
        });
      }
    }

    if (runnerUp2ProposalId) {
      const prop2 = await Proposal.findById(runnerUp2ProposalId);
      if (prop2) {
        prop2.humanPanelReview = {
          reviewedBy,
          comments: panelRemarks,
          verifiedAt: new Date(),
          finalVerdict: "RUNNER_UP_2",
        };
        await prop2.save();
        backupRunnersUp.push({
          proposalId: prop2._id,
          collegeId: prop2.collegeId || prop2.college,
          rank: 2,
        });
      }
    }

    // 3. Update Issue Custody & Lifecycle Status
    const winCollegeId =
      winningProposal.collegeId?._id ||
      winningProposal.collegeId ||
      winningProposal.college;
    issue.assignedLeadCollege = winCollegeId;
    issue.assignedColleges = [winCollegeId];
    issue.winningProposal = winningProposal._id;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    issue.backupRunnersUp = backupRunnersUp as any;
    issue.status = "ASSIGNED";
    await issue.save();

    // 4. Send Notifications
    await createNotification({
      recipientType: "college",
      recipientId: winCollegeId.toString(),
      message: `🏆 Challenge Awarded: Winning RO - Your institution's proposal for "${issue.title}" has been selected as the Winning RO by the State Human Decision Panel!`,
      relatedIssue: issue._id,
      relatedProposal: winningProposal._id,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully confirmed Winner (${winningProposal.title}) and ${backupRunnersUp.length} backup runners-up!`,
      data: {
        issueId: issue._id,
        status: issue.status,
        winningProposalId: winningProposal._id,
        backupRunnersUpCount: backupRunnersUp.length,
      },
    });
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error ? error.message : "Failed to finalize evaluation";
    console.error("POST /api/proposals/evaluate error:", error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 },
    );
  }
}
