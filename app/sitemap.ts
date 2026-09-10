import type { MetadataRoute } from "next";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { blueprints } from "@/lib/db/schema";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://stackpilot.app";

// Cap the number of indexed blueprint pages per sitemap file. If the
// catalog grows past this, split into sitemap-0.xml, sitemap-1.xml, etc.
// via a generateSitemaps() export — noted here rather than built
// prematurely since it's not needed until there are tens of thousands of
// public blueprints.
const MAX_INDEXED_BLUEPRINTS = 5000;

// Without this, Next.js tries to execute sitemap.ts at BUILD time (it's a
// special file, unlike ordinary route handlers) to produce a static
// sitemap.xml — which would require live DATABASE_URL connectivity during
// `next build` (breaking CI, and coupling the build step to DB uptime).
// force-dynamic defers execution to request time instead, which is also
// more correct for a sitemap whose blueprint list changes continuously.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/wizard`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/for-agencies`, changeFrequency: "monthly", priority: 0.6 },
  ];

  const publicBlueprints = await db
    .select({ shareToken: blueprints.shareToken, createdAt: blueprints.createdAt })
    .from(blueprints)
    .where(eq(blueprints.isPublic, true))
    .orderBy(desc(blueprints.createdAt))
    .limit(MAX_INDEXED_BLUEPRINTS);

  const blueprintPages: MetadataRoute.Sitemap = publicBlueprints.map((bp) => ({
    url: `${BASE_URL}/blueprint/${bp.shareToken}`,
    lastModified: bp.createdAt,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticPages, ...blueprintPages];
}
