"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function InsightsPage() {
  const [health, setHealth] = useState<any>(null);
  const [recs, setRecs] = useState<any[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [gaps, setGaps] = useState<any[]>([]);
  const [compare, setCompare] = useState<any>(null);
  const [demo, setDemo] = useState<any>(null);
  const [story, setStory] = useState<any>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    api.knowledgeHealth().then(setHealth).catch(console.error);
    api.recommendations().then(setRecs).catch(console.error);
    api.conflicts().then(setConflicts).catch(console.error);
    api.gaps().then(setGaps).catch(console.error);
    api.incidentStory().then(setStory).catch(console.error);
  }, []);

  async function runCompare() {
    setCompare(await api.searchCompare("Pump P-102 failure"));
  }

  async function runDemo() {
    setRunning(true);
    setDemo(null);
    try {
      const res = await api.runDemo();
      // reveal beats progressively
      const beats: any[] = [];
      for (const b of res.beats) {
        beats.push(b);
        setDemo({ ...res, beats: [...beats] });
        await new Promise((r) => setTimeout(r, 500));
      }
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-white">Insights</h1>
          <p className="text-slate-400">
            Health score, open issues, and a quick walkthrough
          </p>
        </div>
        <button
          onClick={runDemo}
          disabled={running}
          className="rounded-md bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
        >
          {running ? "Running Demo…" : "Run Demo"}
        </button>
      </div>

      {health && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {[
            ["Overall", `${health.knowledge_health}%`],
            ["Coverage", `${health.coverage}%`],
            ["Compliance", `${health.compliance}%`],
            ["Missing docs", health.missing_documents],
            ["Critical gaps", health.critical_gaps],
            ["Freshness", `${health.knowledge_freshness}%`],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-xl border border-white/10 bg-[#0a1522]/80 p-4">
              <div className="text-[11px] uppercase tracking-wider text-slate-500">{label}</div>
              <div className="mt-1 font-[family-name:var(--font-display)] text-2xl text-white">{value}</div>
            </div>
          ))}
        </div>
      )}

      {demo && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-4">
          <h3 className="font-[family-name:var(--font-display)] text-lg text-white">
            Walkthrough
          </h3>
          <ol className="mt-3 space-y-2">
            {demo.beats.map((b: any) => (
              <li key={b.beat} className="flex gap-3 text-sm text-slate-200">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-slate-950">
                  {b.beat}
                </span>
                <div>
                  <div className="font-medium text-white">{b.title}</div>
                  <div className="text-slate-400">{b.detail}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-[#0a1522]/80 p-4">
          <h3 className="font-[family-name:var(--font-display)] text-lg text-white">
            Suggested work
          </h3>
          <div className="mt-3 space-y-2">
            {recs.map((r) => (
              <div key={r.id} className="rounded-md border border-white/10 bg-white/5 p-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      r.priority === "HIGH"
                        ? "bg-red-500/20 text-red-300"
                        : r.priority === "MEDIUM"
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-slate-500/20 text-slate-300"
                    }`}
                  >
                    {r.priority}
                  </span>
                  <span className="text-sm text-white">{r.title}</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{r.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-4">
            <h3 className="text-sm font-medium text-white">Document conflicts</h3>
            {conflicts.map((c) => (
              <div key={c.id} className="mt-3 text-sm text-red-100">
                <div className="font-medium">{c.entity} · {c.field}</div>
                <p className="text-red-100/80">{c.summary}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {c.values.map((v: any) => (
                    <span key={v.document_id} className="rounded border border-white/10 bg-black/20 px-2 py-1 text-xs">
                      {v.source}: {v.value}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-white/10 bg-[#0a1522]/80 p-4">
            <h3 className="text-sm font-medium text-white">Missing docs</h3>
            <div className="mt-2 space-y-2">
              {gaps.map((g) => (
                <div key={g.id} className="text-sm text-amber-100">
                  {g.message}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0a1522]/80 p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-[family-name:var(--font-display)] text-lg text-white">
            Search vs ForgeMind
          </h3>
          <button
            onClick={runCompare}
            className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-200"
          >
            Compare
          </button>
        </div>
        {compare && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-md border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-wider text-slate-500">
                {compare.traditional.label}
              </div>
              <div className="mt-2 text-3xl text-slate-300">{compare.traditional.seconds}s</div>
              <ul className="mt-3 space-y-1 text-sm text-slate-400">
                {compare.traditional.hits.map((h: any, i: number) => (
                  <li key={i}>{h.title}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-md border border-cyan-400/30 bg-cyan-400/5 p-4">
              <div className="text-xs uppercase tracking-wider text-cyan-300/80">
                {compare.forgemind.label}
              </div>
              <div className="mt-2 text-3xl text-cyan-300">{compare.forgemind.seconds}s</div>
              <p className="mt-3 text-sm text-slate-200">{compare.forgemind.answer}</p>
            </div>
          </div>
        )}
      </div>

      {story && (
        <div className="rounded-xl border border-white/10 bg-[#0a1522]/80 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-[family-name:var(--font-display)] text-lg text-white">
              Incident summary
            </h3>
            <a
              href={api.incidentPdfUrl}
              className="rounded-md bg-cyan-500 px-3 py-1.5 text-sm font-medium text-slate-950"
            >
              Export PDF
            </a>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {Object.entries(story)
              .filter(([k]) => !["document_id", "title"].includes(k))
              .map(([k, v]) => (
                <div key={k} className="rounded-md border border-white/10 bg-white/5 p-3">
                  <div className="text-xs uppercase tracking-wider text-slate-500">
                    {k.replaceAll("_", " ")}
                  </div>
                  <div className="mt-1 text-sm text-slate-200">
                    {Array.isArray(v) ? (v as string[]).join(" · ") : String(v)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
