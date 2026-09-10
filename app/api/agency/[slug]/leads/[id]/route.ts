import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { leads, blueprints, agencies } from "@/lib/db/schema";
import { assertTrustedOrigin } from "@/lib/security/origin-check";

// Note: /api/agency/:path* is already gated by middleware.ts, which verifies
// the session is an admin OR a partner_agency user whose JWT `agencySlug`
// claim matches the [slug] segment. The ownership check below is a second,
// explicit layer verifying the specific lead being modified actually
// belongs to that agency — defense in depth in case the route is ever
// reached a different way (e.g. a future server-to-server caller).

const StatusUpdateSchema = z.object({
  status: z.enum(["new", "contacted", "matched", "converted", "closed"]),
});

interface RouteParams {
  params: Promise<{ slug: string; id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const originCheck = assertTrustedOrigin(request);
  if (!originCheck.ok) return originCheck.response;

  const { slug, id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid lead id." }, { status: 400 });
  }

  const parsed = StatusUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const [agency] = await db.select({ id: agencies.id }).from(agencies).where(eq(agencies.slug, slug)).limit(1);
  if (!agency) return NextResponse.json({ error: "Agency not found." }, { status: 404 });

  // Verify the lead actually belongs to a blueprint owned by this agency
  // before allowing the update.
  const [owned] = await db
    .select({ leadId: leads.id, agencyId: blueprints.agencyId })
    .from(leads)
    .innerJoin(blueprints, eq(leads.blueprintId, blueprints.id))
    .where(eq(leads.id, id))
    .limit(1);

  if (!owned || owned.agencyId !== agency.id) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  const [updated] = await db
    .update(leads)
    .set({ status: parsed.data.status })
    .where(eq(leads.id, id))
    .returning({ id: leads.id, status: leads.status });

  if (!updated) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  return NextResponse.json(updated);
}
