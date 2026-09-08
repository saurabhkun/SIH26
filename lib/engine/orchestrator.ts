import { Types } from "mongoose";
import Issue from "@/lib/models/Issue";
import College, { ICollege } from "@/lib/models/College";
import Proposal from "@/lib/models/Proposal";
import { TriageResult, EscalationStage } from "@/types/civic";
import { createNotification } from "@/lib/notifications";

const DISASTER_KEYWORDS = [
  "bridge collapse",
  "flash flood",
  "chemical leak",
  "gas leak",
  "dam crack",
  "mine cave-in",
  "toxic effluent",
  "epidemic",
  "electrocution",
  "landslide",
  "severe contamination",
];

const MUNICIPAL_KEYWORDS = [
  "pothole",
  "street light",
  "garbage bin",
  "drain clog",
  "sweeping",
  "broken bench",
  "stray cattle",
  "manhole lid",
];

/**
 * 1. Automated AI Scan & Triage Routing (Circuit-Breaker Pattern)
 */
export function runTriageCircuitBreaker(issueData: {
  title: string;
  description: string;
  domain: string;
  severityScore?: number;
  district: string;
}): TriageResult {
  const text = `${issueData.title} ${issueData.description}`.toLowerCase();
  const severity = issueData.severityScore ?? 45;

  // Track A: Critical Disaster / Hazard
  const hasDisasterKeyword = DISASTER_KEYWORDS.some((kw) => text.includes(kw));
  if (severity >= 85 || hasDisasterKeyword) {
    return {
      urgencyTrack: "DISASTER_FAST_TRACK",
      hazardSeverity: Math.max(severity, 92),
      rationale: `Emergency Circuit-Breaker Triggered: Critical public safety risk detected (${hasDisasterKeyword ? "High-Hazard Signature" : "Severity Index >= 85"}). Academic bidding bypassed; routed directly to DM Emergency Response Desk.`,
      assignedNodalOfficer: `District Magistrate & Disaster Response Cell, ${issueData.district}`,
    };
  }

  // Track B: Routine Municipal Grievance
  const hasMunicipalKeyword = MUNICIPAL_KEYWORDS.some((kw) =>
    text.includes(kw),
  );
  if (severity < 40 && hasMunicipalKeyword) {
    return {
      urgencyTrack: "TRADITIONAL_GOVT_GRIEVANCE",
      hazardSeverity: severity,
      rationale:
        "Routine Municipal Maintenance: Standard municipal service request. Academic R&D bypassed; routed to Local Urban Body (ULB) / Municipal Works.",
      recommendedDepartment: "Urban Development & Municipal Administration",
    };
  }

  // Track C: Societal S&T Innovation Challenge
  return {
    urgencyTrack: "RO_INNOVATION_PIPELINE",
    hazardSeverity: severity,
    rationale:
      "Grassroots S&T Challenge: Complex structural/engineering problem requiring university research organization intervention and CSR co-funding.",
  };
}

/**
 * 2. Evaluate Bidding Window (Countdown check & Stage 2 -> Stage 3 Escalation)
 */
