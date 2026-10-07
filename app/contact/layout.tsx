import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Contact StackPilot",
  description: "Get in touch with StackPilot about tech stack recommendations, partnerships or questions about our calculators and guides.",
  path: "/contact",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
