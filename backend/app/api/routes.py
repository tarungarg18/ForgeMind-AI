from __future__ import annotations

import asyncio
import uuid
from typing import Any

from fastapi import APIRouter, File, UploadFile
from fastapi.responses import Response

from app.models.schemas import ChatRequest, SimulateRequest
from app.services.intelligence import answer_query, build_incident_story, simulate
from app.services.store import store

router = APIRouter()


@router.get("/health")
async def health() -> dict[str, Any]:
    from app.services.persistence import data_paths

    return {"status": "ok", "service": "ForgeMind AI", "storage": data_paths()}


@router.get("/stats")
async def stats() -> dict[str, Any]:
    snap = store.snapshot()
    kh = store.knowledge_health()
    return {**snap, "knowledge_health": kh.model_dump()}


@router.get("/knowledge-health")
async def knowledge_health() -> dict[str, Any]:
    return store.knowledge_health().model_dump()


@router.get("/plant-twin")
async def plant_twin() -> dict[str, Any]:
    sections: dict[str, list] = {}
    for eq in store.equipment.values():
        sections.setdefault(eq.section, []).append(eq.model_dump())
    return {
        "sections": [{"name": k, "equipment": v} for k, v in sections.items()],
        "equipment": [e.model_dump() for e in store.equipment.values()],
    }


@router.get("/equipment")
async def list_equipment() -> list[dict[str, Any]]:
    return [e.model_dump() for e in store.equipment.values()]


@router.get("/equipment/{equipment_id}")
async def get_equipment(equipment_id: str) -> dict[str, Any]:
    eq = store.equipment[equipment_id]
    return {
        **eq.model_dump(),
        "timeline": [e.model_dump() for e in store.timeline(equipment_id)],
        "impact_radius": store.impact_radius(equipment_id),
        "gaps": [g.model_dump() for g in store.gaps if g.equipment_id == equipment_id],
        "documents": [
            d.model_dump()
            for d in store.documents.values()
            if equipment_id in d.equipment_ids
        ],
    }


@router.get("/timeline/{equipment_id}")
async def timeline(equipment_id: str) -> list[dict[str, Any]]:
    return [e.model_dump() for e in store.timeline(equipment_id)]


@router.get("/graph")
async def graph(equipment_id: str | None = None) -> dict[str, Any]:
    if not equipment_id:
        return {
            "nodes": [n.model_dump() for n in store.nodes.values()],
            "edges": [e.model_dump() for e in store.edges],
        }
    # neighborhood
    keep = set(store.impact_radius(equipment_id))
    # map labels back to ids roughly
    node_ids = {n.id for n in store.nodes.values() if n.label in keep or n.id == equipment_id}
    # also include direct edges
    for e in store.edges:
        if e.source == equipment_id or e.target == equipment_id:
            node_ids.add(e.source)
            node_ids.add(e.target)
    nodes = [n.model_dump() for n in store.nodes.values() if n.id in node_ids]
    edges = [
        e.model_dump()
        for e in store.edges
        if e.source in node_ids and e.target in node_ids
    ]
    return {"nodes": nodes, "edges": edges}


@router.get("/documents")
async def documents() -> list[dict[str, Any]]:
    return [d.model_dump() for d in store.documents.values()]


@router.get("/documents/{document_id}")
async def document(document_id: str) -> dict[str, Any]:
    return store.documents[document_id].model_dump()


@router.get("/conflicts")
async def conflicts() -> list[dict[str, Any]]:
    return [c.model_dump() for c in store.conflicts]


@router.get("/gaps")
async def gaps() -> list[dict[str, Any]]:
    return [g.model_dump() for g in store.gaps]


@router.get("/recommendations")
async def recommendations() -> list[dict[str, Any]]:
    return [r.model_dump() for r in store.recommendations]


@router.get("/notifications")
async def notifications() -> list[dict[str, Any]]:
    return store.notifications


@router.get("/search")
async def smart_search(q: str) -> dict[str, Any]:
    from app.services.vectorstore import semantic_search

    ql = q.strip().lower()
    if not ql:
        return {
            "equipment": [],
            "documents": [],
            "incidents": [],
            "maintenance": [],
            "regulations": [],
            "events": [],
            "semantic": [],
        }

    def doc_match(d: Any) -> bool:
        blob = f"{d.title} {d.summary} {d.content} {d.doc_type}".lower()
        return ql in blob

    docs = list(store.documents.values())
    semantic = semantic_search(q, n=8)
    # Merge semantic-only docs into documents facet
    by_id = {d.id: d for d in docs}
    semantic_docs = []
    seen = set()
    for hit in semantic:
        doc = by_id.get(hit.get("document_id", ""))
        if not doc or doc.id in seen:
            continue
        seen.add(doc.id)
        payload = doc.model_dump()
        payload["semantic_score"] = hit.get("score")
        payload["semantic_snippet"] = hit.get("text", "")[:240]
        semantic_docs.append(payload)

    keyword_docs = [d.model_dump() for d in docs if doc_match(d)]
    for kd in keyword_docs:
        if kd["id"] not in seen:
            semantic_docs.append(kd)
            seen.add(kd["id"])

    return {
        "equipment": [
            e.model_dump()
            for e in store.equipment.values()
            if ql in e.tag.lower() or ql in e.name.lower() or ql in e.department.lower()
        ],
        "documents": semantic_docs,
        "incidents": [
            d.model_dump()
            for d in docs
            if d.doc_type in {"incident", "near_miss"} and doc_match(d)
        ],
        "maintenance": [
            d.model_dump()
            for d in docs
            if d.doc_type in {"maintenance", "work_order", "inspection"} and doc_match(d)
        ],
        "regulations": [
            d.model_dump() for d in docs if d.doc_type == "regulation" and doc_match(d)
        ],
        "events": [
            e.model_dump()
            for e in store.events
            if ql in e.summary.lower() or ql in e.event_type.lower()
        ],
        "semantic": semantic,
    }


