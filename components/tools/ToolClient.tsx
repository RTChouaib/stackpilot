"use client";
import { useMemo, useState } from "react";
type ToolKey="ai-api-cost-calculator"|"startup-cost-calculator"|"saas-mrr-calculator"|"saas-churn-calculator"|"saas-ltv-calculator"|"saas-cac-calculator"|"stripe-fee-calculator"|"token-cost-calculator"|"bandwidth-calculator"|"tech-stack-generator";
const money=(n:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2}).format(Number.isFinite(n)?n:0);
const Input=({label,value,onChange,step="1"}:{label:string,value:string,onChange:(v:string)=>void,step?:string})=><label className="text-sm text-navy"><span className="block font-medium mb-1">{label}</span><input inputMode="decimal" type="number" min="0" step={step} value={value} onChange={e=>onChange(e.target.value)} className="w-full rounded-xl border border-border px-3 py-2.5 bg-white"/></label>;
export default function ToolClient({tool}:{tool:ToolKey}){
 const [v,setV]=useState<Record<string,string>>({});
 const x=(k:string,d="0")=>v[k]??d; const set=(k:string,n:string)=>setV({...v,[k]:n});
 let title="",result:React.ReactNode=null,fields:React.ReactNode=null;
 if(tool==="ai-api-cost-calculator"||tool==="token-cost-calculator"){
   title=tool==="ai-api-cost-calculator"?"AI API Cost Calculator":"Token Cost Calculator";
   fields=<><Input label="Input tokens per month" value={x("in")} onChange={n=>set("in",n)}/><Input label="Output tokens per month" value={x("out")} onChange={n=>set("out",n)}/><Input label="Input price per 1M tokens ($)" value={x("ip","3")} onChange={n=>set("ip",n)}/><Input label="Output price per 1M tokens ($)" value={x("op","15")} onChange={n=>set("op",n)}/></>;
   const cost=Number(x("in"))*Number(x("ip","3"))/1e6+Number(x("out"))*Number(x("op","15"))/1e6;
   result=<Metric label="Estimated monthly API cost" value={money(cost)}/>;
 } else if(tool==="startup-cost-calculator"){
   title="Startup Cost Calculator"; fields=<><Input label="Hosting / month ($)" value={x("hosting","20")} onChange={n=>set("hosting",n)}/><Input label="Database / month ($)" value={x("db","25")} onChange={n=>set("db",n)}/><Input label="AI / month ($)" value={x("ai","0")} onChange={n=>set("ai",n)}/><Input label="Storage / month ($)" value={x("storage","5")} onChange={n=>set("storage",n)}/><Input label="Email / month ($)" value={x("email","10")} onChange={n=>set("email",n)}/><Input label="Other services / month ($)" value={x("other","10")} onChange={n=>set("other",n)}/></>;
   const total=["hosting","db","ai","storage","email","other"].reduce((a,k)=>a+Number(x(k)),0); result=<><Metric label="Estimated monthly infrastructure" value={money(total)}/><Metric label="Estimated annual infrastructure" value={money(total*12)}/></>;
 } else if(tool==="saas-mrr-calculator"){
   title="SaaS MRR Calculator"; fields=<><Input label="Paying customers" value={x("customers","100")} onChange={n=>set("customers",n)}/><Input label="Average monthly revenue per customer ($)" value={x("arpu","49")} onChange={n=>set("arpu",n)}/></>;
   const m=Number(x("customers"))*Number(x("arpu")); result=<><Metric label="MRR" value={money(m)}/><Metric label="ARR" value={money(m*12)}/></>;
 } else if(tool==="saas-churn-calculator"){
   title="SaaS Churn Calculator"; fields=<><Input label="Customers at start" value={x("start","1000")} onChange={n=>set("start",n)}/><Input label="Customers lost" value={x("lost","30")} onChange={n=>set("lost",n)}/></>;
   const churn=Number(x("start"))?Number(x("lost"))/Number(x("start"))*100:0; result=<><Metric label="Monthly customer churn" value={`${churn.toFixed(2)}%`}/><Metric label="Monthly retention" value={`${Math.max(0,100-churn).toFixed(2)}%`}/></>;
 } else if(tool==="saas-ltv-calculator"){
   title="SaaS LTV Calculator"; fields=<><Input label="ARPU / month ($)" value={x("arpu","49")} onChange={n=>set("arpu",n)}/><Input label="Gross margin (%)" value={x("margin","80")} onChange={n=>set("margin",n)}/><Input label="Monthly churn (%)" value={x("churn","3")} onChange={n=>set("churn",n)} step="0.1"/></>;
   const c=Number(x("churn"))/100; const ltv=c?Number(x("arpu"))*(Number(x("margin"))/100)/c:0; result=<Metric label="Estimated customer LTV" value={money(ltv)}/>;
 } else if(tool==="saas-cac-calculator"){
   title="SaaS CAC Calculator"; fields=<><Input label="Sales & marketing spend ($)" value={x("spend","5000")} onChange={n=>set("spend",n)}/><Input label="New customers acquired" value={x("new","100")} onChange={n=>set("new",n)}/></>;
   const cac=Number(x("new"))?Number(x("spend"))/Number(x("new")):0; result=<Metric label="Customer acquisition cost" value={money(cac)}/>;
 } else if(tool==="stripe-fee-calculator"){
   title="Stripe Fee Calculator"; fields=<><Input label="Transaction amount ($)" value={x("amount","100")} onChange={n=>set("amount",n)}/><Input label="Fee percentage (%)" value={x("pct","2.9")} onChange={n=>set("pct",n)} step="0.01"/><Input label="Fixed fee per transaction ($)" value={x("fixed","0.30")} onChange={n=>set("fixed",n)} step="0.01"/><Input label="Number of transactions" value={x("count","1")} onChange={n=>set("count",n)}/></>;
   const fee=(Number(x("amount"))*Number(x("pct"))/100+Number(x("fixed")))*Number(x("count")); result=<><Metric label="Estimated fees" value={money(fee)}/><Metric label="Estimated net revenue" value={money(Number(x("amount"))*Number(x("count"))-fee)}/></>;
 } else if(tool==="bandwidth-calculator"){
   title="Bandwidth Calculator"; fields=<><Input label="Monthly visitors" value={x("visitors","10000")} onChange={n=>set("visitors",n)}/><Input label="Pages per visitor" value={x("pages","2")} onChange={n=>set("pages",n)}/><Input label="Average page size (MB)" value={x("size","2")} onChange={n=>set("size",n)}/></>;
   const gb=Number(x("visitors"))*Number(x("pages"))*Number(x("size"))/1024; result=<Metric label="Estimated monthly bandwidth" value={`${gb.toFixed(2)} GB`}/>;
 } else {
   title="Tech Stack Generator"; fields=<><label className="text-sm text-navy font-medium">Product type<select value={x("type","SaaS")} onChange={e=>set("type",e.target.value)} className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 bg-white"><option>SaaS</option><option>AI app</option><option>Marketplace</option><option>Mobile app</option><option>E-commerce</option><option>Internal tool</option></select></label><label className="text-sm text-navy font-medium">Team<select value={x("team","Solo founder")} onChange={e=>set("team",e.target.value)} className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 bg-white"><option>Solo founder</option><option>Small team</option><option>Established team</option></select></label></>;
   const t=x("type","SaaS"); const stack=t==="AI app"?["Next.js","Node.js","PostgreSQL / Supabase","OpenAI or Anthropic API","Vercel"]:t==="Mobile app"?["React Native","Node.js","PostgreSQL / Supabase","Expo","Vercel"]:t==="Marketplace"?["Next.js","Node.js","PostgreSQL","Stripe Connect","Vercel"]:["Next.js","Supabase / PostgreSQL","Stripe","Vercel"]; result=<div><p className="font-semibold text-navy">Recommended starting stack</p><ul className="mt-3 list-disc pl-5 space-y-1 text-sm text-navy-soft">{stack.map(s=><li key={s}>{s}</li>)}</ul></div>;
 }
 return <div className="bg-white border border-border rounded-2xl p-5 sm:p-7"><h2 className="font-head text-xl font-bold text-navy">{title}</h2><div className="grid sm:grid-cols-2 gap-4 mt-6">{fields}</div><div className="mt-6 bg-surface-alt rounded-xl p-5">{result}</div><p className="text-xs text-navy-soft mt-5">Estimates are illustrative. Provider pricing, usage, region and configuration can change actual costs.</p></div>;
}
function Metric({label,value}:{label:string,value:string}){return <div className="mb-3 last:mb-0"><div className="text-xs uppercase tracking-wide text-navy-soft">{label}</div><div className="font-head text-3xl font-bold text-navy">{value}</div></div>}
