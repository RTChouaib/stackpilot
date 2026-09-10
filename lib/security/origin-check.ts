import { NextResponse, type NextRequest } from "next/server";

/**
 * Lightweight CSRF defense for state-changing routes (anything that isn't a
 * plain GET): verifies the request's `Origin` header (falling back to
 * `Referer` if `Origin` is absent, which some older browsers/clients omit
 * on same-origin requests) matches this app's own origin.
 *
 * This is the standard "Origin verification" mitigation recommended by
 * OWASP as a CSRF defense — simpler than double-submit tokens, and
 * sufficient here because:
 *  - The admin session cookie is `httpOnly` + `SameSite=lax`, which already
 *    blocks it from being sent on most cross-site POSTs in modern browsers;
 *    this is a second, independent layer for older browsers / edge cases.
 *  - The public lead-capture routes (/api/leads, /api/partner-click,
 *    /api/generate-blueprint) don't carry an authenticated session at all,
 *    so the actual risk they defend against is cross-site *spam/abuse*
 *    submission rather than session hijacking — Origin-checking handles
 *    that well without the UX cost of token issuance on every page load.
 *
 * If you need to support genuine cross-origin API clients (e.g. a mobile
 * app calling these routes directly, or a partner embedding the wizard on
 * their own domain), extend `isTrustedOrigin` with an allowlist rather than
 * removing this check.
 */

function isTrustedOrigin(origin: string, appUrl: string): boolean {
  try {
    return new URL(origin).origin === new URL(appUrl).origin;
  } catch {
    return false;
  }
}

export interface OriginCheckResult {
  ok: boolean;
  response: NextResponse;
}

export function assertTrustedOrigin(request: NextRequest): OriginCheckResult {
  // Only state-changing methods need this check — GET/HEAD have no body and
  // shouldn't mutate anything in a well-designed API in the first place.
  if (request.method === "GET" || request.method === "HEAD") {
    return { ok: true, response: NextResponse.next() };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://stackpilot.app";
  const origin = request.headers.get("origin") ?? request.headers.get("referer");

  // In local development, browsers may omit Origin on same-origin requests
  // more often, and NEXT_PUBLIC_APP_URL may not match localhost:3000 unless
  // explicitly set — so this check is skipped outside production. Never
  // relax this in a deployed environment.
  if (process.env.NODE_ENV !== "production") {
    return { ok: true, response: NextResponse.next() };
  }

  if (!origin || !isTrustedOrigin(origin, appUrl)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Request origin could not be verified." },
        { status: 403 }
      ),
    };
  }

  return { ok: true, response: NextResponse.next() };
}
