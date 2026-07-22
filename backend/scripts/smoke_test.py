"""End-to-end smoke test for ForgeMind storage + semantic search + chat."""

from __future__ import annotations

import asyncio
import json
import os
import sys
import tempfile
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))


def main() -> int:
    tmp = Path(tempfile.mkdtemp(prefix="fm-smoke-"))
    os.environ["DATA_DIR"] = str(tmp)
    os.environ["VECTOR_BACKEND"] = "local"
    os.environ["SEED_ON_EMPTY"] = "true"
    os.environ["FORCE_DEMO_LLM"] = "true"

    from app.config import get_settings

    get_settings.cache_clear()

    from app.models.schemas import ChatRequest
    from app.services.ingest import ingest_upload
    from app.services.intelligence import answer_query
    from app.services.persistence import data_paths, document_count
    from app.services.store import store
    from app.services.vectorstore import semantic_search

    assert document_count() >= 1, "expected seed documents"
    print("[ok] seed", document_count(), "docs")
    print("[ok] paths", data_paths())

    payload = (
        b"Vibration report for Pump P-102.\n"
        b"RMS velocity elevated on drive end.\n"
        b"Recommend predictive maintenance within 7 days."
    )
    result = asyncio.run(ingest_upload("smoke_vib_P-102.txt", payload, store.equipment))
    store.add_document(result["document"], result["event"])
    assert result["chunks"] >= 1
    assert result["document"].id in store.documents
    print("[ok] upload", result["document"].id, "chunks", result["chunks"])

    hits = semantic_search("pump vibration predictive maintenance", n=5)
    assert hits, "expected semantic hits"
    top = [
        (h.get("title") or h.get("document_id"), round(float(h.get("score") or 0), 3))
        for h in hits[:3]
    ]
    print("[ok] semantic", top)

    resp = asyncio.run(
        answer_query(
            ChatRequest(message="Why did Pump P-102 fail?", mode="manager", equipment_id=None)
        )
    )
    assert resp.answer
    assert resp.decision_card
    print("[ok] chat", resp.answer[:140].replace("\n", " ").encode("ascii", "replace").decode())
    print(
        "[ok] action",
        resp.decision_card.recommended_action[:100].encode("ascii", "replace").decode(),
    )
    print(json.dumps({"status": "passed", "data_dir": str(tmp)}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
