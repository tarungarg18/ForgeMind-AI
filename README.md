# ForgeMind AI

Plant docs are usually scattered — manuals, inspections, work orders, incident reports.
ForgeMind puts them in one place so teams can **upload, search, and ask** with sources.

## What you can do

- Upload plant documents (PDF, Word, Excel, text) — **persisted for everyone**, not discarded
- Search with keyword + **semantic** (vector) matching
- Browse equipment on a plant map and open asset history
- Ask AI any plant question (mention tags like P-102 in the question)
- See knowledge health, conflicts, and missing-doc gaps
- Run an interactive product walkthrough (Next / Prev / Cancel)

Screens: **Home → Upload → Knowledge → Ask AI → Insights**

## Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js + Tailwind |
| Backend | FastAPI |
| Document DB | **SQLite** (`backend/data/forgemind.db`) |
| Vector search | Local embeddings in SQLite (default); optional ChromaDB |
| LLM | OpenRouter |
| Optional later | Postgres + Qdrant (`docker compose --profile full up`) |

First boot seeds sample plant data (P-102 timeline, pressure conflict, gaps). After that, uploads are parsed, stored, chunked, and embedded.

## Setup

### Backend

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate          # Windows
# source .venv/bin/activate       # macOS/Linux
pip install -r requirements.txt
copy .env.example .env            # or: cp .env.example .env
# add OPENROUTER_API_KEY in .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend

```bash
cd frontend
copy .env.example .env.local
npm install
npm run dev
```

| Service | URL |
|---|---|
| App | http://localhost:3000 |
| API docs | http://127.0.0.1:8000/docs |
| Health | http://127.0.0.1:8000/api/health |

## Environment

`backend/.env` (never commit this file):

```
OPENROUTER_API_KEY=your_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=google/gemini-2.0-flash-001
OPENROUTER_EMBEDDING_MODEL=openai/text-embedding-3-small
VECTOR_BACKEND=local
SEED_ON_EMPTY=true
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

`frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

Without an API key, chat still returns sample answers; semantic ranking still works with the local embedder.

## Quick demo path

1. **Insights** → Start walkthrough (or skip to manual flow)
2. **Upload** a `.txt` that mentions P-102
3. **Knowledge** → search “seal leakage” or “vibration”
4. **Ask AI** → “Why did Pump P-102 fail?”
5. **Insights** → coverage, conflicts, gaps

## Docs

- [Architecture](docs/ARCHITECTURE.md) — storage, ingest, retrieval
- [In-app walkthrough](docs/DEMO.md) — tour controls

## Smoke test

```bash
cd backend
.\.venv\Scripts\activate
python scripts/smoke_test.py
```

Repo: https://github.com/tarungarg18/ForgeMind-AI
