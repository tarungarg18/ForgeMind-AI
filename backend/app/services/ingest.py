"""Ingest uploaded files into SQLite + vector DB."""

from __future__ import annotations

import re
import uuid
from datetime import date
from pathlib import Path
from typing import Any

from app.config import get_settings
from app.models.schemas import AssetEvent, Document
from app.services import persistence as db
from app.services.parsers import parse_bytes
from app.services.vectorstore import chunk_text, index_document_chunks


TAG_RE = re.compile(r"\b([A-Z]-?\d{1,4}|P-?\d{2,4}|V-?\d{1,3}|C-?\d{1,3}|B-?\d{1,3})\b", re.I)


def _guess_doc_type(filename: str, text: str) -> str:
    blob = f"{filename} {text[:800]}".lower()
    if "sop" in blob:
        return "sop"
    if "incident" in blob or "near miss" in blob:
        return "incident"
    if "inspection" in blob:
        return "inspection"
    if "work order" in blob or "maintenance" in blob or "wo-" in blob:
        return "maintenance"
    if "manual" in blob or "oem" in blob:
        return "manual"
    if "compliance" in blob or "oisd" in blob or "peso" in blob:
        return "compliance"
    if "regulation" in blob or "factory act" in blob:
        return "regulation"
    return "upload"


def _link_equipment(text: str, equipment: dict[str, Any]) -> list[str]:
    found: list[str] = []
    lower = text.lower()
    for eq in equipment.values():
        tag = eq.tag.lower()
        if tag in lower or tag.replace("-", "") in lower.replace("-", " ").replace("-", ""):
            found.append(eq.id)
            continue
        # loose: P102 vs P-102
        compact = tag.replace("-", "")
        if compact and compact in lower.replace("-", "").replace(" ", ""):
            found.append(eq.id)
    # also catch bare tags from regex
    for m in TAG_RE.findall(text[:4000]):
        norm = m.upper().replace(" ", "")
        if "-" not in norm and len(norm) > 1:
            norm = f"{norm[0]}-{norm[1:]}"
        for eq in equipment.values():
            if eq.tag.upper() == norm and eq.id not in found:
                found.append(eq.id)
    return found[:6]


def ingest_upload(
    filename: str,
    data: bytes,
    equipment: dict[str, Any],
) -> dict[str, Any]:
    settings = get_settings()
    text, page_count = parse_bytes(filename, data)

    # Persist raw file
    safe_name = Path(filename or "upload.bin").name
    job_id = uuid.uuid4().hex[:10]
    dest = settings.uploads_path / f"{job_id}_{safe_name}"
    dest.write_bytes(data)

    doc_id = f"doc-upload-{job_id}"
    eq_ids = _link_equipment(f"{safe_name}\n{text}", equipment)
    summary = (text[:220] + "…") if len(text) > 220 else text
    doc = Document(
        id=doc_id,
        title=safe_name,
        doc_type=_guess_doc_type(safe_name, text),
        equipment_ids=eq_ids,
        trust_score=0.75,
        freshness="current",
        verified=False,
        signed=False,
        summary=summary or f"Uploaded file {safe_name}",
        content=text[:20000],
        page_count=page_count,
        uploaded_at=date.today().isoformat(),
    )

    stages = [
        {
            "stage": "parse",
            "detail": f"Extracted text from {safe_name} ({len(text)} chars)",
            "done": True,
        },
        {
            "stage": "entities",
            "detail": f"Linked equipment: {', '.join(eq_ids) if eq_ids else 'none detected'}",
            "done": True,
        },
    ]

    db.upsert_document(doc, source_filename=str(dest))
    stages.append({"stage": "sqlite", "detail": f"Saved document {doc_id} in SQLite", "done": True})

    chunks = chunk_text(text)
    indexed = index_document_chunks(doc_id, doc.title, chunks)
    stages.append(
        {
            "stage": "embeddings",
            "detail": f"Indexed {len(indexed)} chunks in vector DB ({settings.vector_backend})",
            "done": True,
        }
    )

    event = AssetEvent(
        id=f"ev-upload-{job_id}",
        equipment_id=eq_ids[0] if eq_ids else "eq-p102",
        date=date.today().isoformat(),
        event_type="document_uploaded",
        summary=f"Uploaded {safe_name}",
        document_id=doc_id,
        severity="info",
    )
    db.upsert_event(event)
    stages.append({"stage": "ready", "detail": "Document searchable in Knowledge + Ask AI", "done": True})

    return {
        "job_id": job_id,
        "document": doc,
        "event": event,
        "chunks": len(indexed),
        "path": str(dest),
        "stages": stages,
    }


def reindex_all_documents(documents: dict[str, Document]) -> int:
    total = 0
    for doc in documents.values():
        chunks = chunk_text(doc.content or doc.summary)
        index_document_chunks(doc.id, doc.title, chunks)
        total += len(chunks)
    return total
