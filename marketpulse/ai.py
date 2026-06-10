"""
Unified AI provider layer — supports Gemini, OpenRouter, and OpenCode.
Auto-selects based on env vars: OpenRouter > OpenCode > Gemini (default).
Includes retry with backoff for rate limits.
"""

from __future__ import annotations

import logging
import os
import time

import requests

logger = logging.getLogger(__name__)


def current_provider() -> str:
    if os.getenv("OPENROUTER_API_KEY"):
        return "openrouter"
    if os.getenv("OPENCODE_API_KEY") and os.getenv("OPENCODE_BASE_URL"):
        return "opencode"
    return "gemini"


def _resolve_model() -> str:
    p = current_provider()
    if p == "openrouter":
        return os.getenv("OPENROUTER_MODEL", "google/gemma-4-26b-a4b-it:free")
    if p == "opencode":
        return os.getenv("OPENCODE_MODEL", "gpt-3.5-turbo")
    return os.getenv("GEMINI_MODEL", "gemini-2.5-flash")


_client = None


def _gemini_client():
    global _client
    if _client is None:
        from google import genai
        key = os.getenv("GOOGLE_API_KEY")
        if not key:
            raise RuntimeError("GOOGLE_API_KEY not set")
        _client = genai.Client(api_key=key)
    return _client


def _generate_gemini(prompt: str) -> str:
    resp = _gemini_client().models.generate_content(
        model=_resolve_model(), contents=prompt
    )
    return resp.text.strip() if resp.text else "No response."


def _openai_url() -> str:
    p = current_provider()
    if p == "openrouter":
        return os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
    return os.getenv("OPENCODE_BASE_URL", "http://localhost:1337/v1")


def _openai_headers() -> dict:
    p = current_provider()
    key = os.getenv("OPENROUTER_API_KEY") if p == "openrouter" else os.getenv("OPENCODE_API_KEY", "")
    h = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    if p == "openrouter":
        h["HTTP-Referer"] = os.getenv("OPENROUTER_SITE_URL", "https://marketpulse.local")
        h["X-Title"] = os.getenv("OPENROUTER_SITE_NAME", "MarketPulse")
    return h


def _generate_openai(prompt: str, retries: int = 3) -> str:
    url = f"{_openai_url().rstrip('/')}/chat/completions"
    payload = {
        "model": _resolve_model(),
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": int(os.getenv("AI_MAX_TOKENS", "1024")),
        "temperature": 0.3,
    }
    for attempt in range(retries):
        try:
            resp = requests.post(url, headers=_openai_headers(), json=payload, timeout=30)
            if resp.status_code == 429 and attempt < retries - 1:
                wait = 2 ** attempt
                logger.warning("Rate limited (429), retrying in %ds...", wait)
                time.sleep(wait)
                continue
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 429 and attempt < retries - 1:
                wait = 2 ** attempt
                logger.warning("Rate limited, retrying in %ds...", wait)
                time.sleep(wait)
                continue
            raise
    raise RuntimeError("Max retries exceeded")


def generate(prompt: str) -> str:
    """Send a prompt to the configured AI provider and return the response."""
    p = current_provider()
    logger.info("AI provider: %s (model: %s)", p, _resolve_model())
    if p in ("openrouter", "opencode"):
        return _generate_openai(prompt)
    return _generate_gemini(prompt)
