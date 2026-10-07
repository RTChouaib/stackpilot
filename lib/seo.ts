import type { Metadata } from "next";

/**
 * Single source of truth for public/SEO URLs. Deliberately NOT read from
 * NEXT_PUBLIC_APP_URL: a wrong value there (localhost, a *.vercel.app preview
 * URL, the old domain) would silently poison every canonical, sitemap entry
 * and structured-data URL. NEXT_PUBLIC_APP_URL is still used for emails,
 * Stripe and origin checks, which is a separate concern.
 */
export const SITE_URL = "https://stackpilot.by-rtc.com";
export const SITE_NAME = "StackPilot";
export const OG_IMAGE = `${SITE_URL}/api/og`;

/** Absolute canonical URL for a path. "/" -> the bare origin; no trailing slashes elsewhere. */
export function absoluteUrl(path: string): string {
  if (!path || path === "/") return SITE_URL;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`.replace(/\/+$/, "");
}

type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
};

/**
 * Full per-page metadata: unique title/description, self-referencing canonical,
 * Open Graph and Twitter cards. (Next replaces — not merges — openGraph/twitter
 * from the root layout, so the image has to be restated here.)
 */
export function pageMeta({ title, description, path, type = "website" }: PageMetaInput): Metadata {
  const url = absoluteUrl(path);
  // The root layout appends " — StackPilot"; don't double it when the title already says it.
  const hasBrand = title.includes(SITE_NAME);
  const fullTitle = hasBrand ? title : `${title} — ${SITE_NAME}`;
  return {
    title: hasBrand ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      locale: "en_US",
      type,
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [OG_IMAGE] },
  };
}

/** Metadata for private/utility pages that must never be indexed. */
export const noIndexMeta: Metadata = { robots: { index: false, follow: false, googleBot: { index: false, follow: false } } };

/** schema.org BreadcrumbList from [name, path] pairs (Home is prepended). */
export function breadcrumb(items: [string, string][]) {
  const all: [string, string][] = [["Home", "/"], ...items];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: absoluteUrl(path) })),
  };
}

/** schema.org Article for a content page (no dates/ratings — only what we actually know). */
export function articleLd(opts: { headline: string; description: string; path: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.headline,
    description: opts.description,
    mainEntityOfPage: absoluteUrl(opts.path),
    url: absoluteUrl(opts.path),
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };
}
