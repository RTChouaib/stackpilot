import { notFound } from "next/navigation";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Layers, Mail, FileDown, Building2 } from "lucide-react";
import { db } from "@/lib/db";
import { leads, blueprints, agencies } from "@/lib/db/schema";
import { getAdminOverview } from "@/lib/admin/stats";
import { StatCard, SimpleBarChart } from "@/components/admin/StatCard";
import LeadsTable from "@/components/admin/LeadsTable";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function AgencyDashboardPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  // Authorization (admin, or a partner_agency session scoped to this exact
  // slug) is already enforced by middleware.ts before this component ever
  // renders — this lookup is just to resolve the slug to real data.
  const [agency] = await db.select().from(agencies).where(eq(agencies.slug, slug)).limit(1);
  if (!agency) notFound();

  const overview = await getAdminOverview(agency.id);

  const agencyLeads = await db
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
    .innerJoin(blueprints, eq(leads.blueprintId, blueprints.id))
    .where(eq(blueprints.agencyId, agency.id))
    .orderBy(desc(leads.createdAt))
    .limit(PAGE_SIZE + 1)
    .offset((page - 1) * PAGE_SIZE);

  const hasNextPage = agencyLeads.length > PAGE_SIZE;
  const pageLeads = agencyLeads.slice(0, PAGE_SIZE);

  return (
    <main className="max-w-6xl mx-auto px-5 sm:px-8 py-12">
      <div className="flex items-center gap-2">
        <Building2 size={16} className="text-violet" />
        <p className="text-xs font-mono text-navy-soft">{agency.name.toUpperCase()} · WHITE-LABEL DASHBOARD</p>
      </div>
      <h1 className="font-head text-3xl font-bold mt-1 text-navy">Overview</h1>
      <p className="text-sm text-navy-soft mt-1">
        Branded wizard: <code className="text-xs">/w/{agency.slug}</code>
      </p>

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

      <div className="mt-5">
        <LeadsTable
          initialLeads={pageLeads}
          patchUrl={(id) => `/api/agency/${agency.slug}/leads/${id}`}
          exportUrl={`/api/agency/${agency.slug}/export-csv`}
        />
        <div className="flex justify-between items-center mt-4 text-sm">
          <Link
            href={`/agency/${agency.slug}?page=${Math.max(1, page - 1)}`}
            aria-disabled={page === 1}
            className={`px-3 py-1.5 rounded-lg border border-border ${page === 1 ? "pointer-events-none opacity-40" : ""}`}
          >
            ← Newer
          </Link>
          <span className="text-navy-soft text-xs">Page {page}</span>
          <Link
            href={`/agency/${agency.slug}?page=${page + 1}`}
            aria-disabled={!hasNextPage}
            className={`px-3 py-1.5 rounded-lg border border-border ${!hasNextPage ? "pointer-events-none opacity-40" : ""}`}
          >
            Older →
          </Link>
        </div>
      </div>
    </main>
  );
}
