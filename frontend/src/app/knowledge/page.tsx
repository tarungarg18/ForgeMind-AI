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
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Knowledge</h1>
        <p className="mt-1 text-sm text-gray-500">
          Pick a machine on the map. Then review its timeline, documents, and gaps.
        </p>
      </header>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-gray-900">Step A — Plant map</div>
            <p className="text-xs text-gray-500">Select equipment first</p>
          </div>
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600"
              placeholder="Search…"
            />
            <button
              onClick={runSearch}
              className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
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
      </section>

      {detail && (
        <section className="space-y-3">
          <div>
            <div className="text-sm font-semibold text-gray-900">Step B — Selected equipment</div>
            <p className="text-xs text-gray-500">Summary, timeline, and linked files</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-4">
              <div className="fm-card p-4">
                <div className="flex items-center gap-2">
                  <StatusDot status={detail.status} />
                  <h2 className="text-lg font-semibold text-gray-900">
                    {detail.tag} · {detail.name}
                  </h2>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="fm-label">Department</dt>
                    <dd className="text-gray-900">{detail.department}</dd>
                  </div>
                  <div>
                    <dt className="fm-label">Health</dt>
                    <dd className="text-gray-900">{detail.health_score}%</dd>
                  </div>
                  <div>
                    <dt className="fm-label">Open incidents</dt>
                    <dd className="text-gray-900">{detail.open_incidents}</dd>
                  </div>
                  <div>
                    <dt className="fm-label">Maintenance due</dt>
                    <dd className="text-gray-900">{detail.maintenance_due_days} days</dd>
                  </div>
                </dl>

                <div className="mt-4">
                  <div className="fm-label">If this fails, also watch</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(detail.impact_radius || []).map((x: string) => (
                      <span key={x} className="rounded-md bg-gray-50 px-2 py-1 text-xs text-gray-700 ring-1 ring-gray-200">
                        {x}
                      </span>
                    ))}
                  </div>
                </div>

                <Link
                  href="/ai"
                  className="mt-4 inline-flex rounded-md bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800"
                >
                  Ask AI about this machine
                </Link>
              </div>

              <div className="fm-card p-4">
                <div className="text-sm font-semibold text-gray-900">Missing documents</div>
                <div className="mt-2 space-y-2">
                  {(detail.gaps || []).map((g: any) => (
                    <div key={g.id} className="rounded-md bg-amber-50 p-2 text-sm text-amber-950 ring-1 ring-amber-100">
                      {g.message}
                    </div>
                  ))}
                  {!detail.gaps?.length && (
                    <p className="text-sm text-gray-500">No gaps flagged.</p>
                  )}
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
              <div className="fm-card p-4">
                <div className="text-sm font-semibold text-gray-900">Documents</div>
                <p className="mb-3 text-xs text-gray-500">Trust score shows how reliable a file looks</p>
                <div className="space-y-2">
                  {(detail.documents || []).map((d: any) => (
                    <button
                      key={d.id}
                      onClick={() => setDoc(d)}
                      className="block w-full rounded-md bg-gray-50 p-2 text-left ring-1 ring-gray-200 hover:bg-white"
                    >
                      <div className="text-sm text-gray-900">{d.title}</div>
                      <div className="text-xs text-gray-500">
                        Trust {(d.trust_score * 100).toFixed(0)}% · {d.freshness}
                        {d.verified ? " · verified" : ""}
                      </div>
                    </button>
                  ))}
                </div>
                {doc && (
                  <div className="mt-4 rounded-md border border-teal-100 bg-teal-50 p-3 text-sm text-gray-800">
                    <div className="font-medium text-gray-900">{doc.title}</div>
                    <p className="mt-2 text-gray-700">{doc.content}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {search && (
        <section className="space-y-3">
          <div>
            <div className="text-sm font-semibold text-gray-900">Search results</div>
            <p className="text-xs text-gray-500">Grouped by type, not only PDFs</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(search).map(([facet, items]: any) => (
              <div key={facet} className="fm-card p-3">
                <div className="fm-label">{facet}</div>
                <div className="mt-1 text-2xl font-semibold text-gray-900">{items.length}</div>
                <div className="mt-2 space-y-1 text-xs text-gray-500">
                  {items.slice(0, 2).map((it: any) => (
                    <div key={it.id || it.tag} className="truncate">
                      {it.tag || it.title || it.summary}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
