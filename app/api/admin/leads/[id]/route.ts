import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { assertTrustedOrigin } from "@/lib/security/origin-check";

// Note: this route is already protected by middleware.ts (matcher includes
// /api/admin/:path*), which rejects non-admin requests with 403 before this
// handler ever runs.

const StatusUpdateSchema = z.object({
  status: z.enum(["new", "contacted", "matched", "converted", "closed"]),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const originCheck = assertTrustedOrigin(request);
  if (!originCheck.ok) return originCheck.response;

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid lead id." }, { status: 400 });
  }

  const parsed = StatusUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
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
