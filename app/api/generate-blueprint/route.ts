import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { assertTrustedOrigin } from "@/lib/security/origin-check";
import { db } from "@/lib/db";
import { blueprints, agencies, leads } from "@/lib/db/schema";
import { QuestionnaireSchema } from "@/lib/ai/schema";
import { sanitizeDeep } from "@/lib/security/sanitize";
import { getAiGenerationRateLimiter, getClientIp, checkRateLimit } from "@/lib/security/rate-limit";
import { generateBlueprintWithAI } from "@/lib/ai/generate";
import { generateShareToken } from "@/lib/utils/token";
import { sendLeadAlertEmail } from "@/lib/email/notifier";

export const runtime = "nodejs"; // @react-pdf and the AI SDK need the Node runtime, not Edge.

export async function POST(request: NextRequest) {
  const originCheck = assertTrustedOrigin(request);
  if (!originCheck.ok) return originCheck.response;

  // ---- 1. Rate limit by IP before doing any real work ----
  const ip = getClientIp(request.headers);
  const rateLimit = await checkRateLimit(getAiGenerationRateLimiter(), ip);
  if (!rateLimit.success) {
    return NextResponse.json(
      {
        error: "You've reached the blueprint generation limit. Please try again later.",
        retryAt: new Date(rateLimit.reset).toISOString(),
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(rateLimit.limit),
          "X-RateLimit-Remaining": String(rateLimit.remaining),
          "Retry-After": String(Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000))),
        },
      }
    );
  }

  // ---- 2. Parse + validate the payload ----
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = QuestionnaireSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid questionnaire payload.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // ---- 3. Sanitize every free-text field before it touches the DB or an LLM prompt ----
  const inputs = sanitizeDeep(parsed.data);

  // ---- 3b. Resolve agency attribution, if this came through a branded wizard ----
  // The client-supplied slug only controls attribution/branding — it never
  // grants any privilege, and an unknown slug just means no attribution
  // rather than an error, so a stale/typo'd link doesn't break the wizard.
  let agencyId: string | null = null;
  if (inputs.agencySlug) {
    const [agency] = await db
      .select({ id: agencies.id })
      .from(agencies)
      .where(eq(agencies.slug, inputs.agencySlug))
      .limit(1);
    agencyId = agency?.id ?? null;
  }

  // ---- 4. Generate (AI, with deterministic constraints + fallback) ----
  const { blueprint, source } = await generateBlueprintWithAI(inputs);

  // ---- 5. Persist with a fresh unguessable share token ----
  const shareToken = generateShareToken();

  const [saved] = await db
    .insert(blueprints)
    .values({
      shareToken,
      agencyId,
      projectName: blueprint.projectName,
      rawInputs: inputs,
      recommendations: { lean: blueprint.lean, balanced: blueprint.balanced, scaleReady: blueprint.scaleReady, architectureNotes: blueprint.architectureNotes },
      aiSetup: blueprint.aiSetup,
      isPublic: true,
    })
    .returning({ id: blueprints.id, shareToken: blueprints.shareToken });

  if (!saved) {
    return NextResponse.json({ error: "Failed to save blueprint." }, { status: 500 });
  }

  // ---- 6. Optional newsletter lead if the founder gave an email up front ----
  // Fire-and-forget-ish: awaited so we can log failures, but a failure here
  // never fails the blueprint generation itself — the blueprint is already
  // saved by this point.
  if (inputs.email) {
    try {
      await db.insert(leads).values({
        blueprintId: saved.id,
        leadType: "newsletter",
        email: inputs.email,
        privacyConsent: true, // the wizard's email step requires the consent checkbox before this field is ever populated
        status: "new",
      });
      await sendLeadAlertEmail({
        lead: { leadType: "newsletter", fullName: null, email: inputs.email, targetBudget: null, targetTimeline: null, notes: null },
        blueprintShareToken: saved.shareToken,
        projectName: blueprint.projectName,
      });
    } catch (error) {
      console.error("[generate-blueprint] Failed to save newsletter lead:", error);
    }
  }

  return NextResponse.json(
    {
      shareToken: saved.shareToken,
      blueprint,
      meta: { source }, // "ai" | "deterministic-fallback" — surfaced for observability, safe to ignore client-side
    },
    { status: 201 }
  );
}
