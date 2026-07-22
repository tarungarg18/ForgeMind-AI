"""SQLite persistence for plant documents, equipment, and events."""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Any, Optional

from app.config import get_settings
from app.models.schemas import AssetEvent, Document, Equipment


def _connect() -> sqlite3.Connection:
    path = get_settings().sqlite_path
    conn = sqlite3.connect(str(path), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = _connect()
    try:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                doc_type TEXT NOT NULL,
                equipment_ids TEXT NOT NULL DEFAULT '[]',
                trust_score REAL NOT NULL DEFAULT 0.8,
                freshness TEXT NOT NULL DEFAULT 'current',
                verified INTEGER NOT NULL DEFAULT 0,
                signed INTEGER NOT NULL DEFAULT 0,
                superseded_by TEXT,
                summary TEXT NOT NULL DEFAULT '',
                content TEXT NOT NULL DEFAULT '',
                page_count INTEGER NOT NULL DEFAULT 1,
                uploaded_at TEXT NOT NULL DEFAULT '',
                source_filename TEXT NOT NULL DEFAULT '',
                entities TEXT NOT NULL DEFAULT '{}'
            );

            CREATE TABLE IF NOT EXISTS equipment (
                id TEXT PRIMARY KEY,
                payload TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS events (
                id TEXT PRIMARY KEY,
                payload TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS meta (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS chunks (
                id TEXT PRIMARY KEY,
                document_id TEXT NOT NULL,
                chunk_index INTEGER NOT NULL,
                text TEXT NOT NULL,
                embedding TEXT,
                FOREIGN KEY(document_id) REFERENCES documents(id)
            );
            """
        )
        conn.commit()
        try:
            conn.execute("ALTER TABLE documents ADD COLUMN entities TEXT NOT NULL DEFAULT '{}'")
            conn.commit()
        except sqlite3.OperationalError:
            pass
    finally:
        conn.close()


def document_count() -> int:
    conn = _connect()
    try:
        row = conn.execute("SELECT COUNT(*) AS c FROM documents").fetchone()
        return int(row["c"])
    finally:
        conn.close()


def _doc_from_row(row: sqlite3.Row) -> Document:
    return Document(
        id=row["id"],
        title=row["title"],
        doc_type=row["doc_type"],
        equipment_ids=json.loads(row["equipment_ids"] or "[]"),
        trust_score=row["trust_score"],
        freshness=row["freshness"],
        verified=bool(row["verified"]),
        signed=bool(row["signed"]),
        superseded_by=row["superseded_by"],
        summary=row["summary"] or "",
        content=row["content"] or "",
        page_count=row["page_count"] or 1,
        uploaded_at=row["uploaded_at"] or "",
        entities=json.loads(row["entities"] or "{}"),
    )


def upsert_document(doc: Document, source_filename: str = "") -> None:
    conn = _connect()
    try:
        conn.execute(
            """
            INSERT INTO documents (
                id, title, doc_type, equipment_ids, trust_score, freshness,
                verified, signed, superseded_by, summary, content, page_count,
                uploaded_at, source_filename, entities
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                title=excluded.title,
                doc_type=excluded.doc_type,
                equipment_ids=excluded.equipment_ids,
                trust_score=excluded.trust_score,
                freshness=excluded.freshness,
                verified=excluded.verified,
                signed=excluded.signed,
                superseded_by=excluded.superseded_by,
                summary=excluded.summary,
                content=excluded.content,
                page_count=excluded.page_count,
                uploaded_at=excluded.uploaded_at,
                source_filename=excluded.source_filename,
                entities=excluded.entities
            """,
            (
                doc.id,
                doc.title,
                doc.doc_type,
                json.dumps(doc.equipment_ids),
                doc.trust_score,
                doc.freshness,
                int(doc.verified),
                int(doc.signed),
                doc.superseded_by,
                doc.summary,
                doc.content,
                doc.page_count,
                doc.uploaded_at,
                source_filename,
                json.dumps(doc.entities or {}),
            ),
        )
        conn.commit()
    finally:
        conn.close()


def load_documents() -> dict[str, Document]:
    conn = _connect()
    try:
        rows = conn.execute("SELECT * FROM documents ORDER BY uploaded_at DESC").fetchall()
        return {row["id"]: _doc_from_row(row) for row in rows}
    finally:
        conn.close()


def upsert_equipment(eq: Equipment) -> None:
    conn = _connect()
    try:
        conn.execute(
            "INSERT INTO equipment (id, payload) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload",
            (eq.id, eq.model_dump_json()),
        )
        conn.commit()
    finally:
        conn.close()


def load_equipment() -> dict[str, Equipment]:
    conn = _connect()
    try:
        rows = conn.execute("SELECT payload FROM equipment").fetchall()
        return {e.id: e for e in (Equipment.model_validate_json(r["payload"]) for r in rows)}
    finally:
        conn.close()


def upsert_event(event: AssetEvent) -> None:
    conn = _connect()
    try:
        conn.execute(
            "INSERT INTO events (id, payload) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload",
            (event.id, event.model_dump_json()),
        )
        conn.commit()
    finally:
        conn.close()


def load_events() -> list[AssetEvent]:
    conn = _connect()
    try:
        rows = conn.execute("SELECT payload FROM events").fetchall()
        return [AssetEvent.model_validate_json(r["payload"]) for r in rows]
    finally:
        conn.close()


def replace_chunks(
    document_id: str,
    chunks: list[dict[str, Any]],
) -> None:
    """chunks: [{id, chunk_index, text, embedding?: list[float]}]"""
    conn = _connect()
    try:
        conn.execute("DELETE FROM chunks WHERE document_id = ?", (document_id,))
        for ch in chunks:
            conn.execute(
                """
                INSERT INTO chunks (id, document_id, chunk_index, text, embedding)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    ch["id"],
                    document_id,
                    ch["chunk_index"],
                    ch["text"],
                    json.dumps(ch.get("embedding")) if ch.get("embedding") is not None else None,
                ),
            )
        conn.commit()
    finally:
        conn.close()


def load_chunks(document_id: Optional[str] = None) -> list[dict[str, Any]]:
    conn = _connect()
    try:
        if document_id:
            rows = conn.execute(
                "SELECT * FROM chunks WHERE document_id = ? ORDER BY chunk_index",
                (document_id,),
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM chunks ORDER BY document_id, chunk_index").fetchall()
        out = []
        for row in rows:
            emb = json.loads(row["embedding"]) if row["embedding"] else None
            out.append(
                {
                    "id": row["id"],
                    "document_id": row["document_id"],
                    "chunk_index": row["chunk_index"],
                    "text": row["text"],
                    "embedding": emb,
                }
            )
        return out
    finally:
        conn.close()


def set_meta(key: str, value: str) -> None:
    conn = _connect()
    try:
        conn.execute(
            "INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
            (key, value),
        )
        conn.commit()
    finally:
        conn.close()


def get_meta(key: str) -> Optional[str]:
    conn = _connect()
    try:
        row = conn.execute("SELECT value FROM meta WHERE key = ?", (key,)).fetchone()
        return row["value"] if row else None
    finally:
        conn.close()


def data_paths() -> dict[str, str]:
    settings = get_settings()
    return {
        "data_dir": str(settings.resolved_data_dir),
        "sqlite": str(settings.sqlite_path),
        "chroma": str(settings.chroma_path),
        "uploads": str(settings.uploads_path),
        "vector_backend": settings.vector_backend,
    }
