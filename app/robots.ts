import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Private/internal areas only. Pages that should stay out of the index but are
// harmless to fetch (/w, /blueprint, /privacy/delete-my-data) are left crawlable
// on purpose: Google can only honor a `noindex` tag on a page it is allowed to fetch.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: ["/", "/api/og"], disallow: ["/admin", "/agency", "/api/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
