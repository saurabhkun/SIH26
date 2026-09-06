import mongoose, { Schema, Document, Model } from "mongoose";
import {
  ISSUE_DOMAINS,
  IssueDomain,
  FACING_SINCE_OPTIONS,
  FacingSince,
  ISSUE_STATUSES,
  IssueStatus,
} from "../constants/domains";

export { ISSUE_DOMAINS, FACING_SINCE_OPTIONS, ISSUE_STATUSES };
export type { IssueDomain, FacingSince, IssueStatus };

export interface IAttachment {
  url: string;
  type: "photo" | "video" | "document";
  filename?: string;
}

export interface IIssue extends Document {
  title: string;
  description: string;
  attachments: IAttachment[];
  domain: IssueDomain;
  severityScore: number;
  aiTags: string[];
  district: string;
  pincode?: string;
  address?: string;
  location?: {
    lat: number;
    lng: number;
  };
  facingSince: FacingSince;
  citizenName: string;
  citizenMobile: string;
  mobileVerified: boolean;
  trackingCode: string;
  dedupFingerprint?: string;
  duplicateOf?: mongoose.Types.ObjectId | null;
  similarIssueIds: mongoose.Types.ObjectId[];
  status: IssueStatus;
  assignedColleges: mongoose.Types.ObjectId[];
  reviewedBy?: string;
  submissionIndexForMobile: number;
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>(
  {
    url: { type: String, required: true },
    type: { type: String, enum: ["photo", "video", "document"], required: true },
    filename: { type: String },
  },
  { _id: false }
);

const IssueSchema = new Schema<IIssue>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    attachments: { type: [AttachmentSchema], default: [] },
    domain: {
      type: String,
      enum: ISSUE_DOMAINS,
      required: true,
    },
    severityScore: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },
    aiTags: { type: [String], default: [] },
    district: { type: String, required: true, trim: true },
    pincode: { type: String, trim: true },
    address: { type: String, trim: true },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    facingSince: {
      type: String,
      enum: FACING_SINCE_OPTIONS,
      required: true,
    },
    citizenName: { type: String, required: true, trim: true },
    citizenMobile: { type: String, required: true, trim: true },
    mobileVerified: { type: Boolean, default: false },
    trackingCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    dedupFingerprint: { type: String, index: true },
    duplicateOf: {
      type: Schema.Types.ObjectId,
      ref: "Issue",
      default: null,
    },
    similarIssueIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Issue",
      },
    ],
    status: {
      type: String,
      enum: ISSUE_STATUSES,
      default: "Reported",
    },
    assignedColleges: [
      {
        type: Schema.Types.ObjectId,
        ref: "College",
      },
    ],
    reviewedBy: { type: String },
    submissionIndexForMobile: { type: Number, default: 1 },
  },
  {
    timestamps: true,
  }
);

// Compound and single field indexes
IssueSchema.index({ district: 1, status: 1 });
IssueSchema.index({ domain: 1 });
IssueSchema.index({ citizenMobile: 1 });

const Issue: Model<IIssue> =
  mongoose.models.Issue || mongoose.model<IIssue>("Issue", IssueSchema);

export default Issue;
