import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Issue from "@/lib/models/Issue";
import User from "@/lib/models/User";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const DEPARTMENTS_ROUTING_MATRIX = [
  {
    id: "pwd-roads",
    name: "Public Works Department (PWD - Roads & Bridges)",
    head: "Chief Engineer (Roads)",
    email: "pwd.roads@jharkhand.gov.in",
    categories: ["roads", "bridges", "potholes", "traffic_signals"],
    activeTickets: 24,
    slaHours: 48,
    status: "Active Operational",
  },
  {
    id: "drinking-water",
    name: "Drinking Water & Sanitation Department (DWSD)",
    head: "Executive Engineer (Sanitation & Water)",
    email: "dwsd.water@jharkhand.gov.in",
    categories: ["water_supply", "water_sewage", "fluoride_arsenic", "pipeline_leakage"],
    activeTickets: 38,
    slaHours: 24,
    status: "Active Operational",
  },
  {
    id: "energy-streetlights",
    name: "Jharkhand Urja Vikas Nigam (JUVNL - Electricity & Streetlights)",
    head: "Superintending Engineer (Distribution)",
    email: "juvnl.dist@jharkhand.gov.in",
    categories: ["electricity_streetlights", "transformer_fault", "power_grid"],
    activeTickets: 19,
    slaHours: 12,
    status: "Active Operational",
  },
  {
    id: "urban-waste",
    name: "Urban Development & Housing (Solid Waste Management)",
    head: "Municipal Commissioner & Urban Waste Head",
    email: "urban.waste@jharkhand.gov.in",
    categories: ["waste_management", "drainage_overflow", "garbage_dump"],
    activeTickets: 31,
    slaHours: 24,
    status: "Active Operational",
  },
  {
    id: "health-family",
    name: "Health, Medical Education & Family Welfare",
    head: "Civil Surgeon & CMO",
    email: "health.civic@jharkhand.gov.in",
    categories: ["public_health", "malnutrition", "hospital_coldchain", "epidemic"],
    activeTickets: 14,
    slaHours: 12,
    status: "High Priority Desk",
  },
  {
    id: "higher-education",
    name: "Dept. of Higher & Technical Education (Research Org Desk)",
    head: "Director of Technical Education",
    email: "dhe.rnd@jharkhand.gov.in",
    categories: ["research_r_d", "innovation", "academic_bidding", "lab_testing"],
    activeTickets: 42,
    slaHours: 72,
    status: "Research Innovation Lead",
  },
];

const SYSTEM_AUDIT_LOGS = [
  {
    id: "log-001",
    action: "SUPER_ADMIN_OVERRIDE",
    issueCode: "JH-2026-WTR-8841",
    performedBy: "Sri Sunil Kumar, IAS (Super Admin)",
    details: "Accepted high toxicity grievance & routed to Research Organization (BIT Mesra lab assay).",
    timestamp: "2026-09-10T08:30:00Z",
  },
  {
    id: "log-002",
    action: "DEPT_MAINTENANCE_ROUTE",
    issueCode: "JH-2026-RD-1049",
    performedBy: "Automated AI Triage Engine",
    details: "Pothole repair routed directly to PWD (Roads) maintenance queue.",
    timestamp: "2026-09-10T09:15:00Z",
  },
  {
    id: "log-003",
    action: "ROLE_VERIFICATION",
    issueCode: "N/A",
    performedBy: "Super Admin Gateway",
    details: "Empanelled CMPDI Technical Consultancy with NABET Category A credentials.",
    timestamp: "2026-09-10T10:00:00Z",
  },
];

