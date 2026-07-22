"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { PlantTwin, StatusDot } from "@/components/PlantTwin";
import { Timeline } from "@/components/Timeline";
import { useEquipment } from "@/components/EquipmentContext";

type EquipmentItem = {
  id: string;
  tag: string;
  name: string;
  status: string;
};

type LinkedDocument = {
  id: string;
  title: string;
  trust_score: number;
  freshness: string;
  verified: boolean;
  content: string;
};

type EquipmentDetail = EquipmentItem & {
  department: string;
  health_score: number;
  maintenance_due_days: number;
  open_incidents: number;
  timeline: Array<{
    id: string;
    date: string;
    event_type: string;
    summary: string;
    severity: string;
    document_id?: string;
  }>;
  impact_radius: string[];
  gaps: Array<{ id: string; message: string }>;
  documents: LinkedDocument[];
};

export default function KnowledgePage() {
  const { equipmentId, setEquipmentId } = useEquipment();
  const [twin, setTwin] = useState<{ equipment: EquipmentItem[] } | null>(null);
  const [detail, setDetail] = useState<EquipmentDetail | null>(null);
  const [doc, setDoc] = useState<LinkedDocument | null>(null);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState<Record<string, Array<{ id?: string; tag?: string; title?: string; summary?: string }>> | null>(null);

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

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Knowledge</h1>
        <p className="mt-1 text-sm text-gray-500">
          Select equipment → read history → open documents.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">1. Select equipment</h2>
        {twin ? (
          <div className="grid gap-4 lg:grid-cols-5">
            <div data-tour="tour-equipment" className="fm-card overflow-hidden lg:col-span-2">
              <div className="border-b border-gray-200 px-4 py-3 text-sm font-medium text-gray-900">
                Equipment list
              </div>
              <div className="divide-y divide-gray-100">
                {twin.equipment.map((eq) => {
                  const active = equipmentId === eq.id;
                  return (
                    <button
                      key={eq.id}
                      type="button"
                      onClick={() => setEquipmentId(eq.id)}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left ${
                        active ? "bg-teal-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <StatusDot status={eq.status} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-gray-900">{eq.tag}</div>
                        <div className="truncate text-xs text-gray-500">{eq.name}</div>
                      </div>
                      {active ? <span className="text-xs text-teal-800">Selected</span> : null}
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
        ) : (
          <p className="text-sm text-gray-500">Loading plant map…</p>
        )}
      </section>

      {detail ? (
        <>
          <section className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900">2. History for {detail.tag}</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {detail.name} · {detail.department} · health {detail.health_score}%
                </p>
              </div>
              <Link
                href="/ai"
                className="rounded-md bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800"
              >
                Ask AI (mention {detail.tag})
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="fm-card p-4">
                <div className="fm-label">Open incidents</div>
                <div className="mt-1 text-xl font-semibold">{detail.open_incidents}</div>
              </div>
              <div className="fm-card p-4">
                <div className="fm-label">Maintenance due</div>
                <div className="mt-1 text-xl font-semibold">{detail.maintenance_due_days} days</div>
              </div>
              <div className="fm-card p-4">
                <div className="fm-label">Status</div>
                <div className="mt-1 flex items-center gap-2 text-xl font-semibold capitalize">
                  <StatusDot status={detail.status} />
                  {detail.status}
                </div>
              </div>
            </div>

            <div data-tour="tour-history">
              <Timeline
                events={detail.timeline}
                onOpenDoc={async (id) => setDoc(await api.document(id))}
              />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-gray-900">3. Documents & gaps</h2>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="fm-card overflow-hidden">
                <div className="border-b border-gray-200 px-4 py-3 text-sm font-medium">Linked documents</div>
                <div className="divide-y divide-gray-100">
                  {detail.documents.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setDoc(item)}
                      className="block w-full px-4 py-3 text-left hover:bg-gray-50"
                    >
                      <div className="text-sm font-medium text-gray-900">{item.title}</div>
                      <div className="text-xs text-gray-500">
                        Trust {(item.trust_score * 100).toFixed(0)}% · {item.freshness}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="fm-card p-4">
                  <div className="text-sm font-medium">Missing documents</div>
                  <div className="mt-3 space-y-2">
                    {detail.gaps.map((gap) => (
                      <div key={gap.id} className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-950">
                        {gap.message}
                      </div>
                    ))}
                    {!detail.gaps.length ? (
                      <p className="text-sm text-gray-500">Nothing missing.</p>
                    ) : null}
                  </div>
                </div>
                <div className="fm-card p-4">
                  <div className="text-sm font-medium">If this fails, also watch</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {detail.impact_radius.map((item) => (
                      <span key={item} className="rounded-md bg-gray-50 px-2 py-1 text-xs ring-1 ring-gray-200">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {doc ? (
              <div className="fm-card border-teal-200 bg-teal-50/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="fm-label text-teal-800">Document preview</div>
                    <div className="mt-1 font-semibold text-gray-900">{doc.title}</div>
                  </div>
                  <button type="button" onClick={() => setDoc(null)} className="text-sm text-gray-500 hover:text-gray-900">
                    Close
                  </button>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-gray-700">{doc.content}</p>
              </div>
            ) : null}
          </section>
        </>
      ) : null}

      <section className="space-y-3 border-t border-gray-100 pt-6">
        <h2 className="text-base font-semibold text-gray-900">Search</h2>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
            className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-teal-600"
            placeholder="e.g. Pump, bearing, OISD"
          />
          <button
            type="button"
            onClick={runSearch}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Search
          </button>
        </div>
        {search ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(search).map(([facet, items]) => (
              <div key={facet} className="fm-card p-4">
                <div className="fm-label">{facet}</div>
                <div className="mt-1 text-2xl font-semibold">{items.length}</div>
                <div className="mt-2 space-y-1 text-xs text-gray-500">
                  {items.slice(0, 2).map((it) => (
                    <div key={it.id || it.tag || it.title} className="truncate">
                      {it.tag || it.title || it.summary}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
