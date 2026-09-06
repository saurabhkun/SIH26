import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Proposal, { IMilestone, ITeamMember, ProposalStatus } from "@/lib/models/Proposal";
import Issue from "@/lib/models/Issue";
import College from "@/lib/models/College";
import { getCurrentUser } from "@/lib/auth/session";
import { createNotifications } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * GET /api/proposals
 * Lists proposals with populated Issue and College info
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const collegeParam = searchParams.get("college");
    const issueParam = searchParams.get("issue");
    const statusParam = searchParams.get("status");

    const query: Record<string, unknown> = {};

    if (collegeParam === "me") {
      const sessionUser = getCurrentUser();
      let college = null;
      if (sessionUser?.collegeId) {
        college = await College.findById(sessionUser.collegeId);
      }
      if (!college && sessionUser?.email) {
        college = await College.findOne({ email: sessionUser.email.toLowerCase() });
      }
      if (!college) {
        college = await College.findOne().sort({ createdAt: 1 });
      }
      if (college) {
        query.college = college._id;
      }
    } else if (collegeParam) {
      query.college = collegeParam;
    }

    if (issueParam) {
      query.issue = issueParam;
    }

    if (statusParam && statusParam !== "all") {
      query.status = statusParam;
    }

    const proposals = await Proposal.find(query)
      .populate("issue", "title trackingCode district domain severityScore status citizenName")
      .populate("college", "name district tier capabilities")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      count: proposals.length,
      data: proposals,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Failed to fetch proposals";
    console.error("GET /api/proposals error:", error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

/**
 * POST /api/proposals
 * Submits a Solution Proposal from a College for a specific Issue
 * Enforces the fairness rule (maxConcurrentClaims)
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      issueId,
      title,
      technicalScope,
      budgetRequested,
      facultyMentor,
      team,
      milestones,
    } = body;

    if (!issueId || !title || !technicalScope || !facultyMentor) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: issueId, title, technicalScope, and facultyMentor are required.",
        },
        { status: 400 }
      );
    }

    // 1. Resolve submitting college
    const sessionUser = getCurrentUser();
    let college = null;
    if (sessionUser?.collegeId) {
      college = await College.findById(sessionUser.collegeId);
    }
    if (!college && sessionUser?.email) {
      college = await College.findOne({ email: sessionUser.email.toLowerCase() });
    }
    if (!college) {
      college = await College.findOne().sort({ createdAt: 1 });
    }
    if (!college) {
      college = await College.create({
        name: "Birla Institute of Technology, Mesra",
        district: "Ranchi",
        tier: "L1",
        capabilities: ["Water Resources", "Environment", "Agriculture", "Energy"],
        facilities: [
          {
            name: "Environmental Engineering & Water Testing Lab",
            description: "Advanced spectrometry and heavy metal trace detection facility.",
            relatedDomains: ["Water Resources", "Environment"],
          },
        ],
        faculty: [
          {
            name: "Dr. Ananya Sen",
            department: "Civil & Environmental Engineering",
            specialization: "Groundwater Arsenic Remediation & Filtration",
            email: "rnd.director@bitmesra.ac.in",
          },
        ],
        email: "rnd.director@bitmesra.ac.in",
        contactPerson: "Dr. A. K. Sinha (Dean R&D)",
        contactPhone: "+91-651-2275444",
        maxConcurrentClaims: 5,
        verified: true,
      });
    }

    if (!college) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: No valid Higher Education Institution identified." },
        { status: 401 }
      );
    }

    // 2. Enforce Fairness Rule: Check active claims
    const activeStatuses: ProposalStatus[] = [
      "Submitted",
      "Under_Government_Review",
      "Approved",
      "In_Progress",
    ];
    const activeProposalsCount = await Proposal.countDocuments({
      college: college._id,
      status: { $in: activeStatuses },
    });

    const maxAllowed = college.maxConcurrentClaims || 3;
    if (activeProposalsCount >= maxAllowed) {
      return NextResponse.json(
        {
          success: false,
          fairnessCapReached: true,
          error: `Fairness Rule Violation: ${college.name} currently has ${activeProposalsCount} active proposals (maximum limit is ${maxAllowed}). Complete or close existing projects before claiming new civic challenges.`,
        },
        { status: 403 }
      );
    }

    // 3. Find the target issue
    const issue = await Issue.findById(issueId);
    if (!issue) {
      return NextResponse.json(
        { success: false, error: "Target civic issue not found." },
        { status: 404 }
      );
    }

    // 4. Format milestones and team members
    const formattedTeam: ITeamMember[] = Array.isArray(team) && team.length > 0
      ? team.map((m: { name: string; role: string; discipline: string }) => ({
          name: m.name?.trim() || "Student Researcher",
          role: m.role?.trim() || "Lead Developer",
          discipline: m.discipline?.trim() || "Engineering",
        }))
      : [
          {
            name: "Student Innovation Lead",
            role: "Project Lead",
            discipline: "Technology & Engineering",
          },
        ];

    const formattedMilestones: IMilestone[] = Array.isArray(milestones) && milestones.length > 0
      ? milestones.map((m: { title: string; description: string; dueDate?: string; fundingReleaseAmount?: number }, idx: number) => ({
          title: m.title?.trim() || `Milestone ${idx + 1}`,
          description: m.description?.trim() || "Deliverable execution and testing",
          dueDate: m.dueDate ? new Date(m.dueDate) : new Date(Date.now() + (idx + 1) * 30 * 24 * 60 * 60 * 1000),
          status: "Pending" as const,
          fundingReleaseAmount: Number(m.fundingReleaseAmount) || Math.round((Number(budgetRequested) || 150000) / (milestones.length || 3)),
          fundingReleased: false,
        }))
      : [
          {
            title: "Phase 1: Field Assessment & Sensor Prototyping",
            description: "Site visits, water sampling, and baseline laboratory calibration",
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: "Pending" as const,
            fundingReleaseAmount: Math.round((Number(budgetRequested) || 150000) * 0.4),
            fundingReleased: false,
          },
          {
            title: "Phase 2: Deployment & Pilot Community Testing",
            description: "Install modular filtration unit and continuous telemetry",
            dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
            status: "Pending" as const,
            fundingReleaseAmount: Math.round((Number(budgetRequested) || 150000) * 0.4),
            fundingReleased: false,
          },
          {
            title: "Phase 3: Final Handover & Nodal Certification",
            description: "Government inspection report and user manual handover to panchayat",
            dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            status: "Pending" as const,
            fundingReleaseAmount: Math.round((Number(budgetRequested) || 150000) * 0.2),
            fundingReleased: false,
          },
        ];

    // 5. Create Proposal doc
    const newProposal = await Proposal.create({
      issue: issue._id,
      college: college._id,
      title: title.trim(),
      technicalScope: technicalScope.trim(),
      budgetRequested: Number(budgetRequested) || 150000,
      facultyMentor: facultyMentor.trim(),
      team: formattedTeam,
      milestones: formattedMilestones,
      status: "Submitted",
      outcomes: {
        patentFiled: false,
        startupCreated: false,
        deployed: false,
      },
    });

    // 6. Update Issue doc: set status to Proposal_Submitted and push college to assignedColleges
    issue.status = "Proposal_Submitted";
    if (!issue.assignedColleges.some((id: unknown) => id?.toString() === college._id.toString())) {
      issue.assignedColleges.push(college._id);
    }
    await issue.save();

    // 7. Notifications
    await createNotifications([
      {
        recipientType: "college",
        recipientId: college._id.toString(),
        message: `Your proposal "${newProposal.title}" for issue ${issue.trackingCode} has been submitted and is under government review.`,
        relatedIssue: issue._id,
        relatedProposal: newProposal._id,
      },
      {
        recipientType: "gov",
        recipientId: "gov",
        message: `New proposal submitted by ${college.name} for issue ${issue.trackingCode} — "${newProposal.title}". Pending review.`,
        relatedIssue: issue._id,
        relatedProposal: newProposal._id,
      },
      ...(issue.citizenMobile
        ? [
            {
              recipientType: "citizen" as const,
              recipientId: issue.citizenMobile as string,
              message: `A university has submitted a proposal to resolve your issue (${issue.trackingCode}). Tracking code remains valid.`,
              relatedIssue: issue._id,
            },
          ]
        : []),
    ]);

    return NextResponse.json({
      success: true,
      message: `Solution proposal '${newProposal.title}' successfully submitted! Issue #${issue.trackingCode} is now in 'Proposal Submitted' status.`,
      data: newProposal,
      updatedIssue: {
        id: issue._id,
        trackingCode: issue.trackingCode,
        status: issue.status,
      },
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Failed to create proposal";
    console.error("POST /api/proposals error:", error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
