"use client";

import { cn } from "@/lib/utils";

const statusColor: Record<string, string> = {
  healthy: "#34d399",
  warning: "#fbbf24",
  critical: "#f87171",
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
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0a1522]/80">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl text-white">
            Plant Twin View
          </h2>
          <p className="text-sm text-slate-400">
            Section layout — click an asset to open its memory
          </p>
        </div>
        <div className="flex gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Healthy</span>
          <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Warning</span>
          <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-red-400" /> Critical</span>
        </div>
      </div>
      <svg viewBox="0 0 640 400" className="h-[360px] w-full">
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="640" height="400" fill="url(#grid)" />
        <rect x="40" y="40" width="360" height="300" rx="12" fill="rgba(8,47,73,0.35)" stroke="rgba(34,211,238,0.25)" />
        <text x="56" y="68" fill="#67e8f9" fontSize="14" fontFamily="var(--font-display)">Section A — Cooling / Process</text>
        <rect x="420" y="80" width="180" height="220" rx="12" fill="rgba(69,26,3,0.25)" stroke="rgba(251,191,36,0.25)" />
        <text x="436" y="108" fill="#fcd34d" fontSize="14" fontFamily="var(--font-display)">Section B — Utilities</text>

        {/* pipes */}
        <path d="M190 170 H300" stroke="rgba(125,211,252,0.5)" strokeWidth="4" />
        <path d="M300 170 H300 250 H190 290" stroke="rgba(125,211,252,0.35)" strokeWidth="3" fill="none" />
        <path d="M190 290 H420 200" stroke="rgba(125,211,252,0.25)" strokeWidth="3" fill="none" />

        {equipment.map((eq) => {
          const selected = selectedId === eq.id;
          const color = statusColor[eq.status] || "#94a3b8";
          return (
            <g
              key={eq.id}
              className="cursor-pointer"
              onClick={() => onSelect(eq.id)}
            >
              <circle
                cx={eq.twin_x}
                cy={eq.twin_y}
                r={selected ? 28 : 22}
                fill="rgba(15,23,42,0.9)"
                stroke={color}
                strokeWidth={selected ? 4 : 3}
              />
              <circle cx={eq.twin_x} cy={eq.twin_y} r={6} fill={color} />
              <text
                x={eq.twin_x}
                y={eq.twin_y + 42}
                textAnchor="middle"
                fill={selected ? "#fff" : "#cbd5e1"}
                fontSize="12"
                fontWeight={selected ? 700 : 500}
              >
                {eq.tag}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function StatusDot({ status }: { status: string }) {
  return (
    <span
      className={cn("inline-block h-2.5 w-2.5 rounded-full")}
      style={{ background: statusColor[status] || "#94a3b8" }}
    />
  );
}
