import { ISSUE_DOMAINS, IssueDomain } from "./constants/domains";

interface ClassificationResult {
  suggestedDomain: IssueDomain;
  suggestedSeverity: number;
  aiTags: string[];
  confidence: number;
}

const DOMAIN_KEYWORDS: Record<IssueDomain, string[]> = {
  "Water Resources": [
    "water",
    "handpump",
    "borewell",
    "tubewell",
    "drinking water",
    "fluoride",
    "arsenic",
    "contamination",
    "pipeline",
    "tank",
    "well",
    "chlorination",
    "seepage",
    "drought",
  ],
  "Urban Development": [
    "road",
    "pothole",
    "culvert",
    "bridge",
    "traffic",
    "street light",
    "streetlight",
    "drainage",
    "flyover",
    "encroachment",
    "footpath",
    "urban",
    "sidewalk",
  ],
  Agriculture: [
    "farmer",
    "crop",
    "paddy",
    "irrigation",
    "canal",
    "check dam",
    "checkdam",
    "silt",
    "siltation",
    "soil",
    "fertilizer",
    "pesticide",
    "harvest",
    "seeds",
    "agriculture",
    "kisan",
  ],
  Healthcare: [
    "hospital",
    "phc",
    "chc",
    "doctor",
    "nurse",
    "medicine",
    "vaccine",
    "cold chain",
    "coldchain",
    "ambulance",
    "clinic",
    "health",
    "infection",
    "disease",
    "maternity",
  ],
  Education: [
    "school",
    "college",
    "classroom",
    "teacher",
    "books",
    "student",
    "midday meal",
    "blackboard",
    "laboratory",
    "hostel",
    "education",
    "desk",
  ],
  Environment: [
    "pollution",
    "coal dust",
    "dust",
    "emission",
    "smoke",
    "air quality",
    "mining",
    "forest",
    "tree",
    "deforestation",
    "river pollution",
    "chemical",
    "toxic",
  ],
  Energy: [
    "electricity",
    "power",
    "transformer",
    "blackout",
    "load shedding",
    "voltage",
    "solar",
    "wire",
    "grid",
    "substation",
    "microgrid",
    "power cut",
  ],
  Sanitation: [
    "toilet",
    "garbage",
    "waste",
    "dumping",
    "sewer",
    "sewage",
    "open defecation",
    "dustbin",
    "solid waste",
    "sanitation",
    "swachh",
  ],
  "Rural Livelihoods": [
    "lac",
    "tussar",
    "silk",
    "artisan",
    "handicraft",
    "tribal",
    "weaver",
    "weaving",
    "mgnrega",
    "self help group",
    "shg",
    "livelihood",
    "forest produce",
    "minor forest produce",
    "mahua",
  ],
  Accessibility: [
    "wheelchair",
    "ramp",
    "disabled",
    "divyang",
    "barrier",
    "braille",
    "elderly",
    "hearing",
    "visual impairment",
    "special needs",
  ],
  "Public Administration": [
    "ration",
    "pension",
    "certificate",
    "caste certificate",
    "officer",
    "bribe",
    "panchayat office",
    "block office",
    "aadhaar",
    "voter",
    "corruption",
  ],
};

const HIGH_SEVERITY_KEYWORDS = [
  "critical",
  "severe",
  "poison",
  "fluorosis",
  "death",
  "casualty",
  "collapse",
  "emergency",
  "hazard",
  "life-threatening",
  "epidemic",
  "urgent",
  "fatal",
  "toxic",
  "outbreak",
];

const MODERATE_SEVERITY_KEYWORDS = [
  "damaged",
  "broken",
  "leak",
  "intermittent",
  "shortage",
  "delayed",
  "spoilage",
  "loss",
  "choked",
  "failing",
];

/**
 * Classifies a civic issue description into a suggested domain and severity level
 */
export function classifyIssueDescription(
  text: string,
  title: string = ""
): ClassificationResult {
  const combined = `${title} ${text}`.toLowerCase();

  // 1. Calculate domain keyword matches
  const scores: Record<IssueDomain, number> = {} as Record<IssueDomain, number>;
  const matchedTags: string[] = [];

  for (const domain of ISSUE_DOMAINS) {
    scores[domain] = 0;
    const keywords = DOMAIN_KEYWORDS[domain] || [];

    for (const kw of keywords) {
      if (combined.includes(kw)) {
        scores[domain] += 1;
        matchedTags.push(kw.replace(/\s+/g, "-"));
      }
    }
  }

  // Find domain with highest score
  let maxScore = 0;
  let bestDomain: IssueDomain = "Urban Development"; // Default fallback

  for (const domain of ISSUE_DOMAINS) {
    if (scores[domain] > maxScore) {
      maxScore = scores[domain];
      bestDomain = domain;
    }
  }

  // 2. Calculate Severity Heuristic (1 to 5)
  let severity = 3; // Baseline moderate

  let highCount = 0;
  for (const hkw of HIGH_SEVERITY_KEYWORDS) {
    if (combined.includes(hkw)) highCount++;
  }

  let modCount = 0;
  for (const mkw of MODERATE_SEVERITY_KEYWORDS) {
    if (combined.includes(mkw)) modCount++;
  }

  if (highCount >= 2) {
    severity = 5;
  } else if (highCount === 1) {
    severity = 4;
  } else if (modCount >= 2) {
    severity = 3;
  } else if (combined.length < 50) {
    severity = 2;
  }

  // Confidence calculation
  const confidence = maxScore > 0 ? Math.min(95, 50 + maxScore * 15) : 40;

  // Clean and unique tags
  const uniqueTags = Array.from(new Set(matchedTags)).slice(0, 5);

  return {
    suggestedDomain: bestDomain,
    suggestedSeverity: severity,
    aiTags: uniqueTags,
    confidence,
  };
}
