"use client";

type Node = { id: string; label: string; kind: string };
type Edge = { id: string; source: string; target: string; relation: string; confidence: number };

const KIND_COLOR: Record<string, string> = {
  equipment: "#0f766e",
  document: "#334155",
  regulation: "#b45309",
  process: "#7c3aed",
  department: "#475569",
  event: "#0369a1",
};

export function GraphView({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) {
  if (!nodes.length) return null;
  const width = 480;
  const height = 260;
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2 - 40;
  const positions = new Map<string, { x: number; y: number }>();
  nodes.forEach((n, i) => {
    const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
    positions.set(n.id, { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) });
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: 300 }}>
      {edges.map((e) => {
        const s = positions.get(e.source);
        const t = positions.get(e.target);
        if (!s || !t) return null;
        return (
          <line
            key={e.id}
            x1={s.x}
            y1={s.y}
            x2={t.x}
            y2={t.y}
            stroke="#cbd5e1"
            strokeWidth={Math.max(1, e.confidence * 2)}
          />
        );
      })}
      {nodes.map((n) => {
        const p = positions.get(n.id);
        if (!p) return null;
        return (
          <g key={n.id}>
            <circle cx={p.x} cy={p.y} r={6} fill={KIND_COLOR[n.kind] || "#64748b"} />
            <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize={9} fill="#334155">
              {n.label.length > 18 ? `${n.label.slice(0, 16)}…` : n.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
