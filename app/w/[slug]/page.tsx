import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { agencies } from "@/lib/db/schema";
import Wizard from "@/components/wizard/Wizard";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getAgency(slug: string) {
  const [agency] = await db.select().from(agencies).where(eq(agencies.slug, slug)).limit(1);
  return agency ?? null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const agency = await getAgency(slug);
  if (!agency) return { title: "Not found — StackPilot" };
  return {
    title: `Build your stack — ${agency.name}`,
    description: `A branded StackPilot blueprint wizard for ${agency.name}.`,
    robots: { index: false, follow: false }, // white-label pages aren't meant to compete with the main site in search
  };
}

export default async function AgencyWizardPage({ params }: PageProps) {
  const { slug } = await params;
  const agency = await getAgency(slug);
  if (!agency) notFound();

  return (
    <main>
      <Wizard
        agencySlug={agency.slug}
        branding={{
          name: agency.name,
          logoUrl: agency.logoUrl ?? undefined,
          accentColor: agency.accentColor ?? undefined,
        }}
      />
    </main>
  );
}
