import mongoose, { Schema, Document, Model } from "mongoose";

export type NotificationType =
  | "CIRCUIT_BREAKER_DISASTER" // Immediate DM & Nodal alert
  | "PROPOSAL_SUBMITTED" // RO submitted a bid
  | "PANEL_DECISION" // Selected as Winner or Runner-Up
  | "RUNNER_UP_PROMOTED" // Primary lead dropped; backup activated
  | "UNCLAIMED_ESCALATION_STAGE" // Problem moved to Stage 3 or 4
  | "DIRECT_NOMINATION_REQUEST" // RO received mandatory direct draft offer
  | "L3_SUBCONTRACT_INVITE" // L1/L2 lead invited an L3 institution
  | "CSR_PLEDGE_RECEIVED" // Industry escrow deposit recorded
  | "MILESTONE_PAYOUT_RELEASED" // Govt verified and released funds
  | "CITIZEN_STATUS_UPDATE"; // Ground resolution progress alert

export type RecipientRole = "GOV" | "RO" | "INDUSTRY" | "CITIZEN" | "ALL";
export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

export interface INotification extends Document {
  recipientId?: mongoose.Types.ObjectId | string; // Empty if broadcast
  recipientRole: RecipientRole;
  recipientPhone?: string; // For citizen SMS alerts simulation
  relatedIssueId?: mongoose.Types.ObjectId;
  relatedProposalId?: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  read: boolean;
  actionUrl?: string; // Direct link to dashboard panel/issue
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientId: { type: Schema.Types.Mixed, index: true },
    recipientRole: {
      type: String,
      enum: [
        "GOV",
        "RO",
        "INDUSTRY",
        "CITIZEN",
        "ALL",
        "gov",
        "college",
        "industry",
        "citizen",
        "all",
      ],
      required: true,
      index: true,
    },
    recipientPhone: { type: String, trim: true },
    relatedIssueId: { type: Schema.Types.ObjectId, ref: "Issue" },
    relatedProposalId: { type: Schema.Types.ObjectId, ref: "Proposal" },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: [
        "CIRCUIT_BREAKER_DISASTER",
        "PROPOSAL_SUBMITTED",
        "PANEL_DECISION",
        "RUNNER_UP_PROMOTED",
        "UNCLAIMED_ESCALATION_STAGE",
        "DIRECT_NOMINATION_REQUEST",
        "L3_SUBCONTRACT_INVITE",
        "CSR_PLEDGE_RECEIVED",
        "MILESTONE_PAYOUT_RELEASED",
        "CITIZEN_STATUS_UPDATE",
      ],
      default: "CITIZEN_STATUS_UPDATE",
    },
    priority: {
      type: String,
      enum: ["LOW", "NORMAL", "HIGH", "CRITICAL"],
      default: "NORMAL",
      index: true,
    },
    read: { type: Boolean, default: false, index: true },
    actionUrl: { type: String, trim: true },
  },
  {
    timestamps: true,
  },
);

// High performance compound indexes
NotificationSchema.index({
  recipientRole: 1,
  recipientId: 1,
  read: 1,
  createdAt: -1,
});
NotificationSchema.index({ priority: 1, read: 1, createdAt: -1 });

const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
