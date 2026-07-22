"""Vector store for semantic search over document chunks.

Primary backend: ChromaDB (persistent on disk under backend/data/chroma).
Fallback: local SQLite chunk embeddings + numpy cosine similarity.
"""

from __future__ import annotations

import hashlib
import logging
import re
from typing import Any, Optional

import numpy as np

from app.config import get_settings
from app.services import persistence as db

logger = logging.getLogger(__name__)

COLLECTION = "forgemind_chunks"
EMBED_DIM = 384


def _hash_embed(text: str, dim: int = EMBED_DIM) -> list[float]:
    """Deterministic bag-of-tokens embedding (no external model required)."""
    vec = np.zeros(dim, dtype=np.float32)
    tokens = re.findall(r"[a-z0-9\-]{2,}", text.lower())
    if not tokens:
        return vec.tolist()
    for tok in tokens:
        h = int(hashlib.md5(tok.encode("utf-8")).hexdigest(), 16)
        idx = h % dim
        sign = 1.0 if (h >> 8) % 2 == 0 else -1.0
        vec[idx] += sign
    norm = float(np.linalg.norm(vec))
    if norm > 0:
        vec /= norm
    return vec.tolist()


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed texts. Tries OpenRouter when configured; else local hash embed."""
    settings = get_settings()
    if settings.openrouter_api_key and not settings.force_demo_llm:
        try:
            return _openrouter_embed(texts)
        except Exception as exc:  # noqa: BLE001
            logger.warning("OpenRouter embeddings failed, using local embed: %s", exc)
    return [_hash_embed(t) for t in texts]


def _openrouter_embed(texts: list[str]) -> list[list[float]]:
    from openai import OpenAI

    settings = get_settings()
    client = OpenAI(
        api_key=settings.openrouter_api_key,
        base_url=settings.openrouter_base_url,
        default_headers={
            "HTTP-Referer": settings.openrouter_site_url,
            "X-Title": settings.openrouter_app_name,
        },
    )
    resp = client.embeddings.create(
        model=settings.openrouter_embedding_model,
        input=texts,
    )
    vectors = [item.embedding for item in resp.data]
    # Project / pad to EMBED_DIM for local fallback compatibility is not required
    # when using OpenRouter consistently; store as-is.
    return vectors


class _ChromaBackend:
    def __init__(self) -> None:
        import chromadb
        from chromadb.config import Settings as ChromaSettings

        settings = get_settings()
        self.client = chromadb.PersistentClient(
            path=str(settings.chroma_path),
            settings=ChromaSettings(anonymized_telemetry=False),
        )
        self.collection = self.client.get_or_create_collection(
            name=COLLECTION,
            metadata={"hnsw:space": "cosine"},
        )

    def upsert(
        self,
        ids: list[str],
        documents: list[str],
        metadatas: list[dict[str, Any]],
        embeddings: list[list[float]],
    ) -> None:
        self.collection.upsert(
            ids=ids,
            documents=documents,
            metadatas=metadatas,
            embeddings=embeddings,
        )

    def delete_document(self, document_id: str) -> None:
        try:
            self.collection.delete(where={"document_id": document_id})
        except Exception:  # noqa: BLE001
            pass

    def query(self, text: str, n: int = 8) -> list[dict[str, Any]]:
        emb = embed_texts([text])[0]
        res = self.collection.query(
            query_embeddings=[emb],
            n_results=max(1, min(n, max(1, self.collection.count() or 1))),
            include=["documents", "metadatas", "distances"],
        )
        out: list[dict[str, Any]] = []
        if not res or not res.get("ids"):
            return out
        for i, cid in enumerate(res["ids"][0]):
            meta = (res["metadatas"][0][i] or {}) if res.get("metadatas") else {}
            dist = res["distances"][0][i] if res.get("distances") else 1.0
            score = max(0.0, 1.0 - float(dist))
            out.append(
                {
                    "chunk_id": cid,
                    "document_id": meta.get("document_id", ""),
                    "title": meta.get("title", ""),
                    "text": res["documents"][0][i] if res.get("documents") else "",
                    "score": score,
                }
            )
        return out


class _LocalBackend:
    """Cosine search over embeddings stored in SQLite chunks table."""

    def upsert(
        self,
        ids: list[str],
        documents: list[str],
        metadatas: list[dict[str, Any]],
        embeddings: list[list[float]],
    ) -> None:
        by_doc: dict[str, list[dict[str, Any]]] = {}
        for i, cid in enumerate(ids):
            doc_id = str(metadatas[i].get("document_id", ""))
            by_doc.setdefault(doc_id, []).append(
                {
                    "id": cid,
                    "chunk_index": int(metadatas[i].get("chunk_index", i)),
                    "text": documents[i],
                    "embedding": embeddings[i],
                }
            )
        for doc_id, chunks in by_doc.items():
            db.replace_chunks(doc_id, chunks)

    def delete_document(self, document_id: str) -> None:
        db.replace_chunks(document_id, [])

    def query(self, text: str, n: int = 8) -> list[dict[str, Any]]:
        q = np.array(_hash_embed(text), dtype=np.float32)
        # If OpenRouter embeddings were stored, dims may differ — re-embed query same way
        try:
            q = np.array(embed_texts([text])[0], dtype=np.float32)
        except Exception:  # noqa: BLE001
            pass

        rows = db.load_chunks()
        scored: list[dict[str, Any]] = []
        for row in rows:
            emb = row.get("embedding")
            if not emb:
                continue
            v = np.array(emb, dtype=np.float32)
            if v.shape != q.shape:
                continue
            denom = float(np.linalg.norm(q) * np.linalg.norm(v))
            score = float(np.dot(q, v) / denom) if denom else 0.0
            scored.append(
                {
                    "chunk_id": row["id"],
                    "document_id": row["document_id"],
                    "title": "",
                    "text": row["text"],
                    "score": score,
                }
            )
        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:n]


_backend: Optional[Any] = None


def get_vector_backend() -> Any:
    global _backend
    if _backend is not None:
        return _backend
    settings = get_settings()
    if settings.vector_backend.lower() == "chroma":
        try:
            _backend = _ChromaBackend()
            logger.info("Vector backend: ChromaDB at %s", settings.chroma_path)
            return _backend
        except Exception as exc:  # noqa: BLE001
            logger.warning("Chroma unavailable (%s); using local SQLite vectors", exc)
    _backend = _LocalBackend()
    logger.info("Vector backend: local SQLite embeddings")
    return _backend


def index_document_chunks(
    document_id: str,
    title: str,
    chunks: list[str],
) -> list[dict[str, Any]]:
    if not chunks:
        return []
    ids = [f"{document_id}::c{i}" for i in range(len(chunks))]
    metadatas = [
        {"document_id": document_id, "title": title, "chunk_index": i}
        for i in range(len(chunks))
    ]
    embeddings = embed_texts(chunks)
    backend = get_vector_backend()
    backend.delete_document(document_id)
    backend.upsert(ids, chunks, metadatas, embeddings)
    # Always mirror into SQLite for backup / local fallback
    db.replace_chunks(
        document_id,
        [
            {
                "id": ids[i],
                "chunk_index": i,
                "text": chunks[i],
                "embedding": embeddings[i],
            }
            for i in range(len(chunks))
        ],
    )
    return [{"id": ids[i], "text": chunks[i]} for i in range(len(chunks))]


def semantic_search(query: str, n: int = 8) -> list[dict[str, Any]]:
    if not query.strip():
        return []
    backend = get_vector_backend()
    hits = backend.query(query, n=n)
    # Fill titles from SQLite when missing
    docs = db.load_documents()
    for h in hits:
        if not h.get("title") and h.get("document_id") in docs:
            h["title"] = docs[h["document_id"]].title
    return hits


def chunk_text(text: str, size: int = 700, overlap: int = 100) -> list[str]:
    cleaned = re.sub(r"\s+", " ", text or "").strip()
    if not cleaned:
        return []
    if len(cleaned) <= size:
        return [cleaned]
    chunks: list[str] = []
    start = 0
    while start < len(cleaned):
        end = min(len(cleaned), start + size)
        chunks.append(cleaned[start:end])
        if end >= len(cleaned):
            break
        start = max(0, end - overlap)
    return chunks
