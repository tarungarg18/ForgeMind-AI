"use client";

export function Timeline({
  events,
  onOpenDoc,
}: {
  events: any[];
  onOpenDoc?: (documentId: string) => void;
}) {
  return (
    <div className="fm-card p-4">
      <div className="text-sm font-semibold text-gray-900">Timeline</div>
      <p className="mb-4 text-xs text-gray-500">Events for this machine, oldest to newest</p>
      <div className="relative ml-2 space-y-0 border-l border-gray-200 pl-5">
        {events.map((ev, idx) => (
          <div key={ev.id} className="relative pb-5">
            <span
              className={`absolute -left-[23px] top-1.5 h-3 w-3 rounded-full border-2 border-white ${
                ev.severity === "critical"
                  ? "bg-red-500"
                  : ev.severity === "warning"
                  ? "bg-amber-500"
                  : "bg-teal-600"
              }`}
            />
            <div className="text-xs text-gray-500">{ev.date}</div>
            <div className="text-sm font-medium capitalize text-gray-900">
              {String(ev.event_type).replaceAll("_", " ")}
            </div>
            <div className="text-sm text-gray-600">{ev.summary}</div>
            {ev.document_id && (
              <button
                onClick={() => onOpenDoc?.(ev.document_id)}
                className="mt-1 text-xs font-medium text-teal-700 hover:underline"
              >
                Open document
              </button>
            )}
            {idx === events.length - 1 && (
              <div className="mt-2 text-xs font-medium text-gray-400">Today</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
