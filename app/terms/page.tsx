import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <main className="max-w-2xl mx-auto px-5 sm:px-8 py-16">
      <h1 className="font-head text-3xl font-bold text-navy">Terms of Service</h1>
      <p className="text-xs text-navy-soft mt-1">Placeholder — have this reviewed by a lawyer before launch.</p>
      <div className="mt-6 text-sm leading-relaxed flex flex-col gap-4 text-navy-soft">
        <p>
          StackPilot generates technology stack recommendations, cost estimates, and launch plans
          based on the answers you provide. These are informational suggestions, not professional
          engineering, legal, financial, or compliance advice — you&apos;re responsible for validating
          any recommendation before acting on it.
        </p>
        <p>
          Cost estimates are planning ranges based on typical pricing at each usage tier, not
          quotes from any vendor. Actual costs depend on your specific usage and the pricing each
          provider has in effect at the time you sign up.
        </p>
        <p>
          The core blueprint-generation product is free. Where we recommend a third-party tool
          flagged as a &quot;Partner recommendation,&quot; we may earn a commission if you sign up through
          that link — this never changes which stack or tool we recommend first; see our{" "}
          <a href="/privacy" className="underline">Privacy Policy</a> for how we handle any data
          you submit through a quote or builder-match request.
        </p>
        <p>
          Agencies using the white-label wizard are responsible for their own client relationships;
          StackPilot provides the underlying blueprint-generation infrastructure and lead capture
          only.
        </p>
        <p>You may not use StackPilot to submit unlawful content or attempt to abuse, scrape, or overload the service.</p>
      </div>
    </main>
  );
}
