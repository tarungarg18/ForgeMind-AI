"""OpenRouter LLM client — OpenAI-compatible API."""

from __future__ import annotations

import json
from typing import Any, Optional

from openai import AsyncOpenAI

from app.config import get_settings


def get_openrouter_client() -> Optional[AsyncOpenAI]:
    settings = get_settings()
    if not settings.openrouter_api_key or settings.force_demo_llm:
        return None
    return AsyncOpenAI(
        api_key=settings.openrouter_api_key,
        base_url=settings.openrouter_base_url,
        default_headers={
            "HTTP-Referer": settings.openrouter_site_url,
            "X-Title": settings.openrouter_app_name,
        },
    )


async def chat_completion(
    messages: list[dict[str, Any]],
    *,
    model: Optional[str] = None,
    temperature: float = 0.2,
    response_json: bool = False,
) -> str:
    """Call OpenRouter. Raises if no client and caller must handle fallback."""
    settings = get_settings()
    client = get_openrouter_client()
    if client is None:
        raise RuntimeError("OpenRouter not configured")

    kwargs: dict[str, Any] = {
        "model": model or settings.openrouter_model,
        "messages": messages,
        "temperature": temperature,
    }
    if response_json:
        kwargs["response_format"] = {"type": "json_object"}

    resp = await client.chat.completions.create(**kwargs)
    return resp.choices[0].message.content or ""


async def chat_json(
    messages: list[dict[str, Any]],
    *,
    model: Optional[str] = None,
) -> dict[str, Any]:
    text = await chat_completion(messages, model=model, response_json=True)
    return json.loads(text)
