import crypto from "crypto";
import { cookies } from "next/headers";
import { UserRole } from "@/lib/models/User";

const SESSION_COOKIE_NAME = "civicresolve_session";
const SESSION_SECRET =
  process.env.SESSION_SECRET || "civicresolve_gov_jharkhand_secure_secret_key_2026";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  designation?: string;
  district?: string;
  organizationName?: string;
  collegeId?: string;
}

/**
 * Encrypt / sign a session payload into a tamper-proof string
 */
export function signSessionToken(user: SessionUser): string {
  const payload = JSON.stringify({
    ...user,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days expiration
  });

  const base64Payload = Buffer.from(payload).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(base64Payload)
    .digest("base64url");

  return `${base64Payload}.${signature}`;
}

/**
 * Verify and parse a signed session token
 */
export function verifySessionToken(token: string): SessionUser | null {
  try {
    const [base64Payload, signature] = token.split(".");
    if (!base64Payload || !signature) return null;

    const expectedSig = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(base64Payload)
      .digest("base64url");

    if (signature !== expectedSig) {
      return null;
    }

    const payloadStr = Buffer.from(base64Payload, "base64url").toString("utf-8");
    const payload = JSON.parse(payloadStr);

    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }

    return {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      designation: payload.designation,
      district: payload.district,
      organizationName: payload.organizationName,
      collegeId: payload.collegeId,
    };
  } catch {
    return null;
  }
}

/**
 * Get the current authenticated user from server cookie
 */
export function getCurrentUser(): SessionUser | null {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

export { SESSION_COOKIE_NAME };