@router.get("/search/compare")
async def search_compare(q: str) -> dict[str, Any]:
    # Traditional shallow keyword hits
    traditional_hits = []
    for d in store.documents.values():
        if q.lower() in d.title.lower():
            traditional_hits.append({"title": d.title, "snippet": d.summary[:120]})
    smart = await smart_search(q)
    fm_answer = await answer_query(ChatRequest(message=q, mode="engineer", equipment_id="eq-p102"))
    return {
        "query": q,
        "traditional": {
            "seconds": 180,
            "label": "Folder search (~3 min)",
            "hits": traditional_hits[:5] or [{"title": "Folder crawl...", "snippet": "No ranked answer"}],
        },
        "forgemind": {
            "seconds": 8,
            "label": "ForgeMind (~8 sec)",
            "answer": fm_answer.answer,
            "citations": fm_answer.explain.documents_used if fm_answer.explain else [],
            "decision_card": fm_answer.decision_card.model_dump() if fm_answer.decision_card else None,
            "facets": {k: len(v) for k, v in smart.items()},
        },
    }


@router.post("/chat")
async def chat(req: ChatRequest) -> dict[str, Any]:
    resp = await answer_query(req)
    return resp.model_dump()


@router.post("/simulate")
async def simulate_decision(req: SimulateRequest) -> dict[str, Any]:
    return simulate(req)


@router.get("/incident-story")
async def incident_story(document_id: str = "doc-incident-p102-2025") -> dict[str, Any]:
    return build_incident_story(document_id)


@router.get("/incident-story/pdf")
async def incident_story_pdf(document_id: str = "doc-incident-p102-2025") -> Response:
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    import io

    story = build_incident_story(document_id)
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)
    y = 750
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, y, story["title"])
    y -= 30
    c.setFont("Helvetica", 11)
    for key in [
        "executive_summary",
        "root_cause",
        "impact",
        "corrective_action",
        "preventive_action",
        "lessons_learned",
    ]:
        c.drawString(50, y, f"{key.replace('_', ' ').title()}:")
        y -= 16
        for line in str(story[key]).split(". "):
            c.drawString(60, y, line[:95])
            y -= 14
        y -= 8
    c.showPage()
    c.save()
    return Response(buf.getvalue(), media_type="application/pdf", headers={
        "Content-Disposition": "attachment; filename=incident-story.pdf"
    })


@router.post("/upload")
async def upload(file: UploadFile = File(...)) -> dict[str, Any]:
    from app.services.ingest import ingest_upload
    from app.services.persistence import data_paths

    content = await file.read()
    result = ingest_upload(file.filename or "upload.txt", content, store.equipment)
    doc = result["document"]
    event = result["event"]
    store.add_document(doc, event)

    nodes = store.graph_stats["nodes"]
    edges = store.graph_stats["edges"]
    stages = []
    for stage in result["stages"]:
        stages.append({**stage, "nodes": nodes, "edges": edges})

    job_id = result["job_id"]
    store.upload_jobs[job_id] = stages
    store.notifications.insert(
        0,
        {
            "id": f"up-{job_id[:6]}",
            "type": "upload",
            "message": f"New document uploaded: {file.filename} (saved to SQLite + vector DB)",
            "ts": "now",
        },
    )
    return {
        "job_id": job_id,
        "filename": file.filename,
        "bytes": len(content),
        "document_id": doc.id,
        "chunks": result["chunks"],
        "storage": data_paths(),
        "stages": stages,
    }


@router.get("/upload/{job_id}")
async def upload_status(job_id: str) -> dict[str, Any]:
    return {"job_id": job_id, "stages": store.upload_jobs.get(job_id, [])}


@router.post("/demo/run")
async def run_demo() -> dict[str, Any]:
    """Walk through the main product flow with sample data."""
    beats = []
    beats.append({"beat": 1, "title": "Upload", "detail": "Sample plant documents loaded"})
    await asyncio.sleep(0.05)
    beats.append({"beat": 2, "title": "Graph update", "detail": f"Nodes {store.graph_stats['nodes']}, edges {store.graph_stats['edges']}"})
    beats.append({"beat": 3, "title": "Plant map", "detail": "P-102 marked critical in Section A"})
    beats.append({"beat": 4, "title": "Timeline", "detail": "History for P-102 from 2021 to 2025"})
    chat = await answer_query(ChatRequest(message="Why did Pump P-102 fail?", mode="manager", equipment_id="eq-p102"))
    beats.append({"beat": 5, "title": "Recommended action", "detail": chat.decision_card.recommended_action if chat.decision_card else ""})
    beats.append({"beat": 6, "title": "Document conflict", "detail": store.conflicts[0].summary})
    why = await answer_query(ChatRequest(message="Why wasn't this incident predicted?", mode="auditor", equipment_id="eq-p102"))
    beats.append({"beat": 7, "title": "Missing docs", "detail": why.answer[:160]})
    kh = store.knowledge_health()
    beats.append({"beat": 8, "title": "Knowledge health", "detail": f"{kh.knowledge_health}% overall, {kh.critical_gaps} critical gaps"})
    return {"beats": beats, "knowledge_health": kh.model_dump(), "decision": chat.model_dump()}


@router.get("/audit/queries")
async def audit_queries() -> list[dict[str, Any]]:
    return store.query_log[-50:]
