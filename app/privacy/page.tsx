import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <main className="max-w-2xl mx-auto px-5 sm:px-8 py-16">
      <h1 className="font-head text-3xl font-bold text-navy">Privacy Policy</h1>
      <p className="text-xs text-navy-soft mt-1">Placeholder — have this reviewed by a lawyer before launch.</p>
      <div className="mt-6 text-sm leading-relaxed flex flex-col gap-4 text-navy-soft">
        <p>
          When you use the wizard, we store your questionnaire answers and the generated blueprint.
          Blueprints are addressed by an unguessable link — anyone with that link can view it, but it
          isn&apos;t otherwise discoverable or listed against your identity.
        </p>
        <p>
          If you request an MVP quote, a builder match, or provide your email to receive your
          blueprint, we store your name, email, and message so we (or, for agency-branded wizards,
          that agency) can follow up. We send you one email confirming that request.
        </p>
        <p>
          We use Upstash (rate limiting), Resend (email delivery), OpenAI (blueprint generation),
          and a Postgres database provider to operate the service. Data handled under the &quot;Privacy /
          EU hosting&quot; priority is directed to EU-region infrastructure where the underlying providers
          support it.
        </p>
        <p>
          You can request deletion of all data tied to your email address at any time —{" "}
          <Link href="/privacy/delete-my-data" className="underline">delete my data</Link>. We&apos;ll
          send a confirmation link to that address before anything is removed.
        </p>
      </div>
    </main>
  );
}
