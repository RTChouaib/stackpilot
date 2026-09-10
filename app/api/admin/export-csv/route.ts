import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { leads, blueprints } from "@/lib/db/schema";
import { toCsv } from "@/lib/utils/csv";
import { eq } from "drizzle-orm";

// Protected by middleware.ts (matcher includes /api/admin/:path*).

export async function GET() {
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
    .leftJoin(blueprints, eq(leads.blueprintId, blueprints.id))
    .orderBy(desc(leads.createdAt));

  const csv = toCsv(rows, [
    "id", "leadType", "fullName", "email", "projectName",
    "targetBudget", "targetTimeline", "status", "createdAt",
  ]);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="stackpilot-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
