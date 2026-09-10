import { NextResponse, type NextRequest } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { leads, blueprints, agencies } from "@/lib/db/schema";
import { toCsv } from "@/lib/utils/csv";

// Protected by middleware.ts (/api/agency/:path*) — admin or the matching
// partner_agency session only.

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  const [agency] = await db.select({ id: agencies.id }).from(agencies).where(eq(agencies.slug, slug)).limit(1);
  if (!agency) return NextResponse.json({ error: "Agency not found." }, { status: 404 });

  const rows = await db
    .select({
      id: leads.id,
      leadType: leads.leadType,
      fullName: leads.fullName,
      email: leads.email,
      targetBudget: leads.targetBudget,
      targetTimeline: leads.targetTimeline,
      status: leads.status,
      createdAt: leads.createdAt,
      projectName: blueprints.projectName,
    })
    .from(leads)
    .innerJoin(blueprints, eq(leads.blueprintId, blueprints.id))
    .where(eq(blueprints.agencyId, agency.id))
    .orderBy(desc(leads.createdAt));

  const csv = toCsv(rows, [
    "id", "leadType", "fullName", "email", "projectName",
    "targetBudget", "targetTimeline", "status", "createdAt",
  ]);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
