"""
Catalyst Detection — finds emerging themes and tickers from news before they hit mainstream.
"""

from __future__ import annotations

import logging

from ai import generate as _ai_generate
from news import get_news

logger = logging.getLogger(__name__)


def catalyst() -> str:
    headlines = get_news()
    if not headlines:
        return "No headlines to scan for catalysts."

    news_block = "\n".join(f"- {h}" for h in headlines[:25])

    prompt = f"""You are MarketPulse, a catalyst detection engine that finds emerging market themes BEFORE they hit mainstream.

SCAN THESE HEADLINES:
{news_block}

Identify 2-4 emerging catalysts. A catalyst is an event, trend, or theme that could move specific tickers.

For each catalyst, output in this EXACT format:

<b>🚨 Emerging Catalysts</b>

<b>1. [Ticker]</b>
Confidence: [0-100]%
[brief reason — one sentence]
Potential Impact: [Bullish/Bearish]

<b>2. [Ticker]</b>
...
[Add theme summary at the end]

<b>Market Theme:</b> [one-sentence on the broader theme connecting these]

Rules: under 160 words, bold tickers, only include tickers you're confident about."""

    try:
        return _ai_generate(prompt)
    except Exception as exc:
        logger.error("Catalyst scan failed: %s", exc)
        return "⚠️ Catalyst scan temporarily unavailable."
