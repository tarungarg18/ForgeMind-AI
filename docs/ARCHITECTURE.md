# Architecture

```
Upload (PDF / DOCX / XLSX / TXT / image)
        │
        ▼
   Parse text ──► LLM entity extraction (equipment tags, process
        │          parameters, regulatory refs, personnel, dates)
        │          — falls back to regex tag matching with no API key
        ▼
 ┌──────────────┐     ┌─────────────────────────┐
 │   SQLite     │     │  Vector index (chunks)  │
 │  documents   │────▶│  local embeddings or    │
 │  (+entities) │     │  optional ChromaDB      │
 │  equipment   │     └───────────┬─────────────┘
 │  events      │                 │
 └──────┬───────┘                 │
        │                         │
        ├── grows knowledge graph (new document + regulation nodes/edges)
        ├── detects conflicts (differing parameter values across documents)
        └── recomputes missing-doc gaps per equipment
        │
        └──────────┬──────────────┘
                   ▼
     Knowledge search  +  Ask AI (RAG)
                   │
                   ▼
            OpenRouter LLM
   (answer + decision card, compliance flags grounded
    in retrieved regulation/SOP evidence)
                   │
                   ▼
        Lessons Learned engine
 (mines incident/near-miss docs for recurring patterns)
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
3. Guess doc type; link equipment IDs from regex tag matching
4. LLM entity extraction (`ingest._extract_entities`): equipment tags, process
   parameters (name/value/unit), regulatory references, personnel, dates —
   falls back to regex-only tags when no `OPENROUTER_API_KEY` is set
5. Upsert `Document` (with `entities` JSON) + timeline `AssetEvent` in SQLite
6. Chunk text (~700 chars) and embed → vector index
7. `store.add_document()` grows the knowledge graph, detects conflicts, and
   recomputes gaps for the linked equipment (`store._grow_graph`,
   `_detect_conflicts`, `_recompute_gaps`)
8. Document appears in Knowledge search and Ask AI retrieval

## Intelligence layer

- **Knowledge graph** — starts from a seed graph, then grows a real node + edges
  per upload; regulation nodes are created on the fly when a document references one
- **Conflict detection** — compares extracted process-parameter values for the same
  equipment across documents; a >10% delta creates/extends a `Conflict`
- **Gap detection** — recomputed per equipment against an expected doc-type set
  (manual, inspection, maintenance) whenever new documents arrive
- **Compliance grounding** — Ask AI's LLM path retrieves regulation/compliance/SOP
  chunks and is instructed to mark a framework `unknown` rather than guess if no
  evidence was retrieved for it
- **Lessons Learned** — `GET /api/lessons-learned` mines incident/near-miss documents
  for recurring patterns (root causes, contractors, equipment classes)

## Retrieval

- **Keyword search** — title / body / type facets (`GET /api/search`)
- **Semantic search** — nearest chunks by embedding similarity (same endpoint + Ask AI context)
- **Ask AI** — top semantic chunks + conflicts/gaps + regulatory context → OpenRouter
  JSON answer (or seeded fallback), with a try/except safety net so an unexpected
  LLM failure always degrades to the seeded answer instead of a 500

## Key modules

| Module | Role |
|---|---|
| `app/services/store.py` | Boot from SQLite, graph/conflict/gap growth, seed |
| `app/services/persistence.py` | SQLite schema + CRUD (incl. `entities` column) |
| `app/services/vectorstore.py` | Embed + semantic query |
| `app/services/parsers.py` | File → text |
| `app/services/ingest.py` | Upload pipeline + LLM entity extraction |
| `app/services/intelligence.py` | Chat / decisions / compliance grounding / lessons learned |
| `app/api/routes.py` | HTTP API |
| `app/main.py` | CORS + catch-all error middleware (keeps CORS headers on 5xx) |

## Config

See `backend/.env.example`: `VECTOR_BACKEND`, `DATA_DIR`, `OPENROUTER_*`, `SEED_ON_EMPTY`, `CORS_ORIGINS`.

Optional Docker: `docker compose --profile full up` for Postgres + Qdrant (future swap-in).
