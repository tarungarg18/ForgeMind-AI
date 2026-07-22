"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export function DecisionCardView({
  card,
  equipmentId,
  onFollowup,
}: {
  card: any;
  equipmentId?: string | null;
  onFollowup?: (action: string) => void;
}) {
  const [approved, setApproved] = useState(false);
  const [approving, setApproving] = useState(false);
  if (!card) return null;
  const compliance = card.compliance || {};

  async function approve() {
    setApproving(true);
    try {
      await api.approveDecision(card.recommended_action, equipmentId);
      setApproved(true);
    } finally {
      setApproving(false);
    }
  }

  return (
    <div className="fm-card overflow-hidden">
      <div className="border-b border-gray-200 bg-teal-50 px-4 py-3">
        <div className="fm-label text-teal-800">Suggested next step</div>
        <h3 className="mt-1 text-lg font-semibold text-gray-900">{card.recommended_action}</h3>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Risk" value={card.risk} warn={card.risk === "HIGH"} />
        <Metric label="Business impact" value={card.business_impact} />
        <Metric label="Sources used" value={`${card.evidence_count} docs`} />
        <Metric label="Assets affected" value={String(card.affected_assets)} />
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-gray-200 px-4 py-3">
        {Object.entries(compliance).map(([k, v]) => (
          <span key={k} className="rounded-md bg-gray-50 px-2 py-1 text-xs text-gray-700 ring-1 ring-gray-200">
            {k}:{" "}
            <span className={String(v) === "pass" ? "text-emerald-700" : String(v) === "warn" ? "text-amber-700" : "text-red-700"}>
              {String(v)}
            </span>
          </span>
        ))}
        <span className="ml-auto text-xs text-gray-500">
          Confidence {(card.confidence * 100).toFixed(0)}%
        </span>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3">
        <button
          type="button"
          onClick={approve}
          disabled={approved || approving}
          className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {approved ? "Approved ✓" : approving ? "Approving…" : "Approve action"}
        </button>
        {(card.followups || []).map((f: string) => (
          <button
            key={f}
            onClick={() => onFollowup?.(f)}
            className="rounded-md bg-white px-3 py-1.5 text-sm text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
          >
            {f}
          </button>
        ))}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-lg bg-gray-50 p-3 ring-1 ring-gray-200">
      <div className="fm-label">{label}</div>
      <div className={`mt-1 text-sm font-medium ${warn ? "text-red-700" : "text-gray-900"}`}>
        {value}
      </div>
    </div>
  );
}
