"""Chat + recommendations. Uses OpenRouter when configured, else sample answers."""

from __future__ import annotations

import json
import re
from typing import Any, Optional

from app.models.schemas import (
    ChatRequest,
    ChatResponse,
    DecisionCard,
    ExplainWhy,
    SimulateRequest,
)
from app.services.openrouter import chat_completion, get_openrouter_client
from app.services.store import store


MODE_INSTRUCTIONS = {
    "engineer": "Respond with technical root-cause detail, parameters, and procedures.",
    "maintenance": "Focus on work orders, parts, downtime, and PM actions.",
    "safety": "Focus on near-miss, hazards, PTW, and worker safety.",
    "compliance": "Cite Factory Act, OISD, PESO and evidence gaps.",
    "manager": "Focus on business impact, cost, downtime risk, and decisions.",
    "auditor": "Focus on audit evidence, signatures, trust, and regulatory references.",
}


def _eq_context(equipment_id: Optional[str]) -> dict[str, Any]:
    if not equipment_id or equipment_id not in store.equipment:
        return {}
    eq = store.equipment[equipment_id]
    return {
        "equipment_id": eq.id,
        "tag": eq.tag,
        "name": eq.name,
        "department": eq.department,
        "open_incidents": eq.open_incidents,
        "maintenance_due_days": eq.maintenance_due_days,
        "health_score": eq.health_score,
        "status": eq.status,
    }


def _docs_for_equipment(equipment_id: Optional[str]) -> list[dict[str, Any]]:
    docs = []
    for d in store.documents.values():
        if equipment_id:
            if equipment_id not in d.equipment_ids and d.doc_type != "regulation":
                continue
        docs.append(
            {
                "id": d.id,
                "title": d.title,
                "doc_type": d.doc_type,
                "trust_score": d.trust_score,
                "freshness": d.freshness,
                "summary": d.summary,
                "content": d.content[:500],
            }
        )
    docs.sort(key=lambda x: x["trust_score"], reverse=True)
    return docs[:10]


def _semantic_context(message: str, equipment_id: Optional[str], limit: int = 8) -> list[dict[str, Any]]:
    """Retrieve relevant chunks from the vector DB, then attach parent docs."""
    try:
        from app.services.vectorstore import semantic_search
    except Exception:
        return _docs_for_equipment(equipment_id)

    hits = semantic_search(message, n=limit)
    if not hits:
        return _docs_for_equipment(equipment_id)

    by_id: dict[str, dict[str, Any]] = {}
    for hit in hits:
        doc = store.documents.get(hit.get("document_id", ""))
        if not doc:
            continue
        if equipment_id and equipment_id not in doc.equipment_ids and doc.doc_type != "regulation":
            # still allow strong semantic hits outside selected equipment
            if float(hit.get("score") or 0) < 0.35:
                continue
        entry = by_id.get(doc.id)
        snippet = hit.get("text") or doc.summary
        if not entry:
            by_id[doc.id] = {
                "id": doc.id,
                "title": doc.title,
                "doc_type": doc.doc_type,
                "trust_score": doc.trust_score,
                "freshness": doc.freshness,
                "summary": doc.summary,
                "content": snippet[:500],
                "semantic_score": hit.get("score"),
            }
        else:
            # keep best score / richer snippet
            if float(hit.get("score") or 0) > float(entry.get("semantic_score") or 0):
                entry["semantic_score"] = hit.get("score")
                entry["content"] = snippet[:500]

    ranked = sorted(
        by_id.values(),
        key=lambda d: (float(d.get("semantic_score") or 0), d["trust_score"]),
        reverse=True,
    )
    return ranked[:limit] or _docs_for_equipment(equipment_id)


def _resolve_equipment_id(message: str, equipment_id: Optional[str]) -> Optional[str]:
    """Prefer tags mentioned in the question; ignore UI selection."""
    lower = message.lower()
    for eq in store.equipment.values():
        tag = eq.tag.lower()
        name = eq.name.lower()
        if tag in lower or tag.replace("-", "") in lower.replace("-", "") or name in lower:
            return eq.id
    if "valve" in lower:
        return "eq-v12"
    if "compressor" in lower:
        return "eq-c8"
    if "boiler" in lower:
        return "eq-b3"
    if "pump" in lower:
        return "eq-p102"
    return equipment_id



