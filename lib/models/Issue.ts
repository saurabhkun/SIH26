import mongoose, { Schema, Document, Model, Types } from "mongoose";
import {
  IssueStatus,
  UrgencyTrack,
  EscalationStage,
  CollegeTier,
  SweetenersConfig,
  DirectNominationInfo,
  L3SubcontractDetail,
  RunnerUpRef,
} from "@/types/civic";
import {
  ISSUE_DOMAINS,
  IssueDomain,
  FACING_SINCE_OPTIONS,
  FacingSince,
  ISSUE_STATUSES,
} from "../constants/domains";

export { ISSUE_DOMAINS, FACING_SINCE_OPTIONS, ISSUE_STATUSES };
export type { IssueDomain, FacingSince, IssueStatus };

export interface IAttachment {
  url: string;
  type: "photo" | "video" | "document";
  filename?: string;
}

export interface IIssue extends Document {
  trackingCode: string;
  title: string;
  description: string;
  domain: string;
  district: string;
  block?: string;
  pincode?: string;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  location?: {
    lat: number;
    lng: number;
  };
  attachments: IAttachment[];
  mediaUrls?: string[];
  severityScore: number;
  aiTags: string[];
  facingSince?: string;
  citizenName: string;
  citizenPhone: string;
  citizenMobile?: string;
  mobileVerified: boolean;
  dedupFingerprint?: string;
  duplicateOf?: Types.ObjectId | null;
  similarIssueIds?: Types.ObjectId[];

  // AI Criticality Detection & Star Triage
  isStarred: boolean;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  aiAnalysisReason?: string;
  suggestedDepartment?: string;

  // Super Admin Triage & Routing
  triageAction?: "pending_super_admin_review" | "accepted" | "rejected" | "assigned_to_govt_dept";
  rejectionReason?: string;
  assignedDepartment?: string;
  maintenanceNotes?: string;
  routingRecommendation?: {
    routingDecision: "GOVT_DEPT" | "GOVT_RO" | "UNIVERSITY_RESEARCH_ORG";
    confidenceScore: number;
    factors: {
      isSensitive: boolean;
      sensitivityLevel: string;
      existingGovtRO: boolean;
      hasDedicatedBudget: boolean;
      govtCapacityStatus: string;
      uniCapabilityScore: number;
      eligibleUniversities: string[];
    };
    rationale: string;
  };

  // Triage & Circuit-Breaker Engine
  urgencyTrack: UrgencyTrack;
  triageRationale?: string;
  disasterNotifiedAt?: Date;
  assignedNodalOfficer?: string;

  // Workflow & Contingency Escalation Ladder
  status: string;
  escalationStage: EscalationStage;
  targetTiers: CollegeTier[];
  biddingDeadline: Date;
  sweeteners: SweetenersConfig;
  directNomination: DirectNominationInfo;

  // Assigned Entity & Subcontracting
  assignedLeadCollege?: Types.ObjectId;
  assignedColleges: Types.ObjectId[];
  subContractedL3?: L3SubcontractDetail;
  winningProposal?: Types.ObjectId;
  backupRunnersUp: RunnerUpRef[];

  reviewedBy?: string;
  submissionIndexForMobile: number;
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>(
  {
    url: { type: String, required: true },
    type: {
      type: String,
      enum: ["photo", "video", "document"],
      required: true,
    },
    filename: { type: String },
  },
  { _id: false },
);

const DirectNominationSchema = new Schema<DirectNominationInfo>(
  {
    collegeId: { type: Schema.Types.ObjectId, ref: "College" },
    collegeName: { type: String },
    nominatedAt: { type: Date },
    status: {
      type: String,
      enum: ["NONE", "PENDING_RO_CONSENT", "ACCEPTED", "DECLINED"],
      default: "NONE",
    },
    rejectionReason: { type: String },
  },
  { _id: false },
);

const SubContractedL3Schema = new Schema<L3SubcontractDetail>(
  {
    collegeId: { type: Schema.Types.ObjectId, ref: "College", required: true },
    collegeName: { type: String },
    type: { type: String, enum: ["L3R", "L3G"], required: true },
    scopeOfWork: [{ type: String }],
    agreedStipend: { type: Number, default: 0 },
    distanceKm: { type: Number },
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "IN_PROGRESS", "COMPLETED"],
      default: "PENDING",
    },
  },
  { _id: false },
);

const RunnerUpSchema = new Schema<RunnerUpRef>(
  {
    proposalId: {
      type: Schema.Types.ObjectId,
      ref: "Proposal",
      required: true,
    },
    collegeId: { type: Schema.Types.ObjectId, ref: "College" },
    collegeName: { type: String },
    rank: { type: Number, enum: [1, 2], required: true },
  },
  { _id: false },
);

