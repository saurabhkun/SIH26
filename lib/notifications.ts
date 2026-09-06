import dbConnect from "@/lib/db";
import Notification from "@/lib/models/Notification";
import type { NotificationRecipientType } from "@/lib/models/Notification";
import mongoose from "mongoose";

interface CreateNotificationInput {
  recipientType: NotificationRecipientType;
  recipientId: string;
  message: string;
  relatedIssue?: string | mongoose.Types.ObjectId;
  relatedProposal?: string | mongoose.Types.ObjectId;
}

/**
 * Fire-and-forget notification creator. Silently swallows errors so that
 * a failing notification never breaks the business action that triggered it.
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<void> {
  try {
    await dbConnect();
    await Notification.create({
      recipientType: input.recipientType,
      recipientId: input.recipientId,
      message: input.message,
      relatedIssue: input.relatedIssue,
      relatedProposal: input.relatedProposal,
      read: false,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[Notification] Failed to create notification:", err);
  }
}

/**
 * Create notifications for multiple recipients at once.
 */
export async function createNotifications(
  inputs: CreateNotificationInput[]
): Promise<void> {
  for (const input of inputs) {
    await createNotification(input);
  }
}
