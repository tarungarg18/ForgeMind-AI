"use client";

const statusColor: Record<string, string> = {
  healthy: "#059669",
  warning: "#d97706",
  critical: "#dc2626",
};

export function PlantTwin({
  equipment,
  selectedId,
  onSelect,
}: {
  equipment: any[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="fm-card overflow-hidden">
      <div className="border-b border-gray-200 px-5 py-4">
        <div className="text-sm font-semibold text-gray-900">Plant map</div>
        <p className="mt-1 text-sm text-gray-500">
          Click a circle (P-102, V-12, …) to select that machine.
        </p>
      </div>
      <svg viewBox="0 0 640 320" className="h-[260px] w-full bg-gray-50">
        <rect x="40" y="28" width="360" height="260" rx="10" fill="#fff" stroke="#e5e7eb" />
        <text x="56" y="52" fill="#6b7280" fontSize="13">Section A</text>
        <rect x="420" y="60" width="180" height="200" rx="10" fill="#fff" stroke="#e5e7eb" />
        <text x="436" y="84" fill="#6b7280" fontSize="13">Section B</text>

        <path d="M190 140 H300" stroke="#cbd5e1" strokeWidth="3" />
        <path d="M300 140 V230 H190" stroke="#cbd5e1" strokeWidth="3" fill="none" />

        {equipment.map((eq) => {
          const selected = selectedId === eq.id;
          const color = statusColor[eq.status] || "#9ca3af";
          return (
            <g
              key={eq.id}
              style={{ cursor: "pointer" }}
              onClick={() => onSelect(eq.id)}
            >
              {selected && (
                <circle
                  cx={eq.twin_x}
                  cy={eq.twin_y}
                  r={34}
                  fill="none"
                  stroke="#0f766e"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                />
              )}
              <circle
                cx={eq.twin_x}
                cy={eq.twin_y}
                r={selected ? 24 : 20}
                fill="#fff"
                stroke={color}
                strokeWidth={selected ? 3 : 2}
              />
              <circle cx={eq.twin_x} cy={eq.twin_y} r={5} fill={color} />
              <text
                x={eq.twin_x}
                y={eq.twin_y + 40}
                textAnchor="middle"
                fill={selected ? "#0f766e" : "#374151"}
                fontSize="13"
                fontWeight={selected ? 700 : 500}
              >
                {eq.tag}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap gap-4 border-t border-gray-200 px-5 py-3 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" /> OK
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-600" /> Watch
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-600" /> Critical
        </span>
      </div>
    </div>
  );
}

export function StatusDot({ status }: { status: string }) {
  return (
    <span
      className="inline-block h-2.5 w-2.5 rounded-full"
      style={{ background: statusColor[status] || "#9ca3af" }}
    />
  );
}
