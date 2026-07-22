"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { PlantTwin, StatusDot } from "@/components/PlantTwin";
import { Timeline } from "@/components/Timeline";
import { useEquipment } from "@/components/EquipmentContext";

export default function KnowledgePage() {
  const { equipmentId, setEquipmentId } = useEquipment();
  const [twin, setTwin] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [doc, setDoc] = useState<any>(null);
  const [query, setQuery] = useState("Pump");
  const [search, setSearch] = useState<any>(null);

  useEffect(() => {
    api.plantTwin().then(setTwin).catch(console.error);
  }, []);

  useEffect(() => {
    if (!equipmentId) return;
    api.equipmentDetail(equipmentId).then(setDetail).catch(console.error);
  }, [equipmentId]);

  async function runSearch() {
    setSearch(await api.search(query));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-white">
            Knowledge Base
          </h1>
          <p className="text-slate-400">Plant Twin · Digital Memory · Smart Search</p>
        </div>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/40"
            placeholder="Smart search…"
          />
          <button
            onClick={runSearch}
            className="rounded-md bg-cyan-500 px-3 py-2 text-sm font-medium text-slate-950"
          >
            Search
          </button>
        </div>
      </div>

      {twin && (
        <PlantTwin
          equipment={twin.equipment}
          selectedId={equipmentId}
          onSelect={setEquipmentId}
        />
      )}

      {detail && (
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-4">
            <div className="rounded-xl border border-white/10 bg-[#0a1522]/80 p-4">
              <div className="flex items-center gap-2">
                <StatusDot status={detail.status} />
                <h2 className="font-[family-name:var(--font-display)] text-xl text-white">
                  {detail.tag} · {detail.name}
                </h2>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-300">
                <div>Department<br /><span className="text-white">{detail.department}</span></div>
                <div>Health<br /><span className="text-white">{detail.health_score}%</span></div>
                <div>Open Incidents<br /><span className="text-white">{detail.open_incidents}</span></div>
                <div>Maintenance Due<br /><span className="text-white">{detail.maintenance_due_days} days</span></div>
              </div>
              <div className="mt-4">
                <div className="text-xs uppercase tracking-wider text-slate-500">Impact Radius</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(detail.impact_radius || []).map((x: string) => (
                    <span key={x} className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-200">
                      {x}
                    </span>
                  ))}
                </div>
              </div>
              <Link
                href="/ai"
                className="mt-4 inline-flex rounded-md bg-cyan-500 px-3 py-2 text-sm font-medium text-slate-950"
              >
                Open Contextual Copilot →
              </Link>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0a1522]/80 p-4">
              <h3 className="text-sm font-medium text-white">Knowledge Gaps</h3>
              <div className="mt-2 space-y-2">
                {(detail.gaps || []).map((g: any) => (
                  <div key={g.id} className="rounded-md border border-amber-400/20 bg-amber-400/5 p-2 text-sm text-amber-100">
                    {g.message}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <Timeline
              events={detail.timeline || []}
              onOpenDoc={async (id) => setDoc(await api.document(id))}
            />
          </div>

          <div className="lg:col-span-3">
            <div className="rounded-xl border border-white/10 bg-[#0a1522]/80 p-4">
              <h3 className="text-sm font-medium text-white">Documents</h3>
              <div className="mt-3 space-y-2">
                {(detail.documents || []).map((d: any) => (
                  <button
                    key={d.id}
                    onClick={() => setDoc(d)}
                    className="block w-full rounded-md border border-white/10 bg-white/5 p-2 text-left hover:bg-white/10"
                  >
                    <div className="text-sm text-white">{d.title}</div>
                    <div className="text-xs text-slate-400">
                      Trust {(d.trust_score * 100).toFixed(0)}% · {d.freshness}
                      {d.verified ? " · Verified" : ""}
                      {d.signed ? " · Signed" : ""}
                    </div>
                  </button>
                ))}
              </div>
              {doc && (
                <div className="mt-4 rounded-md border border-cyan-400/20 bg-cyan-400/5 p-3 text-sm text-slate-200">
                  <div className="font-medium text-white">{doc.title}</div>
                  <p className="mt-2 text-slate-300">{doc.content}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {search && (
        <div className="rounded-xl border border-white/10 bg-[#0a1522]/80 p-4">
          <h3 className="font-[family-name:var(--font-display)] text-lg text-white">
            Smart Search — Knowledge, not just PDFs
          </h3>
          <div className="mt-4 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
            {Object.entries(search).map(([facet, items]: any) => (
              <div key={facet} className="rounded-md border border-white/10 bg-white/5 p-3">
                <div className="text-xs uppercase tracking-wider text-slate-500">{facet}</div>
                <div className="mt-1 text-2xl text-white">{items.length}</div>
                <div className="mt-2 space-y-1 text-xs text-slate-400">
                  {items.slice(0, 2).map((it: any) => (
                    <div key={it.id || it.tag} className="truncate">
                      {it.tag || it.title || it.summary}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
