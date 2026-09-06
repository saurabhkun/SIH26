import mongoose, { Schema, Document, Model } from "mongoose";
import { PLEDGE_STATUSES, PledgeStatus } from "../constants/domains";

export { PLEDGE_STATUSES };
export type { PledgeStatus };

export interface IIndustryPledge extends Document {
  proposal: mongoose.Types.ObjectId;
  organizationName: string;
  contactEmail: string;
  isCSR: boolean;
  amountPledged: number;
  amountReleased: number;
  status: PledgeStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  mentorshipOffered: boolean;
  mentorshipNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const IndustryPledgeSchema = new Schema<IIndustryPledge>(
  {
    proposal: {
      type: Schema.Types.ObjectId,
      ref: "Proposal",
      required: true,
      index: true,
    },
    organizationName: { type: String, required: true, trim: true },
    contactEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    isCSR: { type: Boolean, default: false },
    amountPledged: { type: Number, required: true, min: 0 },
    amountReleased: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: PLEDGE_STATUSES,
      default: "Pledged",
    },
    razorpayOrderId: { type: String, trim: true },
    razorpayPaymentId: { type: String, trim: true },
    razorpaySignature: { type: String, trim: true },
    mentorshipOffered: { type: Boolean, default: false },
    mentorshipNotes: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

const IndustryPledge: Model<IIndustryPledge> =
  mongoose.models.IndustryPledge ||
  mongoose.model<IIndustryPledge>("IndustryPledge", IndustryPledgeSchema);

export default IndustryPledge;
