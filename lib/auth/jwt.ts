import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export const SESSION_COOKIE_NAME = "sp_session";

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET is missing or too short. Set a random string of at least 32 characters."
    );
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload extends JWTPayload {
  userId: string;
  email: string;
  role: "user" | "admin" | "partner_agency";
  // Only present for role = 'partner_agency' — scopes that session's
  // dashboard queries to leads/blueprints belonging to this agency, and
  // lets middleware check /agency/[slug]/* access without a DB round trip.
  agencyId?: string;
  agencySlug?: string;
}

/** Signs a session JWT, valid for 7 days. */
export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

/**
 * Verifies a session JWT. Returns null instead of throwing so callers
 * (especially middleware) can treat any failure — expired, tampered,
 * wrong signature — as "not authenticated" without a try/catch at every
 * call site.
 */
export async function verifySession(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify<SessionPayload>(token, getSecretKey());
    return payload;
  } catch {
    return null;
  }
}

/** Convenience guard used inside Server Components / Route Handlers. */
export function isAdmin(session: SessionPayload | null): boolean {
  return session?.role === "admin";
}

/** True for either a full admin or a partner_agency user scoped to their own agency. */
export function isAdminOrAgency(session: SessionPayload | null): boolean {
  return session?.role === "admin" || session?.role === "partner_agency";
}
