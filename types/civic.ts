import { Types } from "mongoose";

export type UrgencyTrack =
  | "DISASTER_FAST_TRACK"
  | "TRADITIONAL_GOVT_GRIEVANCE"
  | "RO_INNOVATION_PIPELINE";

export type EscalationStage = 1 | 2 | 3 | 4 | 5;

export type CollegeTier = "L1" | "L2" | "L3R" | "L3G";

export type ProposalStanding =
  | "SUBMITTED"
  | "AI_RANKED"
  | "WINNER"
  | "RUNNER_UP_1"
  | "RUNNER_UP_2"
  | "REJECTED"
  | "PROMOTED_FROM_RUNNER_UP";

export type DirectAssignmentStatus =
  "NONE" | "PENDING_RO_CONSENT" | "ACCEPTED" | "DECLINED";

export type IssueStatus =
  | "REPORTED"
  | "TRIAGED"
  | "OPEN_FOR_BIDDING"
  | "EVALUATION"
  | "ASSIGNED"
  | "FIELD_EXECUTION"
  | "RESOLVED"
  | "ESCALATED_TO_GOVT"
  // Legacy / UI friendly aliases:
  | "Under_Review"
  | "Assigned_HEI"
  | "Proposal_Submitted"
  | "Under_Prototyping"
  | "Industry_Funded"
  | "Resolved";

export interface ProjectMilestone {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  payoutPercentage: number;
  status:
    | "PENDING"
    | "SUBMITTED"
    | "VERIFIED"
    | "DISBURSED"
    | "In_Progress"
    | "Completed"
    | "Pending"
    | "Delayed"
    | (string & {});
  proofUrls?: string[];
  fundingReleased?: boolean;
  fundingReleaseAmount?: number;
  submissionRemarks?: string;
  completedAt?: Date | string;
}

export interface AIEvaluationBreakdown {
  feasibilityScore: number; // 0 - 30
  resourceMatchScore: number; // 0 - 30
  trackRecordScore: number; // 0 - 20
  noveltyScore: number; // 0 - 20
  compositeScore: number; // 0 - 100
  reasoningSummary: string;
}

export interface HumanPanelReview {
  reviewedBy: string;
  comments: string;
  verifiedAt: Date | string;
  finalVerdict: ProposalStanding;
}

export interface SweetenersConfig {
  priorityFunding: boolean;
  stateBonusPoints: number;
  fastTrackApproval: boolean;
}

export interface DirectNominationInfo {
  collegeId?: Types.ObjectId | string;
  collegeName?: string;
  nominatedAt?: Date | string;
  status: DirectAssignmentStatus;
  rejectionReason?: string;
}

export interface L3SubcontractDetail {
  collegeId: Types.ObjectId | string;
  collegeName?: string;
  type: "L3R" | "L3G";
  scopeOfWork: string[];
  agreedStipend: number;
  distanceKm?: number;
  status?: "PENDING" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED";
}

export interface RunnerUpRef {
  proposalId: Types.ObjectId | string;
  collegeId?: Types.ObjectId | string;
  collegeName?: string;
  rank: 1 | 2;
}

export interface TriageResult {
  urgencyTrack: UrgencyTrack;
  hazardSeverity: number;
  rationale: string;
  assignedNodalOfficer?: string;
  recommendedDepartment?: string;
}
