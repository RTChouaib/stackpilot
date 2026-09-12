import { sql, eq, and, count, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { blueprints, leads, partnerClicks } from "@/lib/db/schema";

export interface AdminOverview {
  totalBlueprints: number;
  emailCaptureRate: number; // 0-100
  quoteRequests: number;
  builderMatchRequests: number;
  affiliateClicks: number;
  projectTypeCounts: { label: string; value: number }[];
  techCounts: { label: string; value: number }[];
}

/**
 * Computes overview KPIs, optionally scoped to a single agency's blueprints
 * (used by the agency white-label dashboard at /agency/[slug]). Passing no
 * agencyId returns platform-wide stats (the main /admin dashboard).
 *
 * Leads and partner clicks don't carry `agencyId` directly — they're
 * scoped by joining through the blueprint they belong to.
 */
export async function getAdminOverview(agencyId?: string): Promise<AdminOverview> {
  const blueprintAgencyFilter: SQL | undefined = agencyId ? eq(blueprints.agencyId, agencyId) : undefined;

  const [totalBlueprintsRows, newsletterLeadsRows, quoteRequestsRows, builderMatchRequestsRows, affiliateClicksRows] =
    await Promise.all([
      db.select({ value: count() }).from(blueprints).where(blueprintAgencyFilter),
      leadCountByType("newsletter", agencyId),
      leadCountByType("mvp_quote", agencyId),
      leadCountByType("builder_match", agencyId),
      db
        .select({ value: count() })
        .from(partnerClicks)
        .innerJoin(blueprints, eq(partnerClicks.blueprintId, blueprints.id))
        .where(blueprintAgencyFilter),
    ]);

  // count() always returns exactly one row, but noUncheckedIndexedAccess
  // still types array access as possibly-undefined — default to 0 rather
  // than asserting, so a genuinely empty result degrades to "no data"
  // instead of a runtime crash.
  const totalBlueprints = totalBlueprintsRows[0]?.value ?? 0;
  const newsletterLeads = newsletterLeadsRows[0]?.value ?? 0;
  const quoteRequests = quoteRequestsRows[0]?.value ?? 0;
  const builderMatchRequests = builderMatchRequestsRows[0]?.value ?? 0;
  const affiliateClicks = affiliateClicksRows[0]?.value ?? 0;

  // Project type breakdown — rawInputs is JSONB, so pull the field out with
  // a JSON path expression rather than a typed column. The agency filter is
  // injected as a parameterized fragment, not string-concatenated, so this
  // stays immune to SQL injection regardless of where agencyId originated.
  const agencyWhereFragment = agencyId ? sql`WHERE agency_id = ${agencyId}` : sql``;

  const projectTypeRows = await db.execute<{ project_type: string; value: number }>(sql`
    SELECT raw_inputs->>'projectType' AS project_type, COUNT(*)::int AS value
    FROM ${blueprints}
    ${agencyWhereFragment}
    GROUP BY raw_inputs->>'projectType'
    ORDER BY value DESC
  `);

  // Most-recommended tech, sourced from the "balanced" tier's frontend +
  // backend + database + hosting choices across every generated blueprint.
  const techRows = await db.execute<{ tech: string; value: number }>(sql`
    SELECT tech, COUNT(*)::int AS value FROM (
      SELECT recommendations->'balanced'->>'frontend' AS tech FROM ${blueprints} ${agencyWhereFragment}
      UNION ALL
      SELECT recommendations->'balanced'->>'backend' FROM ${blueprints} ${agencyWhereFragment}
      UNION ALL
      SELECT recommendations->'balanced'->>'database' FROM ${blueprints} ${agencyWhereFragment}
      UNION ALL
      SELECT recommendations->'balanced'->>'hosting' FROM ${blueprints} ${agencyWhereFragment}
    ) t
    WHERE tech IS NOT NULL
    GROUP BY tech
    ORDER BY value DESC
    LIMIT 8
  `);

  return {
    totalBlueprints,
    emailCaptureRate: totalBlueprints > 0 ? Math.round((100 * newsletterLeads) / totalBlueprints) : 0,
    quoteRequests,
    builderMatchRequests,
    affiliateClicks,
    projectTypeCounts: projectTypeRows.map((r) => ({ label: r.project_type ?? "unspecified", value: r.value })),
    techCounts: techRows.map((r) => ({ label: r.tech, value: r.value })),
  };
}

function leadCountByType(leadType: "newsletter" | "mvp_quote" | "builder_match", agencyId?: string) {
  const base = db.select({ value: count() }).from(leads);
  if (!agencyId) {
    return base.where(eq(leads.leadType, leadType));
  }
  return db
    .select({ value: count() })
    .from(leads)
    .innerJoin(blueprints, eq(leads.blueprintId, blueprints.id))
    .where(and(eq(leads.leadType, leadType), eq(blueprints.agencyId, agencyId)));
}
