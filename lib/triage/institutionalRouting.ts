/**
 * Institutional Triage & Routing Decision Engine
 * Evaluates 5 deterministic criteria to determine optimal issue allocation:
 * 1. Existing Government RO Presence (hasExistingGovtRO)
 * 2. Problem Sensitivity (sensitivityLevel)
 * 3. Funding & Annual Budget Allocation (hasYearlyBudget)
 * 4. Government RO Capacity (govtROCapacity)
 * 5. University Technical Capability Assessment (uniCapabilityMatch)
 */

export type RoutingDecision = "GOVT_DEPT" | "GOVT_RO" | "UNIVERSITY_RESEARCH_ORG";
export type SensitivityLevel = "Public" | "Policy Sensitive" | "Security Sensitive";
export type GovtCapacityStatus = "Available" | "Moderate" | "High / Saturated";

export interface EmpaneledUniversityLab {
  id: string;
  name: string;
  department: string;
  domains: string[];
  nablAccredited: boolean;
  specializations: string[];
  equipmentReadinessScore: number; // 0.0 to 1.0
}

export interface RoutingFactors {
  isSensitive: boolean;
  sensitivityLevel: SensitivityLevel;
  existingGovtRO: boolean;
  hasDedicatedBudget: boolean;
  govtCapacityStatus: GovtCapacityStatus;
  uniCapabilityScore: number;
  eligibleUniversities: string[];
}

export interface RoutingEvaluationResult {
  routingDecision: RoutingDecision;
  confidenceScore: number;
  factors: RoutingFactors;
  rationale: string;
}

export interface IssueInputForRouting {
  title?: string;
  description?: string;
  domain?: string;
  category?: string;
  severityScore?: number;
  priority?: string;
  tags?: string[];
  aiTags?: string[];
  district?: string;
  sensitivityLevel?: SensitivityLevel;
  hasYearlyBudget?: boolean;
  hasDedicatedBudget?: boolean;
}

export interface RoutingContextData {
  hasExistingGovtRO?: boolean;
  govtROPresenceDomains?: string[];
  sensitivityLevel?: SensitivityLevel;
  hasYearlyBudget?: boolean;
  hasDedicatedBudget?: boolean;
  govtROCapacity?: GovtCapacityStatus;
  empaneledUniversities?: EmpaneledUniversityLab[];
}

// Empaneled State Academic Research Institutions & NABL Labs
export const DEFAULT_EMPANELED_UNIVERSITIES: EmpaneledUniversityLab[] = [
  {
    id: "bit-mesra-env",
    name: "BIT Mesra",
    department: "Department of Environmental Science & Chemical Testing",
    domains: ["Water Resources", "Environmental", "Urban Development", "Waste Management", "water", "environment"],
    nablAccredited: true,
    specializations: ["Heavy Metal Testing", "Fluoride/Arsenic Filtration", "Industrial Effluent Analysis", "IoT Water Telemetry"],
    equipmentReadinessScore: 0.95,
  },
  {
    id: "nit-jsr-civil",
    name: "NIT Jamshedpur",
    department: "Department of Civil & Metallurgical Engineering",
    domains: ["Infrastructure", "Roads & Bridges", "Structural Integrity", "Civil", "roads", "infrastructure"],
    nablAccredited: true,
    specializations: ["Non-Destructive Concrete Testing", "Soil Stabilization", "Pavement Design", "Bridge Load Telemetry"],
    equipmentReadinessScore: 0.92,
  },
  {
    id: "iit-ism-mining",
    name: "IIT (ISM) Dhanbad",
    department: "Department of Mining Engineering & Clean Coal Technology",
    domains: ["Mining & Geology", "Environmental", "Air Quality", "Heavy Industry", "mining", "environment"],
    nablAccredited: true,
    specializations: ["Fly Ash Utilization", "Mine Void Geo-technical Safety", "Acid Mine Drainage Remediation", "Air Particulate Sensors"],
    equipmentReadinessScore: 0.96,
  },
  {
    id: "bau-ranchi-agri",
    name: "Birsa Agricultural University (BAU) Ranchi",
    department: "Department of Agritech, Soil Science & Water Conservation",
    domains: ["Agritech & Soil", "Agriculture", "Irrigation", "Rural Livelihood", "farming", "livelihood"],
    nablAccredited: false,
    specializations: ["Micro-Irrigation Automation", "Drought-Resilient Crop Genetics", "Solar Agri-Pumping", "Bio-Fertilizer Formulation"],
    equipmentReadinessScore: 0.88,
  },
  {
    id: "ru-health-biotech",
    name: "Ranchi University / AIIMS Deoghar",
    department: "Biomedical Diagnostics & Community Health Surveillance",
    domains: ["Healthcare", "Public Health", "Nutrition", "health", "anganwadi"],
    nablAccredited: true,
    specializations: ["Point-of-Care Diagnostics", "Malnutrition Bio-Surveillance", "Mobile Clinic Telemetry", "Cold Chain Logistics"],
    equipmentReadinessScore: 0.89,
  },
];

