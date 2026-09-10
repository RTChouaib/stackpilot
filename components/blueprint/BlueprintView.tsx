"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, Clock, Gauge, Layers, Server, Database, Lock, Globe,
  FileDown, CreditCard, BarChart3, Mail, Bot, Users, ArrowRight,
  Download, Share2, TrendingUp, ExternalLink,
} from "lucide-react";
import type { Blueprint } from "@/lib/db/schema";
import type { BlueprintOutput } from "@/lib/ai/schema";

type TierKey = "lean" | "balanced" | "scaleReady";

const TIER_LABELS: Record<TierKey, { name: string; accent: string }> = {
  lean: { name: "Lean MVP", accent: "#157F4A" },
  balanced: { name: "Balanced Recommendation", accent: "#4C5FF0" },
  scaleReady: { name: "Scale-ready", accent: "#8B5CF6" },
};

const FIELD_ROWS: Array<[keyof BlueprintOutput["lean"], string, typeof Layers]> = [
  ["frontend", "Frontend", Layers],
  ["backend", "Backend / API", Server],
  ["database", "Database", Database],
  ["auth", "Authentication", Lock],
  ["hosting", "Hosting", Globe],
  ["storage", "File storage", FileDown],
  ["payments", "Payments", CreditCard],
  ["analytics", "Analytics", BarChart3],
  ["email", "Email & notifications", Mail],
  ["aiProvider", "AI provider", Bot],
];

interface Props {
  blueprint: Blueprint;
  recommendations: { lean: BlueprintOutput["lean"]; balanced: BlueprintOutput["balanced"]; scaleReady: BlueprintOutput["scaleReady"] };
  aiSetup: BlueprintOutput["aiSetup"];
  architectureNotes: string;
}

interface ArchitectureNode {
  label: string;
  sub: string;
  Icon: typeof Layers;
}

function architectureNodes(tier: BlueprintOutput["lean"]): ArchitectureNode[] {
  return [
    { label: "USERS", sub: "People using your product", Icon: Users },
    { label: "FRONTEND", sub: tier.frontend, Icon: Layers },
    { label: "BACKEND / API", sub: tier.backend, Icon: Server },
    { label: "DATABASE", sub: tier.database, Icon: Database },
  ];
}

