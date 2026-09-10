import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { users, agencies } from "@/lib/db/schema";
import { signSession, SESSION_COOKIE_NAME } from "@/lib/auth/jwt";
import { verifyPassword } from "@/lib/auth/password";
import { getLeadSubmissionRateLimiter, getClientIp, checkRateLimit } from "@/lib/security/rate-limit";
import { assertTrustedOrigin } from "@/lib/security/origin-check";

const LoginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

/**
 * Real per-user auth: each admin/agency user has their own bcrypt password
 * hash in `users.passwordHash` (set via `npm run db:seed`, or
 * `npm run db:seed-agency` for an agency user). Replaces an earlier single
 * shared-password design — see README.
 */
export async function POST(request: NextRequest) {
  const originCheck = assertTrustedOrigin(request);
  if (!originCheck.ok) return originCheck.response;

  const ip = getClientIp(request.headers);
  const rateLimit = await checkRateLimit(getLeadSubmissionRateLimiter(), `admin-login:${ip}`);
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Too many login attempts. Try again shortly." }, { status: 429 });
  }

  const parsed = LoginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 400 });
  }

  const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);

  // Constant-shape response whether the user doesn't exist, has no password
  // set, or the password is wrong — avoids leaking which case it was via
  // response differences. (Timing isn't fully constant-time across the "no
  // such user" vs "bcrypt.compare failed" paths, a known limitation of this
  // simplified login; a production auth provider handles this properly.)
  if (!user || !user.passwordHash || (user.role !== "admin" && user.role !== "partner_agency")) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  let agencySlug: string | undefined;
  if (user.role === "partner_agency" && user.agencyId) {
    const [agency] = await db.select({ slug: agencies.slug }).from(agencies).where(eq(agencies.id, user.agencyId)).limit(1);
    agencySlug = agency?.slug;
  }

  const token = await signSession({
    userId: user.id,
    email: user.email,
    role: user.role,
    ...(user.agencyId ? { agencyId: user.agencyId } : {}),
    ...(agencySlug ? { agencySlug } : {}),
  });

  const response = NextResponse.json({
    ok: true,
    role: user.role,
    redirectTo: user.role === "partner_agency" && agencySlug ? `/agency/${agencySlug}` : "/admin",
  });
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
