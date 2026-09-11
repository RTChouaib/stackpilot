"use client";

import { Sparkles } from "lucide-react";

interface Props {
  freeRemaining: number;
  paidCredits: number;
  accent: string;
}

export default function QuotaBadge({ freeRemaining, paidCredits, accent }: Props) {
  const total = freeRemaining + paidCredits;
  const label =
    total === 0
      ? "No generations left today"
      : paidCredits > 0
      ? `${freeRemaining} free + ${paidCredits} purchased left`
      : `${freeRemaining} free generation${freeRemaining === 1 ? "" : "s"} left today`;

  return (
    <div
      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
      style={{ color: accent, background: `${accent}14` }}
    >
      <Sparkles size={12} />
      {label}
    </div>
  );
}
