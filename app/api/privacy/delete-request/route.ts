import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { deletionRequests } from "@/lib/db/schema";
import { generateShareToken } from "@/lib/utils/token";
import { sendDeletionConfirmationEmail } from "@/lib/email/notifier";
import { getLeadSubmissionRateLimiter, getClientIp, checkRateLimit } from "@/lib/security/rate-limit";
import { assertTrustedOrigin } from "@/lib/security/origin-check";

const RequestSchema = z.object({ email: z.string().email() });

/**
 * GDPR / data-deletion request, step 1: double opt-in by email, the same
 * "confirm via a link sent to the address itself" pattern used elsewhere in
 * this app. A request submitted for someone else's email address does
 * nothing until that address's owner clicks the link — no data is deleted,
 * and this endpoint never reveals whether the email exists in the system.
 */
export async function POST(request: NextRequest) {
  const originCheck = assertTrustedOrigin(request);
  if (!originCheck.ok) return originCheck.response;

  const ip = getClientIp(request.headers);
  const rateLimit = await checkRateLimit(getLeadSubmissionRateLimiter(), ip);
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Too many requests. Please wait a few minutes and try again." }, { status: 429 });
  }

  const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  const token = generateShareToken();
  await db.insert(deletionRequests).values({ email: parsed.data.email, token, status: "pending" });
  await sendDeletionConfirmationEmail(parsed.data.email, token);

  // Always the same response regardless of whether the email exists
  // anywhere in the system, or whether sending succeeded — this endpoint
  // must not be usable to test which emails are registered.
  return NextResponse.json({ ok: true, message: "If that email has associated data, a confirmation link has been sent." });
}
