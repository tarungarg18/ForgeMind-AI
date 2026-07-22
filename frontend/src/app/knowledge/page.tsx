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
  summary?: string;
  doc_type?: string;
  equipment_ids?: string[];
  semantic_score?: number;
  semantic_snippet?: string;
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
    equipment_id?: string;
  }>;
  impact_radius: string[];
  gaps: Array<{ id: string; message: string }>;
  documents: LinkedDocument[];
};

type SearchResult = {
  equipment: EquipmentItem[];
  documents: LinkedDocument[];
  incidents: LinkedDocument[];
  maintenance: LinkedDocument[];
  regulations: LinkedDocument[];
  events: Array<{
    id: string;
    summary: string;
    event_type: string;
    equipment_id?: string;
    date?: string;
  }>;
};

export default function KnowledgePage() {
  const { equipmentId, setEquipmentId } = useEquipment();
  const [twin, setTwin] = useState<{ equipment: EquipmentItem[] } | null>(null);
  const [detail, setDetail] = useState<EquipmentDetail | null>(null);
  const [doc, setDoc] = useState<LinkedDocument | null>(null);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    api.plantTwin().then(setTwin).catch(console.error);
  }, []);

  useEffect(() => {
    if (!equipmentId) return;
    setDoc(null);
    api.equipmentDetail(equipmentId).then(setDetail).catch(console.error);
  }, [equipmentId]);

  async function runSearch() {
    const q = query.trim();
    if (!q) {
      setSearch(null);
      setSearchError(null);
      return;
    }
    setSearching(true);
    setSearchError(null);
    try {
      const res = (await api.search(q)) as SearchResult;
      setSearch(res);
    } catch (err) {
      setSearch(null);
      setSearchError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  }

  function clearSearch() {
    setQuery("");
    setSearch(null);
    setSearchError(null);
  }

  function openEquipment(id: string) {
    setEquipmentId(id);
    const el = document.querySelector('[data-tour="tour-equipment"]');
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function openDocument(item: LinkedDocument) {
    try {
      const full = await api.document(item.id);
      setDoc(full);
      if (item.equipment_ids?.[0]) {
        setEquipmentId(item.equipment_ids[0]);
      }
      window.requestAnimationFrame(() => {
        document
          .querySelector("[data-testid='document-preview']")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    } catch {
      setDoc(item);
    }
  }

  const hitCount = search
    ? search.equipment.length +
      search.documents.length +
      search.events.length +
      search.incidents.length +
      search.maintenance.length +
      search.regulations.length
    : 0;

  // Deduplicate docs shown across facets
  const docHits = search
    ? (() => {
        const seen = new Set<string>();
        const list: LinkedDocument[] = [];
        for (const bucket of [
          search.documents,
          search.incidents,
          search.maintenance,
          search.regulations,
        ]) {
          for (const d of bucket) {
            if (seen.has(d.id)) continue;
            seen.add(d.id);
            list.push(d);
          }
        }
        return list;
      })()
    : [];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Knowledge</h1>
        <p className="mt-1 text-sm text-gray-500">
          Search the plant, select equipment, then open history and documents.
        </p>
      </header>

      <section className="space-y-3" data-testid="knowledge-search">
        <h2 className="text-base font-semibold text-gray-900">Search plant knowledge</h2>
        <div className="flex flex-wrap gap-2">
          <input
            data-testid="knowledge-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
            className="min-w-[200px] flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-teal-600"
            placeholder="Try P-102, seal, bearing, OISD, incident…"
          />
          <button
            type="button"
            data-testid="knowledge-search-btn"
            onClick={runSearch}
            disabled={searching || !query.trim()}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {searching ? "Searching…" : "Search"}
          </button>
          {search || query ? (
            <button
              type="button"
              onClick={clearSearch}
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
            >
              Clear
            </button>
          ) : null}
        </div>

        {searchError ? (
          <p className="text-sm text-red-700" data-testid="knowledge-search-error">
            {searchError}
          </p>
        ) : null}

        {search ? (
          <div data-testid="knowledge-search-results" className="space-y-3">
            <p className="text-xs text-gray-500">
              {hitCount === 0
                ? `No matches for “${query.trim()}”. Try another tag or keyword.`
                : `${hitCount} match${hitCount === 1 ? "" : "es"} — click a result to open it.`}
            </p>

            {search.equipment.length > 0 ? (
              <div className="fm-card overflow-hidden">
                <div className="border-b border-gray-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Equipment ({search.equipment.length})
                </div>
                <div className="divide-y divide-gray-100">
                  {search.equipment.map((eq) => (
                    <button
                      key={eq.id}
                      type="button"
                      onClick={() => openEquipment(eq.id)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-teal-50"
                    >
                      <StatusDot status={eq.status} />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900">{eq.tag}</div>
                        <div className="truncate text-xs text-gray-500">{eq.name}</div>
                      </div>
                      <span className="ml-auto text-xs text-teal-800">Open</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {docHits.length > 0 ? (
              <div className="fm-card overflow-hidden">
                <div className="border-b border-gray-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Documents ({docHits.length})
                </div>
                <div className="divide-y divide-gray-100">
                  {docHits.slice(0, 8).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openDocument(item)}
                      className="block w-full px-4 py-3 text-left hover:bg-teal-50"
                    >
                      <div className="text-sm font-medium text-gray-900">{item.title}</div>
                      <div className="mt-0.5 text-xs text-gray-500">
                        {(item.doc_type || "document").replace(/_/g, " ")}
                        {typeof item.trust_score === "number"
                          ? ` · trust ${(item.trust_score * 100).toFixed(0)}%`
                          : ""}
                        {item.freshness ? ` · ${item.freshness}` : ""}
                        {typeof item.semantic_score === "number"
                          ? ` · semantic ${(item.semantic_score * 100).toFixed(0)}%`
                          : ""}
                      </div>
                      {item.semantic_snippet || item.summary ? (
                        <p className="mt-1 line-clamp-2 text-xs text-gray-600">
                          {item.semantic_snippet || item.summary}
                        </p>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {search.events.length > 0 ? (
              <div className="fm-card overflow-hidden">
                <div className="border-b border-gray-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Events ({search.events.length})
                </div>
                <div className="divide-y divide-gray-100">
                  {search.events.slice(0, 6).map((ev) => (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => ev.equipment_id && openEquipment(ev.equipment_id)}
                      className="block w-full px-4 py-3 text-left hover:bg-teal-50"
                    >
                      <div className="text-sm font-medium capitalize text-gray-900">
                        {ev.event_type.replace(/_/g, " ")}
                      </div>
                      <div className="mt-0.5 text-xs text-gray-500">
                        {ev.date ? `${ev.date} · ` : ""}
                        {ev.summary}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">1. Select equipment</h2>
        {twin ? (
          <div className="grid gap-4 lg:grid-cols-5">
            <div
              data-tour="tour-equipment"
              data-testid="equipment-list"
              className="fm-card overflow-hidden lg:col-span-2"
            >
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
                data-testid="ask-ai-link"
                className="rounded-md bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800"
              >
                Ask AI
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

            <div data-tour="tour-history" data-testid="equipment-history">
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
              <div
                data-testid="document-preview"
                className="fm-card border-teal-200 bg-teal-50/40 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="fm-label text-teal-800">Document preview</div>
                    <div className="mt-1 font-semibold text-gray-900">{doc.title}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDoc(null)}
                    className="text-sm text-gray-500 hover:text-gray-900"
                  >
                    Close
                  </button>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-gray-700">{doc.content}</p>
              </div>
            ) : null}
          </section>
        </>
      ) : null}
    </div>
  );
}
