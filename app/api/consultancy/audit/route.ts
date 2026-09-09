import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export interface AuditProject {
  id: string;
  proposalId: string;
  issueId: string;
  trackingCode: string;
  title: string;
  collegeName: string;
  tier: string;
  district: string;
  domain: string;
  sponsorName: string;
  totalBudget: number;
  assignedConsultancy: string;
  accreditationRequired: string;
  status: "Audit_Assigned" | "Field_Inspection_Scheduled" | "Lab_Assay_In_Progress" | "Report_Submitted" | "Approved";
  currentMilestone: {
    index: number;
    title: string;
    description: string;
    fundingReleaseAmount: number;
    targetDate: string;
  };
  labParametersTested: {
    name: string;
    expectedStandard: string;
    measuredValue?: string;
    unit: string;
    pass?: boolean;
  }[];
  auditVerdict?: "APPROVED" | "DEFECTS_IDENTIFIED";
  auditReportUrl?: string;
  auditorRemarks?: string;
  certifiedAt?: string;
}

// In-memory demo audits seed store for initial presentation
const DEMO_AUDITS: AuditProject[] = [
  {
    id: "audit-101",
    proposalId: "prop_water_01",
    issueId: "iss_fluoride_01",
    trackingCode: "JH-2026-WTR-8841",
    title: "Nano-Alumina Packed Filter Column for High Fluoride Ground Wells",
    collegeName: "Birla Institute of Technology (BIT), Mesra",
    tier: "L1",
    district: "Garhwa",
    domain: "Water Resources",
    sponsorName: "Tata Steel Foundation (CSR)",
    totalBudget: 450000,
    assignedConsultancy: "Central Mine Planning & Design Institute (CMPDI)",
    accreditationRequired: "NABL ISO 17025 / JSPCB Approved",
    status: "Lab_Assay_In_Progress",
    currentMilestone: {
      index: 1,
      title: "Phase 1: Laboratory Spectroscopic & Toxicity Assay",
      description: "Sample collection across 12 test tube-wells in Garhwa block; lab ICP-MS fluoride reduction verification below 1.0 mg/L threshold.",
      fundingReleaseAmount: 180000,
      targetDate: "2026-10-15",
    },
    labParametersTested: [
      { name: "Fluoride Ion Concentration", expectedStandard: "< 1.0", measuredValue: "0.42", unit: "mg/L", pass: true },
      { name: "Arsenic Trace Levels", expectedStandard: "< 0.01", measuredValue: "0.003", unit: "mg/L", pass: true },
      { name: "Effluent Turbidity (NTU)", expectedStandard: "< 5.0", measuredValue: "1.8", unit: "NTU", pass: true },
      { name: "Total Dissolved Solids (TDS)", expectedStandard: "< 500", measuredValue: "280", unit: "mg/L", pass: true },
    ],
  },
  {
    id: "audit-102",
    proposalId: "prop_mine_02",
    issueId: "iss_coal_02",
    trackingCode: "JH-2026-ENV-4190",
    title: "Fly-Ash & Geopolymer Soil Stabilization for Abandoned Overburden Dumps",
    collegeName: "IIT (ISM) Dhanbad",
    tier: "L1",
    district: "Dhanbad",
    domain: "Environment & Mining",
    sponsorName: "Coal India CSR Trust",
    totalBudget: 750000,
    assignedConsultancy: "Central Mine Planning & Design Institute (CMPDI)",
    accreditationRequired: "DGMS / NABET Category A",
    status: "Field_Inspection_Scheduled",
    currentMilestone: {
      index: 2,
      title: "Phase 2: Pilot Slope Stability & Core Shear Strength Audit",
      description: "Field geotechnical core drilling at Jharia Overburden Dump #4 to verify slope safety factor >= 1.5.",
      fundingReleaseAmount: 300000,
      targetDate: "2026-11-01",
    },
    labParametersTested: [
      { name: "Slope Safety Factor (FoS)", expectedStandard: ">= 1.50", measuredValue: "1.68", unit: "Ratio", pass: true },
      { name: "Unconfined Compressive Strength", expectedStandard: ">= 2.5", measuredValue: "3.1", unit: "MPa", pass: true },
      { name: "Heavy Metal Leachability (TCLP)", expectedStandard: "Non-Hazardous", measuredValue: "Below Detectable Limit", unit: "mg/L", pass: true },
    ],
  },
  {
    id: "audit-103",
    proposalId: "prop_bridge_03",
    issueId: "iss_infra_03",
    trackingCode: "JH-2026-INF-9210",
    title: "Fiber-Reinforced Polymer Crack Remediation for Rural Check Dams",
    collegeName: "National Institute of Technology (NIT), Jamshedpur",
    tier: "L2",
    district: "Saraikela-Kharsawan",
    domain: "Public Works & Infrastructure",
    sponsorName: "Hindalco Rural Development CSR",
    totalBudget: 380000,
    assignedConsultancy: "MECON Limited",
    accreditationRequired: "Ministry of Steel PSU / NABL Accredited",
    status: "Report_Submitted",
    currentMilestone: {
      index: 1,
      title: "Phase 1: Ultrasonic Crack Depth & Hydrostatic Pressure Audit",
      description: "Non-destructive ultrasonic pulse velocity profiling of repaired check dam spillway.",
      fundingReleaseAmount: 150000,
      targetDate: "2026-09-30",
    },
    labParametersTested: [
      { name: "Ultrasonic Pulse Velocity", expectedStandard: ">= 3.75", measuredValue: "4.12", unit: "km/s", pass: true },
      { name: "Hydrostatic Seepage Rate", expectedStandard: "< 0.05", measuredValue: "0.01", unit: "L/min/m²", pass: true },
    ],
    auditVerdict: "APPROVED",
    auditorRemarks: "Ultrasonic testing confirmed 100% void fill and structural bonding. Recommended for immediate Milestone 1 fund release.",
    certifiedAt: "2026-09-08T10:30:00Z",
  },
];

