import { NextResponse, type NextRequest } from "next/server";
import { assertTrustedOrigin } from "@/lib/security/origin-check";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { leads, blueprints } from "@/lib/db/schema";
import { LeadSubmissionSchema } from "@/lib/validation/lead";
import { sanitizeDeep } from "@/lib/security/sanitize";
import { getLeadSubmissionRateLimiter, getClientIp, checkRateLimit } from "@/lib/security/rate-limit";
import { sendLeadAlertEmail } from "@/lib/email/notifier";

export async function POST(request: NextRequest) {
  const originCheck = assertTrustedOrigin(request);
  if (!originCheck.ok) return originCheck.response;

  const ip = getClientIp(request.headers);
  const rateLimit = await checkRateLimit(getLeadSubmissionRateLimiter(), ip);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Too many submissions. Please wait a few minutes and try again." },
      { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000))) } }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = LeadSubmissionSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid lead submission.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const input = sanitizeDeep(parsed.data);

  // Confirm the referenced blueprint actually exists before attaching a lead
  // to it — prevents orphaned leads from a spoofed/guessed blueprintId.
  const [blueprint] = await db
    .select({ id: blueprints.id, shareToken: blueprints.shareToken, projectName: blueprints.projectName })
    .from(blueprints)
    .where(eq(blueprints.id, input.blueprintId))
    .limit(1);

  if (!blueprint) {
    return NextResponse.json({ error: "Blueprint not found." }, { status: 404 });
  }

  const [savedLead] = await db
    .insert(leads)
    .values({
      blueprintId: blueprint.id,
      leadType: input.leadType,
      fullName: input.fullName,
      email: input.email,
      notes: input.notes,
      targetBudget: input.targetBudget,
      targetTimeline: input.targetTimeline,
      privacyConsent: input.privacyConsent,
      status: "new",
    })
    .returning();

  if (!savedLead) {
    return NextResponse.json({ error: "Failed to save lead." }, { status: 500 });
  }

  // Fire the admin alert. Awaited so we can report delivery status, but a
  // failure here does not roll back the lead — it's already durably stored.
  const emailResult = await sendLeadAlertEmail({
    lead: savedLead,
    blueprintShareToken: blueprint.shareToken,
    projectName: blueprint.projectName,
  });

  return NextResponse.json(
    { id: savedLead.id, status: savedLead.status, notified: emailResult.ok },
    { status: 201 }
  );
}
