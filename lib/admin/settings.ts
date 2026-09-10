import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { partnerTools, recommendationSettings } from "@/lib/db/schema";
import { STACKS } from "@/lib/ai/stack-data";

/**
 * Every distinct tool name across all stack pools/tiers — the full universe
 * of things an admin might want to flag as a partner. Deduplicated.
 */
export function allKnownTools(): string[] {
  const names = new Set<string>();
  for (const pool of Object.values(STACKS)) {
    for (const tier of Object.values(pool)) {
      for (const value of Object.values(tier)) {
        names.add(value);
      }
    }
  }
  return Array.from(names).sort();
}

export interface PartnerToolRow {
  toolName: string;
  isPartner: boolean;
  affiliateUrl: string | null;
}

/**
 * Returns every known tool with its partner flag — tools never explicitly
 * toggled by an admin default to `isPartner: false` rather than needing a
 * DB row to exist first, so the admin panel always shows the full list.
 */
export async function getPartnerTools(): Promise<PartnerToolRow[]> {
  const rows = await db.select().from(partnerTools);
  const byName = new Map(rows.map((r) => [r.toolName, r]));
  return allKnownTools().map((toolName) => {
    const existing = byName.get(toolName);
    return {
      toolName,
      isPartner: existing?.isPartner ?? false,
      affiliateUrl: existing?.affiliateUrl ?? null,
    };
  });
}

export async function setPartnerTool(toolName: string, isPartner: boolean, affiliateUrl?: string | null): Promise<void> {
  const [existing] = await db.select().from(partnerTools).where(eq(partnerTools.toolName, toolName)).limit(1);
  if (existing) {
    await db
      .update(partnerTools)
      .set({ isPartner, affiliateUrl: affiliateUrl ?? existing.affiliateUrl, updatedAt: new Date() })
      .where(eq(partnerTools.id, existing.id));
  } else {
    await db.insert(partnerTools).values({ toolName, isPartner, affiliateUrl: affiliateUrl ?? null });
  }
}

/**
 * Illustrative-only settings surfaced in the admin panel as sliders. They
 * are deliberately NOT read by lib/ai/rules-engine.ts or the AI prompt —
 * see the panel's own copy and the README for why wiring these in would be
 * misleading (there's no principled way to turn "cost: 70%, speed: 30%"
 * into a specific stack swap without just re-implementing the whole
 * decision table behind a fake dial). This still records what an admin set
 * them to, in case that's useful signal for future manual tuning of
 * lib/ai/stack-data.ts.
 */
export async function getRecommendationSettings() {
  const [row] = await db.select().from(recommendationSettings).where(eq(recommendationSettings.id, 1)).limit(1);
  return row ?? { id: 1, costWeight: 50, speedWeight: 50, qualityWeight: 50, updatedAt: new Date() };
}

export async function setRecommendationSettings(values: { costWeight: number; speedWeight: number; qualityWeight: number }): Promise<void> {
  const [existing] = await db.select().from(recommendationSettings).where(eq(recommendationSettings.id, 1)).limit(1);
  if (existing) {
    await db.update(recommendationSettings).set({ ...values, updatedAt: new Date() }).where(eq(recommendationSettings.id, 1));
  } else {
    await db.insert(recommendationSettings).values({ id: 1, ...values });
  }
}