export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser();
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("status");

    let filteredAudits = DEMO_AUDITS;
    if (filter && filter !== "all") {
      filteredAudits = DEMO_AUDITS.filter((a) => a.status === filter);
    }

    const firmName =
      user?.organizationName ||
      "Central Mine Planning & Design Institute (CMPDI)";

    const metrics = {
      activeAudits: DEMO_AUDITS.filter((a) => a.status !== "Approved").length,
      pendingInspections: DEMO_AUDITS.filter((a) => a.status === "Field_Inspection_Scheduled" || a.status === "Lab_Assay_In_Progress").length,
      completedCertifications: DEMO_AUDITS.filter((a) => a.auditVerdict === "APPROVED").length,
      totalDisbursementsUnlocked: 630000,
    };

    return NextResponse.json({
      success: true,
      data: {
        firmName,
        accreditation: user?.accreditation || "NABET / QCI Accredited (Category A)",
        audits: filteredAudits,
        metrics,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch audit data";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      auditId,
      verdict,
      remarks,
      reportUrl,
      measuredParameters,
    } = body;

    if (!auditId || !verdict) {
      return NextResponse.json(
        { success: false, error: "Audit ID and inspection verdict are required." },
        { status: 400 },
      );
    }

    const audit = DEMO_AUDITS.find((a) => a.id === auditId);
    if (!audit) {
      return NextResponse.json(
        { success: false, error: "Audit project not found." },
        { status: 404 },
      );
    }

    audit.auditVerdict = verdict;
    audit.auditorRemarks = remarks || (verdict === "APPROVED" ? "Milestone verified and certified by third-party technical auditor." : "Defects identified during field inspection; corrective actions required.");
    audit.auditReportUrl = reportUrl || "https://civicresolve.gov.in/reports/audit-cert-signed.pdf";
    audit.certifiedAt = new Date().toISOString();
    audit.status = verdict === "APPROVED" ? "Approved" : "Lab_Assay_In_Progress";

    if (measuredParameters && Array.isArray(measuredParameters)) {
      audit.labParametersTested = measuredParameters;
    }

    return NextResponse.json({
      success: true,
      message:
        verdict === "APPROVED"
          ? `✓ Milestone Verified! Third-party Compliance Certificate issued for ${audit.trackingCode}. Funds release authorized.`
          : `⚠️ Defect Report filed for ${audit.trackingCode}. College team notified for remediation.`,
      data: audit,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Audit submission failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
