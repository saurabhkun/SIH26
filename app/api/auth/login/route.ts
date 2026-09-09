import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User, { UserRole } from "@/lib/models/User";
import { signSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

// Preset default demo accounts fallback if database has not yet been seeded
const DEMO_ACCOUNTS: Record<
  string,
  {
    name: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    designation: string;
    district?: string;
    organizationName?: string;
    employeeId?: string;
    accreditation?: string;
    domainExpertise?: string[];
  }
> = {
  "officer@jharkhand.gov.in": {
    name: "Dr. Arvind Kumar",
    email: "officer@jharkhand.gov.in",
    passwordHash: "Gov@1234",
    role: "gov",
    designation: "State Nodal Review Officer",
    district: "Ranchi",
  },
  "ro.evaluator@jharkhand.gov.in": {
    name: "Dr. Birendra Mahato",
    email: "ro.evaluator@jharkhand.gov.in",
    passwordHash: "Ro@1234",
    role: "gov_ro",
    designation: "District Research Officer & State Evaluator",
    district: "Ranchi",
    employeeId: "JH-RO-8842",
  },
  "director.rnd@bitmesra.ac.in": {
    name: "Dr. Ananya Sen",
    email: "director.rnd@bitmesra.ac.in",
    passwordHash: "College@1234",
    role: "college",
    designation: "Dean of Research & Innovation",
    district: "Ranchi",
    organizationName: "BIT Mesra, Ranchi",
  },
  "csr.head@tatasteel.com": {
    name: "Sanjay Chatterjee",
    email: "csr.head@tatasteel.com",
    passwordHash: "Industry@1234",
    role: "industry",
    designation: "Head of CSR & Sustainability",
    organizationName: "Tata Steel Foundation",
  },
  "audit.lead@cmpdi.co.in": {
    name: "Dr. Alok K. Mishra",
    email: "audit.lead@cmpdi.co.in",
    passwordHash: "Consultancy@1234",
    role: "consultancy",
    designation: "Chief Technical Auditor & Environmental Assayer",
    organizationName: "Central Mine Planning & Design Institute (CMPDI)",
    district: "Ranchi",
    accreditation: "NABET / QCI Accredited (Category A)",
    domainExpertise: [
      "Mining Reclamation",
      "Air Quality Monitoring",
      "Water Contamination Assays",
      "Structural Stability Audits",
    ],
  },
};

interface AuthenticatedUserDoc {
  _id: string | { toString: () => string };
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  designation?: string;
  district?: string;
  college?: string | { toString: () => string };
  organizationName?: string;
  employeeId?: string;
  accreditation?: string;
  domainExpertise?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, role } = body;

    if (!email || !password || !role) {
      return NextResponse.json(
        {
          success: false,
          error: "Please provide email, password, and target portal role.",
        },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedRole = role.toLowerCase().trim();

    // Map role aliases
    const targetRole: UserRole =
      normalizedRole === "gov_ro" || normalizedRole === "ro"
        ? "gov_ro"
        : normalizedRole === "consultancy"
        ? "consultancy"
        : normalizedRole === "gov"
        ? "gov"
        : normalizedRole === "college"
        ? "college"
        : normalizedRole === "industry"
        ? "industry"
        : "citizen";

    let user: AuthenticatedUserDoc | null = null;

    // 1. Try to find user in MongoDB
    try {
      await connectDB();
      user = await User.findOne({
        email: normalizedEmail,
        role: targetRole,
      }).lean();
    } catch (dbErr) {
      console.warn("DB lookup bypassed, checking demo fallback:", dbErr);
    }

    // 2. Fallback to demo accounts for prototype resilience
    if (!user) {
      const demo = DEMO_ACCOUNTS[normalizedEmail];
      if (demo && (demo.role === targetRole || demo.role.toLowerCase() === normalizedRole) && demo.passwordHash === password) {
        user = {
          _id: `demo_${demo.role}_id`,
          ...demo,
        };
      }
    } else {
      // Validate password (supports bcrypt hash and plaintext demo passwords)
      let isMatch = user.passwordHash === password;
      if (!isMatch) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const bcrypt = require("bcryptjs");
          isMatch = bcrypt.compareSync(password, user.passwordHash);
        } catch {
          isMatch = false;
        }
      }

      if (!isMatch) {
        return NextResponse.json(
          { success: false, error: "Invalid email or password credentials." },
          { status: 401 },
        );
      }
    }

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Account not found for this portal role. Please check credentials or use demo login.",
        },
        { status: 401 },
      );
    }

    // 3. Generate signed session token
    const sessionPayload = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      designation: user.designation,
      district: user.district,
      organizationName: user.organizationName,
      collegeId: user.college?.toString(),
      employeeId: user.employeeId,
      accreditation: user.accreditation,
      domainExpertise: user.domainExpertise,
    };

    const token = signSessionToken(sessionPayload);

    // Determine role dashboard redirect
    const redirectUrl =
      user.role === "gov_ro"
        ? "/dashboard/gov/ro"
        : user.role === "consultancy"
        ? "/dashboard/consultancy"
        : user.role === "gov"
        ? "/dashboard/gov"
        : user.role === "college"
        ? "/dashboard/college"
        : user.role === "industry"
        ? "/dashboard/industry"
        : "/";

    const response = NextResponse.json({
      success: true,
      message: `Authenticated as ${user.name} (${user.role.toUpperCase()})`,
      user: sessionPayload,
      redirectUrl,
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      sameSite: "lax",
    });

    return response;
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error ? error.message : "Authentication failed";
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 },
    );
  }
}
