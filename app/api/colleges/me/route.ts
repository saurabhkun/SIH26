import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import College from "@/lib/models/College";
import Proposal, { ProposalStatus } from "@/lib/models/Proposal";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * Helper to resolve the active college document for the logged in user
 */
async function resolveCurrentCollege() {
  await connectDB();
  const sessionUser = getCurrentUser();

  let college = null;

  if (sessionUser?.collegeId) {
    try {
      college = await College.findById(sessionUser.collegeId);
    } catch {
      // ignore
    }
  }

  if (!college && sessionUser?.email) {
    college = await College.findOne({ email: sessionUser.email.toLowerCase() });
  }

  // Fallback to first college or create default BIT Mesra record for prototype continuity
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
          description:
            "Advanced spectrometry and heavy metal trace detection facility.",
          relatedDomains: ["Water Resources", "Environment"],
        },
        {
          name: "Renewable Energy Research Center",
          description:
            "Solar PV microgrid and biomass conversion testing setup.",
          relatedDomains: ["Energy"],
        },
      ],
      faculty: [
        {
          name: "Dr. Ananya Sen",
          department: "Civil & Environmental Engineering",
          specialization: "Groundwater Arsenic Remediation & Filtration",
          email: "director.rnd@bitmesra.ac.in",
        },
        {
          name: "Prof. Rajesh Verma",
          department: "Computer Science & Engineering",
          specialization: "IoT Sensor Networks for Smart Irrigation",
          email: "rverma@bitmesra.ac.in",
        },
      ],
      email: "director.rnd@bitmesra.ac.in",
      contactPerson: "Dr. A. K. Sinha (Dean R&D)",
      contactPhone: "+91-651-2275444",
      maxConcurrentClaims: 5,
      verified: true,
    });
  }

  return college;
}

/**
 * GET /api/colleges/me
 * Retrieves current college profile, capabilities, and active claim counts
 */
export async function GET() {
  try {
    const college = await resolveCurrentCollege();

    if (!college) {
      return NextResponse.json(
        { success: false, error: "College institution profile not found." },
        { status: 404 },
      );
    }

    // Calculate active claims count
    const activeStatuses: ProposalStatus[] = [
      "Submitted",
      "Under_Government_Review",
      "Approved",
      "In_Progress",
    ];
    const activeProposalsCount = await Proposal.countDocuments({
      college: college._id,
      status: {
        $in: activeStatuses,
      },
    });

    const isAtCap = activeProposalsCount >= (college.maxConcurrentClaims || 3);

    return NextResponse.json({
      success: true,
      data: {
        ...college.toObject(),
        activeProposalsCount,
        isAtCap,
        remainingClaims: Math.max(
          0,
          (college.maxConcurrentClaims || 3) - activeProposalsCount,
        ),
      },
    });
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error
        ? error.message
        : "Failed to fetch college profile";
    console.error("GET /api/colleges/me error:", error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/colleges/me
 * Updates self-reported capabilities, facilities, and faculty roster
 */
export async function PUT(request: NextRequest) {
  try {
    const college = await resolveCurrentCollege();

    if (!college) {
      return NextResponse.json(
        { success: false, error: "College institution profile not found." },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { capabilities, facilities, faculty, contactPerson, contactPhone } =
      body;

    if (capabilities && Array.isArray(capabilities)) {
      college.capabilities = capabilities;
    }

    if (facilities && Array.isArray(facilities)) {
      college.facilities = facilities;
    }

    if (faculty && Array.isArray(faculty)) {
      college.faculty = faculty;
    }

    if (contactPerson !== undefined) {
      college.contactPerson = contactPerson;
    }

    if (contactPhone !== undefined) {
      college.contactPhone = contactPhone;
    }

    await college.save();

    return NextResponse.json({
      success: true,
      message:
        "Institution profile and self-reported capabilities updated successfully.",
      data: college,
    });
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error
        ? error.message
        : "Failed to update college profile";
    console.error("PUT /api/colleges/me error:", error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 },
    );
  }
}
