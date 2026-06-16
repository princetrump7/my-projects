"""
Market Narrative Engine — turns raw market data into a daily story.
"""

from __future__ import annotations

import logging

from ai import generate as _ai_generate
from market import get_prices
from news import get_news
from sentiment import analyze_sentiment

logger = logging.getLogger(__name__)


def story() -> str:
    try:
        prices = get_prices()
        headlines = get_news()
        sentiment_text = analyze_sentiment(headlines) if headlines else "No news."
    except Exception as exc:
        logger.error("Story data fetch failed: %s", exc)
        return "⚠️ Could not gather market data for today's story."

    price_lines = "\n".join(f"- {n}: ${i['price']:,.2f} ({i['change']:+.2f}%)" for n, i in prices.items())
    news_lines = "\n".join(f"- {h}" for h in headlines[:8])

    prompt = f"""You are MarketPulse, a market storyteller. Turn this data into a compelling narrative that traders will remember.

TODAY'S PRICES:
{price_lines}

TOP HEADLINES:
{news_lines}

SENTIMENT:
{sentiment_text}

Write in this EXACT HTML format:

<b>📖 Today's Market Story</b>

<b>Narrative:</b>
[2-3 sentences on the single story driving markets today]

<b>Winners:</b> [tickers benefiting]
<b>Losers:</b> [tickers being left behind]

<b>Why It Matters:</b>
[1 sentence on what this means for the week ahead]

Rules: under 130 words, no disclaimers, traders are busy people who want the big picture."""

    try:
        return _ai_generate(prompt)
    except Exception as exc:
        logger.error("Story AI failed: %s", exc)
        return f"<b>📖 Today's Market Story</b>\n\n<b>Narrative:</b> Market data could not be synthesized into a story right now.\n\n<b>Why It Matters:</b> Check back during market hours for live narrative."
