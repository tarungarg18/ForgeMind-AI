# Architecture

```
Upload (PDF / DOCX / XLSX / TXT / image)
        │
        ▼
   Parse text ──► link equipment tags (P-102, V-12, …)
        │
        ▼
 ┌──────────────┐     ┌─────────────────────────┐
 │   SQLite     │     │  Vector index (chunks)  │
 │  documents   │────▶│  local embeddings or    │
 │  equipment   │     │  optional ChromaDB      │
 │  events      │     └───────────┬─────────────┘
 └──────┬───────┘                 │
        │                         │
        └──────────┬──────────────┘
                   ▼
     Knowledge search  +  Ask AI (RAG)
                   │
                   ▼
            OpenRouter LLM
         (answer + decision card)
```

## Storage

| Layer | Tech | Location |
|---|---|---|
| Relational + default vectors | **SQLite** | `backend/data/forgemind.db` |
| Raw files | Disk | `backend/data/uploads/` |
| Optional vector DB | **ChromaDB** | `backend/data/chroma` when `VECTOR_BACKEND=chroma` |
| LLM / optional embeddings | OpenRouter | API key in `backend/.env` |

`backend/data/` is gitignored. Delete it to re-seed sample plant data on next boot.

## Ingest pipeline

1. Save raw bytes under `uploads/`
2. Extract text (`parsers.py`: pypdf, python-docx, openpyxl, plain text)
3. Guess doc type; link equipment IDs from tags in the text
4. Upsert `Document` (+ optional timeline `AssetEvent`) in SQLite
5. Chunk text (~700 chars) and embed → vector index
6. Document appears in Knowledge search and Ask AI retrieval

## Retrieval

- **Keyword search** — title / body / type facets (`GET /api/search`)
- **Semantic search** — nearest chunks by embedding similarity (same endpoint + Ask AI context)
- **Ask AI** — top semantic chunks + conflicts/gaps → OpenRouter JSON answer (or seeded fallback)

## Key modules

| Module | Role |
|---|---|
| `app/services/store.py` | Boot from SQLite, graph helpers, seed |
| `app/services/persistence.py` | SQLite schema + CRUD |
| `app/services/vectorstore.py` | Embed + semantic query |
| `app/services/parsers.py` | File → text |
| `app/services/ingest.py` | Upload pipeline |
| `app/services/intelligence.py` | Chat / decisions |
| `app/api/routes.py` | HTTP API |

## Config

See `backend/.env.example`: `VECTOR_BACKEND`, `DATA_DIR`, `OPENROUTER_*`, `SEED_ON_EMPTY`, `CORS_ORIGINS`.

Optional Docker: `docker compose --profile full up` for Postgres + Qdrant (future swap-in).
