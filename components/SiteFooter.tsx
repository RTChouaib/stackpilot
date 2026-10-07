import Link from "next/link";
export default function SiteFooter() {
 return <footer className="border-t border-border mt-16 bg-white">
  <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 grid sm:grid-cols-4 gap-8 text-sm">
   <div><div className="font-head font-bold text-navy">StackPilot</div><p className="mt-2 text-navy-soft">Practical startup technology guidance, calculators and tools.</p></div>
   <div><h2 className="font-semibold text-navy">Explore</h2><div className="mt-3 flex flex-col gap-2"><Link href="/tools">Tools</Link><Link href="/guides">Guides</Link><Link href="/comparisons">Comparisons</Link><Link href="/stacks">Tech stacks</Link><Link href="/cost">Costs</Link><Link href="/qna">Q&A</Link><Link href="/ai">AI guides</Link><Link href="/startups">Startups</Link><Link href="/development">Development</Link><Link href="/wizard">Build my stack</Link></div></div>
   <div><h2 className="font-semibold text-navy">Company</h2><div className="mt-3 flex flex-col gap-2"><Link href="/about">About</Link><Link href="/for-agencies">For agencies</Link><Link href="/contact">Contact</Link><Link href="/advertising">Advertising</Link></div></div>
   <div><h2 className="font-semibold text-navy">Legal</h2><div className="mt-3 flex flex-col gap-2"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/cookie-policy">Cookie policy</Link><Link href="/disclaimer">Disclaimer</Link></div></div>
  </div>
  <div className="border-t border-border py-5 text-center text-xs text-navy-soft">© {new Date().getFullYear()} StackPilot. Estimates are informational and may change.</div>
 </footer>
}