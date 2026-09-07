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
  { _id: false }
);

const ProposalSchema = new Schema<IProposal>(
  {
    issueId: {
      type: Schema.Types.ObjectId,
      ref: "Issue",
      required: true,
      index: true,
    },
    collegeId: {
      type: Schema.Types.ObjectId,
      ref: "College",
      required: true,
      index: true,
    },
    issue: {
      type: Schema.Types.ObjectId,
      ref: "Issue",
    },
    college: {
      type: Schema.Types.ObjectId,
      ref: "College",
    },
    title: { type: String, required: true, trim: true },
    methodologySummary: { type: String, required: true, trim: true },
    technicalScope: { type: String, trim: true },
    estimatedCost: { type: Number, required: true, min: 0 },
    budgetRequested: { type: Number, default: 0 },

    facultyLead: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
      specialization: { type: String, required: true, trim: true },
      designation: { type: String, default: "Principal Investigator / Professor" },
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
  }
);

/* eslint-disable @typescript-eslint/no-explicit-any */
// Synchronize virtual / alias fields before save
ProposalSchema.pre("save", function (this: any) {
  if (this.issueId && !this.issue) this.issue = this.issueId;
  if (this.issue && !this.issueId) this.issueId = this.issue;
  if (this.collegeId && !this.college) this.college = this.collegeId;
  if (this.college && !this.collegeId) this.collegeId = this.college;
  if (this.methodologySummary && !this.technicalScope) this.technicalScope = this.methodologySummary;
  if (this.technicalScope && !this.methodologySummary) this.methodologySummary = this.technicalScope;
  if (this.estimatedCost && !this.budgetRequested) this.budgetRequested = this.estimatedCost;
  if (this.budgetRequested && !this.estimatedCost) this.estimatedCost = this.budgetRequested;
  if (this.facultyMentor && (!this.facultyLead || !this.facultyLead.name)) {
    this.facultyLead = {
      name: this.facultyMentor,
      email: "mentor@institution.ac.in",
      specialization: "Principal Investigator",
      designation: "Professor & Lead",
    };
  }
});

// Indexes
ProposalSchema.index({ issueId: 1, "aiEvaluation.compositeScore": -1 });
ProposalSchema.index({ collegeId: 1, status: 1 });

const Proposal: Model<IProposal> =
  mongoose.models.Proposal ||
  mongoose.model<IProposal>("Proposal", ProposalSchema);

export default Proposal;
