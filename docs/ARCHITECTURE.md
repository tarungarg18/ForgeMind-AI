# Architecture

Simple layout:

```
Upload → Knowledge Base → ForgeMind AI → Insights
```

## How it works

1. Documents get parsed and stored with a trust score
2. Equipment, events, and links go into a knowledge graph
3. When you pick an asset, chat keeps that context
4. Questions go through OpenRouter (or sample answers if no API key)
5. Responses include sources, a recommended action, and related equipment

## Data

Local demo ships with sample docs around pump P-102 (2021–2025), including a pressure mismatch between the manual and later reports.