const IssueSchema = new Schema<IIssue>(
  {
    trackingCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    domain: { type: String, required: true, trim: true, index: true },
    district: { type: String, required: true, trim: true, index: true },
    block: { type: String, trim: true },
    pincode: { type: String, trim: true },
    address: { type: String, trim: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    attachments: { type: [AttachmentSchema], default: [] },
    mediaUrls: [{ type: String }],
    severityScore: { type: Number, min: 1, max: 100, default: 45 },
    aiTags: { type: [String], default: [] },
    facingSince: { type: String, default: "1_to_3_months" },
    citizenName: { type: String, required: true, trim: true },
    citizenPhone: { type: String, default: "9876543210", trim: true },
    citizenMobile: { type: String, trim: true },
    mobileVerified: { type: Boolean, default: false },
    dedupFingerprint: { type: String, index: true },
    duplicateOf: { type: Schema.Types.ObjectId, ref: "Issue", default: null },
    similarIssueIds: [{ type: Schema.Types.ObjectId, ref: "Issue" }],

    // AI Criticality Detection & Star Triage
    isStarred: { type: Boolean, default: false, index: true },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
      index: true,
    },
    aiAnalysisReason: { type: String, default: "" },
    suggestedDepartment: { type: String, default: "Higher & Technical Education" },

    // Super Admin Triage & Lifecycle Routing
    triageAction: {
      type: String,
      enum: ["pending_super_admin_review", "accepted", "rejected", "assigned_to_govt_dept"],
      default: "pending_super_admin_review",
      index: true,
    },
    rejectionReason: { type: String, default: "" },
    assignedDepartment: { type: String, default: "" },
    maintenanceNotes: { type: String, default: "" },
    routingRecommendation: {
      routingDecision: {
        type: String,
        enum: ["GOVT_DEPT", "GOVT_RO", "UNIVERSITY_RESEARCH_ORG"],
      },
      confidenceScore: { type: Number },
      factors: {
        isSensitive: { type: Boolean },
        sensitivityLevel: { type: String },
        existingGovtRO: { type: Boolean },
        hasDedicatedBudget: { type: Boolean },
        govtCapacityStatus: { type: String },
        uniCapabilityScore: { type: Number },
        eligibleUniversities: [{ type: String }],
      },
      rationale: { type: String },
    },

    // Triage & Circuit Breaker
    urgencyTrack: {
      type: String,
      enum: [
        "DISASTER_FAST_TRACK",
        "TRADITIONAL_GOVT_GRIEVANCE",
        "RO_INNOVATION_PIPELINE",
      ],
      default: "RO_INNOVATION_PIPELINE",
      index: true,
    },
    triageRationale: { type: String },
    disasterNotifiedAt: { type: Date },
    assignedNodalOfficer: { type: String },

    // Workflow & Escalation Engine
    status: {
      type: String,
      default: "OPEN_FOR_BIDDING",
      index: true,
    },
    escalationStage: {
      type: Number,
      enum: [1, 2, 3, 4, 5],
      default: 1,
      index: true,
    },
    targetTiers: {
      type: [String],
      enum: ["L1", "L2", "L3R", "L3G"],
      default: ["L1"],
    },
    biddingDeadline: {
      type: Date,
      default: () => new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      index: true,
    },
    sweeteners: {
      priorityFunding: { type: Boolean, default: false },
      stateBonusPoints: { type: Number, default: 0 },
      fastTrackApproval: { type: Boolean, default: false },
    },
    directNomination: {
      type: DirectNominationSchema,
      default: () => ({ status: "NONE" }),
    },

    // Assigned Entity & Subcontracting
    assignedLeadCollege: { type: Schema.Types.ObjectId, ref: "College" },
    assignedColleges: [{ type: Schema.Types.ObjectId, ref: "College" }],
    subContractedL3: { type: SubContractedL3Schema },
    winningProposal: { type: Schema.Types.ObjectId, ref: "Proposal" },
    backupRunnersUp: { type: [RunnerUpSchema], default: [] },

    reviewedBy: { type: String },
    submissionIndexForMobile: { type: Number, default: 1 },
  },
  {
    timestamps: true,
  },
);

// High-speed compound indexes for query execution
IssueSchema.index({ district: 1, status: 1 });
IssueSchema.index({ escalationStage: 1, biddingDeadline: 1 });
IssueSchema.index({ urgencyTrack: 1, createdAt: -1 });

const Issue: Model<IIssue> =
  mongoose.models.Issue || mongoose.model<IIssue>("Issue", IssueSchema);

export default Issue;
