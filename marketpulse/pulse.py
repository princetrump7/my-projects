"""
Pulse scoring engine — flagship command.
Combines signals, sentiment, news, insider activity into one conclusive output.
"""

from __future__ import annotations

import logging

import yfinance as yf

from ai import generate as _ai_generate
from insider import get_insider_trades
from sentiment import analyze_ticker_sentiment
from signals import scan_signals

logger = logging.getLogger(__name__)


def _ticker_news(ticker: str) -> list[str]:
    try:
        titles = []
        for item in (yf.Ticker(ticker).news or [])[:12]:
            t = (item.get("content", {}).get("title") or item.get("title") or "")
            if t:
                titles.append(t.strip())
        return titles
    except Exception:
        return []


def pulse(ticker: str) -> str:
    price, change = 0.0, 0.0
    try:
        hist = yf.Ticker(ticker).history(period="5d")
        if hist is not None and len(hist) >= 2:
            price = float(hist["Close"].iloc[-1])
            prev = float(hist["Close"].iloc[-2])
            change = ((price - prev) / prev) * 100
    except Exception:
        pass

    headlines = _ticker_news(ticker)
    _, sentiment_text = analyze_ticker_sentiment(ticker, headlines, change)
    signals = scan_signals([ticker])
    insider_trades = get_insider_trades(limit=5)
    ticker_insiders = [t for t in (insider_trades or []) if t.get("ticker") == ticker]

    sig_block = "\n".join(f"- {s['label']}: {s['detail']}" for s in signals[:3]) if signals else "- None detected"
    insider_block = "\n".join(f"- {t['role']} {'bought' if t['type']=='BUY' else 'sold'} ${t['value']:,.0f}" for t in ticker_insiders[:3]) if ticker_insiders else "- No recent insider activity"
    news_block = "\n".join(f"- {h}" for h in headlines[:8]) if headlines else "- No recent news"

    prompt = f"""You are MarketPulse, a world-class market intelligence engine.
A trader is evaluating {ticker} (${price:.2f}, {change:+.2f}% today).

TECHNICAL SIGNALS:
{sig_block}

NEWS HEADLINES:
{news_block}

INSIDER ACTIVITY:
{insider_block}

SENTIMENT ANALYSIS:
{sentiment_text}

Generate a comprehensive pulse report in this EXACT HTML format:

<b>🧠 Market Pulse — {ticker}</b>

<b>Overall Score:</b> [0-100 score]
<b>Sentiment:</b> [Bullish/Bearish/Neutral]
<b>Momentum:</b> [Strong/Moderate/Weak]
<b>Institutional Activity:</b> [Positive/Negative/Neutral]
<b>News Impact:</b> [High/Medium/Low]

<b>AI Conclusion:</b>
[2-3 sentences on what it all means for a trader]

<b>Key Risks:</b>
• [risk 1]
• [risk 2]

<b>Action Zones:</b>
Buy Zone: [range]
Resistance: [level]
Stop Loss: [level]

Rules: under 180 words, bold tags, actionable language, no disclaimers."""

    try:
        return _ai_generate(prompt)
    except Exception as exc:
        logger.error("Pulse failed for %s: %s", ticker, exc)
        return f"⚠️ Pulse analysis unavailable for {ticker}."
