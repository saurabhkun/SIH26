/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Schema, Document, Model, Types } from "mongoose";
import {
  ProjectMilestone,
  AIEvaluationBreakdown,
  HumanPanelReview,
} from "@/types/civic";
import {
  PROPOSAL_STATUSES,
  ProposalStatus,
  MILESTONE_STATUSES,
  MilestoneStatus,
} from "../constants/domains";

export { PROPOSAL_STATUSES, MILESTONE_STATUSES };
export type { ProposalStatus, MilestoneStatus };

export type IMilestone = ProjectMilestone & {
  dueDate?: Date | string;
  fundingReleaseAmount?: number;
  fundingReleased?: boolean;
};

export interface ITeamMember {
  name: string;
  role: string;
  discipline?: string;
  specialization?: string;
}

export interface IOutcomes {
  patentFiled: boolean;
  patentDetails?: string;
  startupCreated: boolean;
  deployed: boolean;
  impactSummary?: string;
  thirdPartyAudit?: any;
}

export interface IProposal extends Document {
  issueId: Types.ObjectId;
  collegeId: Types.ObjectId;
  // Aliases for compatibility
  issue: Types.ObjectId;
  college: Types.ObjectId;

  title: string;
  methodologySummary: string;
  technicalScope: string;
  estimatedCost: number;
  budgetRequested: number;

  facultyLead: {
    name: string;
    email: string;
    specialization: string;
    designation?: string;
  };
  studentTeamSize: number;
  utilizedLabs: string[];

  milestones: ProjectMilestone[];
  aiEvaluation: AIEvaluationBreakdown;
  humanPanelReview: HumanPanelReview;

  facultyMentor?: string;
  team?: ITeamMember[];
  outcomes?: {
    patentFiled?: boolean;
    patentDetails?: string;
    startupCreated?: boolean;
    deployed?: boolean;
    impactSummary?: string;
    thirdPartyAudit?: any;
  };

  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const MilestoneSchema = new Schema<ProjectMilestone>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    targetDate: { type: String, required: true },
    payoutPercentage: { type: Number, required: true, min: 0, max: 100 },
    status: {
      type: String,
      default: "PENDING",
    },
    proofUrls: [{ type: String }],
    fundingReleased: { type: Boolean, default: false },
    fundingReleaseAmount: { type: Number, default: 0 },
    submissionRemarks: { type: String },
    completedAt: { type: String },
  },
  { _id: false },
);

