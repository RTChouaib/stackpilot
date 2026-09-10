import type { Metadata } from "next";
import { Building2 } from "lucide-react";

export const metadata: Metadata = {
  title: "For agencies",
  description: "White-label StackPilot for your agency: branded blueprints, qualified lead capture, and client-ready PDFs.",
};

const PLANS = [
  { name: "Starter", price: "€299", body: "For solo consultants and small studios." },
  { name: "Growth", price: "€749", body: "For agencies actively scoping multiple client projects." },
  { name: "Enterprise", price: "Custom", body: "For larger agencies needing custom integrations and SLAs." },
];

export default function AgenciesPage() {
  return (
    <main className="max-w-5xl mx-auto px-5 sm:px-8 py-16">
      <div className="text-center max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-violet-dim text-violet mb-5">
          <Building2 size={13} /> For agencies
        </span>
        <h1 className="font-head text-4xl font-bold leading-tight text-navy">
          Turn website visitors into qualified, well-scoped project leads.
        </h1>
      </div>

      <div className="grid md:grid-cols-3 gap-5 mt-16">
        {PLANS.map((p) => (
          <div key={p.name} className="bg-white border border-border rounded-2xl p-6">
            <p className="font-head font-semibold text-lg text-navy">{p.name}</p>
            <p className="mt-2 font-head text-3xl font-bold text-navy">{p.price}<span className="text-sm text-navy-soft">/month</span></p>
            <p className="text-sm mt-2 text-navy-soft">{p.body}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
