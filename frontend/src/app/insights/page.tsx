"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
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
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Insights</h1>
          <p className="mt-1 text-sm text-gray-500">
            Overview of coverage, open issues, and a guided walkthrough.
          </p>
        </div>
        <button
          onClick={runDemo}
          disabled={running}
          className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
        >
          {running && <Loader2 className="h-4 w-4 animate-spin" />}
          {running ? "Running…" : "Run walkthrough"}
        </button>
      </header>

      {health && (
        <section className="space-y-3">
          <div>
            <div className="text-sm font-semibold text-gray-900">1. Coverage snapshot</div>
            <p className="text-xs text-gray-500">How complete the plant knowledge looks right now</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Overall", `${health.knowledge_health}%`],
              ["Coverage", `${health.coverage}%`],
              ["Compliance", `${health.compliance}%`],
              ["Missing docs", health.missing_documents],
              ["Critical gaps", health.critical_gaps],
              ["Freshness", `${health.knowledge_freshness}%`],
            ].map(([label, value]) => (
              <div key={String(label)} className="fm-card p-4">
                <div className="fm-label">{label}</div>
                <div className="mt-1 text-2xl font-semibold text-gray-900">{value}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {demo && (
        <section className="space-y-3">
          <div>
            <div className="text-sm font-semibold text-gray-900">Walkthrough progress</div>
            <p className="text-xs text-gray-500">Auto steps through the main product flow</p>
          </div>
          <div className="fm-card p-4">
            <ol className="space-y-3">
              {demo.beats.map((b: any) => (
                <li key={b.beat} className="flex gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">
                    {b.beat}
                  </span>
                  <div>
                    <div className="font-medium text-gray-900">{b.title}</div>
                    <div className="text-gray-500">{b.detail}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div>
          <div className="text-sm font-semibold text-gray-900">2. Open items</div>
          <p className="text-xs text-gray-500">Work queue, conflicts, and missing docs</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="fm-card p-4">
            <div className="text-sm font-semibold text-gray-900">Suggested work</div>
            <div className="mt-3 space-y-2">
              {recs.map((r) => (
                <div key={r.id} className="rounded-md bg-gray-50 p-3 ring-1 ring-gray-200">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        r.priority === "HIGH"
                          ? "bg-red-100 text-red-800"
                          : r.priority === "MEDIUM"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {r.priority}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{r.title}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{r.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="fm-card p-4">
              <div className="text-sm font-semibold text-gray-900">Document conflicts</div>
              {conflicts.map((c) => (
                <div key={c.id} className="mt-3 text-sm">
                  <div className="font-medium text-gray-900">
                    {c.entity} · {c.field}
                  </div>
                  <p className="text-gray-600">{c.summary}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {c.values.map((v: any) => (
                      <span key={v.document_id} className="rounded bg-gray-50 px-2 py-1 text-xs text-gray-700 ring-1 ring-gray-200">
                        {v.source}: {v.value}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="fm-card p-4">
              <div className="text-sm font-semibold text-gray-900">Missing docs</div>
              <div className="mt-2 space-y-2">
                {gaps.map((g) => (
                  <div key={g.id} className="text-sm text-gray-700">
                    {g.message}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-gray-900">3. Search vs ForgeMind</div>
            <p className="text-xs text-gray-500">Rough time comparison for the same question</p>
          </div>
          <button
            onClick={runCompare}
            className="rounded-md bg-white px-3 py-1.5 text-sm text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
          >
            Compare
          </button>
        </div>
        {compare && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="fm-card p-4">
              <div className="fm-label">{compare.traditional.label}</div>
              <div className="mt-2 text-3xl font-semibold text-gray-400">{compare.traditional.seconds}s</div>
              <ul className="mt-3 space-y-1 text-sm text-gray-500">
                {compare.traditional.hits.map((h: any, i: number) => (
                  <li key={i}>{h.title}</li>
                ))}
              </ul>
            </div>
            <div className="fm-card border-teal-200 bg-teal-50 p-4">
              <div className="fm-label text-teal-800">{compare.forgemind.label}</div>
              <div className="mt-2 text-3xl font-semibold text-teal-900">{compare.forgemind.seconds}s</div>
              <p className="mt-3 text-sm text-gray-800">{compare.forgemind.answer}</p>
            </div>
          </div>
        )}
      </section>

      {story && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-gray-900">4. Incident summary</div>
              <p className="text-xs text-gray-500">Auto write-up from the near-miss report</p>
            </div>
            <a
              href={api.incidentPdfUrl}
              className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800"
            >
              Export PDF
            </a>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {Object.entries(story)
              .filter(([k]) => !["document_id", "title"].includes(k))
              .map(([k, v]) => (
                <div key={k} className="fm-card p-3">
                  <div className="fm-label">{k.replaceAll("_", " ")}</div>
                  <div className="mt-1 text-sm text-gray-800">
                    {Array.isArray(v) ? (v as string[]).join(" · ") : String(v)}
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
