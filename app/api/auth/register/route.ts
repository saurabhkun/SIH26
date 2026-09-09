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
      // Gov RO specific
      fullName,
      designation,
      employeeId,
      // Consultancy specific
      firmName,
      domainExpertise,
      accreditation,
      address,
      contactPerson,
    } = body;

    if (!role || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Role, email, and password are required." },
        { status: 400 },
      );
    }

    if (role === "gov") {
      return NextResponse.json(
        {
          success: false,
          error:
            "State Department Nodal accounts are created by State Headquarters administrative mandate.",
        },
        { status: 403 },
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail.includes("@")) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please provide a valid institutional, corporate, or official email address.",
        },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: "Password must be at least 6 characters long.",
        },
        { status: 400 },
      );
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error:
            "An account with this email address already exists. Please sign in.",
        },
        { status: 409 },
      );
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    // 1. College / HEI Registration
    if (role === "college") {
      if (!institutionName || !district) {
        return NextResponse.json(
          {
            success: false,
            error: "Institution Name and District are required.",
          },
          { status: 400 },
        );
      }

      const validTiers: CollegeTier[] = ["L1", "L2", "L3R", "L3G"];
      const resolvedTier: CollegeTier = validTiers.includes(tier as CollegeTier)
        ? (tier as CollegeTier)
        : "L2";

      // Generate a clean college code
      const codeBase = institutionName
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 6)
        .toUpperCase();
      const code = `${codeBase}-${Math.floor(100 + Math.random() * 900)}`;

      const equipmentList = Array.isArray(labEquipment)
        ? labEquipment
        : typeof labEquipment === "string"
          ? labEquipment
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean)
          : [];

      // Create or update College doc
      const collegeDoc = await College.create({
        name: institutionName.trim(),
        code,
        email: normalizedEmail,
        tier: resolvedTier,
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
        availableStudentWorkforce:
          tier === "L1" ? 180 : tier === "L2" ? 120 : 60,
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
    }

    // 2. Industry Partner Registration
    if (role === "industry") {
      if (!companyName || !csrRegistrationNo) {
        return NextResponse.json(
          {
            success: false,
            error: "Company Name and MCA CSR Registration Number are required.",
          },
          { status: 400 },
        );
      }

      const newUser = await User.create({
        name: companyName.trim(),
        email: normalizedEmail,
        passwordHash,
        role: "industry",
        designation: csrDomainFocus
          ? `Head of CSR (${csrDomainFocus})`
          : "Head of CSR & Sustainability",
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

    // 3. Government Research Officer (Gov RO) Registration
    if (role === "gov_ro" || role === "GOV_RO") {
      if (!fullName || !designation) {
        return NextResponse.json(
          {
            success: false,
            error: "Full Name and Official Designation are required for Research Officers.",
          },
          { status: 400 },
        );
      }

      const officerDistrict = district || "State Headquarters";
      const officerEmpId = employeeId?.trim() || `JH-RO-${Math.floor(1000 + Math.random() * 9000)}`;

      const newUser = await User.create({
        name: fullName.trim(),
        email: normalizedEmail,
        passwordHash,
        role: "gov_ro",
        designation: designation.trim(),
        district: officerDistrict.trim(),
        employeeId: officerEmpId,
        organizationName: "Dept. of Higher & Technical Education (Govt of Jharkhand)",
      });

      const sessionPayload = {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: "gov_ro" as const,
        designation: newUser.designation,
        district: newUser.district,
        employeeId: newUser.employeeId,
        organizationName: newUser.organizationName,
      };

      const token = signSessionToken(sessionPayload);
      const response = NextResponse.json({
        success: true,
        message: "Research Officer account successfully created and authorized!",
        redirectUrl: "/dashboard/gov/ro",
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

    // 4. Technical Consultancy Firm Registration
    if (role === "consultancy" || role === "CONSULTANCY") {
      const legalFirmName = firmName || companyName;
      if (!legalFirmName) {
        return NextResponse.json(
          {
            success: false,
            error: "Firm Legal Name is required for Technical Consultancy registration.",
          },
          { status: 400 },
        );
      }

      const domainsList = Array.isArray(domainExpertise)
        ? domainExpertise
        : typeof domainExpertise === "string"
          ? domainExpertise
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean)
          : ["Water Effluent & Hydrology", "Geotechnical & Mine Reclamation"];

      const newUser = await User.create({
        name: contactPerson?.trim() || legalFirmName.trim(),
        email: normalizedEmail,
        passwordHash,
        role: "consultancy",
        designation: "Lead Technical Auditor & Partner",
        organizationName: legalFirmName.trim(),
        district: district?.trim() || "Ranchi",
        address: address?.trim(),
        contactPerson: contactPerson?.trim(),
        accreditation: accreditation?.trim() || "NABET / QCI / NABL Accredited",
        domainExpertise: domainsList,
        operatingDistricts: [district?.trim() || "All 24 Districts"],
      });

      const sessionPayload = {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: "consultancy" as const,
        designation: newUser.designation,
        district: newUser.district,
        organizationName: newUser.organizationName,
        accreditation: newUser.accreditation,
        domainExpertise: newUser.domainExpertise,
      };

      const token = signSessionToken(sessionPayload);
      const response = NextResponse.json({
        success: true,
        message: "Technical Consultancy Firm registered and empanelled!",
        redirectUrl: "/dashboard/consultancy",
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
      { success: false, error: "Invalid registration role specified." },
      { status: 400 },
    );
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error ? error.message : "Registration failed";
    console.error("POST /api/auth/register error:", error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 },
    );
  }
}
