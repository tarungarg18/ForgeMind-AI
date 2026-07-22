"use client";

function severityLabel(severity: string) {
  if (severity === "critical") return { text: "Critical", className: "bg-red-50 text-red-700" };
  if (severity === "warning") return { text: "Warning", className: "bg-amber-50 text-amber-800" };
  return { text: "Normal", className: "bg-gray-100 text-gray-600" };
}

function prettyType(eventType: string) {
  return String(eventType).replaceAll("_", " ");
}

export function Timeline({
  events,
  onOpenDoc,
}: {
  events: any[];
  onOpenDoc?: (documentId: string) => void;
}) {
  if (!events?.length) {
    return (
      <div className="fm-card p-6">
        <div className="text-sm font-semibold text-gray-900">History</div>
        <p className="mt-2 text-sm text-gray-500">No events yet for this machine.</p>
      </div>
    );
  }

  return (
    <div className="fm-card overflow-hidden">
      <div className="border-b border-gray-200 px-5 py-4">
        <div className="text-sm font-semibold text-gray-900">History</div>
        <p className="mt-1 text-sm text-gray-500">
          What happened to this machine, from first install to now.
        </p>
      </div>

      <div className="divide-y divide-gray-100">
        {events.map((ev, idx) => {
          const sev = severityLabel(ev.severity);
          const isLatest = idx === events.length - 1;
          return (
            <div
              key={ev.id}
              className={`px-5 py-4 ${isLatest ? "bg-teal-50/40" : "bg-white"}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">{ev.date}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${sev.className}`}>
                  {sev.text}
                </span>
                {isLatest && (
                  <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-800">
                    Latest
                  </span>
                )}
              </div>
              <div className="mt-1 text-sm font-medium capitalize text-gray-800">
                {prettyType(ev.event_type)}
              </div>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">{ev.summary}</p>
              {ev.document_id && (
                <button
                  type="button"
                  onClick={() => onOpenDoc?.(ev.document_id)}
                  className="mt-3 text-sm font-medium text-teal-700 hover:text-teal-900 hover:underline"
                >
                  View linked document
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
