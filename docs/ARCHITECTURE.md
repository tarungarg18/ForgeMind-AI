# Architecture — ForgeMind AI (PS 8)

## Surfaces (external)

Upload → Knowledge Base (Plant Twin) → ForgeMind AI → Insights

## Internal flow

1. Ingest documents → trust score + entity/graph upsert + gap/conflict scan
2. User selects asset on Plant Twin → Contextual Copilot session
3. LangGraph-style supervisor routes to internal specialists (hidden)
4. OpenRouter LLM composes answer + **Decision Card**
5. Explain Why + Evidence Heatmap + Impact Radius from graph

## LLM

All generative calls go through **OpenRouter** (`OPENROUTER_BASE_URL` + `OPENROUTER_API_KEY`).

## Demo corpus

Seeded Pump P-102 history 2021–2025 with intentional pressure conflicts (120/140/150 PSI).
