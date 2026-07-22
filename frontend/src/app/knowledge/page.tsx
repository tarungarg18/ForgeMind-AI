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
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState<any>(null);

  useEffect(() => {
    api.plantTwin().then(setTwin).catch(console.error);
  }, []);

  useEffect(() => {
    if (!equipmentId) return;
    setDoc(null);
    api.equipmentDetail(equipmentId).then(setDetail).catch(console.error);
  }, [equipmentId]);

  async function runSearch() {
    if (!query.trim()) return;
    setSearch(await api.search(query));
  }

  const selectedTag = detail?.tag || "—";

  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Knowledge</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
            How to use this page: pick a machine → read its history → open linked documents.
          </p>
        </div>

        <ol className="grid gap-3 sm:grid-cols-3">
          <li className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <div className="text-xs font-semibold text-teal-800">Step 1</div>
            <div className="mt-1 text-sm font-medium text-gray-900">Select equipment</div>
            <p className="mt-1 text-xs text-gray-500">Use the list or click the map</p>
          </li>
          <li className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <div className="text-xs font-semibold text-teal-800">Step 2</div>
            <div className="mt-1 text-sm font-medium text-gray-900">Read history</div>
            <p className="mt-1 text-xs text-gray-500">Install, maintenance, incidents</p>
          </li>
          <li className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <div className="text-xs font-semibold text-teal-800">Step 3</div>
            <div className="mt-1 text-sm font-medium text-gray-900">Open a document</div>
            <p className="mt-1 text-xs text-gray-500">Or ask AI about this machine</p>
          </li>
        </ol>
      </header>

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">1. Select equipment</h2>
          <p className="mt-1 text-sm text-gray-500">
            Currently selected: <span className="font-medium text-teal-800">{selectedTag}</span>
          </p>
        </div>

        {twin && (
          <div className="grid gap-4 lg:grid-cols-5">
            <div className="fm-card overflow-hidden lg:col-span-2">
              <div className="border-b border-gray-200 px-4 py-3">
                <div className="text-sm font-medium text-gray-900">Equipment list</div>
                <p className="text-xs text-gray-500">Click a row to select</p>
              </div>
              <div className="divide-y divide-gray-100">
                {twin.equipment.map((eq: any) => {
                  const active = equipmentId === eq.id;
                  return (
                    <button
                      key={eq.id}
                      type="button"
                      onClick={() => setEquipmentId(eq.id)}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                        active ? "bg-teal-50" : "bg-white hover:bg-gray-50"
                      }`}
                    >
                      <StatusDot status={eq.status} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-gray-900">{eq.tag}</div>
                        <div className="truncate text-xs text-gray-500">{eq.name}</div>
                      </div>
                      {active && (
                        <span className="text-xs font-medium text-teal-800">Selected</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-3">
              <PlantTwin
                equipment={twin.equipment}
                selectedId={equipmentId}
                onSelect={setEquipmentId}
              />
            </div>
          </div>
        )}
      </section>

      {detail && (
        <>
          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  2. History for {detail.tag}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {detail.name} · {detail.department} · health {detail.health_score}%
                </p>
              </div>
              <Link
                href="/ai"
                className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
              >
                Ask AI about {detail.tag}
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="fm-card p-4">
                <div className="fm-label">Open incidents</div>
                <div className="mt-1 text-xl font-semibold text-gray-900">{detail.open_incidents}</div>
              </div>
              <div className="fm-card p-4">
                <div className="fm-label">Maintenance due</div>
                <div className="mt-1 text-xl font-semibold text-gray-900">
                  {detail.maintenance_due_days} days
                </div>
              </div>
              <div className="fm-card p-4">
                <div className="fm-label">Status</div>
                <div className="mt-1 flex items-center gap-2 text-xl font-semibold capitalize text-gray-900">
                  <StatusDot status={detail.status} />
                  {detail.status}
                </div>
              </div>
            </div>

            <Timeline
              events={detail.timeline || []}
              onOpenDoc={async (id) => setDoc(await api.document(id))}
            />
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">3. Documents & gaps</h2>
              <p className="mt-1 text-sm text-gray-500">
                Files linked to {detail.tag}. Click one to read it.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="fm-card overflow-hidden">
                <div className="border-b border-gray-200 px-4 py-3 text-sm font-medium text-gray-900">
                  Linked documents
                </div>
                <div className="divide-y divide-gray-100">
                  {(detail.documents || []).map((d: any) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDoc(d)}
                      className="block w-full px-4 py-3 text-left hover:bg-gray-50"
                    >
                      <div className="text-sm font-medium text-gray-900">{d.title}</div>
                      <div className="mt-0.5 text-xs text-gray-500">
                        Trust {(d.trust_score * 100).toFixed(0)}% · {d.freshness}
                        {d.verified ? " · verified" : ""}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="fm-card p-4">
                  <div className="text-sm font-medium text-gray-900">Missing documents</div>
                  <div className="mt-3 space-y-2">
                    {(detail.gaps || []).map((g: any) => (
                      <div
                        key={g.id}
                        className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950"
                      >
                        {g.message}
                      </div>
                    ))}
                    {!detail.gaps?.length && (
                      <p className="text-sm text-gray-500">Nothing missing for this machine.</p>
                    )}
                  </div>
                </div>

                <div className="fm-card p-4">
                  <div className="text-sm font-medium text-gray-900">If this fails, also watch</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(detail.impact_radius || []).map((x: string) => (
                      <span
                        key={x}
                        className="rounded-md bg-gray-50 px-2.5 py-1 text-xs text-gray-700 ring-1 ring-gray-200"
                      >
                        {x}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {doc && (
              <div className="fm-card border-teal-200 bg-teal-50/50 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="fm-label text-teal-800">Document preview</div>
                    <div className="mt-1 text-base font-semibold text-gray-900">{doc.title}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDoc(null)}
                    className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-white hover:text-gray-900"
                  >
                    Close
                  </button>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-gray-700">{doc.content}</p>
              </div>
            )}
          </section>
        </>
      )}

      <section className="space-y-4 border-t border-gray-100 pt-8">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Optional search</h2>
          <p className="mt-1 text-sm text-gray-500">Find equipment, docs, or incidents by keyword.</p>
        </div>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
            className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-600"
            placeholder="e.g. Pump, bearing, OISD"
          />
          <button
            type="button"
            onClick={runSearch}
            className="rounded-md bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            Search
          </button>
        </div>
        {search && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(search).map(([facet, items]: any) => (
              <div key={facet} className="fm-card p-4">
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
        )}
      </section>
    </div>
  );
}
