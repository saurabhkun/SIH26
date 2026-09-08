import dbConnect from "@/lib/db";
import Notification, {
  NotificationType,
  NotificationPriority,
  RecipientRole,
} from "@/lib/models/Notification";
import mongoose from "mongoose";

export interface DispatchOptions {
  recipientRole:
    RecipientRole | "gov" | "college" | "industry" | "citizen" | "all";
  recipientId?: string | mongoose.Types.ObjectId;
  recipientPhone?: string;
  relatedIssueId?: string | mongoose.Types.ObjectId;
  relatedProposalId?: string | mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
  actionUrl?: string;
}

function normalizeRole(
  role: string,
): "GOV" | "RO" | "INDUSTRY" | "CITIZEN" | "ALL" {
  const upper = role.toUpperCase();
  if (upper === "COLLEGE" || upper === "RO" || upper === "HEI") return "RO";
  if (upper === "GOV" || upper === "ADMIN") return "GOV";
  if (upper === "INDUSTRY" || upper === "CSR") return "INDUSTRY";
  if (upper === "CITIZEN") return "CITIZEN";
  return "ALL";
}

/**
 * Dispatches operational alerts across Government, RO, Industry, and Citizens.
 * Operates resiliently with fire-and-forget logging so notifications never break primary business logic.
 */
export async function dispatchNotification(opts: DispatchOptions) {
  try {
    await dbConnect();
    const normalizedRole = normalizeRole(opts.recipientRole);

    return await Notification.create({
      recipientRole: normalizedRole,
      recipientId: opts.recipientId,
      recipientPhone: opts.recipientPhone,
      relatedIssueId: opts.relatedIssueId,
      relatedProposalId: opts.relatedProposalId,
      title: opts.title,
      message: opts.message,
      type: opts.type,
      priority: opts.priority || "NORMAL",
      actionUrl: opts.actionUrl,
      read: false,
    });
  } catch (err) {
    console.error("[Notification Dispatcher] Failed to dispatch alert:", err);
    return null;
  }
}

/**
 * Batch dispatch notifications to multiple recipients simultaneously.
 */
export async function dispatchNotifications(optionsList: DispatchOptions[]) {
  const promises = optionsList.map((opts) => dispatchNotification(opts));
  return await Promise.all(promises);
}
