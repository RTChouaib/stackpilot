import { NextResponse } from "next/server";
import { getPartnerTools } from "@/lib/admin/settings";

/**
 * Public, read-only partner-tool labels for the blueprint page's
 * monetization funnel. Distinct from /api/admin/partner-tools (which also
 * allows toggling and is admin-only) — this route only ever exposes
 * toolName/isPartner/affiliateUrl, which is exactly the information the
 * funnel already displays, so there's nothing sensitive here worth gating.
 *
 * force-dynamic (rather than a `revalidate` value) is deliberate: exporting
 * `revalidate` makes Next.js treat this as eligible for static generation,
 * which means it tries to execute — and hit the database — at BUILD time,
 * not just request time. That broke `next build` in an environment without
 * live DB access. Partner-tool lookups are cheap and change rarely, so
 * per-request DB reads are an acceptable tradeoff for a build that doesn't
 * depend on database uptime; add response caching at the infra layer
 * (e.g. a CDN Cache-Control header) if this ever needs to scale further.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const tools = await getPartnerTools();
  return NextResponse.json(tools);
}
