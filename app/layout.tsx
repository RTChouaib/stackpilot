import type { Metadata } from "next";
import "./globals.css";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://stackpilot.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: { default: "StackPilot — Choose the right stack before you build.", template: "%s — StackPilot" },
  description: "Describe your product and get a tailored technical stack, AI model recommendations, costs, and a launch plan.",
  openGraph: {
    title: "StackPilot",
    description: "From idea to the right tech stack, cost estimate, and build plan — in minutes.",
    url: BASE_URL,
    siteName: "StackPilot",
    images: [{ url: "/api/og", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "StackPilot",
    url: BASE_URL,
    description: "Free AI-powered project-planning platform for founders.",
  };

  return (
    <html lang="en">
      <body>
        {/* eslint-disable-next-line react/no-danger */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        {children}
      </body>
    </html>
  );
}
