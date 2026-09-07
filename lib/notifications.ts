import { dispatchNotification } from "@/lib/engine/notify";
import { NotificationType, NotificationPriority } from "@/lib/models/Notification";
import mongoose from "mongoose";

export interface CreateNotificationInput {
  recipientType?: "citizen" | "college" | "industry" | "gov" | "all" | string;
  recipientRole?: "GOV" | "RO" | "INDUSTRY" | "CITIZEN" | "ALL" | string;
  recipientId?: string | mongoose.Types.ObjectId;
  recipientPhone?: string;
  title?: string;
  message: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  actionUrl?: string;
  relatedIssue?: string | mongoose.Types.ObjectId;
  relatedIssueId?: string | mongoose.Types.ObjectId;
  relatedProposal?: string | mongoose.Types.ObjectId;
  relatedProposalId?: string | mongoose.Types.ObjectId;
}

function inferNotificationType(title: string, message: string): NotificationType {
  const text = `${title} ${message}`.toLowerCase();
  if (text.includes("disaster") || text.includes("hazard") || text.includes("circuit-breaker") || text.includes("emergency")) {
    return "CIRCUIT_BREAKER_DISASTER";
  }
  if (text.includes("promoted") || text.includes("cascade") || text.includes("runner-up #1")) {
    return "RUNNER_UP_PROMOTED";
  }
  if (text.includes("awarded") || text.includes("winner") || text.includes("panel")) {
    return "PANEL_DECISION";
  }
  if (text.includes("nomination") || text.includes("direct")) {
    return "DIRECT_NOMINATION_REQUEST";
  }
  if (text.includes("subcontract") || text.includes("l3")) {
    return "L3_SUBCONTRACT_INVITE";
  }
  if (text.includes("sweetener") || text.includes("stage 3") || text.includes("stage 4") || text.includes("escalat")) {
    return "UNCLAIMED_ESCALATION_STAGE";
  }
  if (text.includes("pledge") || text.includes("csr") || text.includes("deposit")) {
    return "CSR_PLEDGE_RECEIVED";
  }
  if (text.includes("milestone") || text.includes("payout") || text.includes("release") || text.includes("fund")) {
    return "MILESTONE_PAYOUT_RELEASED";
  }
  if (text.includes("proposal") || text.includes("bid")) {
    return "PROPOSAL_SUBMITTED";
  }
  return "CITIZEN_STATUS_UPDATE";
}

/**
 * Universal notification creator with automatic priority and title inferencing.
 */
export async function createNotification(input: CreateNotificationInput): Promise<void> {
  const role = (input.recipientRole || input.recipientType || "ALL").toString();
  const title = input.title || (input.message.length > 50 ? input.message.slice(0, 47) + "..." : input.message);
  const type = input.type || inferNotificationType(title, input.message);
  const priority: NotificationPriority =
    input.priority || (type === "CIRCUIT_BREAKER_DISASTER" ? "CRITICAL" : type === "RUNNER_UP_PROMOTED" || type === "DIRECT_NOMINATION_REQUEST" ? "HIGH" : "NORMAL");

  const issueId = input.relatedIssueId || input.relatedIssue;
  const proposalId = input.relatedProposalId || input.relatedProposal;

  const defaultActionUrl = issueId ? `/dashboard/gov/allocations` : undefined;

  await dispatchNotification({
    recipientRole: role as unknown as "GOV" | "RO" | "INDUSTRY" | "CITIZEN" | "ALL",
    recipientId: input.recipientId,
    recipientPhone: input.recipientPhone,
    title,
    message: input.message,
    type,
    priority,
    actionUrl: input.actionUrl || defaultActionUrl,
    relatedIssueId: issueId,
    relatedProposalId: proposalId,
  });
}

/**
 * Create notifications for multiple recipients at once.
 */
export async function createNotifications(inputs: CreateNotificationInput[]): Promise<void> {
  for (const input of inputs) {
    await createNotification(input);
  }
}
