"use client";

export function EvidenceHeatmap({ items }: { items: any[] }) {
  if (!items?.length) return null;
  const max = Math.max(...items.map((i) => i.weight || 0), 1);

  return (
    <div className="fm-card p-4">
      <div className="text-sm font-semibold text-gray-900">Sources used</div>
      <p className="mb-3 text-xs text-gray-500">How much each document contributed</p>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.document_id}>
            <div className="mb-1 flex justify-between text-xs text-gray-600">
              <span className="truncate pr-2">{item.title}</span>
              <span>{item.weight}</span>
            </div>
            <div className="h-2 overflow-hidden rounded bg-gray-100">
              <div
                className="h-full rounded bg-teal-600"
                style={{ width: `${(item.weight / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
