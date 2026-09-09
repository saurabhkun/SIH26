import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Issue from "@/lib/models/Issue";
import Proposal from "@/lib/models/Proposal";
import College from "@/lib/models/College";
import { getCurrentUser } from "@/lib/auth/session";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * GET /api/gov/ro
 * Fetches:
 * 1. Technical Feasibility Queue (Problems flagged for R&D evaluation)
 * 2. Academic Proposals for evaluation, milestone sign-off & nodal badge verification
 * 3. Bottlenecked / Overdue issues for Stage Escalation Controls
 */
export async function GET() {
  try {
    await connectDB();

    // 1. Feasibility Queue: Issues flagged for R&D or under review
    const feasibilityIssues = await Issue.find({
      $or: [
        { urgencyTrack: "RO_INNOVATION_PIPELINE" },
        { status: { $in: ["Reported", "Under_Review", "OPEN_FOR_BIDDING", "UNDER_FIELD_VERIFICATION", "TRIAGED"] } },
      ],
    })
      .populate("assignedLeadCollege", "name district tier capabilities")
      .sort({ createdAt: -1 })
      .limit(60)
      .lean();

    // 2. HEI Proposals: Academic submissions from universities
    const heiProposals = await Proposal.find({})
      .populate("issue", "title description trackingCode district domain severityScore status urgencyTrack")
      .populate("college", "name district tier capabilities facilities")
      .sort({ createdAt: -1 })
      .limit(60)
      .lean();

    // 3. Bottlenecked / Escalation Issues: Issues with deadlines or staged progression
    const now = new Date();
    const escalationIssues = await Issue.find({
      urgencyTrack: "RO_INNOVATION_PIPELINE",
      status: { $in: ["OPEN_FOR_BIDDING", "TRIAGED", "ESCALATED", "DIRECT_NOMINATED", "STALLED"] },
    })
      .populate("assignedLeadCollege", "name district tier")
      .populate("assignedColleges", "name district tier")
      .sort({ biddingDeadline: 1, createdAt: -1 })
      .limit(60)
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        feasibilityIssues,
        heiProposals,
        escalationIssues,
        metrics: {
          pendingFeasibility: feasibilityIssues.filter((i) => ["Reported", "Under_Review", "TRIAGED"].includes(i.status)).length,
          proposalsAwaitingBadge: heiProposals.filter((p) => !p.humanPanelReview?.verifiedAt).length,
          activeMilestonesInFlight: heiProposals.reduce(
            (sum, p) => sum + (p.milestones?.filter((m) => m.status === "In_Progress" || m.status === "Pending").length || 0),
            0,
          ),
          escalationsRequiringAction: escalationIssues.filter(
            (i) => (i.biddingDeadline && new Date(i.biddingDeadline) < now) || i.escalationStage > 1,
          ).length,
        },
      },
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Failed to fetch RO workspace data";
    console.error("GET /api/gov/ro error:", error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

/**
 * POST /api/gov/ro
 * Handles RO actions:
 * - approve_feasibility
 * - request_field_verification
 * - reject_administrative
 * - sign_off_milestone
 * - issue_nodal_badge
 * - trigger_stage_escalation
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = getCurrentUser();
    const body = await request.json();
    const { action, issueId, proposalId, milestoneIndex, badgeType, remarks, nextStage, targetCollegeId } = body;

    const roOfficerName = user?.name || "Dr. Arvind Kumar (State Research Review Officer)";

    // ─────────────────────────────────────────────────────────────
    // 1. Technical Feasibility Actions
    // ─────────────────────────────────────────────────────────────
    if (action === "approve_feasibility") {
      if (!issueId) return NextResponse.json({ success: false, error: "Missing issueId" }, { status: 400 });

      const issue = await Issue.findById(issueId);
      if (!issue) return NextResponse.json({ success: false, error: "Issue not found" }, { status: 404 });

      issue.urgencyTrack = "RO_INNOVATION_PIPELINE";
      issue.status = "OPEN_FOR_BIDDING";
      issue.escalationStage = 1;
      issue.targetTiers = ["L1", "L2"];
      issue.biddingDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      issue.reviewedBy = roOfficerName;
      issue.triageRationale = remarks || "R&D Technical Feasibility validated by State Research Officer. Opened for multi-tier university consortium bidding.";
      await issue.save();

      if (issue.citizenMobile) {
        await createNotification({
          recipientType: "citizen",
          recipientId: issue.citizenMobile,
          message: `Update on ${issue.trackingCode}: State Research Officer has approved your problem for Academic Innovation & University Bidding.`,
          relatedIssue: issue._id,
        });
      }

      return NextResponse.json({
        success: true,
        message: `Issue ${issue.trackingCode} approved for open university bidding!`,
        data: issue,
      });
    }

    if (action === "request_field_verification") {
      if (!issueId) return NextResponse.json({ success: false, error: "Missing issueId" }, { status: 400 });

      const issue = await Issue.findById(issueId);
      if (!issue) return NextResponse.json({ success: false, error: "Issue not found" }, { status: 404 });

      issue.status = "UNDER_FIELD_VERIFICATION";
      issue.triageRationale = remarks || "Field baseline sampling & geo-tagging requested from District Nodal Technical Officer.";
      issue.reviewedBy = roOfficerName;
      await issue.save();

      return NextResponse.json({
        success: true,
        message: `Field verification requested for ${issue.trackingCode}. Ground technical team notified.`,
        data: issue,
      });
    }

    if (action === "reject_administrative") {
      if (!issueId) return NextResponse.json({ success: false, error: "Missing issueId" }, { status: 400 });

      const issue = await Issue.findById(issueId);
      if (!issue) return NextResponse.json({ success: false, error: "Issue not found" }, { status: 404 });

      issue.urgencyTrack = "TRADITIONAL_GOVT_GRIEVANCE";
      issue.status = "ROUTED_ULB_MUNICIPAL";
      issue.triageRationale = remarks || "Standard municipal / administrative service request. Academic R&D bypassed; routed directly to Urban Local Body (ULB).";
      issue.reviewedBy = roOfficerName;
      await issue.save();

      if (issue.citizenMobile) {
        await createNotification({
          recipientType: "citizen",
          recipientId: issue.citizenMobile,
          message: `Update on ${issue.trackingCode}: Classified as standard municipal civic maintenance; routed directly to Local Municipal Body.`,
          relatedIssue: issue._id,
        });
      }

      return NextResponse.json({
        success: true,
        message: `Issue ${issue.trackingCode} marked as Administrative Maintenance and rerouted to ULB.`,
        data: issue,
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 2. HEI Proposal Milestone Sign-Off & Nodal Badge Actions
    // ─────────────────────────────────────────────────────────────
    if (action === "sign_off_milestone") {
      if (!proposalId || milestoneIndex === undefined) {
        return NextResponse.json({ success: false, error: "Missing proposalId or milestoneIndex" }, { status: 400 });
      }

      const proposal = await Proposal.findById(proposalId);
      if (!proposal) return NextResponse.json({ success: false, error: "Proposal not found" }, { status: 404 });

      if (!proposal.milestones || !proposal.milestones[milestoneIndex]) {
        return NextResponse.json({ success: false, error: "Milestone index out of bounds" }, { status: 400 });
      }

      const m = proposal.milestones[milestoneIndex];
      const newStatus = m.status === "Completed" ? "In_Progress" : "Completed";
      m.status = newStatus;
      if (newStatus === "Completed") {
        m.completedAt = new Date().toISOString();
        m.submissionRemarks = remarks || `Verified & signed off by State Research Officer (${roOfficerName})`;
      }
      proposal.markModified("milestones");
      await proposal.save();

      return NextResponse.json({
        success: true,
        message: `Milestone "${m.title}" status updated to ${newStatus}.`,
        data: proposal,
      });
    }

    if (action === "issue_nodal_badge") {
      if (!proposalId) return NextResponse.json({ success: false, error: "Missing proposalId" }, { status: 400 });

      const proposal = await Proposal.findById(proposalId).populate("collegeId").populate("issueId");
      if (!proposal) return NextResponse.json({ success: false, error: "Proposal not found" }, { status: 404 });

      const badgeName = badgeType || "Govt Nodal R&D Certified";
      const verifiedComments = `[${badgeName}] Officially verified by ${roOfficerName}. Quality check & tech feasibility validated. ${remarks || ""}`;

      proposal.humanPanelReview = {
        reviewedBy: roOfficerName,
        comments: verifiedComments,
        verifiedAt: new Date(),
        finalVerdict: proposal.humanPanelReview?.finalVerdict || "AI_RANKED",
      };
      // Mark as Approved if not already
      if (proposal.status === "Submitted" || proposal.status === "Under_Review") {
        proposal.status = "Approved";
      }
      await proposal.save();

      return NextResponse.json({
        success: true,
        message: `Official Nodal Badge "${badgeName}" issued to ${proposal.title}!`,
        data: proposal,
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 3. Stage Escalation Controls
    // ─────────────────────────────────────────────────────────────
    if (action === "trigger_stage_escalation") {
      if (!issueId) return NextResponse.json({ success: false, error: "Missing issueId" }, { status: 400 });

      const issue = await Issue.findById(issueId);
      if (!issue) return NextResponse.json({ success: false, error: "Issue not found" }, { status: 404 });

      const targetStageNum = Number(nextStage) || (issue.escalationStage < 5 ? issue.escalationStage + 1 : 5);
      issue.escalationStage = targetStageNum as 1 | 2 | 3 | 4 | 5;

      if (targetStageNum === 2) {
        issue.targetTiers = ["L1", "L2"];
        issue.status = "OPEN_FOR_BIDDING";
        issue.sweeteners = {
          priorityFunding: true,
          stateBonusPoints: 10,
          fastTrackApproval: false,
        };
        issue.biddingDeadline = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
        issue.triageRationale = `Stage 2 Escalation: Bidding pool expanded to Tier L2 colleges with State Bonus Points (+10) and Priority Funding.`;
      } else if (targetStageNum === 3) {
        issue.status = "DIRECT_NOMINATED";
        issue.sweeteners = {
          priorityFunding: true,
          stateBonusPoints: 20,
          fastTrackApproval: true,
        };
        if (targetCollegeId) {
          const col = await College.findById(targetCollegeId);
          issue.directNomination = {
            collegeId: col?._id,
            collegeName: col?.name || "Directly Nominated State University",
            nominatedAt: new Date(),
            status: "PENDING_RO_CONSENT",
          };
        }
        issue.triageRationale = `Stage 3 Escalation: Direct Institutional Nomination with Fast-Track CSR Escrow guarantee.`;
      } else if (targetStageNum === 4) {
        issue.status = "EMERGENCY_ALLOCATION";
        issue.triageRationale = `Stage 4 Escalation: State Emergency R&D Taskforce appointed.`;
      } else if (targetStageNum === 5) {
        issue.status = "STAGE_5_EGRESS_PUBLIC_WORKS";
        issue.urgencyTrack = "TRADITIONAL_GOVT_GRIEVANCE";
        issue.triageRationale = `Stage 5 Egress: Challenge has exited the academic pipeline and transitioned directly to State Public Works Department for civil engineering procurement.`;
      }

      await issue.save();

      return NextResponse.json({
        success: true,
        message: `Issue ${issue.trackingCode} escalated to Stage ${targetStageNum}!`,
        data: issue,
      });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Failed to execute RO action";
    console.error("POST /api/gov/ro error:", error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
