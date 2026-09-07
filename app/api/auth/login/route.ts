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
  "rnd.director@bitmesra.ac.in": {
    name: "Dr. Ananya Sen",
    email: "rnd.director@bitmesra.ac.in",
    passwordHash: "College@1234",
    role: "college",
    designation: "Dean of Research & Innovation",
    district: "Ranchi",
  },
  "csr.head@tatasteel.com": {
    name: "Sanjay Chatterjee",
    email: "csr.head@tatasteel.com",
    passwordHash: "Industry@1234",
    role: "industry",
    designation: "Head of CSR & Sustainability",
    organizationName: "Tata Steel Foundation",
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
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, role } = body;

    if (!email || !password || !role) {
      return NextResponse.json(
        { success: false, error: "Please provide email, password, and target portal role." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    let user: AuthenticatedUserDoc | null = null;

    // 1. Try to find user in MongoDB
    try {
      await connectDB();
      user = await User.findOne({ email: normalizedEmail, role }).lean();
    } catch (dbErr) {
      console.warn("DB lookup bypassed, checking demo fallback:", dbErr);
    }

    // 2. Fallback to demo accounts for prototype resilience
    if (!user) {
      const demo = DEMO_ACCOUNTS[normalizedEmail];
      if (demo && demo.role === role && demo.passwordHash === password) {
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
          { status: 401 }
        );
      }
    }

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Account not found for this portal role. Please use demo credentials.",
        },
        { status: 401 }
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
    };

    const token = signSessionToken(sessionPayload);

    // Determine role dashboard redirect
    const redirectUrl =
      user.role === "gov"
        ? "/dashboard/gov"
        : user.role === "college"
        ? "/dashboard/college"
        : "/dashboard/industry";

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
    const errorMsg = error instanceof Error ? error.message : "Authentication failed";
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
