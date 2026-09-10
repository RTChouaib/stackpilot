import type { LucideIcon } from "lucide-react";

export function StatCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string | number }) {
  return (
    <div className="bg-white border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono text-navy-soft">{label.toUpperCase()}</p>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-dim">
          <Icon size={18} className="text-blue" />
        </div>
      </div>
      <p className="font-head text-3xl font-bold mt-3 text-navy">{value}</p>
    </div>
  );
}

export function SimpleBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex flex-col gap-2.5">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="text-xs w-40 flex-shrink-0 truncate text-navy-soft">{d.label}</span>
          <div className="flex-1 h-6 rounded-md overflow-hidden bg-surface-alt">
            <div
              className="h-full rounded-md flex items-center justify-end px-2 bg-blue"
              style={{ width: `${Math.max(6, (d.value / max) * 100)}%` }}
            >
              <span className="text-[11px] font-semibold text-white">{d.value}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
