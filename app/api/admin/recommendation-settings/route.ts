import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getRecommendationSettings, setRecommendationSettings } from "@/lib/admin/settings";
import { assertTrustedOrigin } from "@/lib/security/origin-check";

// Protected by middleware.ts (/api/admin/:path*). These settings are
// illustrative only — see lib/admin/settings.ts for why they aren't wired
// into actual recommendation logic.

export async function GET() {
  return NextResponse.json(await getRecommendationSettings());
}

const SettingsSchema = z.object({
  costWeight: z.number().int().min(0).max(100),
  speedWeight: z.number().int().min(0).max(100),
  qualityWeight: z.number().int().min(0).max(100),
});

export async function POST(request: NextRequest) {
  const originCheck = assertTrustedOrigin(request);
  if (!originCheck.ok) return originCheck.response;

  const parsed = SettingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload.", issues: parsed.error.flatten() }, { status: 400 });
  }
  await setRecommendationSettings(parsed.data);
  return NextResponse.json({ ok: true });
}
