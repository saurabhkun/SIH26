/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";
import Issue from "@/lib/models/Issue";
import { IssueDomain, IssueStatus } from "@/lib/constants/domains";
import {
  sanitizeMediaUrl,
  getContextualMediaUrl,
} from "@/lib/constants/civicMedia";

export interface PhoneAppReport {
  _id: string;
  id?: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  image_urls: string[];
  status: string;
  priority: string;
  consolidated_reports?: number;
  contact_number?: string | null;
  coordinates?: { lat: number; lng: number } | null;
  admin_notes?: string;
  created_at?: string | Date;
  updated_at?: string | Date;
}

/**
 * Maps arbitrary category strings (e.g. potholes_roads, water, etc.) to canonical IssueDomain
 */
export function mapCategoryToDomain(
  category?: string,
  title?: string,
): IssueDomain {
  const c = `${category || ""} ${title || ""}`.toLowerCase();
  if (
    c.includes("water") ||
    c.includes("handpump") ||
    c.includes("plumb") ||
    c.includes("fluoride") ||
    c.includes("well")
  ) {
    return "Water Resources";
  }
  if (
    c.includes("agri") ||
    c.includes("farm") ||
    c.includes("crop") ||
    c.includes("irrigation") ||
    c.includes("kisan") ||
    c.includes("drought")
  ) {
    return "Agriculture";
  }
  if (
    c.includes("health") ||
    c.includes("medic") ||
    c.includes("doctor") ||
    c.includes("phc") ||
    c.includes("malnutrition") ||
    c.includes("stunt")
  ) {
    return "Healthcare";
  }
  if (
    c.includes("edu") ||
    c.includes("school") ||
    c.includes("college") ||
    c.includes("class") ||
    c.includes("student")
  ) {
    return "Education";
  }
  if (
    c.includes("mine") ||
    c.includes("mining") ||
    c.includes("coal") ||
    c.includes("dust") ||
    c.includes("reclamation") ||
    c.includes("forest") ||
    c.includes("tree")
  ) {
    return "Environment";
  }
  if (
    c.includes("pothole") ||
    c.includes("road") ||
    c.includes("street") ||
    c.includes("traffic") ||
    c.includes("bridge") ||
    c.includes("drain")
  ) {
    return "Urban Development";
  }
  if (
    c.includes("power") ||
    c.includes("electric") ||
    c.includes("light") ||
    c.includes("grid")
  ) {
    return "Energy";
  }
  if (
    c.includes("sanitat") ||
    c.includes("toilet") ||
    c.includes("garbage") ||
    c.includes("waste")
  ) {
    return "Sanitation";
  }
  if (
    c.includes("livelihood") ||
    c.includes("tussar") ||
    c.includes("lac") ||
    c.includes("artisan") ||
    c.includes("shg")
  ) {
    return "Rural Livelihoods";
  }
  return "Urban Development";
}

/**
 * Extracts or guesses a Jharkhand district from a location string or coordinates
 */
export function extractDistrict(
  locationStr?: string,
  coordinates?: { lat: number; lng: number } | null,
): string {
  if (!locationStr && !coordinates) return "Ranchi";

  const loc = (locationStr || "").toLowerCase();
  const JHARKHAND_NAMES = [
    "Ranchi",
    "Dhanbad",
    "East Singhbhum",
    "Bokaro",
    "Hazaribagh",
    "Deoghar",
    "Giridih",
    "Palamu",
    "Garhwa",
    "Latehar",
    "Ramgarh",
    "Dumka",
    "Godda",
    "Sahibganj",
    "Seraikela Kharsawan",
    "Khunti",
    "Lohardaga",
    "West Singhbhum",
    "Gumla",
    "Pakur",
    "Jamtara",
    "Koderma",
    "Chatra",
    "Simdega",
  ];

  for (const name of JHARKHAND_NAMES) {
    if (loc.includes(name.toLowerCase())) {
      return name;
    }
  }

  // Fallback to Ranchi (state capital) for statewide aggregation
  return "Ranchi";
}

/**
 * Converts a raw report document (from 'reports' collection) to a normalized Issue-compatible object
 */
export function normalizeReportToIssue(doc: any): any {
  const idStr = doc._id
    ? doc._id.toString()
    : doc.id || new mongoose.Types.ObjectId().toString();
  const trackingCode =
    doc.id && doc.id.startsWith("CR-")
      ? doc.id
      : `CR-JH-${idStr.slice(-6).toUpperCase()}`;
  const domain = mapCategoryToDomain(doc.category, doc.title);
  const district = extractDistrict(doc.location, doc.coordinates);

  const statusMap: Record<string, IssueStatus> = {
    submitted: "Reported",
    in_progress: "Under_Prototyping",
    resolved: "Resolved",
    rejected: "Rejected",
    under_review: "Under_Review",
  };

  const status: IssueStatus =
    statusMap[doc.status?.toLowerCase()] ||
    (doc.status as IssueStatus) ||
    "Reported";
  const priorityScore =
    doc.priority === "critical" || doc.priority === "high"
      ? 4
      : doc.priority === "medium"
        ? 3
        : 2;

  const attachments =
    Array.isArray(doc.image_urls) && doc.image_urls.length > 0
      ? doc.image_urls.map((url: string, idx: number) => ({
          url: sanitizeMediaUrl(url, domain, idx),
          type: "photo",
          filename: "field_evidence.jpg",
        }))
      : Array.isArray(doc.attachments) && doc.attachments.length > 0
        ? doc.attachments.map((a: any, idx: number) => ({
            ...a,
            url: sanitizeMediaUrl(a.url, domain, idx),
          }))
        : [
            {
              url: getContextualMediaUrl(domain, 0),
              type: "photo",
              filename: "field_evidence.jpg",
            },
          ];

  return {
    _id: doc._id || new mongoose.Types.ObjectId(idStr),
    title: doc.title || "Citizen Reported Challenge",
    description: doc.description || "",
    attachments,
    domain,
    severityScore: priorityScore,
    aiTags: [doc.category || "mobile_sourcing", domain.toLowerCase()],
    district,
    pincode: doc.location?.match(/\b\d{6}\b/)?.[0] || "",
    address: doc.location || district,
    location: doc.coordinates || { lat: 23.3441, lng: 85.3096 },
    facingSince: "<1 month",
    citizenName: doc.user_id || "Mobile Citizen",
    citizenMobile: doc.user_id || doc.contact_number || "9999999999",
    mobileVerified: true,
    trackingCode,
    status,
    similarIssueIds: [],
    assignedColleges: [],
    submissionIndexForMobile: doc.consolidated_reports || 1,
    createdAt: doc.created_at ? new Date(doc.created_at) : new Date(),
    updatedAt: doc.updated_at ? new Date(doc.updated_at) : new Date(),
  };
}

