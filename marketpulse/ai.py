"""
Unified AI provider layer — OpenRouter primary, Gemini fallback.
No CLI agent fallback (opencode run is a coding agent, not a text generator).
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
    if os.getenv("GOOGLE_API_KEY"):
        return "gemini"
    return "none"


def _resolve_model() -> str:
    p = current_provider()
    if p == "gemini":
        return os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    return os.getenv("OPENROUTER_MODEL", "google/gemma-4-26b-a4b-it:free")


def _generate_openrouter(prompt: str) -> str | None:
    key = os.getenv("OPENROUTER_API_KEY")
    if not key:
        return None
    url = f"{os.getenv('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1').rstrip('/')}/chat/completions"
    payload = {
        "model": _resolve_model(),
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": int(os.getenv("AI_MAX_TOKENS", "1024")),
        "temperature": 0.3,
    }
    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "HTTP-Referer": os.getenv("OPENROUTER_SITE_URL", "https://marketpulse.local"),
        "X-Title": os.getenv("OPENROUTER_SITE_NAME", "MarketPulse"),
    }
    for attempt in range(3):
        try:
            resp = requests.post(url, headers=headers, json=payload, timeout=60)
            if resp.status_code == 429:
                logger.warning("OpenRouter 429 (attempt %d/3)", attempt + 1)
                if attempt < 2:
                    time.sleep(5)
                    continue
                return None
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"].strip()
        except requests.exceptions.Timeout:
            logger.warning("OpenRouter timeout (attempt %d/3)", attempt + 1)
            if attempt < 2:
                time.sleep(3)
                continue
            return None
        except requests.exceptions.RequestException as exc:
            logger.error("OpenRouter error: %s", exc)
            if attempt < 2:
                time.sleep(3)
                continue
            return None
    return None


def _generate_gemini(prompt: str) -> str | None:
    key = os.getenv("GOOGLE_API_KEY")
    if not key:
        return None
    try:
        from google import genai
        client = genai.Client(api_key=key)
        model = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
        resp = client.models.generate_content(model=model, contents=prompt)
        if resp and resp.text:
            return resp.text.strip()
        return None
    except Exception as exc:
        logger.warning("Gemini error: %s", exc)
        return None


def generate(prompt: str) -> str:
    p = current_provider()
    if p == "none":
        return "⚠️ No AI provider configured."

    logger.info("AI provider: %s (model: %s)", p, _resolve_model())

    if p == "openrouter":
        result = _generate_openrouter(prompt)
        if result:
            return result
        logger.warning("OpenRouter failed, trying Gemini...")
        result = _generate_gemini(prompt)
        if result:
            return result
        return "⚠️ AI is busy right now. Try again in a minute."

    result = _generate_gemini(prompt)
    if result:
        return result
    return "⚠️ AI analysis temporarily unavailable."
