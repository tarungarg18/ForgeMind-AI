"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export default function UploadPage() {
  const [stages, setStages] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [filename, setFilename] = useState<string | null>(null);

  async function onUpload(file: File) {
    setBusy(true);
    setFilename(file.name);
    setStages([]);
    try {
      const res = await api.upload(file);
      for (const stage of res.stages) {
        setStages((prev) => [...prev, stage]);
        await new Promise((r) => setTimeout(r, 450));
      }
    } finally {
      setBusy(false);
    }
  }

  const latest = stages[stages.length - 1];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-white">Upload</h1>
        <p className="text-slate-400">
          Heterogeneous ingestion with live knowledge graph growth
        </p>
      </div>

      <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-cyan-400/30 bg-[#0a1522]/80 p-8 text-center hover:bg-[#0a1522]">
        <input
          type="file"
          className="hidden"
          accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg,.eml,.txt"
          onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
        />
        <div className="font-[family-name:var(--font-display)] text-xl text-white">
          Drop industrial documents
        </div>
        <p className="mt-2 text-sm text-slate-400">
          PDF · Word · Excel · Images · Email (.eml)
        </p>
        {busy && <p className="mt-4 text-cyan-300">Processing {filename}…</p>}
      </label>

      {stages.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-[#0a1522]/80 p-4">
            <h3 className="text-sm font-medium text-white">Pipeline</h3>
            <ol className="mt-3 space-y-2">
              {stages.map((s, idx) => (
                <li key={idx} className="flex items-center gap-3 text-sm text-slate-300">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-xs text-cyan-300">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="capitalize text-white">{s.stage}</div>
                    <div className="text-xs text-slate-500">{s.detail}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4">
            <h3 className="font-[family-name:var(--font-display)] text-lg text-white">
              Live Knowledge Graph Growth
            </h3>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500">Nodes</div>
                <div className="font-[family-name:var(--font-display)] text-4xl text-cyan-300">
                  {latest?.nodes ?? 0}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500">Edges</div>
                <div className="font-[family-name:var(--font-display)] text-4xl text-amber-300">
                  {latest?.edges ?? 0}
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-300">
              Relations upsert continuously as documents arrive — the plant brain never goes stale.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