export async function evaluateBiddingWindow(
  issueId: string | Types.ObjectId,
): Promise<{
  success: boolean;
  stage: EscalationStage;
  bidsCount: number;
  message: string;
}> {
  const issue = await Issue.findById(issueId);
  if (!issue) throw new Error("Issue record not found");

  const bidsCount = await Proposal.countDocuments({
    $or: [{ issueId: issue._id }, { issue: issue._id }],
  });

  // Stage 1 -> Stage 2: Bids exist, advance to panel evaluation
  if (bidsCount > 0) {
    issue.escalationStage = 2;
    issue.status = "EVALUATION";
    await issue.save();

    await createNotification({
      recipientType: "gov",
      recipientId: "gov_admin_nodal",
      message: `Bidding Window Closed: ${bidsCount} institutional proposals received for "${issue.title}". Ready for Human Panel Evaluation.`,
      relatedIssue: issue._id,
    });

    return {
      success: true,
      stage: 2,
      bidsCount,
      message: `${bidsCount} proposals received. Challenge moved to Stage 2 (Human Panel Evaluation).`,
    };
  }

  // Zero bids -> Escalate to Stage 3: Spectrum Expansion + Sweeteners
  issue.escalationStage = 3;
  issue.status = "OPEN_FOR_BIDDING";
  issue.targetTiers = ["L1", "L2"];
  issue.sweeteners = {
    priorityFunding: true,
    stateBonusPoints: 15,
    fastTrackApproval: true,
  };
  issue.biddingDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // +7 days
  await issue.save();

  await createNotification({
    recipientType: "college",
    recipientId: "all_eligible_colleges",
    message: `⚡ Stage 3 Sweeteners Attached: Eligibility widened to L1 + L2 for "${issue.title}" with Priority CSR Funding & +15 State Points.`,
    relatedIssue: issue._id,
  });

  return {
    success: true,
    stage: 3,
    bidsCount: 0,
    message:
      "Zero bids received in initial window. Escalated to Stage 3: Spectrum broadened to L1+L2 with Priority CSR Sweeteners (+7 day deadline extension).",
  };
}

/**
 * 3. Stage 4: Expert Direct Selection & Nomination
 */
export async function handleDirectNomination(
  issueId: string | Types.ObjectId,
  targetCollegeId: string | Types.ObjectId,
): Promise<{ success: boolean; nominatedCollege: string; message: string }> {
  const [issue, college] = await Promise.all([
    Issue.findById(issueId),
    College.findById(targetCollegeId),
  ]);

  if (!issue) throw new Error("Issue not found");
  if (!college) throw new Error("Target College not found");

  issue.escalationStage = 4;
  issue.directNomination = {
    collegeId: college._id,
    collegeName: college.name,
    nominatedAt: new Date(),
    status: "PENDING_RO_CONSENT",
  };
  await issue.save();

  await createNotification({
    recipientType: "college",
    recipientId: college._id.toString(),
    message: `🏛️ Direct Nomination (Stage 4): State Domain Expert has directly nominated ${college.name} to lead "${issue.title}". Action required: Accept or Decline.`,
    relatedIssue: issue._id,
  });

  return {
    success: true,
    nominatedCollege: college.name,
    message: `Successfully nominated ${college.name}. Awaiting institutional consent.`,
  };
}

/**
 * 4. Respond to Direct Nomination Consent Loop
 */
export async function respondToNomination(
  issueId: string | Types.ObjectId,
  accepted: boolean,
  reason?: string,
): Promise<{ success: boolean; newStatus: string; message: string }> {
  const issue = await Issue.findById(issueId);
  if (!issue || !issue.directNomination?.collegeId) {
    throw new Error("No active direct nomination found on this issue");
  }

  const collegeId = issue.directNomination.collegeId;

  if (accepted) {
    // RO Accepts -> Project transitions to Assigned
    issue.directNomination.status = "ACCEPTED";
    issue.assignedLeadCollege = collegeId as Types.ObjectId;
    issue.assignedColleges = [collegeId as Types.ObjectId];
    issue.status = "ASSIGNED";
    await issue.save();

    await createNotification({
      recipientType: "gov",
      recipientId: "gov_admin_nodal",
      message: `Direct Assignment Accepted: ${issue.directNomination.collegeName || "Nominated RO"} has accepted lead custody of "${issue.title}".`,
      relatedIssue: issue._id,
    });

    return {
      success: true,
      newStatus: "ASSIGNED",
      message:
        "Direct nomination accepted. Challenge is now officially Assigned to the lead RO.",
    };
  }

  // RO Declines -> Stage 5: RO Pipeline Egress / Executive Escalation
  issue.directNomination.status = "DECLINED";
  issue.directNomination.rejectionReason = reason || "Capacity constraint";
  issue.escalationStage = 5;
  issue.status = "ESCALATED_TO_GOVT";
  await issue.save();

  await createNotification({
    recipientType: "gov",
    recipientId: "gov_admin_nodal",
    message: `🚨 Stage 5 Egress: Challenge "${issue.title}" has exited the academic pipeline and transitioned to Public Works for direct civil procurement.`,
    relatedIssue: issue._id,
  });

  return {
    success: true,
    newStatus: "ESCALATED_TO_GOVT",
    message:
      "Nomination declined. Challenge has exited the RO academic pipeline (Stage 5 Egress) and transferred to the State Public Works Department.",
  };
}