export default function BlueprintView({ blueprint, recommendations, aiSetup, architectureNotes }: Props) {
  const [activeTier, setActiveTier] = useState<TierKey>("balanced");
  const tier = recommendations[activeTier];

  const handleDownloadPdf = () => {
    window.location.href = `/api/pdf/${blueprint.shareToken}`;
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/blueprint/${blueprint.shareToken}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* clipboard may be unavailable; link is still in the address bar */
    }
  };

  const trackPartnerClick = (toolName: string) => {
    fetch("/api/partner-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blueprintId: blueprint.id, toolName }),
      keepalive: true,
    }).catch(() => {});
  };

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4 mb-3">
        <div>
          <p className="text-xs font-mono text-navy-soft">
            YOUR STACKPILOT BLUEPRINT · LAST UPDATED{" "}
            {new Date(blueprint.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }).toUpperCase()}
          </p>
          <h1 className="font-head text-3xl font-bold mt-1 text-navy">{blueprint.projectName}</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={handleShare} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl border-2 border-border text-navy">
            <Share2 size={14} /> Share
          </button>
          <button onClick={handleDownloadPdf} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl border-2 border-border text-navy">
            <Download size={14} /> Download PDF
          </button>
        </div>
      </header>

      {/* Tier tabs */}
      <div className="flex gap-2 mt-6 mb-6 flex-wrap">
        {(Object.keys(TIER_LABELS) as TierKey[]).map((k) => (
          <button
            key={k}
            onClick={() => setActiveTier(k)}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold border-2 flex items-center gap-2"
            style={{
              borderColor: activeTier === k ? TIER_LABELS[k].accent : "#E1E4F0",
              background: activeTier === k ? `${TIER_LABELS[k].accent}14` : "#fff",
              color: activeTier === k ? TIER_LABELS[k].accent : "#10193A",
            }}
          >
            {TIER_LABELS[k].name}
            {k === "balanced" && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-dim text-blue">Recommended</span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTier}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
          className="bg-white border border-border rounded-2xl overflow-hidden"
          style={{ borderTopWidth: 4, borderTopColor: TIER_LABELS[activeTier].accent }}
        >
          <div className="p-6 border-b border-border flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-head text-xl font-bold text-navy">{TIER_LABELS[activeTier].name}</p>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-alt text-navy-soft"><Clock size={12} /> {tier.estimatedLaunchTime}</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-alt text-navy-soft"><Gauge size={12} /> {tier.difficultyLevel}</span>
            </div>
          </div>

          <div className="p-6 border-b border-border">
            <p className="text-xs font-mono text-navy-soft mb-3">ESTIMATED MONTHLY COST</p>
            <div className="grid grid-cols-3 gap-2">
              {[["100 users", tier.monthlyCostAt100Users], ["1,000 users", tier.monthlyCostAt1000Users], ["10,000 users", tier.monthlyCostAt10000Users]].map(([l, v]) => (
                <div key={l} className="rounded-lg p-3 text-center bg-surface-alt">
                  <p className="text-[11px] text-navy-soft">{l}</p>
                  <p className="font-head font-semibold text-navy">{v}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 border-b border-border">
            <p className="text-xs font-mono text-navy-soft mb-3">TECHNICAL SPEC</p>
            <div className="rounded-xl border border-border overflow-hidden">
              {FIELD_ROWS.map(([key, label, Icon], i) => (
                <div key={key} className={`flex items-start gap-3 px-4 py-3 text-sm ${i !== FIELD_ROWS.length - 1 ? "border-b border-border" : ""}`}>
                  <Icon size={15} className="mt-0.5 flex-shrink-0 text-navy-soft" />
                  <span className="font-mono text-xs w-36 flex-shrink-0 pt-0.5 text-navy-soft">{label}</span>
                  <span className="font-medium text-navy">{String(tier[key])}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 border-b border-border grid sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-mono text-navy-soft mb-2">WHY THIS FITS</p>
              <p className="text-sm text-navy">{tier.whyItFits}</p>
            </div>
            <div>
              <p className="text-xs font-mono text-navy-soft mb-2">MAIN TRADE-OFFS</p>
              <ul className="text-sm flex flex-col gap-1.5">
                {tier.mainTradeoffs.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-navy">
                    <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0 bg-navy-soft" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {aiSetup.length > 0 && (
        <section className="mt-14">
          <h2 className="font-head text-2xl font-bold text-navy">Best AI setup for your product</h2>
          <p className="text-sm mt-2 mb-7 text-navy-soft">
            The right AI model depends on the task, privacy requirements, expected quality, response speed, and budget. Model capability and pricing change frequently.
          </p>
          <div className="flex flex-col gap-4">
            {aiSetup.map((t, i) => (
              <div key={i} className="bg-white border border-border rounded-2xl p-5">
                <p className="text-xs font-mono text-navy-soft">{t.task.toUpperCase()}</p>
                <p className="font-head font-semibold text-lg mt-0.5 text-navy">{t.recommendedModel}</p>
                <p className="text-sm mt-1 text-navy-soft">{t.bestFor}</p>
                <div className="grid sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-border text-sm">
                  <p><span className="font-medium">Privacy note: </span><span className="text-navy-soft">{t.privacyConsiderations}</span></p>
                  <p><span className="font-medium">Explanation: </span><span className="text-navy-soft">{t.plainLanguageExplanation}</span></p>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-green-dim text-green">Lower cost: {t.lowerCostAlternative}</span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-violet-dim text-violet">Higher quality: {t.higherQualityAlternative}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-14">
        <h2 className="font-head text-2xl font-bold text-navy">How it fits together</h2>
        <div className="bg-white bg-blueprint-grid bg-grid-28 border border-border rounded-2xl p-8 mt-6">
          <div className="flex flex-col items-center gap-2">
            {architectureNodes(tier).map((node, i, arr) => (
              <div key={node.label} className="w-full flex flex-col items-center">
                <div className="bg-white border border-border rounded-xl px-5 py-4 flex items-center gap-3 w-full sm:w-72">
                  <node.Icon size={18} className="text-blue flex-shrink-0" />
                  <div>
                    <p className="text-xs font-mono text-navy-soft">{node.label}</p>
                    <p className="font-semibold text-sm mt-0.5 text-navy">{node.sub}</p>
                  </div>
                </div>
                {i < arr.length - 1 && <div className="w-px h-6 bg-border" />}
              </div>
            ))}
          </div>
          <p className="text-sm text-navy-soft text-center mt-6 pt-6 border-t border-border">{architectureNotes}</p>
        </div>
      </section>

      <MonetizationFunnel blueprint={blueprint} balancedTier={recommendations.balanced} onPartnerClick={trackPartnerClick} />
    </>
  );
}

/* ============================================================
   MONETIZATION FUNNEL
   ============================================================ */

function MonetizationFunnel({
  blueprint,
  balancedTier,
  onPartnerClick,
}: {
  blueprint: Blueprint;
  balancedTier: BlueprintOutput["balanced"];
  onPartnerClick: (tool: string) => void;
}) {
  const [openPanel, setOpenPanel] = useState<"quote" | null>(null);
  const [matchSent, setMatchSent] = useState(false);
  const [quoteSent, setQuoteSent] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", notes: "", targetBudget: "", targetTimeline: "" });
  const [partnerFlags, setPartnerFlags] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/partner-tools")
      .then((r) => r.json())
      .then((rows: { toolName: string; isPartner: boolean }[]) => {
        setPartnerFlags(Object.fromEntries(rows.filter((r) => r.isPartner).map((r) => [r.toolName, true])));
      })
      .catch(() => {
        /* non-critical — funnel still works without partner labels */
      });
  }, []);

  const submitLead = async (leadType: "mvp_quote" | "builder_match") => {
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        blueprintId: blueprint.id,
        leadType,
        privacyConsent: true,
        ...(leadType === "mvp_quote" ? form : {}),
      }),
    });
    if (res.ok) {
      if (leadType === "mvp_quote") setQuoteSent(true);
      else setMatchSent(true);
    }
  };

  const tools = [balancedTier.frontend, balancedTier.database, balancedTier.hosting, balancedTier.payments].filter(
    (v) => v && !v.startsWith("Not needed")
  );

  return (
    <section className="mt-16 pt-10 border-t border-border">
      <h2 className="font-head text-2xl font-bold text-center text-navy">Want help turning this blueprint into a real product?</h2>
      <div className="grid md:grid-cols-3 gap-5 mt-8">
        <div className="bg-white border border-border rounded-2xl p-6 flex flex-col">
          <p className="font-head font-semibold text-navy">Get an MVP quote</p>
          <p className="text-sm mt-1.5 flex-1 text-navy-soft">Receive a fixed-price estimate for building your MVP.</p>
          {quoteSent ? (
            <p className="text-sm mt-4 text-green flex items-center gap-2"><Check size={16} /> Request received.</p>
          ) : openPanel === "quote" ? (
            <div className="mt-4 flex flex-col gap-2">
              <input placeholder="Name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="rounded-lg border-2 border-border px-3 py-2 text-sm" />
              <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-lg border-2 border-border px-3 py-2 text-sm" />
              <input placeholder="Budget" value={form.targetBudget} onChange={(e) => setForm({ ...form, targetBudget: e.target.value })} className="rounded-lg border-2 border-border px-3 py-2 text-sm" />
              <button onClick={() => submitLead("mvp_quote")} className="mt-1 bg-navy text-white rounded-lg py-2 text-sm font-semibold inline-flex items-center justify-center gap-2">
                Request my MVP quote <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <button onClick={() => setOpenPanel("quote")} className="mt-4 border-2 border-border rounded-xl py-2.5 text-sm font-semibold text-navy">Request my MVP quote</button>
          )}
        </div>

        <div className="bg-white border border-border rounded-2xl p-6 flex flex-col">
          <p className="font-head font-semibold text-navy">Match with a vetted builder</p>
          <p className="text-sm mt-1.5 flex-1 text-navy-soft">We&apos;ll match you with a developer or agency suited to your product, budget, and stack.</p>
          {matchSent ? (
            <p className="text-sm mt-4 text-green flex items-center gap-2"><Check size={16} /> Request sent.</p>
          ) : (
            <button onClick={() => submitLead("builder_match")} className="mt-4 border-2 border-border rounded-xl py-2.5 text-sm font-semibold text-navy">Find a builder</button>
          )}
        </div>

        <div className="bg-white border border-border rounded-2xl p-6 flex flex-col">
          <p className="font-head font-semibold text-navy">Start with recommended tools</p>
          <div className="flex flex-col gap-2 mt-3 flex-1">
            {tools.map((tool) => (
              <button key={tool} onClick={() => onPartnerClick(tool)} className="flex items-center justify-between text-sm px-3 py-2 rounded-lg border border-border text-navy">
                <span className="truncate pr-2">{tool}</span>
                {partnerFlags[tool] ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-dim text-amber flex-shrink-0">Partner recommendation</span>
                ) : (
                  <ExternalLink size={13} className="text-navy-soft flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
          <p className="text-[11px] mt-3 text-navy-soft">We may earn a commission if you choose a partner tool. This never changes our primary recommendation.</p>
        </div>
      </div>
    </section>
  );
}
