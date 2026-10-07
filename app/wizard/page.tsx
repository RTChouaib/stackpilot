import { pageMeta } from "@/lib/seo";
import type { Metadata } from "next";
import Wizard from "@/components/wizard/Wizard";

export const metadata: Metadata = pageMeta({ title: "Build your tech stack", description: "Answer a few questions and get a tailored tech stack, AI setup, cost estimates, and a launch plan.", path: "/wizard" });

export default function WizardPage() {
  return (
    <main>
      <Wizard />
    </main>
  );
}
