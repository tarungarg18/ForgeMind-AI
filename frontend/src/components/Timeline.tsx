"use client";

export function Timeline({
  events,
  onOpenDoc,
}: {
  events: any[];
  onOpenDoc?: (documentId: string) => void;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0a1522]/80 p-4">
      <h3 className="font-[family-name:var(--font-display)] text-lg text-white">
        Equipment timeline
      </h3>
      <p className="mb-4 text-sm text-slate-400">Past events linked to source documents</p>
      <div className="relative ml-3 space-y-0 border-l border-cyan-500/30 pl-6">
        {events.map((ev, idx) => (
          <div key={ev.id} className="relative pb-6">
            <span
              className={`absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 border-[#0a1522] ${
                ev.severity === "critical"
                  ? "bg-red-400"
                  : ev.severity === "warning"
                  ? "bg-amber-400"
                  : "bg-cyan-400"
              }`}
            />
            <div className="text-xs text-slate-500">{ev.date}</div>
            <div className="text-sm font-medium capitalize text-white">
              {ev.event_type.replaceAll("_", " ")}
            </div>
            <div className="text-sm text-slate-300">{ev.summary}</div>
            {ev.document_id && (
              <button
                onClick={() => onOpenDoc?.(ev.document_id)}
                className="mt-1 text-xs text-cyan-300 hover:underline"
              >
                Open original document →
              </button>
            )}
            {idx === events.length - 1 && (
              <div className="mt-3 text-xs uppercase tracking-wider text-emerald-300/80">Today</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
