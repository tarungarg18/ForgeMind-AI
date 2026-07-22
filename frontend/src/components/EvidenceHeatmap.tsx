"use client";

export function EvidenceHeatmap({ items }: { items: any[] }) {
  if (!items?.length) return null;
  const max = Math.max(...items.map((i) => i.weight || 0), 1);
  return (
    <div className="rounded-xl border border-white/10 bg-[#0a1522]/80 p-4">
      <h4 className="text-sm font-medium text-white">Sources used</h4>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item.document_id}>
            <div className="mb-1 flex justify-between text-xs text-slate-400">
              <span className="truncate pr-2 text-slate-200">{item.title}</span>
              <span>{item.weight}</span>
            </div>
            <div className="h-2 overflow-hidden rounded bg-white/5">
              <div
                className="h-full rounded bg-gradient-to-r from-cyan-600 to-amber-400"
                style={{ width: `${(item.weight / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
