import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { sanitizeDeep } from "@/lib/security/sanitize";
import { getLeadSubmissionRateLimiter, getClientIp, checkRateLimit } from "@/lib/security/rate-limit";
import { sendLeadAlertEmail } from "@/lib/email/notifier";
import { assertTrustedOrigin } from "@/lib/security/origin-check";

const ContactSchema = z.object({
  fullName: z.string().min(1).max(120),
  email: z.string().email(),
  notes: z.string().min(1).max(2000),
  privacyConsent: z.literal(true),
});

/**
 * General contact-form submissions. Stored in the same `leads` table as
 * blueprint-attached leads (leadType: "contact", blueprintId: null) so the
 * admin dashboard shows every inbound message in one place, rather than a
 * separate untracked inbox.
 */
export async function POST(request: NextRequest) {
  const originCheck = assertTrustedOrigin(request);
  if (!originCheck.ok) return originCheck.response;

  const ip = getClientIp(request.headers);
  const rateLimit = await checkRateLimit(getLeadSubmissionRateLimiter(), ip);
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Too many submissions. Please wait a few minutes and try again." }, { status: 429 });
  }

  const parsed = ContactSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid submission.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const input = sanitizeDeep(parsed.data);

  const [saved] = await db
    .insert(leads)
    .values({
      blueprintId: null,
      leadType: "contact",
      fullName: input.fullName,
      email: input.email,
      notes: input.notes,
      privacyConsent: true,
      status: "new",
    })
    .returning();

  if (!saved) {
    return NextResponse.json({ error: "Failed to save your message." }, { status: 500 });
  }

  await sendLeadAlertEmail({
    lead: saved,
    projectName: "General contact form",
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
