/**
 * Curated high-resolution civic, societal, and infrastructure photographic evidence CDN URLs.
 * Used for seed datasets, test fixtures, and fallback media rendering across all dashboards.
 */

export const SEED_CIVIC_MEDIA: Record<string, string[]> = {
  waterContamination: [
    "https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1574482620826-40685ca5ebd2?auto=format&fit=crop&w=800&q=80",
  ],
  schoolInfra: [
    "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80",
  ],
  ruralRoads: [
    "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1578991624414-276ef23a534f?auto=format&fit=crop&w=800&q=80",
  ],
  agritech: [
    "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=800&q=80",
  ],
  environment: [
    "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80",
  ],
  healthcare: [
    "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80",
  ],
  energy: [
    "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80",
  ],
  sanitation: [
    "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1604187351574-c75ca79f5807?auto=format&fit=crop&w=800&q=80",
  ],
  ruralLivelihoods: [
    "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&w=800&q=80",
  ],
};

/**
 * Returns a reliable public CDN media URL for a given domain/category and index.
 */
export function getContextualMediaUrl(domain?: string, index = 0): string {
  const d = (domain || "").toLowerCase();
  let pool = SEED_CIVIC_MEDIA.waterContamination;

  if (d.includes("water") || d.includes("handpump") || d.includes("fluoride")) {
    pool = SEED_CIVIC_MEDIA.waterContamination;
  } else if (d.includes("agri") || d.includes("crop") || d.includes("farm") || d.includes("irrigation")) {
    pool = SEED_CIVIC_MEDIA.agritech;
  } else if (d.includes("school") || d.includes("edu") || d.includes("student")) {
    pool = SEED_CIVIC_MEDIA.schoolInfra;
  } else if (d.includes("road") || d.includes("pothole") || d.includes("urban") || d.includes("traffic") || d.includes("bridge")) {
    pool = SEED_CIVIC_MEDIA.ruralRoads;
  } else if (d.includes("health") || d.includes("vaccine") || d.includes("doctor") || d.includes("phc")) {
    pool = SEED_CIVIC_MEDIA.healthcare;
  } else if (d.includes("power") || d.includes("electric") || d.includes("energy") || d.includes("solar")) {
    pool = SEED_CIVIC_MEDIA.energy;
  } else if (d.includes("waste") || d.includes("sanitat") || d.includes("garbage") || d.includes("drain")) {
    pool = SEED_CIVIC_MEDIA.sanitation;
  } else if (d.includes("lac") || d.includes("livelihood") || d.includes("tribal") || d.includes("shg")) {
    pool = SEED_CIVIC_MEDIA.ruralLivelihoods;
  } else if (d.includes("mine") || d.includes("coal") || d.includes("forest") || d.includes("dust") || d.includes("environ")) {
    pool = SEED_CIVIC_MEDIA.environment;
  }

  return pool[index % pool.length];
}

/**
 * Validates and cleanses image URLs so that invalid/fictional hosts (like storage.civicresolve.gov.in)
 * are replaced with reliable contextual photos.
 */
export function sanitizeMediaUrl(url?: string, domain?: string, index = 0): string {
  if (!url || typeof url !== "string" || url.trim().length === 0) {
    return getContextualMediaUrl(domain, index);
  }
  const cleanUrl = url.trim();
  // Filter out nonexistent/fake mock government domains
  if (
    cleanUrl.includes("storage.civicresolve.gov.in") ||
    cleanUrl.includes("civicresolve.gov.in") ||
    cleanUrl.includes("example.gov.in") ||
    cleanUrl.includes("localhost:9999")
  ) {
    return getContextualMediaUrl(domain, index);
  }
  return cleanUrl;
}
