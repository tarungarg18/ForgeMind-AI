"use client";

export function DecisionCardView({
  card,
  onFollowup,
}: {
  card: any;
  onFollowup?: (action: string) => void;
}) {
  if (!card) return null;
  const compliance = card.compliance || {};
  return (
    <div className="overflow-hidden rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-950/50 to-slate-950/80 shadow-[0_0_0_1px_rgba(34,211,238,0.08)]">
      <div className="border-b border-white/10 px-4 py-3">
        <div className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/80">
          Enterprise Decision Center
        </div>
        <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl text-white">
          {card.recommended_action}
        </h3>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Risk" value={card.risk} tone={card.risk === "HIGH" ? "bad" : "warn"} />
        <Metric label="Business Impact" value={card.business_impact} />
        <Metric label="Evidence" value={`${card.evidence_count} docs`} />
        <Metric label="Affected Assets" value={String(card.affected_assets)} />
      </div>
      <div className="flex flex-wrap gap-2 border-t border-white/10 px-4 py-3">
        {Object.entries(compliance).map(([k, v]) => (
          <span
            key={k}
            className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-200"
          >
            {k}{" "}
            <span className={String(v) === "pass" ? "text-emerald-300" : String(v) === "warn" ? "text-amber-300" : "text-red-300"}>
              {String(v) === "pass" ? "✓" : String(v) === "warn" ? "⚠" : "✗"}
            </span>
          </span>
        ))}
        <span className="ml-auto text-xs text-slate-400">
          Confidence {(card.confidence * 100).toFixed(0)}%
        </span>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-white/10 bg-black/20 px-4 py-3">
        <button className="rounded-md bg-cyan-500 px-3 py-1.5 text-sm font-medium text-slate-950 hover:bg-cyan-400">
          Approve Action
        </button>
        {(card.followups || []).map((f: string) => (
          <button
            key={f}
            onClick={() => onFollowup?.(f)}
            className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/10"
          >
            {f}
          </button>
        ))}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "bad" | "warn";
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <div className="text-[11px] uppercase tracking-wider text-slate-400">{label}</div>
      <div
        className={`mt-1 text-sm font-medium ${
          tone === "bad" ? "text-red-300" : tone === "warn" ? "text-amber-300" : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
