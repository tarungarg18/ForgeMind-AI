"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useWalkthrough } from "@/components/WalkthroughContext";
import { api } from "@/lib/api";

export function HomeDashboard() {
  const { start } = useWalkthrough();
  const [health, setHealth] = useState<number | null>(null);
  const [recs, setRecs] = useState<Array<{ id: string; title: string; priority: string }>>([]);
  const [notes, setNotes] = useState<Array<{ id: string; message: string }>>([]);

  useEffect(() => {
    api.knowledgeHealth().then((h) => setHealth(h.knowledge_health)).catch(() => {});
    api.recommendations().then((r) => setRecs(r.slice(0, 3))).catch(() => {});
    api.notifications().then((n) => setNotes(n.slice(0, 3))).catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Home</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upload docs, inspect equipment, ask questions, review insights.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/upload" className="fm-card p-4 hover:bg-gray-50">
          <div className="text-sm font-semibold text-gray-900">Upload</div>
          <p className="mt-1 text-xs text-gray-500">Add a plant document</p>
        </Link>
        <Link href="/knowledge" className="fm-card p-4 hover:bg-gray-50">
          <div className="text-sm font-semibold text-gray-900">Knowledge</div>
          <p className="mt-1 text-xs text-gray-500">Map, history, documents</p>
        </Link>
        <Link href="/ai" className="fm-card p-4 hover:bg-gray-50">
          <div className="text-sm font-semibold text-gray-900">Ask AI</div>
          <p className="mt-1 text-xs text-gray-500">Questions with sources</p>
        </Link>
        <Link href="/insights" className="fm-card p-4 hover:bg-gray-50">
          <div className="text-sm font-semibold text-gray-900">Insights</div>
          <p className="mt-1 text-xs text-gray-500">Coverage and gaps</p>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="fm-card p-4">
          <div className="fm-label">Doc coverage</div>
          <div className="mt-1 text-3xl font-semibold text-teal-800">
            {health !== null ? `${health}%` : "—"}
          </div>
          <button
            type="button"
            data-testid="home-start-walkthrough"
            onClick={start}
            className="mt-4 rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Start walkthrough
          </button>
        </div>

        <div className="fm-card p-4 lg:col-span-1">
          <div className="text-sm font-semibold text-gray-900">Top recommendations</div>
          <div className="mt-3 space-y-2">
            {recs.map((r) => (
              <div key={r.id} className="rounded-md bg-gray-50 px-3 py-2 text-sm">
                <span className="mr-2 text-xs font-semibold text-amber-700">{r.priority}</span>
                {r.title}
              </div>
            ))}
            {!recs.length ? <p className="text-sm text-gray-500">Loading…</p> : null}
          </div>
        </div>

        <div className="fm-card p-4">
          <div className="text-sm font-semibold text-gray-900">Recent alerts</div>
          <div className="mt-3 space-y-2">
            {notes.map((n) => (
              <div key={n.id} className="text-sm text-gray-700">
                {n.message}
              </div>
            ))}
            {!notes.length ? <p className="text-sm text-gray-500">No alerts.</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