def _heatmap(docs: list[dict[str, Any]], message: str) -> list[dict[str, Any]]:
    scores = []
    msg = message.lower()
    for d in docs:
        base = int(d["trust_score"] * 100)
        bonus = 0
        blob = (d["title"] + d["summary"] + d["content"]).lower()
        for token in re.findall(r"[a-z0-9\-]+", msg):
            if len(token) > 3 and token in blob:
                bonus += 8
        if d["doc_type"] in {"inspection", "incident", "maintenance"} and any(
            k in msg for k in ["fail", "leak", "bearing", "why", "incident", "predict"]
        ):
            bonus += 10
        scores.append({"document_id": d["id"], "title": d["title"], "weight": min(100, base // 2 + bonus)})
    scores.sort(key=lambda x: x["weight"], reverse=True)
    return scores


def _seeded_decision(message: str, mode: str, equipment_id: Optional[str]) -> ChatResponse:
    resolved = _resolve_equipment_id(message, None)
    eq_id = resolved or "eq-p102"
    ctx = _eq_context(eq_id)
    docs = _semantic_context(message, resolved)
    if not docs:
        docs = _docs_for_equipment(eq_id)
    heatmap = _heatmap(docs, message)
    conflicts = [c.summary for c in store.conflicts]
    gaps = [g.message for g in store.gaps if not resolved or g.equipment_id == eq_id]
    impact = store.impact_radius(eq_id) if resolved or "pump" in message.lower() or "p-102" in message.lower() else []


    lower = message.lower()
    ask_why_not = "why wasn't" in lower or "why wasnt" in lower or "not predicted" in lower or "why not" in lower
    lessons = "learn" in lower or "compressor" in lower
    show_graph = "show everything connected" in lower or "connected to" in lower
    identity = "what is this" in lower or "valve" in lower and "what" in lower

    if ask_why_not:
        answer = (
            f"This incident was not predicted because critical predictive signals were missing. "
            f"No vibration report exists for {ctx.get('tag', 'P-102')}, maintenance was delayed "
            f"(due in {ctx.get('maintenance_due_days', 12)} days with open backlog), inspection follow-through "
            f"was incomplete, and a cross-document pressure conflict (120 vs 140 vs 150 PSI) was never reconciled."
        )
        action = "Close predictive gaps: upload vibration report + reconcile pressure envelope"
        risk = "HIGH"
        impact_inr = "₹4.1L unplanned downtime risk remains open"
    elif lessons:
        answer = (
            "Across compressor failure history (2022–2025), the dominant pattern is bearing wear. "
            "Average downtime is ~11 hours. The same contractor appears in 3 of 5 events. "
            "Preventive suggestion: tighten vibration routes and reduce bearing PM cadence to 60 days."
        )
        action = "Adopt 60-day bearing PM + contractor quality review"
        risk = "MEDIUM"
        impact_inr = "₹2.8L average downtime exposure per repeat event"
        eq_id = "eq-c8"
        impact = store.impact_radius("eq-c8")
        docs = _docs_for_equipment("eq-c8")
        heatmap = _heatmap(docs, message)
    elif show_graph:
        answer = (
            f"Graph neighborhood for {ctx.get('tag', 'P-102')}: "
            + " → ".join(impact)
            + ". Relationship confidences range from 0.70 to 0.99."
        )
        action = "Inspect Impact Radius and Digital Memory Timeline"
        risk = "MEDIUM"
        impact_inr = "Multi-asset cascade risk on cooling → production path"
    elif identity:
        answer = (
            "Identified asset: Valve V-12 (Isolation Valve), Cooling department. "
            "Installed 2022. Linked to Pump P-102. Involved in 2025 near miss NM-221. "
            "Maintenance due in ~20 days. Open related SOP: SOP-CL-04."
        )
        action = "Open V-12 timeline and verify isolation SOP"
        risk = "HIGH"
        impact_inr = "Cooling line isolation risk if valve state is uncertain"
        eq_id = "eq-v12"
        impact = store.impact_radius("eq-v12")
    else:
        # Default P-102 failure narrative
        mode_bit = {
            "engineer": "Seal degradation plus sustained overpressure versus OEM 120 PSI design limit.",
            "maintenance": "Replace seal kit, verify bearing condition, schedule outage ~6–8 hours.",
            "safety": "Near-miss surge pathway already demonstrated — treat as high potential incident.",
            "compliance": "OISD evidence incomplete; Factory Act logs present; PESO dossier OK.",
            "manager": "Decision: intervene now to avoid cascading cooling/production downtime.",
            "auditor": "Evidence trail exists but pressure values conflict across Manual/Inspection/WO.",
        }.get(mode, "")
        answer = (
            f"Pump P-102 failure risk is driven by seal leakage history, bearing replacement in 2024, "
            f"and unresolved operating pressure conflict. {mode_bit} "
            f"Supporting documents: OEM manual, 2023 inspection, WO-8841, near miss NM-221."
        )
        action = "Replace mechanical seal and restore pressure to ≤120 PSI design envelope"
        risk = "HIGH"
        impact_inr = "₹3.4L downtime avoided if action taken before next surge"

    # Mode framing append
    if mode == "manager" and "₹" not in answer:
        answer += f" Business framing: {impact_inr}."
    if mode == "auditor":
        answer += " Audit note: prefer verified/signed docs; downweight trust 41% superseded inspection."

    card = DecisionCard(
        recommended_action=action,
        risk=risk,
        business_impact=impact_inr,
        evidence_count=len(docs),
        affected_assets=max(1, len([x for x in impact if x.startswith(("Pump", "Valve", "Compressor", "Boiler", "Cooling", "Production"))])),
        compliance={"Factory Act": "pass", "PESO": "pass", "OISD": "warn"},
        confidence=0.91 if docs else 0.6,
        followups=[
            "View Timeline",
            "Open SOP",
            "Compare Failures",
            "Generate RCA",
            "Run Simulator",
            "Inspect Compliance",
        ],
    )

    explain = ExplainWhy(
        evidence=[
            "Digital Memory events 2021–2025 for selected asset",
            "Graph relations with confidence weights",
            "Trust-ranked document retrieval",
        ]
        + (gaps[:2] if ask_why_not else []),
        confidence=card.confidence,
        reasoning_path=[
            "Bind equipment context",
            "Retrieve trust-ranked documents",
            "Expand knowledge graph neighborhood",
            "Detect conflicts and gaps",
            "Suggest next action",
        ],
        graph_hops=impact[:6],
        documents_used=[{"id": d["id"], "title": d["title"], "trust": d["trust_score"]} for d in docs[:5]],
        conflicts=conflicts,
        evidence_heatmap=heatmap[:5],
    )

    return ChatResponse(
        answer=answer,
        mode=mode,
        context_equipment_id=eq_id,
        decision_card=card,
        explain=explain,
        impact_radius=impact,
        related_equipment=[eq_id],
    )


async def answer_query(req: ChatRequest) -> ChatResponse:
    # Resolve equipment from the question text, not from UI selection
    resolved = _resolve_equipment_id(req.message, None)
    seeded = _seeded_decision(req.message, req.mode, resolved)

    if get_openrouter_client() is None:
        store.query_log.append({"message": req.message, "mode": req.mode, "source": "seeded"})
        return seeded

    ctx = _eq_context(resolved) if resolved else {}
    docs = _semantic_context(req.message, resolved)
    conflicts = [c.model_dump() for c in store.conflicts]
    gaps = [
        g.model_dump()
        for g in store.gaps
        if not resolved or g.equipment_id == resolved
    ]

    system = (
        "You are ForgeMind AI. Help plant staff find answers from equipment docs and history. "
        "The user may ask about any plant topic. Infer equipment from the question when mentioned. "
        "Return JSON only with keys: answer, recommended_action, risk, business_impact, "
        "confidence, compliance (Factory Act/PESO/OISD as pass|warn|fail), reasoning_path (array), "
        "evidence (array). "
        f"Answer style: {req.mode}. {MODE_INSTRUCTIONS.get(req.mode, '')} "
        "Prefer newer, verified documents. Mention conflicts or missing docs if relevant."
    )
    user_payload = {
        "question": req.message,
        "inferred_equipment": ctx,
        "documents": docs,
        "conflicts": conflicts,
        "gaps": gaps,
        "impact_radius": store.impact_radius(resolved) if resolved else [],
    }

    try:
        raw = await chat_completion(
            [
                {"role": "system", "content": system},
                {"role": "user", "content": json.dumps(user_payload)},
            ],
            response_json=True,
        )
        data = json.loads(raw)
        heatmap = _heatmap(docs, req.message)
        card = DecisionCard(
            recommended_action=data.get("recommended_action", seeded.decision_card.recommended_action),
            risk=data.get("risk", seeded.decision_card.risk),
            business_impact=data.get("business_impact", seeded.decision_card.business_impact),
            evidence_count=len(docs),
            affected_assets=seeded.decision_card.affected_assets,
            compliance=data.get("compliance", seeded.decision_card.compliance),
            confidence=float(data.get("confidence", seeded.decision_card.confidence)),
            followups=seeded.decision_card.followups,
        )
        explain = ExplainWhy(
            evidence=data.get("evidence", seeded.explain.evidence),
            confidence=card.confidence,
            reasoning_path=data.get("reasoning_path", seeded.explain.reasoning_path),
            graph_hops=seeded.impact_radius[:6],
            documents_used=[{"id": d["id"], "title": d["title"], "trust": d["trust_score"]} for d in docs[:5]],
            conflicts=[c.summary for c in store.conflicts],
            evidence_heatmap=heatmap[:5],
        )
        resp = ChatResponse(
            answer=data.get("answer", seeded.answer),
            mode=req.mode,
            context_equipment_id=ctx.get("equipment_id"),
            decision_card=card,
            explain=explain,
            impact_radius=seeded.impact_radius,
            related_equipment=[ctx.get("equipment_id")] if ctx.get("equipment_id") else [],
        )
        store.query_log.append({"message": req.message, "mode": req.mode, "source": "openrouter"})
        return resp
    except Exception:
        store.query_log.append({"message": req.message, "mode": req.mode, "source": "seeded_fallback"})
        return seeded


def simulate(req: SimulateRequest) -> dict[str, Any]:
    eq = store.equipment.get(req.equipment_id)
    tag = eq.tag if eq else req.equipment_id
    return {
        "equipment_id": req.equipment_id,
        "scenario": req.scenario,
        "steps": [
            {"label": "Current Risk", "value": "HIGH", "detail": f"{tag} has open incidents and pressure conflict"},
            {"label": "Probability of Failure", "value": "68%", "detail": "Heuristic from leakage + overdue predictive docs"},
            {"label": "Production Downtime", "value": "8–14 hours", "detail": "Cooling line cascade to compressor/production"},
            {"label": "Estimated Cost", "value": "₹3.4L–₹5.2L", "detail": "Lost throughput + emergency parts premium"},
            {"label": "Compliance Impact", "value": "OISD ⚠", "detail": "Evidence gap worsens if failure occurs undocumented"},
        ],
        "recommendation": "Do not postpone. Execute seal replacement window within 12 days.",
    }


def build_incident_story(document_id: str = "doc-incident-p102-2025") -> dict[str, Any]:
    doc = store.documents.get(document_id)
    return {
        "title": "Auto Incident Story — NM-221",
        "executive_summary": doc.summary if doc else "Near miss on cooling line.",
        "timeline": [
            "2023 Seal leakage at elevated pressure",
            "2024 Bearing replacement; pressure still elevated",
            "2025-01-14 Surge near miss involving P-102 and V-12",
            "2025-03-02 Compliance finding on OISD evidence",
        ],
        "root_cause": "Unresolved overpressure vs OEM design + missing vibration monitoring",
        "impact": "Temporary evacuation; cooling/production cascade risk",
        "corrective_action": "Replace seal; restore ≤120 PSI; isolate and verify V-12",
        "preventive_action": "Add vibration route; reconcile document conflicts; close OISD evidence",
        "lessons_learned": "Cross-document conflicts and knowledge gaps are leading indicators",
        "document_id": document_id,
    }
