import type { MetadataRoute } from "next";
import { articles, qnas } from "./content";
import { comparisons } from "./comparisons/data";
import { stackPages } from "./stacks/data";
import { costPages } from "./cost/data";
import { absoluteUrl } from "@/lib/seo";

// Fully static (no DB): only public, indexable, canonical URLs. User-generated
// /blueprint/* pages, /w/*, /admin, /agency and /api are intentionally excluded.
const TOOLS = [
  "ai-api-cost-calculator", "startup-cost-calculator", "saas-mrr-calculator", "saas-churn-calculator",
  "saas-ltv-calculator", "saas-cac-calculator", "stripe-fee-calculator", "token-cost-calculator",
  "bandwidth-calculator", "tech-stack-generator",
];
const STATIC_PAGES = [
  "/", "/wizard", "/tools", "/guides", "/qna", "/comparisons", "/stacks", "/cost", "/ai", "/startups",
  "/development", "/for-agencies", "/about", "/contact", "/privacy", "/terms", "/cookie-policy", "/disclaimer", "/advertising",
];

export default function sitemap(): MetadataRoute.Sitemap {
  // /guides/<slug> for a comparison 308-redirects to /comparisons/<slug>, so list only the canonical one.
  const comparisonSlugs = new Set(comparisons.map((c) => c.slug));
  const entry = (path: string, changeFrequency: "weekly" | "monthly", priority: number) => ({ url: absoluteUrl(path), changeFrequency, priority });
  return [
    ...STATIC_PAGES.map((p) => entry(p, "weekly", p === "/" ? 1 : 0.7)),
    ...TOOLS.map((s) => entry(`/tools/${s}`, "monthly", 0.8)),
    ...articles.filter((a) => !comparisonSlugs.has(a.slug)).map((a) => entry(`/guides/${a.slug}`, "monthly", 0.7)),
    ...comparisons.map((c) => entry(`/comparisons/${c.slug}`, "monthly", 0.75)),
    ...stackPages.map((p) => entry(`/stacks/${p.slug}`, "monthly", 0.75)),
    ...costPages.map((p) => entry(`/cost/${p.slug}`, "monthly", 0.7)),
    ...qnas.map((q) => entry(`/qna/${q[0]}`, "monthly", 0.6)),
  ];
}
