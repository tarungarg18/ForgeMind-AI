"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useEquipment } from "@/components/EquipmentContext";
import { DecisionCardView } from "@/components/DecisionCard";
import { EvidenceHeatmap } from "@/components/EvidenceHeatmap";

const MODES = [
  { id: "engineer", label: "Engineer" },
  { id: "maintenance", label: "Maintenance" },
  { id: "safety", label: "Safety Officer" },
  { id: "compliance", label: "Compliance" },
  { id: "manager", label: "Plant Manager" },
  { id: "auditor", label: "Auditor" },
];

const SUGGESTIONS = [
  "Why did Pump P-102 fail?",
  "Why wasn't this incident predicted?",
  "What did we learn from compressor failures?",
  "Show everything connected to Pump P-102",
  "What happens if maintenance is postponed?",
];

export default function AIPage() {
  const { equipmentId } = useEquipment();
  const [mode, setMode] = useState("manager");
  const [message, setMessage] = useState("Why did Pump P-102 fail?");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [ctx, setCtx] = useState<any>(null);
  const [sim, setSim] = useState<any>(null);
  const [graph, setGraph] = useState<any>(null);

  useEffect(() => {
    if (!equipmentId) return;
    api.equipmentDetail(equipmentId).then(setCtx).catch(console.error);
    api.graph(equipmentId).then(setGraph).catch(console.error);
  }, [equipmentId]);

  async function ask(text?: string) {
    const msg = text || message;
    setLoading(true);
    setSim(null);
    try {
      if (msg.toLowerCase().includes("postponed") || msg.toLowerCase().includes("postpone")) {
        const s = await api.simulate(equipmentId || "eq-p102");
        setSim(s);
      }
      const res = await api.chat({
        message: msg,
        mode,
        equipment_id: equipmentId,
      });
      setResponse(res);
      if (msg.toLowerCase().includes("connected")) {
        setGraph(await api.graph(equipmentId || "eq-p102"));
      }
    } finally {
      setLoading(false);
    }
  }

  async function onFollowup(action: string) {
    if (action === "Run Simulator") {
      setSim(await api.simulate(equipmentId || "eq-p102"));
      return;
    }
    if (action === "View Timeline") {
      window.location.href = "/knowledge";
      return;
    }
    if (action === "Generate RCA" || action === "Inspect Compliance") {
      await ask(
        action === "Generate RCA"
          ? "Generate RCA for Pump P-102 seal leakage and near miss"
          : "Show compliance gaps for Pump P-102 against Factory Act OISD PESO"
      );
      return;
    }
    await ask(action);
  }

  async function onImage(file: File) {
    const reader = new FileReader();
    reader.onload = async () => {
      const b64 = String(reader.result || "");
      setLoading(true);
      try {
        const res = await api.chat({
          message: "What is this valve?",
          mode,
          equipment_id: "eq-v12",
          image_b64: b64,
        });
        setResponse(res);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-white">
          ForgeMind AI
        </h1>
        <p className="text-slate-400">
          One assistant · Decision Cards · Contextual Copilot · Explain Why
        </p>
      </div>

      {ctx && (
        <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4">
          <div className="text-[11px] uppercase tracking-[0.18em] text-cyan-300/80">
            Context locked
          </div>
          <div className="mt-2 grid gap-3 text-sm text-slate-200 sm:grid-cols-4">
            <div>Equipment<br /><span className="text-white">{ctx.tag} · {ctx.name}</span></div>
            <div>Department<br /><span className="text-white">{ctx.department}</span></div>
            <div>Open Incidents<br /><span className="text-white">{ctx.open_incidents}</span></div>
            <div>Maintenance Due<br /><span className="text-white">{ctx.maintenance_due_days} days</span></div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              mode === m.id
                ? "bg-cyan-500 text-slate-950"
                : "border border-white/10 bg-white/5 text-slate-300"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <div className="rounded-xl border border-white/10 bg-[#0a1522]/80 p-4">
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setMessage(s);
                    ask(s);
                  }}
                  className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300 hover:bg-white/10"
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && ask()}
                className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/40"
                placeholder="Ask a decision question…"
              />
              <button
                onClick={() => ask()}
                disabled={loading}
                className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 disabled:opacity-60"
              >
                {loading ? "Thinking…" : "Ask"}
              </button>
            </div>
            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-xs text-slate-400">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onImage(e.target.files[0])}
              />
              <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 hover:bg-white/10">
                Ask by Image
              </span>
              Upload pump / valve / P&ID screenshot
            </label>
          </div>

          {response && (
            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-[#0a1522]/80 p-4 text-slate-200">
                <div className="text-[11px] uppercase tracking-wider text-slate-500">Answer · {response.mode}</div>
                <p className="mt-2 leading-relaxed">{response.answer}</p>
              </div>
              <DecisionCardView card={response.decision_card} onFollowup={onFollowup} />
              {response.explain && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-[#0a1522]/80 p-4">
                    <h4 className="text-sm font-medium text-white">Explain Why</h4>
                    <ul className="mt-2 space-y-1 text-sm text-slate-300">
                      {(response.explain.reasoning_path || []).map((r: string) => (
                        <li key={r}>→ {r}</li>
                      ))}
                    </ul>
                    {response.explain.conflicts?.length > 0 && (
                      <div className="mt-3 rounded-md border border-red-400/30 bg-red-400/10 p-2 text-sm text-red-100">
                        Conflict: {response.explain.conflicts[0]}
                      </div>
                    )}
                    <div className="mt-3 text-xs text-slate-500">
                      Confidence {(response.explain.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                  <EvidenceHeatmap items={response.explain.evidence_heatmap || []} />
                </div>
              )}
            </div>
          )}

          {sim && (
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-4">
              <h3 className="font-[family-name:var(--font-display)] text-lg text-white">
                Decision Simulator
              </h3>
              <div className="mt-3 space-y-2">
                {sim.steps.map((s: any) => (
                  <div key={s.label} className="rounded-md border border-white/10 bg-black/20 p-3">
                    <div className="text-xs uppercase tracking-wider text-amber-200/70">{s.label}</div>
                    <div className="text-white">{s.value}</div>
                    <div className="text-sm text-slate-400">{s.detail}</div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-sm text-amber-100">{sim.recommendation}</p>
            </div>
          )}
        </div>

        <div className="space-y-4 lg:col-span-5">
          <div className="rounded-xl border border-white/10 bg-[#0a1522]/80 p-4">
            <h3 className="text-sm font-medium text-white">Impact Radius / Graph</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {(response?.impact_radius || ctx?.impact_radius || []).map((x: string) => (
                <span key={x} className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-200">
                  {x}
                </span>
              ))}
            </div>
            {graph && (
              <div className="mt-4 max-h-72 space-y-1 overflow-auto text-xs text-slate-400">
                {graph.edges?.slice(0, 20).map((e: any) => (
                  <div key={e.id}>
                    {e.source} <span className="text-cyan-300">──{(e.confidence * 100).toFixed(0)}%──</span> {e.target}
                    <span className="text-slate-600"> ({e.relation})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {response?.explain?.documents_used && (
            <div className="rounded-xl border border-white/10 bg-[#0a1522]/80 p-4">
              <h3 className="text-sm font-medium text-white">Documents Used</h3>
              <div className="mt-2 space-y-2">
                {response.explain.documents_used.map((d: any) => (
                  <div key={d.id} className="text-sm text-slate-300">
                    {d.title}
                    <span className="ml-2 text-xs text-slate-500">trust {(d.trust * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
