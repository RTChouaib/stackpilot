"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import type { Lead } from "@/lib/db/schema";

const STATUS_OPTIONS = ["new", "contacted", "matched", "converted", "closed"] as const;

interface Props {
  initialLeads: (Pick<Lead, "id" | "leadType" | "fullName" | "email" | "status" | "createdAt"> & { projectName: string | null })[];
  /** Defaults to the platform admin endpoints; pass agency-scoped paths for /agency/[slug]. */
  patchUrl?: (id: string) => string;
  exportUrl?: string;
}

export default function LeadsTable({
  initialLeads,
  patchUrl = (id) => `/api/admin/leads/${id}`,
  exportUrl = "/api/admin/export-csv",
}: Props) {
  const [leads, setLeads] = useState(initialLeads);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const updateStatus = async (id: string, status: (typeof STATUS_OPTIONS)[number]) => {
    setPendingId(id);
    const prev = leads;
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l)));
    const res = await fetch(patchUrl(id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) setLeads(prev); // revert on failure
    setPendingId(null);
  };

  return (
    <div className="bg-white border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <p className="font-head font-semibold text-navy">Lead management</p>
        <a
          href={exportUrl}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl border-2 border-border text-navy"
        >
          <Download size={14} /> Export CSV
        </a>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="text-left border-b border-border">
              {["Type", "Name", "Email", "Product", "Status", "Date"].map((h) => (
                <th key={h} className="py-2 pr-4 text-xs font-mono font-normal text-navy-soft">{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 && (
              <tr><td colSpan={6} className="py-6 text-center text-navy-soft">No leads yet.</td></tr>
            )}
            {leads.map((l) => (
              <tr key={l.id} className="border-b border-border">
                <td className="py-2 pr-4"><span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-dim text-blue">{l.leadType}</span></td>
                <td className="py-2 pr-4">{l.fullName ?? "—"}</td>
                <td className="py-2 pr-4">{l.email}</td>
                <td className="py-2 pr-4 truncate max-w-[160px]">{l.projectName ?? "—"}</td>
                <td className="py-2 pr-4">
                  <select
                    value={l.status}
                    disabled={pendingId === l.id}
                    onChange={(e) => updateStatus(l.id, e.target.value as (typeof STATUS_OPTIONS)[number])}
                    className="text-xs border border-border rounded-lg px-2 py-1 bg-white"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="py-2 pr-4 text-xs text-navy-soft">{new Date(l.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
