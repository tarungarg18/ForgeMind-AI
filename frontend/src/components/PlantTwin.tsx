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
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="text-sm font-semibold text-gray-900">Plant map</div>
        <p className="text-xs text-gray-500">Click a machine to see its history below</p>
      </div>
      <svg viewBox="0 0 640 360" className="h-[300px] w-full bg-gray-50">
        <rect x="40" y="36" width="360" height="280" rx="8" fill="#fff" stroke="#e5e7eb" />
        <text x="56" y="60" fill="#6b7280" fontSize="13">Section A</text>
        <rect x="420" y="70" width="180" height="210" rx="8" fill="#fff" stroke="#e5e7eb" />
        <text x="436" y="94" fill="#6b7280" fontSize="13">Section B</text>

        <path d="M190 150 H300" stroke="#cbd5e1" strokeWidth="3" />
        <path d="M300 150 V250 H190" stroke="#cbd5e1" strokeWidth="3" fill="none" />

        {equipment.map((eq) => {
          const selected = selectedId === eq.id;
          const color = statusColor[eq.status] || "#9ca3af";
          return (
            <g key={eq.id} className="cursor-pointer" onClick={() => onSelect(eq.id)}>
              <circle
                cx={eq.twin_x}
                cy={eq.twin_y}
                r={selected ? 26 : 20}
                fill="#fff"
                stroke={color}
                strokeWidth={selected ? 3 : 2}
              />
              <circle cx={eq.twin_x} cy={eq.twin_y} r={5} fill={color} />
              <text
                x={eq.twin_x}
                y={eq.twin_y + 38}
                textAnchor="middle"
                fill={selected ? "#111827" : "#4b5563"}
                fontSize="12"
                fontWeight={selected ? 700 : 500}
              >
                {eq.tag}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex gap-4 border-t border-gray-200 px-4 py-2 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-emerald-600" /> OK</span>
        <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-amber-600" /> Watch</span>
        <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-red-600" /> Critical</span>
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
