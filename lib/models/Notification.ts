import mongoose, { Schema, Document, Model } from "mongoose";

export const NOTIFICATION_RECIPIENT_TYPES = [
  "citizen",
  "college",
  "industry",
  "gov",
] as const;

export type NotificationRecipientType = (typeof NOTIFICATION_RECIPIENT_TYPES)[number];

export interface INotification extends Document {
  recipientType: NotificationRecipientType;
  /** For citizens: mobile number string. For others: MongoDB ObjectId of User */
  recipientId: string;
  message: string;
  relatedIssue?: mongoose.Types.ObjectId;
  relatedProposal?: mongoose.Types.ObjectId;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientType: {
      type: String,
      enum: NOTIFICATION_RECIPIENT_TYPES,
      required: true,
    },
    recipientId: { type: String, required: true, index: true },
    message: { type: String, required: true, trim: true },
    relatedIssue: { type: Schema.Types.ObjectId, ref: "Issue" },
    relatedProposal: { type: Schema.Types.ObjectId, ref: "Proposal" },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ recipientType: 1, recipientId: 1, read: 1 });
NotificationSchema.index({ createdAt: -1 });

const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
