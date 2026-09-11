"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";

interface Props {
  priceUsd: number;
  creditsPerPurchase: number;
  reason: "daily_limit_reached" | "ip_ceiling_reached";
  paymentsEnabled: boolean;
  onClose: () => void;
}

export default function PaywallPanel({ priceUsd, creditsPerPurchase, reason, paymentsEnabled, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buyCredits = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      if (!res.ok) throw new Error("Could not start checkout. Please try again.");
      const { url } = await res.json();
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setLoading(false);
    }
  };

  const canOfferTopUp = reason === "daily_limit_reached" && paymentsEnabled;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(16,25,58,0.5)" }}>
      <div className="bg-white rounded-2xl border border-border max-w-sm w-full p-6 text-center">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto bg-blue-dim">
          <CreditCard size={18} className="text-blue" />
        </div>
        <h2 className="font-head text-xl font-bold text-navy mt-4">
          {reason === "daily_limit_reached" ? "You're out of free generations for today" : "Daily limit reached for this network"}
        </h2>
        <p className="text-sm text-navy-soft mt-2">
          {reason === "daily_limit_reached"
            ? canOfferTopUp
              ? `Your free generations reset tomorrow, or buy ${creditsPerPurchase} more right now for $${priceUsd} — they never expire.`
              : "Your free generations reset tomorrow — come back then for 2 more."
            : "This network has hit its daily generation ceiling. Try again tomorrow, or from a different network."}
        </p>
        {error && <p className="text-sm text-amber mt-3">{error}</p>}
        <div className="mt-6 flex flex-col gap-2">
          {canOfferTopUp && (
            <button
              onClick={buyCredits}
              disabled={loading}
              className="bg-navy text-white rounded-xl py-3 text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
              Buy {creditsPerPurchase} more for ${priceUsd}
            </button>
          )}
          <button onClick={onClose} className="text-sm font-medium text-navy-soft py-2">
            {canOfferTopUp ? "Maybe later" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
