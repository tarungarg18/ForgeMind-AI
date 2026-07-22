# ForgeMind AI

**Industrial Knowledge Intelligence Platform**  
Tagline: *Ask Anything About Your Plant.*

ET AI Hackathon 2026 — **Problem Statement 8**: AI for Industrial Knowledge Intelligence.

## What it is

ForgeMind is **Decision Intelligence** for industrial plants — not a chatbot over PDFs.

- **Plant Twin View** (SVG floor map)
- **Digital Memory Timeline** (Git history for assets)
- **Enterprise Decision Center** (every answer ends as a Decision Card)
- **Contextual Copilot** (asset-aware)
- **Cross-document conflict detection** + **Document trust scores**
- **Knowledge gaps / health score**
- **Interactive Demo Mode** for judging

Agents run internally via orchestration. Users see four surfaces only:

`Upload → Knowledge Base → ForgeMind AI → Insights`

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js, Tailwind, IBM Plex / Sora |
| Backend | FastAPI |
| LLM | **OpenRouter** (OpenAI-compatible) |
| Knowledge | Seeded industrial graph + trust-ranked retrieval |

## Quick start

### Backend

```bash
cd backend
python -m venv .venv
# Windows:
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env   # set OPENROUTER_API_KEY
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
copy .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000

## OpenRouter

Set in `backend/.env`:

```
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=google/gemini-2.0-flash-001
```

If the key is missing, the API falls back to high-quality seeded Decision Intelligence responses (demo-safe).

## Demo path

1. Insights → **Run Demo**
2. Or: Upload → Knowledge Base (click P-102) → ForgeMind AI → Decision Card → Insights Health Score

## Repository

https://github.com/tarungarg18/ForgeMind-AI