export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser();
    // Allow super_admin or gov roles
    if (user && user.role !== "super_admin" && user.role !== "gov") {
      return NextResponse.json(
        { success: false, error: "Access restricted to Super Administrators." },
        { status: 403 },
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const filterStatus = searchParams.get("status");

    const query: Record<string, unknown> = {};
    if (filterStatus && filterStatus !== "all") {
      query.triageAction = filterStatus;
    }

    const issues = await Issue.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const users = await User.find({})
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const metrics = {
      totalPipeline: await Issue.countDocuments({}),
      pendingSuperAdminReview: await Issue.countDocuments({
        $or: [
          { triageAction: "pending_super_admin_review" },
          { triageAction: { $exists: false } },
        ],
      }),
      acceptedForResearch: await Issue.countDocuments({ triageAction: "accepted" }),
      assignedToGovtDepts: await Issue.countDocuments({
        $or: [
          { triageAction: "assigned_to_govt_dept" },
          { status: "Assigned_Govt_Dept" },
        ],
      }),
      rejectedComplaints: await Issue.countDocuments({ triageAction: "rejected" }),
    };

    return NextResponse.json({
      success: true,
      data: {
        issues,
        departments: DEPARTMENTS_ROUTING_MATRIX,
        auditLogs: SYSTEM_AUDIT_LOGS,
        users,
        metrics,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch Super Admin data";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser();
    const body = await request.json();
    const { action, issueId, reason, departmentId, notes } = body;

    if (!action || !issueId) {
      return NextResponse.json(
        { success: false, error: "Action and Issue ID are required." },
        { status: 400 },
      );
    }

    await connectDB();

    const issue = await Issue.findById(issueId);
    if (!issue) {
      return NextResponse.json(
        { success: false, error: "Issue not found." },
        { status: 404 },
      );
    }

    const actorName = user?.name || "Super Admin Desk";

    if (action === "accept") {
      issue.triageAction = "accepted";
      issue.status = "Accepted_Verified";
      issue.reviewedBy = actorName;
      await issue.save();

      SYSTEM_AUDIT_LOGS.unshift({
        id: `log-${Date.now()}`,
        action: "SUPER_ADMIN_ACCEPT",
        issueCode: issue.trackingCode,
        performedBy: actorName,
        details: `Accepted problem into global directory and Research Organization pipeline. Notes: ${notes || "Verified by Super Admin."}`,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: `✓ Issue ${issue.trackingCode} Accepted! Published to Global Verified Directory & Research Organization Portal.`,
        data: issue,
      });
    }

    if (action === "reject") {
      issue.triageAction = "rejected";
      issue.status = "Rejected";
      issue.rejectionReason = reason || "Out of administrative jurisdiction";
      issue.reviewedBy = actorName;
      await issue.save();

      SYSTEM_AUDIT_LOGS.unshift({
        id: `log-${Date.now()}`,
        action: "SUPER_ADMIN_REJECT",
        issueCode: issue.trackingCode,
        performedBy: actorName,
        details: `Rejected report. Reason: ${issue.rejectionReason}`,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: `Issue ${issue.trackingCode} rejected with logged reason: "${issue.rejectionReason}".`,
        data: issue,
      });
    }

    if (action === "assign_dept") {
      const dept = DEPARTMENTS_ROUTING_MATRIX.find((d) => d.id === departmentId);
      const deptName = dept ? dept.name : departmentId || "Urban Municipal Works";

      issue.triageAction = "assigned_to_govt_dept";
      issue.status = "Assigned_Govt_Dept";
      issue.assignedDepartment = deptName;
      issue.maintenanceNotes = notes || "Routine department maintenance and repair SLA active.";
      issue.reviewedBy = actorName;
      await issue.save();

      SYSTEM_AUDIT_LOGS.unshift({
        id: `log-${Date.now()}`,
        action: "DEPT_MAINTENANCE_ROUTE",
        issueCode: issue.trackingCode,
        performedBy: actorName,
        details: `Routed to ${deptName} for direct field execution. Notes: ${issue.maintenanceNotes}`,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: `✓ Issue ${issue.trackingCode} successfully routed to ${deptName} maintenance queue!`,
        data: issue,
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action specified." },
      { status: 400 },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Super Admin triage action failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