/**
 * Maps an issue document to Flutter / phone app schema
 */
export function mapToFlutterReport(issue: any): PhoneAppReport {
  const idStr = issue._id ? issue._id.toString() : "";
  const tracking =
    issue.trackingCode || `CR-JH-${idStr.slice(-6).toUpperCase()}`;

  const flutterStatus =
    issue.status === "Reported" || issue.status === "submitted"
      ? "submitted"
      : issue.status === "Resolved" || issue.status === "resolved"
        ? "resolved"
        : "in_progress";

  const priority =
    issue.severityScore >= 4 || issue.priority === "high"
      ? "high"
      : issue.severityScore === 3 || issue.priority === "medium"
        ? "medium"
        : "low";

  const domain = issue.domain || "Urban Development";
  const rawImages =
    Array.isArray(issue.image_urls) && issue.image_urls.length > 0
      ? issue.image_urls
      : issue.attachments?.map((a: any) => a.url) || [];

  const images =
    rawImages.length > 0
      ? rawImages.map((u: string, idx: number) =>
          sanitizeMediaUrl(u, domain, idx),
        )
      : [getContextualMediaUrl(domain, 0)];

  return {
    _id: idStr,
    id: tracking,
    user_id: issue.citizenMobile || issue.user_id || "9999999999",
    title: issue.title || "",
    description: issue.description || "",
    category: (issue.domain || issue.category || "urban_development")
      .toLowerCase()
      .replace(/\s+/g, "_"),
    location: issue.address || issue.location || issue.district || "Jharkhand",
    image_urls: images,
    status: flutterStatus,
    priority,
    consolidated_reports: issue.similarIssueIds?.length
      ? issue.similarIssueIds.length + 1
      : 1,
    contact_number: issue.citizenMobile || issue.contact_number || null,
    coordinates: issue.location?.lat
      ? issue.location
      : { lat: 23.3441, lng: 85.3096 },
    admin_notes: issue.reviewedBy ? `Reviewed by ${issue.reviewedBy}` : "",
    created_at: issue.createdAt || issue.created_at || new Date().toISOString(),
    updated_at: issue.updatedAt || issue.updated_at || new Date().toISOString(),
  };
}

/**
 * Automatically syncs any document from the 'reports' collection into the 'issues' collection
 * so all web dashboards, analytics, review queues, and marketplace views immediately have them!
 */
export async function syncReportsToIssues(): Promise<void> {
  try {
    if (!mongoose.connection?.db) {
      const { connectDB } = await import("@/lib/mongodb");
      await connectDB();
    }

    if (!mongoose.connection?.db) return;

    const reportsColl = mongoose.connection.db.collection("reports");
    const rawReports = await reportsColl.find().toArray();
    const issuesColl = mongoose.connection.db.collection("issues");

    for (const report of rawReports) {
      const idStr = report._id ? report._id.toString() : report.id || "";
      const trackingCode =
        report.id && report.id.startsWith("CR-")
          ? report.id
          : `CR-JH-${idStr.slice(-6).toUpperCase()}`;

      // Check if already in 'issues' collection
      const existing = await issuesColl.findOne({
        $or: [
          { _id: report._id },
          { trackingCode },
          { title: report.title, citizenMobile: report.user_id },
        ],
      });

      if (!existing) {
        const normalized = normalizeReportToIssue(report);
        try {
          await Issue.create(normalized);
        } catch {
          // Fallback to direct collection insert if validation or schema mismatch
          await issuesColl.insertOne(normalized);
        }
      }
    }
  } catch (err) {
    console.warn("syncReportsToIssues warning:", err);
  }
}

/**
 * Syncs an issue back to the 'reports' collection for Flutter app compatibility
 */
export async function syncIssueToReport(issue: any): Promise<void> {
  try {
    if (!mongoose.connection?.db) return;
    const reportsColl = mongoose.connection.db.collection("reports");
    const flutterDoc = mapToFlutterReport(issue);

    await reportsColl.updateOne(
      { $or: [{ _id: issue._id }, { id: flutterDoc.id }] },
      { $set: flutterDoc },
      { upsert: true },
    );
  } catch (err) {
    console.warn("syncIssueToReport warning:", err);
  }
}

/**
 * Fetches and merges documents from both 'issues' and 'reports' collections
 */
export async function getAllUnifiedIssues(): Promise<any[]> {
  // 1. Ensure sync first
  await syncReportsToIssues();

  // 2. Query all issues
  const issues = await Issue.find()
    .populate("assignedColleges", "name tier district")
    .populate("similarIssueIds", "trackingCode title status")
    .sort({ createdAt: -1 })
    .lean();

  return issues;
}
