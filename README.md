# ForgeMind AI

Plant docs are usually scattered — manuals, inspections, work orders, incident reports.
ForgeMind puts them in one place so you can ask questions about equipment and get answers with sources.

## What you can do

- Upload PDFs and other plant documents
- See equipment on a simple plant map
- Open an asset timeline (install → maintenance → incidents)
- Ask questions in chat (answers include a recommended action)
- Spot missing docs, conflicts between documents, and compliance gaps

Main screens: **Upload**, **Knowledge Base**, **ForgeMind AI**, **Insights**

## Stack

- Frontend: Next.js + Tailwind
- Backend: FastAPI
- LLM: OpenRouter
- Sample plant data is seeded for local demo

## Setup

### Backend

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
# put your OpenRouter key in .env
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
copy .env.example .env.local
npm install
npm run dev
```

App: http://localhost:3000  
API: http://127.0.0.1:8000/docs

## Env

`backend/.env`:

```
OPENROUTER_API_KEY=your_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=google/gemini-2.0-flash-001
```

If no key is set, chat still works using the built-in sample answers.

## Quick try

1. Open Knowledge Base and click pump **P-102**
2. Go to ForgeMind AI and ask why it failed
3. Or hit **Run Demo** on Insights

Repo: https://github.com/tarungarg18/ForgeMind-AI
