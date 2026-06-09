"""
AI sentiment analysis engine using the unified AI provider layer.
"""

from __future__ import annotations

import logging
from typing import Dict, List, Tuple

from ai import generate as _ai_generate

logger = logging.getLogger(__name__)


def analyze_sentiment(news_list: List[str]) -> str:
    if not news_list:
        return "No headlines to analyze."
    headlines_text = "\n".join(f"- {h}" for h in news_list)
    prompt = f"""You are MarketPulse, a professional market intelligence engine.

Analyze the following financial news headlines and output a concise structured report in this exact plain text format:
Overall sentiment: bullish / bearish / neutral
Affected assets: comma-separated assets
Early trend signal: yes / no
Confidence: 0-100
Why it matters: one sentence focused on trader pain, risk, or opportunity
Watch next: one concrete event, level, or data point to monitor

Headlines:
{headlines_text}
"""
    try:
        return _ai_generate(prompt)
    except Exception as exc:
        logger.error("Sentiment analysis failed: %s", exc)
        return "Sentiment analysis failed due to an error."


def analyze_ticker_sentiment(ticker: str, headlines: List[str], price_change: float = 0.0) -> Tuple[Dict[str, float], str]:
    news_block = "\n".join(f"- {h}" for h in headlines[:12]) if headlines else "- No recent news."
    price_ctx = f"{price_change:+.2f}%" if price_change else "N/A"
    prompt = f"""You are MarketPulse, a sharp market sentiment analyst.

Analyze the sentiment for <b>{ticker}</b> (price change: {price_ctx}) based on these headlines:

{news_block}

Output in this EXACT plain text format (no markdown):
Ticker: {ticker}
Overall sentiment: bullish / bearish / neutral
Score: 0-100 (where 50 is neutral, >50 bullish, <50 bearish)
Bullish signals: list the bullish factors
Bearish signals: list the bearish factors
Key driver: one sentence on what's moving this ticker
Watch: one specific level, event, or catalyst
"""
    try:
        text = _ai_generate(prompt)
        score = 50.0
        for line in text.lower().split("\n"):
            if "score:" in line:
                try:
                    score = float(line.split(":")[1].strip())
                    score = max(0.0, min(100.0, score))
                except (ValueError, IndexError):
                    pass
                break
        st = text.lower()
        if "bullish" in st and "bearish" not in (st.split("sentiment:")[-1][:20] if "sentiment:" in st else ""):
            bc, bbc = score / 100.0, (100 - score) / 200.0
        elif "bearish" in st:
            bbc, bc = (score / 100.0 if score > 50 else (100 - score) / 100.0), (100 - score) / 200.0
        else:
            bc = bbc = 0.3
        scores = {"bullish": round(bc, 2), "bearish": round(bbc, 2), "neutral": round(max(0.0, 1.0 - bc - bbc), 2), "score": score}
        return scores, text
    except Exception as exc:
        logger.error("Ticker sentiment failed for %s: %s", ticker, exc)
        return {"bullish": 0.0, "bearish": 0.0, "neutral": 1.0, "score": 50.0}, "⚠️ Sentiment analysis unavailable."
