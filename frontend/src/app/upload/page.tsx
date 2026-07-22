"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
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
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Upload</h1>
        <p className="mt-1 text-sm text-gray-500">
          Add plant documents here. After processing, they show up in Knowledge and Ask AI.
        </p>
      </header>

      <section className="space-y-3">
        <div>
          <div className="text-sm font-semibold text-gray-900">1. Choose a file</div>
          <p className="text-xs text-gray-500">PDF, Word, Excel, image, or email (.eml)</p>
        </div>
        <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center hover:border-teal-600 hover:bg-teal-50/40">
          <input
            type="file"
            className="hidden"
            accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg,.eml,.txt"
            onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
          />
          <div className="text-base font-medium text-gray-900">Drop a file or click to browse</div>
          <p className="mt-1 text-sm text-gray-500">One file at a time for now</p>
          {busy && (
            <p className="mt-4 inline-flex items-center gap-2 text-sm text-teal-800">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing {filename}…
            </p>
          )}
        </label>
      </section>

      {stages.length > 0 && (
        <section className="space-y-3">
          <div>
            <div className="text-sm font-semibold text-gray-900">2. Processing status</div>
            <p className="text-xs text-gray-500">What happens to the file, step by step</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="fm-card p-4">
              <ol className="space-y-3">
                {stages.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-semibold text-teal-800">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="capitalize font-medium text-gray-900">{s.stage}</div>
                      <div className="text-xs text-gray-500">{s.detail}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="fm-card p-4">
              <div className="text-sm font-semibold text-gray-900">Graph update</div>
              <p className="text-xs text-gray-500">Nodes and links added from this file</p>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <div className="fm-label">Nodes</div>
                  <div className="text-3xl font-semibold text-gray-900">{latest?.nodes ?? 0}</div>
                </div>
                <div>
                  <div className="fm-label">Edges</div>
                  <div className="text-3xl font-semibold text-gray-900">{latest?.edges ?? 0}</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