// Domains where State Government has direct statutory operational arms (e.g. DWSD, PWD, JUVNL)
export const DEFAULT_GOVT_RO_DOMAINS = [
  "Roads & Bridges",
  "Urban Development",
  "Electricity & Power",
  "Law & Order",
  "Municipal Maintenance",
];

/**
 * Evaluates the 5 institutional routing parameters deterministically:
 * 1. Existing Government RO Presence
 * 2. Problem Sensitivity Level (Public / Policy Sensitive / Security Sensitive)
 * 3. Dedicated Annual Budget Line Presence
 * 4. Government RO Operational Capacity Status
 * 5. University Technical Capability & NABL Accreditation Match
 */
export function evaluateRoutingDestination(
  issue: IssueInputForRouting,
  contextData: RoutingContextData = {}
): RoutingEvaluationResult {
  const domain = (issue.domain || issue.category || "General Civic").toLowerCase();
  const textCorpus = `${issue.title || ""} ${issue.description || ""} ${issue.domain || ""} ${(issue.aiTags || []).join(" ")}`.toLowerCase();

  // 1. Sensitivity Level Assessment
  let sensitivityLevel: SensitivityLevel =
    contextData.sensitivityLevel ||
    issue.sensitivityLevel ||
    "Public";

  if (!contextData.sensitivityLevel && !issue.sensitivityLevel) {
    if (
      textCorpus.includes("border") ||
      textCorpus.includes("defense") ||
      textCorpus.includes("classified") ||
      textCorpus.includes("security") ||
      textCorpus.includes("vip escort") ||
      textCorpus.includes("critical infrastructure")
    ) {
      sensitivityLevel = "Security Sensitive";
    } else if (
      textCorpus.includes("policy") ||
      textCorpus.includes("land acquisition") ||
      textCorpus.includes("statutory audit") ||
      textCorpus.includes("cabinet note") ||
      textCorpus.includes("tribal land dispute")
    ) {
      sensitivityLevel = "Policy Sensitive";
    }
  }

  const isSensitive = sensitivityLevel !== "Public";

  // 2. Existing Government RO / Direct Wing Presence
  const govtRODomains = contextData.govtROPresenceDomains || DEFAULT_GOVT_RO_DOMAINS;
  const hasExistingGovtRO =
    contextData.hasExistingGovtRO !== undefined
      ? contextData.hasExistingGovtRO
      : govtRODomains.some((d) => domain.includes(d.toLowerCase()) || d.toLowerCase().includes(domain));

  // 3. Dedicated Annual Budget Line Assessment
  // Routine municipal works (potholes, streetlights, leak patches) usually have active budget lines
  let hasDedicatedBudget =
    contextData.hasDedicatedBudget !== undefined
      ? contextData.hasDedicatedBudget
      : issue.hasYearlyBudget !== undefined
      ? issue.hasYearlyBudget
      : false;

  if (contextData.hasDedicatedBudget === undefined && issue.hasYearlyBudget === undefined) {
    const isRoutineMaintenance =
      textCorpus.includes("pothole") ||
      textCorpus.includes("pipe leak") ||
      textCorpus.includes("streetlight") ||
      textCorpus.includes("garbage pickup") ||
      textCorpus.includes("drain cleaning") ||
      textCorpus.includes("handpump repair");
    if (isRoutineMaintenance) {
      hasDedicatedBudget = true;
    }
  }

  // 4. Government RO Capacity Status
  const govtCapacityStatus: GovtCapacityStatus =
    contextData.govtROCapacity || "Available";

  // 5. University Capability Matching
  const universities = contextData.empaneledUniversities || DEFAULT_EMPANELED_UNIVERSITIES;
  const eligibleUniversitiesList: { name: string; dept: string; score: number }[] = [];

  for (const uni of universities) {
    const domainMatch = uni.domains.some(
      (d) => domain.includes(d.toLowerCase()) || d.toLowerCase().includes(domain)
    );
    const textMatch = uni.specializations.some((spec) =>
      textCorpus.includes(spec.toLowerCase())
    );

    let matchScore = 0;
    if (domainMatch) matchScore += 0.5;
    if (textMatch) matchScore += 0.3;
    if (uni.nablAccredited) matchScore += 0.2;

    const finalScore = Math.min(matchScore * uni.equipmentReadinessScore + 0.1, 1.0);

    if (finalScore >= 0.70 || (domainMatch && uni.equipmentReadinessScore >= 0.85)) {
      eligibleUniversitiesList.push({
        name: `${uni.name} - ${uni.department}`,
        dept: uni.department,
        score: finalScore,
      });
    }
  }

  // Sort matched universities by readiness
  eligibleUniversitiesList.sort((a, b) => b.score - a.score);
  const bestUniScore = eligibleUniversitiesList[0]?.score || 0;
  const eligibleUniversityNames = eligibleUniversitiesList.map((u) => u.name);

  // DECISION LOGIC MATRIX

  // RULE 1: Problem Sensitivity (Security / Policy sensitive MUST stay in Gov)
  if (isSensitive) {
    return {
      routingDecision: "GOVT_DEPT",
      confidenceScore: 0.98,
      factors: {
        isSensitive: true,
        sensitivityLevel,
        existingGovtRO: hasExistingGovtRO,
        hasDedicatedBudget,
        govtCapacityStatus,
        uniCapabilityScore: bestUniScore,
        eligibleUniversities: eligibleUniversityNames,
      },
      rationale: `Retained under strict Government control: Issue classified as "${sensitivityLevel}" which statutory governance mandates retaining within sovereign departmental jurisdiction.`,
    };
  }

  // RULE 2: Standard Routine Maintenance with Active Budget -> GOVT_DEPT
  if (hasDedicatedBudget && hasExistingGovtRO && govtCapacityStatus !== "High / Saturated") {
    return {
      routingDecision: "GOVT_DEPT",
      confidenceScore: 0.94,
      factors: {
        isSensitive: false,
        sensitivityLevel,
        existingGovtRO: true,
        hasDedicatedBudget: true,
        govtCapacityStatus,
        uniCapabilityScore: bestUniScore,
        eligibleUniversities: eligibleUniversityNames,
      },
      rationale: "Retained by Government Department: Active departmental fiscal budget exists and issue requires standard statutory enforcement / municipal maintenance.",
    };
  }

  // RULE 3: Government RO Available with dedicated state laboratory mandate -> GOVT_RO
  if (hasExistingGovtRO && govtCapacityStatus === "Available" && bestUniScore < 0.75) {
    return {
      routingDecision: "GOVT_RO",
      confidenceScore: 0.91,
      factors: {
        isSensitive: false,
        sensitivityLevel,
        existingGovtRO: true,
        hasDedicatedBudget,
        govtCapacityStatus: "Available",
        uniCapabilityScore: bestUniScore,
        eligibleUniversities: eligibleUniversityNames,
      },
      rationale: "Assigned to State Government Research Organization: Dedicated departmental presence exists and State Nodal Laboratory has active operational capacity.",
    };
  }

  // RULE 4: Unbudgeted / Exploratory R&D or Gov Lab Saturated with High University Capability -> UNIVERSITY_RESEARCH_ORG
  if (
    (!hasDedicatedBudget || govtCapacityStatus === "High / Saturated" || !hasExistingGovtRO) &&
    bestUniScore >= 0.70 &&
    eligibleUniversityNames.length > 0
  ) {
    const triggerReason =
      govtCapacityStatus === "High / Saturated"
        ? "State Government RO laboratories are saturated / overloaded"
        : !hasDedicatedBudget
        ? "Unbudgeted exploratory civic challenge requiring academic R&D, prototype validation, or CSR co-funding"
        : "Specialized problem domain without dedicated state operational lab";

    return {
      routingDecision: "UNIVERSITY_RESEARCH_ORG",
      confidenceScore: Math.max(0.88, Math.min(0.96, bestUniScore)),
      factors: {
        isSensitive: false,
        sensitivityLevel,
        existingGovtRO: hasExistingGovtRO,
        hasDedicatedBudget,
        govtCapacityStatus,
        uniCapabilityScore: bestUniScore,
        eligibleUniversities: eligibleUniversityNames,
      },
      rationale: `Allocated to Academic Research Organization: ${triggerReason}. Matched with empaneled institutions (${eligibleUniversityNames.slice(0, 2).join("; ")}) with ${(bestUniScore * 100).toFixed(0)}% capability alignment.`,
    };
  }

  // RULE 5: Fallback - University lacks equipment/accreditation (< 0.70) -> Retain under Gov RO / Dept
  return {
    routingDecision: hasExistingGovtRO ? "GOVT_RO" : "GOVT_DEPT",
    confidenceScore: 0.85,
    factors: {
      isSensitive: false,
      sensitivityLevel,
      existingGovtRO: hasExistingGovtRO,
      hasDedicatedBudget,
      govtCapacityStatus,
      uniCapabilityScore: bestUniScore,
      eligibleUniversities: eligibleUniversityNames,
    },
    rationale: `Retained under Government oversight: Empaneled universities lack specialized testing gear or NABL accreditation for "${issue.domain || "Civic"}" (Capability: ${(bestUniScore * 100).toFixed(0)}% < 70% threshold).`,
  };
}
