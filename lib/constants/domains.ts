export const ISSUE_DOMAINS = [
  "Education",
  "Healthcare",
  "Agriculture",
  "Water Resources",
  "Sanitation",
  "Environment",
  "Energy",
  "Urban Development",
  "Rural Livelihoods",
  "Accessibility",
  "Public Administration",
] as const;

export type IssueDomain = (typeof ISSUE_DOMAINS)[number];

export const FACING_SINCE_OPTIONS = [
  "<1 month",
  "1-6 months",
  "6-12 months",
  "1+ years",
] as const;

export type FacingSince = (typeof FACING_SINCE_OPTIONS)[number];

export const ISSUE_STATUSES = [
  "Reported",
  "Under_Review",
  "Duplicate",
  "Rejected",
  "Assigned_HEI",
  "Proposal_Submitted",
  "Under_Prototyping",
  "Industry_Funded",
  "Resolved",
] as const;

export type IssueStatus = (typeof ISSUE_STATUSES)[number];

export const COLLEGE_TIERS = ["L1", "L2", "L3"] as const;
export type CollegeTier = (typeof COLLEGE_TIERS)[number];

export const PROPOSAL_STATUSES = [
  "Submitted",
  "Under_Government_Review",
  "Approved",
  "In_Progress",
  "Testing",
  "Completed",
  "Rejected",
] as const;

export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export const MILESTONE_STATUSES = [
  "Pending",
  "In_Progress",
  "Completed",
  "Delayed",
] as const;

export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

export const PLEDGE_STATUSES = [
  "Pledged",
  "Payment_Processing",
  "Funded",
  "Milestone_Released",
  "Completed",
  "Withdrawn",
] as const;

export type PledgeStatus = (typeof PLEDGE_STATUSES)[number];
