import type { Metadata } from "next";
import Wizard from "@/components/wizard/Wizard";

export const metadata: Metadata = {
  title: "Build your stack — StackPilot",
  description: "Answer a few questions and get a tailored tech stack, AI setup, cost estimates, and a launch plan.",
};

export default function WizardPage() {
  return (
    <main>
      <Wizard />
    </main>
  );
}
