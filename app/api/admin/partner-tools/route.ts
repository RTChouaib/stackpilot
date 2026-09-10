import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getPartnerTools, setPartnerTool } from "@/lib/admin/settings";
import { assertTrustedOrigin } from "@/lib/security/origin-check";

// Protected by middleware.ts (/api/admin/:path*).

export async function GET() {
  return NextResponse.json(await getPartnerTools());
}

const ToggleSchema = z.object({
  toolName: z.string().min(1).max(200),
  isPartner: z.boolean(),
  affiliateUrl: z.string().url().optional().nullable(),
});

export async function POST(request: NextRequest) {
  const originCheck = assertTrustedOrigin(request);
  if (!originCheck.ok) return originCheck.response;

  const parsed = ToggleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload.", issues: parsed.error.flatten() }, { status: 400 });
  }
  await setPartnerTool(parsed.data.toolName, parsed.data.isPartner, parsed.data.affiliateUrl);
  return NextResponse.json({ ok: true });
}