/**
 * 5. Handle Lead Dropout & Automatic Runner-Up Custody Cascading
 */
export async function handleLeadDropout(
  issueId: string | Types.ObjectId,
  breachReason?: string,
): Promise<{
  success: boolean;
  promotedCollegeName?: string;
  remainingRunnersUp: number;
  message: string;
}> {
  const issue = await Issue.findById(issueId)
    .populate("assignedLeadCollege")
    .populate("backupRunnersUp.proposalId");

  if (!issue) throw new Error("Issue not found");

  const formerLeadName =
    (issue.assignedLeadCollege as unknown as ICollege)?.name ||
    "Lead Institution";

  // Check if designated runners-up exist in custody backup queue
  if (issue.backupRunnersUp && issue.backupRunnersUp.length > 0) {
    const nextInLine = issue.backupRunnersUp[0];
    const winningProposal = await Proposal.findById(
      nextInLine.proposalId,
    ).populate("collegeId");

    if (winningProposal && winningProposal.collegeId) {
      const newLeadCollege = winningProposal.collegeId as unknown as ICollege;

      // Update proposal standings
      await Proposal.findByIdAndUpdate(issue.winningProposal, {
        "humanPanelReview.finalVerdict": "REJECTED",
        status: "Dropped_Out",
      });

      winningProposal.humanPanelReview.finalVerdict = "PROMOTED_FROM_RUNNER_UP";
      winningProposal.status = "Approved";
      await winningProposal.save();

      // Transfer custody to Runner-Up #1
      issue.assignedLeadCollege = newLeadCollege._id;
      issue.assignedColleges = [newLeadCollege._id];
      issue.winningProposal = winningProposal._id;
      issue.backupRunnersUp.shift(); // Remove the promoted runner-up
      issue.status = "ASSIGNED";
      await issue.save();

      await createNotification({
        recipientType: "college",
        recipientId: newLeadCollege._id.toString(),
        message: `🎯 Promoted to Lead RO: Due to lead transition on "${issue.title}", custody has cascaded to your institution as Designated Runner-Up #1.`,
        relatedIssue: issue._id,
      });

      await createNotification({
        recipientType: "gov",
        recipientId: "gov_admin_nodal",
        message: `Custody Cascade Complete: Custody of "${issue.title}" automatically transferred from ${formerLeadName} to Runner-Up #1 (${newLeadCollege.name}). Reason: ${breachReason || "Performance / Dropout"}.`,
        relatedIssue: issue._id,
      });

      return {
        success: true,
        promotedCollegeName: newLeadCollege.name,
        remainingRunnersUp: issue.backupRunnersUp.length,
        message: `Lead custody automatically cascaded to Runner-Up #1 (${newLeadCollege.name}) without resetting the bidding pipeline.`,
      };
    }
  }

  // If no runners-up available, escalate to Stage 4 direct nomination or Stage 5 egress
  issue.escalationStage = 5;
  issue.status = "ESCALATED_TO_GOVT";
  await issue.save();

  return {
    success: false,
    remainingRunnersUp: 0,
    message:
      "No backup runners-up remained in the queue. Challenge has escalated to Stage 5 (Government Direct Civil Works).",
  };
}
