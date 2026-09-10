"use client";

import { useState } from "react";
import type { RecommendationSettings } from "@/lib/db/schema";

interface Props {
  initialSettings: Pick<RecommendationSettings, "costWeight" | "speedWeight" | "qualityWeight">;
}

const FIELDS = [
  { key: "costWeight", label: "Cost" },
  { key: "speedWeight", label: "Speed" },
  { key: "qualityWeight", label: "Quality" },
] as const;

export default function RecommendationSettingsPanel({ initialSettings }: Props) {
  const [values, setValues] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const update = (key: (typeof FIELDS)[number]["key"], value: number) => {
    setValues((v) => ({ ...v, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    setSaved(false);
    await fetch("/api/admin/recommendation-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-white border border-border rounded-2xl p-6">
      <p className="font-head font-semibold mb-1 text-navy">Recommendation emphasis</p>
      <p className="text-sm mb-4 text-navy-soft">
        Illustrative controls only — these are recorded but not currently applied to the recommendation engine.
        The deterministic rules engine and AI prompt use a fixed decision table (see README), not these weights.
      </p>
      <div className="flex flex-col gap-4">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <div className="flex justify-between text-xs mb-1 text-navy-soft">
              <span>{f.label}</span><span>{values[f.key]}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={values[f.key]}
              onChange={(e) => update(f.key, Number(e.target.value))}
              className="w-full"
            />
          </div>
        ))}
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="mt-4 text-sm font-semibold px-4 py-2 rounded-xl border-2 border-border text-navy disabled:opacity-50"
      >
        {saving ? "Saving…" : saved ? "Saved" : "Save"}
      </button>
    </div>
  );
}
