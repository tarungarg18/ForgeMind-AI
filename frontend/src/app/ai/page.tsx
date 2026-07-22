"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useEquipment } from "@/components/EquipmentContext";
import { DecisionCardView } from "@/components/DecisionCard";
import { EvidenceHeatmap } from "@/components/EvidenceHeatmap";

const MODES = [
  { id: "engineer", label: "Engineer" },
  { id: "maintenance", label: "Maintenance" },
  { id: "safety", label: "Safety" },
  { id: "compliance", label: "Compliance" },
  { id: "manager", label: "Manager" },
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
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Ask AI</h1>
        <p className="mt-1 text-sm text-gray-500">
          Ask a question about the selected machine. You get an answer, sources, and a suggested action.
        </p>
      </header>

      {ctx && (
        <div className="fm-card bg-teal-50 p-4 ring-teal-100">
          <div className="fm-label text-teal-800">Currently selected</div>
          <div className="mt-2 grid gap-3 text-sm sm:grid-cols-4">
            <div>
              <div className="text-gray-500">Equipment</div>
              <div className="font-medium text-gray-900">{ctx.tag} · {ctx.name}</div>
            </div>
            <div>
              <div className="text-gray-500">Department</div>
              <div className="font-medium text-gray-900">{ctx.department}</div>
            </div>
            <div>
              <div className="text-gray-500">Open incidents</div>
              <div className="font-medium text-gray-900">{ctx.open_incidents}</div>
            </div>
            <div>
              <div className="text-gray-500">Maintenance due</div>
              <div className="font-medium text-gray-900">{ctx.maintenance_due_days} days</div>
            </div>
          </div>
        </div>
      )}

      <section className="space-y-3">
        <div>
          <div className="text-sm font-semibold text-gray-900">1. Answer style</div>
          <p className="text-xs text-gray-500">Same question, different focus</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`rounded-md px-3 py-1.5 text-sm ${
                mode === m.id
                  ? "bg-teal-700 text-white"
                  : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <div className="text-sm font-semibold text-gray-900">2. Ask your question</div>
          <p className="text-xs text-gray-500">Use a suggestion or type your own</p>
        </div>
        <div className="fm-card p-4">
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setMessage(s);
                  ask(s);
                }}
                className="rounded-md bg-gray-50 px-2 py-1 text-xs text-gray-700 ring-1 ring-gray-200 hover:bg-white"
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
              className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-teal-600"
              placeholder="Ask a question…"
            />
            <button
              onClick={() => ask()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Working…" : "Ask"}
            </button>
          </div>
          <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-xs text-gray-500">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onImage(e.target.files[0])}
            />
            <span className="rounded-md bg-white px-2 py-1 ring-1 ring-gray-200 hover:bg-gray-50">
              Ask from image
            </span>
            Upload a pump / valve / panel photo
          </label>
        </div>
      </section>

      {response && (
        <section className="space-y-3">
          <div>
            <div className="text-sm font-semibold text-gray-900">3. Answer</div>
            <p className="text-xs text-gray-500">Plain answer, then suggested action and sources</p>
          </div>

          <div className="fm-card p-4 text-sm leading-relaxed text-gray-800">
            <div className="fm-label">Answer ({response.mode})</div>
            <p className="mt-2">{response.answer}</p>
          </div>

          <DecisionCardView card={response.decision_card} onFollowup={onFollowup} />

          <div className="grid gap-4 md:grid-cols-2">
            {response.explain && (
              <div className="fm-card p-4">
                <div className="text-sm font-semibold text-gray-900">How we got here</div>
                <ul className="mt-2 space-y-1 text-sm text-gray-700">
                  {(response.explain.reasoning_path || []).map((r: string) => (
                    <li key={r}>- {r}</li>
                  ))}
                </ul>
                {response.explain.conflicts?.length > 0 && (
                  <div className="mt-3 rounded-md bg-red-50 p-2 text-sm text-red-900 ring-1 ring-red-100">
                    Conflict: {response.explain.conflicts[0]}
                  </div>
                )}
                <div className="mt-3 text-xs text-gray-500">
                  Confidence {(response.explain.confidence * 100).toFixed(0)}%
                </div>
              </div>
            )}
            <EvidenceHeatmap items={response.explain?.evidence_heatmap || []} />
          </div>
        </section>
      )}

      {sim && (
        <section className="space-y-3">
          <div>
            <div className="text-sm font-semibold text-gray-900">What if we postpone?</div>
            <p className="text-xs text-gray-500">Simple risk walkthrough</p>
          </div>
          <div className="fm-card space-y-2 p-4">
            {sim.steps.map((s: any) => (
              <div key={s.label} className="rounded-md bg-gray-50 p-3 ring-1 ring-gray-200">
                <div className="fm-label">{s.label}</div>
                <div className="font-medium text-gray-900">{s.value}</div>
                <div className="text-sm text-gray-600">{s.detail}</div>
              </div>
            ))}
            <p className="pt-2 text-sm text-gray-800">{sim.recommendation}</p>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div>
          <div className="text-sm font-semibold text-gray-900">Connected items</div>
          <p className="text-xs text-gray-500">Nearby equipment and links from the graph</p>
        </div>
        <div className="fm-card p-4">
          <div className="flex flex-wrap gap-2">
            {(response?.impact_radius || ctx?.impact_radius || []).map((x: string) => (
              <span key={x} className="rounded-md bg-gray-50 px-2 py-1 text-xs text-gray-700 ring-1 ring-gray-200">
                {x}
              </span>
            ))}
          </div>
          {graph && (
            <div className="mt-4 max-h-56 space-y-1 overflow-auto text-xs text-gray-600">
              {graph.edges?.slice(0, 20).map((e: any) => (
                <div key={e.id}>
                  {e.source} --{(e.confidence * 100).toFixed(0)}%--&gt; {e.target}
                  <span className="text-gray-400"> ({e.relation})</span>
                </div>
              ))}
            </div>
          )}
          {response?.explain?.documents_used && (
            <div className="mt-4 border-t border-gray-100 pt-3">
              <div className="fm-label">Documents used</div>
              <div className="mt-2 space-y-1 text-sm text-gray-700">
                {response.explain.documents_used.map((d: any) => (
                  <div key={d.id}>
                    {d.title}
                    <span className="ml-2 text-xs text-gray-400">trust {(d.trust * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
