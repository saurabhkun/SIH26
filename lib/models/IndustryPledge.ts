import mongoose, { Schema, Document, Model, Types } from "mongoose";

export const PLEDGE_STATUSES = [
  "Pledged",
  "Escrow_Deposited",
  "Funded",
  "Milestone_Released",
  "Completed",
  "Refunded",
] as const;

export type PledgeStatus = (typeof PLEDGE_STATUSES)[number] | string;

export interface IIndustryPledge extends Document {
  issueId?: Types.ObjectId;
  proposalId?: Types.ObjectId;
  proposal?: Types.ObjectId;
  companyName: string;
  organizationName?: string;
  csrRegistrationNo: string;
  contactEmail?: string;
  isCSR: boolean;
  pledgedAmount: number;
  escrowBalance: number;
  amountPledged?: number;
  amountReleased: number;
  status: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  disbursedMilestones: string[];
  mentorshipOffered: boolean;
  mentorshipNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const IndustryPledgeSchema = new Schema<IIndustryPledge>(
  {
    issueId: {
      type: Schema.Types.ObjectId,
      ref: "Issue",
      index: true,
    },
    proposalId: {
      type: Schema.Types.ObjectId,
      ref: "Proposal",
      index: true,
    },
    proposal: {
      type: Schema.Types.ObjectId,
      ref: "Proposal",
      index: true,
    },
    companyName: { type: String, required: true, trim: true },
    organizationName: { type: String, trim: true },
    csrRegistrationNo: {
      type: String,
      default: "CSR-JH-2026-0988",
      trim: true,
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    isCSR: { type: Boolean, default: true },
    pledgedAmount: { type: Number, required: true, min: 1000 },
    escrowBalance: { type: Number, default: 0, min: 0 },
    amountPledged: { type: Number },
    amountReleased: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      default: "Pledged",
      index: true,
    },
    razorpayOrderId: { type: String, trim: true },
    razorpayPaymentId: { type: String, trim: true },
    razorpaySignature: { type: String, trim: true },
    disbursedMilestones: [{ type: String }],
    mentorshipOffered: { type: Boolean, default: false },
    mentorshipNotes: { type: String, trim: true },
  },
  {
    timestamps: true,
  },
);

/* eslint-disable @typescript-eslint/no-explicit-any */
IndustryPledgeSchema.pre("validate", function (this: any, next) {
  if (this.companyName && !this.organizationName) {
    this.organizationName = this.companyName;
  }
  if (this.organizationName && !this.companyName) {
    this.companyName = this.organizationName;
  }
  if (this.pledgedAmount != null && this.amountPledged == null) {
    this.amountPledged = this.pledgedAmount;
  }
  if (this.amountPledged != null && this.pledgedAmount == null) {
    this.pledgedAmount = this.amountPledged;
  }
  if (this.proposalId && !this.proposal) {
    this.proposal = this.proposalId;
  }
  if (this.proposal && !this.proposalId) {
    this.proposalId = this.proposal;
  }
  if (typeof next === "function") next();
});

IndustryPledgeSchema.pre("save", function (this: any) {
  if (this.companyName && !this.organizationName)
    this.organizationName = this.companyName;
  if (this.organizationName && !this.companyName)
    this.companyName = this.organizationName;
  if (this.pledgedAmount != null && this.amountPledged == null)
    this.amountPledged = this.pledgedAmount;
  if (this.amountPledged != null && this.pledgedAmount == null)
    this.pledgedAmount = this.amountPledged;
  if (this.proposalId && !this.proposal) this.proposal = this.proposalId;
  if (this.proposal && !this.proposalId) this.proposalId = this.proposal;
  if (this.status === "Funded" && this.escrowBalance === 0) {
    this.escrowBalance = this.pledgedAmount;
  }
});

IndustryPledgeSchema.index({ issueId: 1, status: 1 });
IndustryPledgeSchema.index({ proposalId: 1, status: 1 });

const IndustryPledge: Model<IIndustryPledge> =
  mongoose.models.IndustryPledge ||
  mongoose.model<IIndustryPledge>("IndustryPledge", IndustryPledgeSchema);

export default IndustryPledge;
