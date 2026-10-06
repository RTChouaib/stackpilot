import Link from "next/link";
import { Sparkles, Cpu, DollarSign, Building2, Calculator, ArrowRight } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AdSlot from "@/components/AdSlot";

const cards=[
 {icon:Cpu,title:"Smart stack recommendations",body:"Describe your product and get a practical architecture, technologies, AI options and cost ranges.",href:"/wizard"},
 {icon:Calculator,title:"Free startup calculators",body:"Estimate AI API costs, SaaS metrics, infrastructure spending and payment fees.",href:"/tools"},
 {icon:Building2,title:"Practical tech guides",body:"Understand databases, hosting, AI APIs and startup architecture before you build.",href:"/guides"},
];
const popular=[["AI API Cost Calculator","/tools/ai-api-cost-calculator"],["Startup Cost Calculator","/tools/startup-cost-calculator"],["SaaS MRR Calculator","/tools/saas-mrr-calculator"],["Supabase vs Firebase","/guides/supabase-vs-firebase"],["Best Tech Stack for SaaS","/guides/best-tech-stack-for-saas"],["How to Choose a Tech Stack","/guides/how-to-choose-a-tech-stack"]];
const faqs=[
 ["Is StackPilot free?","Yes. The public calculators, guides and stack generator are designed to be useful without a subscription."],
 ["What is a tech stack?","A tech stack is the set of technologies used to build and operate a software product, such as its frontend, backend, database and hosting."],
 ["Are the cost estimates exact?","No. They are planning estimates. Provider pricing, usage, region and product configuration can change the final cost."],
 ["Can StackPilot recommend an AI stack?","Yes. The generator can include AI models and infrastructure when your product needs them."]
];
export default function Home(){
 return <><SiteHeader/><main>
  <section className="bg-blueprint-grid bg-grid-28 border-b border-border"><div className="max-w-5xl mx-auto px-5 sm:px-8 pt-16 pb-20 text-center">
   <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-blue-dim text-blue mb-5">Free tools for founders & developers</span>
   <h1 className="font-head text-4xl sm:text-6xl font-bold leading-tight text-navy">Find the right tech stack for your startup</h1>
   <p className="mt-5 text-lg text-navy-soft max-w-2xl mx-auto">Get a personalized technology stack, AI recommendations, infrastructure estimates and an MVP plan based on what you&apos;re building.</p>
   <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center"><Link href="/wizard" className="bg-navy text-white rounded-xl px-5 py-3 font-semibold">Build my stack</Link><Link href="/tools" className="bg-white border border-border text-navy rounded-xl px-5 py-3 font-semibold">Explore free tools</Link></div>
  </div></section>
  <AdSlot/>
  <section className="max-w-6xl mx-auto px-5 sm:px-8 py-14"><div className="grid md:grid-cols-3 gap-5">{cards.map(c=><Link key={c.title} href={c.href} className="bg-white border border-border rounded-2xl p-6 hover:shadow-sm"><c.icon size={20} className="text-blue"/><h2 className="font-head font-semibold text-lg mt-4 text-navy">{c.title}</h2><p className="text-sm mt-2 text-navy-soft">{c.body}</p><span className="inline-flex items-center gap-1 mt-5 text-sm font-semibold text-blue">Explore <ArrowRight size={14}/></span></Link>)}</div></section>
  <section className="bg-white border-y border-border"><div className="max-w-6xl mx-auto px-5 sm:px-8 py-14"><h2 className="font-head text-2xl font-bold text-navy">Popular StackPilot resources</h2><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">{popular.map(([t,h])=><Link key={h} href={h} className="border border-border rounded-xl p-4 font-medium text-navy hover:border-blue">{t}</Link>)}</div></div></section>
  <section className="max-w-3xl mx-auto px-5 sm:px-8 py-16"><h2 className="font-head text-2xl font-bold text-navy">Frequently asked questions</h2><div className="mt-6 flex flex-col gap-3">{faqs.map(([q,a])=><details key={q} className="bg-white border border-border rounded-xl p-5"><summary className="font-semibold cursor-pointer text-navy">{q}</summary><p className="mt-2 text-sm leading-6 text-navy-soft">{a}</p></details>)}</div></section>
 </main><SiteFooter/></>;
}