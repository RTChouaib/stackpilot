"use client";

import { useState } from "react";
import type { PartnerToolRow } from "@/lib/admin/settings";

interface Props {
  initialTools: PartnerToolRow[];
}

export default function PartnerToolsPanel({ initialTools }: Props) {
  const [tools, setTools] = useState(initialTools);
  const [pending, setPending] = useState<string | null>(null);

  const toggle = async (toolName: string) => {
    setPending(toolName);
    const current = tools.find((t) => t.toolName === toolName);
    const nextValue = !current?.isPartner;
    setTools((ts) => ts.map((t) => (t.toolName === toolName ? { ...t, isPartner: nextValue } : t)));
    await fetch("/api/admin/partner-tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolName, isPartner: nextValue }),
    }).catch(() => {
      // revert on network failure
      setTools((ts) => ts.map((t) => (t.toolName === toolName ? { ...t, isPartner: !nextValue } : t)));
    });
    setPending(null);
  };

  return (
    <div className="bg-white border border-border rounded-2xl p-6">
      <p className="font-head font-semibold mb-1 text-navy">Partner agencies & tools</p>
      <p className="text-sm mb-4 text-navy-soft">
        Mark a tool as a partner recommendation. This never changes the primary recommendation — only its label in the monetization funnel.
      </p>
      <div className="grid sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto">
        {tools.map((tool) => (
          <button
            key={tool.toolName}
            onClick={() => toggle(tool.toolName)}
            disabled={pending === tool.toolName}
            className="flex items-center justify-between text-sm px-3.5 py-2.5 rounded-lg border border-border text-left disabled:opacity-50"
          >
            <span className="truncate pr-2">{tool.toolName}</span>
            {tool.isPartner ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-dim text-amber flex-shrink-0">Partner</span>
            ) : (
              <span className="text-xs flex-shrink-0 text-navy-soft">Mark as partner</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
