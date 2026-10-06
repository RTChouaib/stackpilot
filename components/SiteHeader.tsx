import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function SiteHeader() {
  return <header className="border-b border-border bg-white/95 backdrop-blur sticky top-0 z-40">
    <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2" aria-label="StackPilot home">
        <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center"><Sparkles size={16} color="#fff" /></div>
        <span className="font-head font-bold text-lg text-navy">StackPilot</span>
      </Link>
      <nav className="flex items-center gap-2 sm:gap-5 text-sm">
        <Link href="/tools" className="text-navy-soft hover:text-navy">Tools</Link>
        <Link href="/guides" className="hidden sm:block text-navy-soft hover:text-navy">Guides</Link>
        <Link href="/qna" className="hidden sm:block text-navy-soft hover:text-navy">Q&A</Link><Link href="/comparisons" className="hidden lg:block text-navy-soft hover:text-navy">Comparisons</Link>
        <Link href="/wizard" className="bg-navy text-white rounded-xl px-4 py-2.5 font-semibold">Build my stack</Link>
      </nav>
    </div>
  </header>;
}