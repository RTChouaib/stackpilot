export default function AdSlot({ slot, className = "" }: { slot?: string; className?: string }) {
 const client = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;
 if (!client) return null;
 return <div className={`my-8 min-h-[90px] flex items-center justify-center overflow-hidden ${className}`} aria-label="Advertisement">
   <ins className="adsbygoogle" style={{display:"block", minHeight:90, width:"100%"}} data-ad-client={client} data-ad-slot={slot ?? ""} data-ad-format="auto" data-full-width-responsive="true" />
   <script dangerouslySetInnerHTML={{__html:"(adsbygoogle = window.adsbygoogle || []).push({});"}} />
 </div>;
}