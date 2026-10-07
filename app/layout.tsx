import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://stackpilot.by-rtc.com";
const ADSENSE_ID = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;

export const metadata: Metadata = {
 metadataBase: new URL(BASE_URL),
 title: { default: "StackPilot — Startup Tech Stack, Tools & Calculators", template: "%s — StackPilot" },
 description: "Free startup technology guides, calculators, comparisons and a personalized tech stack generator.",
 openGraph: { title: "StackPilot — Startup Tech Stack, Tools & Calculators", description: "Practical technology guides, startup calculators and a personalized stack generator.", url: BASE_URL, siteName:"StackPilot", images:[{url:"/api/og",width:1200,height:630}], type:"website" },
 twitter:{card:"summary_large_image"},
 robots:{index:true,follow:true},
};

export default function RootLayout({children}:{children:React.ReactNode}) {
 const orgJsonLd={"@context":"https://schema.org","@type":"Organization",name:"StackPilot",url:BASE_URL,description:"Startup technology tools, guides and calculators."};
 const siteJsonLd={"@context":"https://schema.org","@type":"WebSite",name:"StackPilot",url:BASE_URL};
 return <html lang="en"><body>
  {ADSENSE_ID && <Script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ID}`} crossOrigin="anonymous" strategy="afterInteractive" />}
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(orgJsonLd)}} />
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(siteJsonLd)}} />
  {children}
  <Analytics />
 </body></html>;
}