import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
import College from "@/lib/models/College";
import { signSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { CollegeTier } from "@/types/civic";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      role,
      email,
      password,
      // University specific
      institutionName,
      district,
      tier,
      labEquipment,
      facultyLeadName,
      // Industry specific
      companyName,
      csrRegistrationNo,
      csrDomainFocus,
    } = body;

    if (!role || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Role, email, and password are required." },
        { status: 400 }
      );
    }

    if (role === "gov") {
      return NextResponse.json(
        {
          success: false,
          error: "Government departmental nodal accounts are invitation-only by State Administration.",
        },
        { status: 403 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid institutional or corporate email address." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "An account with this email address already exists. Please sign in." },
        { status: 409 }
      );
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    if (role === "college") {
      if (!institutionName || !district || !tier) {
        return NextResponse.json(
          { success: false, error: "Institution Name, District, and Academic Tier (L1/L2/L3R/L3G) are required." },
          { status: 400 }
        );
      }

      const validTiers: CollegeTier[] = ["L1", "L2", "L3R", "L3G"];
      if (!validTiers.includes(tier as CollegeTier)) {
        return NextResponse.json(
          { success: false, error: "Invalid tier selected. Must be L1, L2, L3R, or L3G." },
          { status: 400 }
        );
      }

      // Generate a clean college code
      const codeBase = institutionName
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 6)
        .toUpperCase();
      const code = `${codeBase}-${Math.floor(100 + Math.random() * 900)}`;

      const equipmentList = Array.isArray(labEquipment)
        ? labEquipment
        : typeof labEquipment === "string"
        ? labEquipment.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [];

      // Create or update College doc
      const collegeDoc = await College.create({
        name: institutionName.trim(),
        code,
        email: normalizedEmail,
        tier: tier as CollegeTier,
        district: district.trim(),
        facilities: equipmentList.map((eq: string) => ({
          name: eq,
          equipment: [eq],
          certification: "State Certified Lab Cell",
        })),
        faculty: facultyLeadName
          ? [
              {
                name: facultyLeadName.trim(),
                department: "Applied Research & Innovation",
                specialization: "Principal Investigator",
                email: normalizedEmail,
              },
            ]
          : [],
        activeFacultyCount: tier === "L1" ? 40 : tier === "L2" ? 25 : 15,
        availableStudentWorkforce: tier === "L1" ? 180 : tier === "L2" ? 120 : 60,
        reputationScore: tier === "L1" ? 4.9 : 4.6,
        verified: true,
      });

      // Create User doc
      const newUser = await User.create({
        name: facultyLeadName?.trim() || institutionName.trim(),
        email: normalizedEmail,
        passwordHash,
        role: "college",
        designation: "Dean of Research / Principal Investigator",
        district: district.trim(),
        college: collegeDoc._id,
        organizationName: institutionName.trim(),
      });

      const sessionPayload = {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: "college" as const,
        designation: newUser.designation,
        district: newUser.district,
        organizationName: institutionName.trim(),
        collegeId: collegeDoc._id.toString(),
      };

      const token = signSessionToken(sessionPayload);
      const response = NextResponse.json({
        success: true,
        message: "Institution successfully registered and verified!",
        redirectUrl: "/dashboard/college",
        user: sessionPayload,
      });

      response.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });

      return response;
    } else if (role === "industry") {
      if (!companyName || !csrRegistrationNo) {
        return NextResponse.json(
          { success: false, error: "Company Name and MCA CSR Registration Number are required." },
          { status: 400 }
        );
      }

      // Create User doc for industry partner
      const newUser = await User.create({
        name: companyName.trim(),
        email: normalizedEmail,
        passwordHash,
        role: "industry",
        designation: csrDomainFocus ? `Head of CSR (${csrDomainFocus})` : "Head of CSR & Sustainability",
        organizationName: companyName.trim(),
      });

      const sessionPayload = {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: "industry" as const,
        designation: newUser.designation,
        organizationName: companyName.trim(),
      };

      const token = signSessionToken(sessionPayload);
      const response = NextResponse.json({
        success: true,
        message: "CSR Corporate Partner successfully registered!",
        redirectUrl: "/dashboard/industry",
        user: sessionPayload,
      });

      response.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: "Invalid role specified." },
      { status: 400 }
    );
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Registration failed";
    console.error("POST /api/auth/register error:", error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
