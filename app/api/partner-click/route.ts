import { NextResponse, type NextRequest } from "next/server";
import { assertTrustedOrigin } from "@/lib/security/origin-check";
import { z } from "zod";
import { db } from "@/lib/db";
import { partnerClicks } from "@/lib/db/schema";
import { sanitizeInputText } from "@/lib/security/sanitize";

const PartnerClickSchema = z.object({
  blueprintId: z.string().uuid(),
  toolName: z.string().min(1).max(200),
  affiliateUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  const originCheck = assertTrustedOrigin(request);
  if (!originCheck.ok) return originCheck.response;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = PartnerClickSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  await db.insert(partnerClicks).values({
    blueprintId: parsed.data.blueprintId,
    toolName: sanitizeInputText(parsed.data.toolName),
    affiliateUrl: parsed.data.affiliateUrl,
  });

  // Best-effort analytics endpoint — 204 regardless, so a slow/duplicate
  // click never surfaces an error in the UI.
  return new NextResponse(null, { status: 204 });
}
