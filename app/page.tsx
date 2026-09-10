import Link from "next/link";
import { Sparkles, Cpu, DollarSign, Building2, ShieldCheck } from "lucide-react";

const FEATURES = [
  { icon: Cpu, title: "Smart stack recommendations", body: "Answer a few questions and get three tailored options — lean, balanced, and scale-ready — with real reasoning behind each pick." },
  { icon: DollarSign, title: "Realistic cost estimates", body: "See monthly costs at 100, 1,000, and 10,000 users, so you know what you're signing up for before you build." },
  { icon: Building2, title: "Get your MVP built", body: "When you're ready, request a fixed-price quote or get matched with a vetted developer or agency." },
];

const FAQS = [
  { q: "Is StackPilot really free?", a: "Yes. Generating your blueprint costs nothing. StackPilot earns from optional MVP quotes, agency matches, and partner tool referrals — never from changing what we recommend." },
  { q: "Do I need to know how to code?", a: "No. Every recommendation is explained in plain language, and the Lean MVP option is built for non-technical founders." },
  { q: "How accurate are the cost estimates?", a: "They're realistic ranges based on typical pricing at each user tier, not quotes. Treat them as planning numbers." },
];

export default function LandingPage() {
  return (
    <main>
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center">
              <Sparkles size={16} color="#fff" />
            </div>
            <span className="font-head font-bold text-lg text-navy">StackPilot</span>
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm">
            <Link href="/for-agencies" className="text-navy-soft">For agencies</Link>
            <Link href="/wizard" className="bg-navy text-white rounded-xl px-4 py-2.5 font-semibold">Build my stack</Link>
          </nav>
        </div>
      </header>

      <section className="bg-blueprint-grid bg-grid-28 border-b border-border">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 pt-16 pb-20 text-center">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-dim text-blue mb-5">
            <ShieldCheck size={13} /> Free for founders
          </span>
          <h1 className="font-head text-4xl sm:text-5xl font-bold leading-tight text-navy">
            Choose the right stack before you build.
          </h1>
          <p className="mt-5 text-lg text-navy-soft max-w-2xl mx-auto">
            Describe your product and get a tailored technical stack, AI model recommendations, costs, and a launch plan.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/wizard" className="bg-navy text-white rounded-xl px-5 py-3 font-semibold text-sm">Build my stack</Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-20">
        <div className="grid md:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <article key={f.title} className="bg-white border border-border rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-dim">
                <f.icon size={18} className="text-blue" />
              </div>
              <h2 className="font-head font-semibold text-lg mt-4 text-navy">{f.title}</h2>
              <p className="text-sm mt-2 text-navy-soft">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-border py-20" aria-labelledby="faq-heading">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <h2 id="faq-heading" className="font-head text-2xl sm:text-3xl font-bold text-center mb-10 text-navy">
            Frequently asked questions
          </h2>
          <div className="flex flex-col gap-3">
            {FAQS.map((f) => (
              <details key={f.q} className="bg-white border border-border rounded-2xl px-5 py-4">
                <summary className="font-medium text-sm cursor-pointer text-navy">{f.q}</summary>
                <p className="text-sm mt-2 text-navy-soft">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-10 text-center text-xs text-navy-soft">
        © {new Date().getFullYear()} StackPilot. Recommendations are informational and not a substitute for professional technical advice.
      </footer>
    </main>
  );
}
