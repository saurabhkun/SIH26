import Groq from "groq-sdk";

export interface TriageResult {
  isStarred: boolean;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  severityScore: number; // 1 to 5
  aiAnalysisReason: string;
  suggestedDepartment: string;
}

// Deterministic high-hazard heuristics for fallback and offline environments
const CRITICAL_KEYWORDS = [
  "arsenic",
  "fluoride",
  "chemical leak",
  "toxic effluent",
  "mine cave-in",
  "mine subsidence",
  "lead contamination",
  "heavy metal",
  "cyanide",
  "dam breach",
  "cracked check dam",
  "bridge collapse",
  "ceiling collapse",
  "severe acute malnutrition",
  "sam children",
  "hospital cold-chain",
  "vaccine spoiled",
  "maternal death",
  "epidemic",
  "cholera outbreak",
  "methane leak",
  "radioactive",
  "poisoning",
];

const HIGH_KEYWORDS = [
  "drinking water contaminated",
  "crop failure",
  "drought emergency",
  "transformer blast",
  "power grid failure",
  "landslide",
  "erosion",
  "structural crack",
  "sewage overflow in school",
];

function fallbackHeuristicTriage(
  title: string,
  description: string,
  category: string,
  district: string,
): TriageResult {
  const text = `${title} ${description} ${category}`.toLowerCase();

  const isCritical = CRITICAL_KEYWORDS.some((kw) => text.includes(kw));
  if (isCritical) {
    const matchedKw =
      CRITICAL_KEYWORDS.find((kw) => text.includes(kw)) || "hazardous threat";
    return {
      isStarred: true,
      priority: "CRITICAL",
      severityScore: 5,
      aiAnalysisReason: `High-criticality public hazard detected: identified "${matchedKw}" signature in ${district} requiring immediate emergency R&D and nodal intervention.`,
      suggestedDepartment: "Disaster Management & Higher Technical Education",
    };
  }

  const isHigh = HIGH_KEYWORDS.some((kw) => text.includes(kw));
  if (isHigh) {
    return {
      isStarred: true,
      priority: "HIGH",
      severityScore: 4,
      aiAnalysisReason: `Significant community impact identified in ${district} (${category}). Flagged for expedited academic review and priority CSR co-funding.`,
      suggestedDepartment: "Dept. of Higher & Technical Education",
    };
  }

  return {
    isStarred: false,
    priority: "MEDIUM",
    severityScore: 2,
    aiAnalysisReason: "Automated triage pending manual Nodal Officer review.",
    suggestedDepartment: "Higher & Technical Education",
  };
}

export async function analyzeIssueCriticality(
  title: string,
  description: string,
  category: string,
  district: string,
): Promise<TriageResult> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return fallbackHeuristicTriage(title, description, category, district);
  }

  try {
    const groq = new Groq({ apiKey });

    const prompt = `
You are an expert civic grievance triage officer for the Government of Jharkhand.
Analyze this submitted problem:
- Category: ${category}
- District: ${district}
- Title: ${title}
- Description: ${description}

Evaluate whether this issue poses an immediate public health emergency, toxic contamination, structural collapse hazard, or severe child risk requiring urgent R&D intervention.

Return ONLY raw valid JSON conforming exactly to this structure:
{
  "isStarred": boolean,
  "priority": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "severityScore": number,
  "aiAnalysisReason": "Short 1-2 sentence technical rationale",
  "suggestedDepartment": "Department Name"
}
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are an automated government triage parser. Return valid raw JSON only without markdown or code fences.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.1-8b-instant",
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const content = chatCompletion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content) as TriageResult;

    return {
      isStarred: Boolean(parsed.isStarred),
      priority: ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(parsed.priority)
        ? parsed.priority
        : parsed.isStarred
        ? "CRITICAL"
        : "MEDIUM",
      severityScore: Math.min(
        5,
        Math.max(
          1,
          Number(parsed.severityScore) || (parsed.isStarred ? 5 : 2),
        ),
      ),
      aiAnalysisReason:
        parsed.aiAnalysisReason ||
        "Automated triage completed by AI officer.",
      suggestedDepartment:
        parsed.suggestedDepartment || "Higher & Technical Education",
    };
  } catch (error) {
    console.error("AI Triage error fallback:", error);
    return fallbackHeuristicTriage(title, description, category, district);
  }
}
