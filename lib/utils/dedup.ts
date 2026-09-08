import crypto from "crypto";

/**
 * Normalizes description, district, and coordinates to produce a deterministic deduplication hash
 */
export function generateDedupFingerprint(
  description: string,
  district: string,
  location?: { lat?: number; lng?: number },
): string {
  const normalizedDesc = description
    .toLowerCase()
    .replace(/[^\w\s]/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  const normalizedDistrict = district.toLowerCase().trim();

  let locationKey = "nolocation";
  if (
    location &&
    typeof location.lat === "number" &&
    typeof location.lng === "number"
  ) {
    const roundedLat = location.lat.toFixed(2);
    const roundedLng = location.lng.toFixed(2);
    locationKey = `${roundedLat},${roundedLng}`;
  }

  const rawKey = `${normalizedDistrict}|${locationKey}|${normalizedDesc}`;
  return crypto.createHash("sha256").update(rawKey).digest("hex").slice(0, 32);
}

/**
 * Generates an official tracking code in format: CR-JH-YYYY-NNNNNN
 */
export function formatTrackingCode(year: number, sequenceNum: number): string {
  const padded = String(sequenceNum).padStart(6, "0");
  return `CR-JH-${year}-${padded}`;
}
