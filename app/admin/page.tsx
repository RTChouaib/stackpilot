import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Layers, Mail, FileDown, Building2, ArrowUpRight } from "lucide-react";
import { db } from "@/lib/db";
import { leads, blueprints } from "@/lib/db/schema";
import { getAdminOverview } from "@/lib/admin/stats";
import { StatCard, SimpleBarChart } from "@/components/admin/StatCard";
import LeadsTable from "@/components/admin/LeadsTable";
import PartnerToolsPanel from "@/components/admin/PartnerToolsPanel";
import RecommendationSettingsPanel from "@/components/admin/RecommendationSettingsPanel";
import { getPartnerTools, getRecommendationSettings } from "@/lib/admin/settings";

// This page is only reachable by an authenticated admin — middleware.ts
// verifies the JWT and role before this component ever renders, so no
// additional auth check is needed here.

export const dynamic = "force-dynamic"; // always fresh KPIs, never cached

const PAGE_SIZE = 25;

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function AdminPage({ searchParams }: PageProps) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [overview, partnerTools, recommendationSettings] = await Promise.all([
    getAdminOverview(),
    getPartnerTools(),
    getRecommendationSettings(),
  ]);

  const rows = await db
    .select({
      id: leads.id,
      leadType: leads.leadType,
      fullName: leads.fullName,
      email: leads.email,
      status: leads.status,
      createdAt: leads.createdAt,
      projectName: blueprints.projectName,
    })
    .from(leads)
    .leftJoin(blueprints, eq(leads.blueprintId, blueprints.id))
    .orderBy(desc(leads.createdAt))
    .limit(PAGE_SIZE + 1)
    .offset((page - 1) * PAGE_SIZE);

  const hasNextPage = rows.length > PAGE_SIZE;
  const pageLeads = rows.slice(0, PAGE_SIZE);

  return (
    <main className="max-w-6xl mx-auto px-5 sm:px-8 py-12">
      <p className="text-xs font-mono text-navy-soft">ADMIN</p>
      <h1 className="font-head text-3xl font-bold mt-1 text-navy">Overview</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <StatCard icon={Layers} label="Blueprints generated" value={overview.totalBlueprints} />
        <StatCard icon={Mail} label="Email capture rate" value={`${overview.emailCaptureRate}%`} />
        <StatCard icon={FileDown} label="Quote requests" value={overview.quoteRequests} />
        <StatCard icon={Building2} label="Builder-match requests" value={overview.builderMatchRequests} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mt-8">
        <div className="bg-white border border-border rounded-2xl p-6">
          <p className="font-head font-semibold mb-4 text-navy">Most common project types</p>
          {overview.projectTypeCounts.length ? (
            <SimpleBarChart data={overview.projectTypeCounts} />
          ) : (
            <p className="text-sm text-navy-soft">No blueprints generated yet.</p>
          )}
        </div>
        <div className="bg-white border border-border rounded-2xl p-6">
          <p className="font-head font-semibold mb-4 text-navy">Most recommended technologies</p>
          {overview.techCounts.length ? (
            <SimpleBarChart data={overview.techCounts} />
          ) : (
            <p className="text-sm text-navy-soft">No blueprints generated yet.</p>
          )}
        </div>
      </div>

      <div className="bg-white border border-border rounded-2xl p-6 mt-5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-dim">
            <ArrowUpRight size={18} className="text-amber" />
          </div>
          <div>
            <p className="font-head font-semibold text-navy">Affiliate-link clicks</p>
            <p className="text-sm text-navy-soft">Clicks on partner-tagged tools inside blueprints.</p>
          </div>
        </div>
        <p className="font-head text-3xl font-bold text-navy">{overview.affiliateClicks}</p>
      </div>

      <div className="mt-5">
        <LeadsTable initialLeads={pageLeads} />
        <div className="flex justify-between items-center mt-4 text-sm">
          <Link
            href={`/admin?page=${Math.max(1, page - 1)}`}
            aria-disabled={page === 1}
            className={`px-3 py-1.5 rounded-lg border border-border ${page === 1 ? "pointer-events-none opacity-40" : ""}`}
          >
            ← Newer
          </Link>
          <span className="text-navy-soft text-xs">Page {page}</span>
          <Link
            href={`/admin?page=${page + 1}`}
            aria-disabled={!hasNextPage}
            className={`px-3 py-1.5 rounded-lg border border-border ${!hasNextPage ? "pointer-events-none opacity-40" : ""}`}
          >
            Older →
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mt-5">
        <PartnerToolsPanel initialTools={partnerTools} />
        <RecommendationSettingsPanel initialSettings={recommendationSettings} />
      </div>
    </main>
  );
}