const ProposalSchema = new Schema<IProposal>(
  {
    issueId: {
      type: Schema.Types.ObjectId,
      ref: "Issue",
      index: true,
      default: function (this: any) {
        return this.issue || null;
      },
    },
    collegeId: {
      type: Schema.Types.ObjectId,
      ref: "College",
      index: true,
      default: function (this: any) {
        return this.college || null;
      },
    },
    issue: {
      type: Schema.Types.ObjectId,
      ref: "Issue",
      default: function (this: any) {
        return this.issueId || null;
      },
    },
    college: {
      type: Schema.Types.ObjectId,
      ref: "College",
      default: function (this: any) {
        return this.collegeId || null;
      },
    },
    title: { type: String, required: true, trim: true },
    methodologySummary: {
      type: String,
      trim: true,
      default: function (this: any) {
        return this.technicalScope || "";
      },
    },
    technicalScope: {
      type: String,
      trim: true,
      default: function (this: any) {
        return this.methodologySummary || "";
      },
    },
    estimatedCost: {
      type: Number,
      min: 0,
      default: function (this: any) {
        return this.budgetRequested || 150000;
      },
    },
    budgetRequested: {
      type: Number,
      min: 0,
      default: function (this: any) {
        return this.estimatedCost || 150000;
      },
    },

    facultyLead: {
      name: {
        type: String,
        trim: true,
        default: function (this: any) {
          return this.facultyMentor || "Principal Investigator";
        },
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
        default: "faculty.lead@institution.ac.in",
      },
      specialization: {
        type: String,
        trim: true,
        default: "Societal Innovation & Technology",
      },
      designation: {
        type: String,
        default: "Principal Investigator / Professor",
      },
    },
    studentTeamSize: { type: Number, default: 4 },
    utilizedLabs: [{ type: String }],

    milestones: { type: [MilestoneSchema], default: [] },

    aiEvaluation: {
      feasibilityScore: { type: Number, default: 24, min: 0, max: 30 },
      resourceMatchScore: { type: Number, default: 26, min: 0, max: 30 },
      trackRecordScore: { type: Number, default: 18, min: 0, max: 20 },
      noveltyScore: { type: Number, default: 16, min: 0, max: 20 },
      compositeScore: { type: Number, default: 84, min: 0, max: 100 },
      reasoningSummary: {
        type: String,
        default:
          "High alignment with regional water testing infrastructure. Verified IoT sensor calibration capabilities and previous on-time delivery rate.",
      },
    },

    humanPanelReview: {
      reviewedBy: { type: String },
      comments: { type: String },
      verifiedAt: { type: Date },
      finalVerdict: {
        type: String,
        enum: [
          "SUBMITTED",
          "AI_RANKED",
          "WINNER",
          "RUNNER_UP_1",
          "RUNNER_UP_2",
          "REJECTED",
          "PROMOTED_FROM_RUNNER_UP",
        ],
        default: "AI_RANKED",
      },
    },

    facultyMentor: { type: String, trim: true },
    team: { type: [Object], default: [] },
    outcomes: {
      type: Object,
      default: () => ({
        patentFiled: false,
        startupCreated: false,
        deployed: false,
      }),
    },

    status: {
      type: String,
      default: "Submitted",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

/* eslint-disable @typescript-eslint/no-explicit-any */
// Synchronize virtual / alias fields before validate and save
const syncFields = function (doc: any) {
  if (doc.issueId && !doc.issue) doc.issue = doc.issueId;
  if (doc.issue && !doc.issueId) doc.issueId = doc.issue;
  if (doc.collegeId && !doc.college) doc.college = doc.collegeId;
  if (doc.college && !doc.collegeId) doc.collegeId = doc.college;
  if (doc.methodologySummary && !doc.technicalScope)
    doc.technicalScope = doc.methodologySummary;
  if (doc.technicalScope && !doc.methodologySummary)
    doc.methodologySummary = doc.technicalScope;
  if (doc.estimatedCost !== undefined && doc.budgetRequested === undefined)
    doc.budgetRequested = doc.estimatedCost;
  if (doc.budgetRequested !== undefined && doc.estimatedCost === undefined)
    doc.estimatedCost = doc.budgetRequested;
  if (!doc.facultyLead || !doc.facultyLead.name) {
    doc.facultyLead = {
      name: doc.facultyMentor || "Principal Investigator",
      email: "mentor@institution.ac.in",
      specialization: "Applied Research & Innovation",
      designation: "Principal Investigator / Professor",
    };
  } else {
    if (!doc.facultyLead.email)
      doc.facultyLead.email = "mentor@institution.ac.in";
    if (!doc.facultyLead.specialization)
      doc.facultyLead.specialization = "Applied Research & Innovation";
    if (!doc.facultyLead.designation)
      doc.facultyLead.designation = "Principal Investigator / Professor";
    if (!doc.facultyLead.name && doc.facultyMentor)
      doc.facultyLead.name = doc.facultyMentor;
  }
  if (!doc.facultyMentor && doc.facultyLead?.name) {
    doc.facultyMentor = doc.facultyLead.name;
  }
};

ProposalSchema.pre("validate", function (this: any) {
  syncFields(this);
});

ProposalSchema.pre("save", function (this: any) {
  syncFields(this);
});

// Indexes
ProposalSchema.index({ issueId: 1, "aiEvaluation.compositeScore": -1 });
ProposalSchema.index({ collegeId: 1, status: 1 });

const Proposal: Model<IProposal> =
  mongoose.models.Proposal ||
  mongoose.model<IProposal>("Proposal", ProposalSchema);

export default Proposal;
