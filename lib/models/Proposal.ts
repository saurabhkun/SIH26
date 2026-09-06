import mongoose, { Schema, Document, Model } from "mongoose";
import {
  PROPOSAL_STATUSES,
  ProposalStatus,
  MILESTONE_STATUSES,
  MilestoneStatus,
} from "../constants/domains";

export { PROPOSAL_STATUSES, MILESTONE_STATUSES };
export type { ProposalStatus, MilestoneStatus };

export interface ITeamMember {
  name: string;
  role: string;
  discipline: string;
}

export interface IMilestone {
  title: string;
  description: string;
  dueDate: Date;
  status: MilestoneStatus;
  completedAt?: Date;
  fundingReleaseAmount: number;
  fundingReleased: boolean;
}

export interface IOutcomes {
  patentFiled: boolean;
  patentDetails?: string;
  startupCreated: boolean;
  deployed: boolean;
  impactSummary?: string;
}

export interface IProposal extends Document {
  issue: mongoose.Types.ObjectId;
  college: mongoose.Types.ObjectId;
  title: string;
  technicalScope: string;
  budgetRequested: number;
  facultyMentor: string;
  team: ITeamMember[];
  milestones: IMilestone[];
  status: ProposalStatus;
  outcomes: IOutcomes;
  createdAt: Date;
  updatedAt: Date;
}

const TeamMemberSchema = new Schema<ITeamMember>(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    discipline: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const MilestoneSchema = new Schema<IMilestone>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: MILESTONE_STATUSES,
      default: "Pending",
    },
    completedAt: { type: Date },
    fundingReleaseAmount: { type: Number, required: true, min: 0 },
    fundingReleased: { type: Boolean, default: false },
  },
  { _id: false }
);

const OutcomeSchema = new Schema<IOutcomes>(
  {
    patentFiled: { type: Boolean, default: false },
    patentDetails: { type: String, trim: true },
    startupCreated: { type: Boolean, default: false },
    deployed: { type: Boolean, default: false },
    impactSummary: { type: String, trim: true },
  },
  { _id: false }
);

const ProposalSchema = new Schema<IProposal>(
  {
    issue: {
      type: Schema.Types.ObjectId,
      ref: "Issue",
      required: true,
    },
    college: {
      type: Schema.Types.ObjectId,
      ref: "College",
      required: true,
    },
    title: { type: String, required: true, trim: true },
    technicalScope: { type: String, required: true, trim: true },
    budgetRequested: { type: Number, required: true, min: 0 },
    facultyMentor: { type: String, required: true, trim: true },
    team: { type: [TeamMemberSchema], default: [] },
    milestones: { type: [MilestoneSchema], default: [] },
    status: {
      type: String,
      enum: PROPOSAL_STATUSES,
      default: "Submitted",
    },
    outcomes: {
      type: OutcomeSchema,
      default: () => ({
        patentFiled: false,
        startupCreated: false,
        deployed: false,
      }),
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ProposalSchema.index({ issue: 1 });
ProposalSchema.index({ college: 1, status: 1 });

const Proposal: Model<IProposal> =
  mongoose.models.Proposal ||
  mongoose.model<IProposal>("Proposal", ProposalSchema);

export default Proposal;
