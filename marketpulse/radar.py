"""
Opportunity Radar — multi-factor scanner.
Scores tickers on volume, insider activity, Reddit buzz, and technical signals.
"""

from __future__ import annotations

import logging

from ai import generate as _ai_generate
from insider import get_insider_trades
from reddit import get_trending_tickers
from signals import DEFAULT_UNIVERSE, scan_signals

logger = logging.getLogger(__name__)


def _build_radar() -> list[dict]:
    signals = scan_signals(DEFAULT_UNIVERSE)
    insiders = get_insider_trades(limit=10) or []
    reddit = dict(get_trending_tickers(min_mentions=2))

    ticker_scores: dict[str, dict] = {}
    for s in signals[:20]:
        t = s["ticker"]
        if t not in ticker_scores:
            ticker_scores[t] = {"ticker": t, "factors": [], "confidence": 0}
        ticker_scores[t]["factors"].append(s["label"])
        ticker_scores[t]["confidence"] = max(ticker_scores[t]["confidence"], s.get("confidence", 50))

    for ins in insiders:
        t = ins["ticker"]
        if t not in ticker_scores:
            ticker_scores[t] = {"ticker": t, "factors": [], "confidence": 50}
        ticker_scores[t]["factors"].append(f"Insider {'BUY' if ins['type'] == 'BUY' else 'SELL'}: ${ins['value']:,.0f}")

    for t, c in reddit.items():
        if t not in ticker_scores:
            ticker_scores[t] = {"ticker": t, "factors": [], "confidence": 40}
        ticker_scores[t]["factors"].append(f"Reddit mentions: {c}")
        ticker_scores[t]["confidence"] = min(95, ticker_scores[t]["confidence"] + 10)

    results = [v for v in ticker_scores.values() if len(v["factors"]) >= 2 or v["confidence"] >= 70]
    results.sort(key=lambda x: (-len(x["factors"]), -x["confidence"]))
    return results[:8]


def radar() -> str:
    try:
        picks = _build_radar()
    except Exception as exc:
        logger.error("Radar build failed: %s", exc)
        return "⚠️ Radar scan failed."

    if not picks:
        return "No high-conviction opportunities right now."

    lines = []
    for p in picks:
        factors = "\n  • ".join(p["factors"])
        lines.append(f"<b>{p['ticker']}</b> (conviction {p['confidence']}%)\n  • {factors}")

    picks_block = "\n\n".join(lines)

    prompt = f"""You are MarketPulse. Present these radar picks to a trader looking for opportunities.

RADAR PICKS:
{picks_block}

Format in this EXACT HTML:

<b>🛰️ Opportunity Radar</b>

[For each ticker:]
<b>TICKER</b> — [Conviction X%]
[2 factors listed as bullet points]

<b>AI Pick:</b> [for the highest-conviction pick, say in one sentence why it stands out]

Rules: under 150 words, bold tickers, one AI pick at the end."""

    try:
        ai_take = _ai_generate(prompt)
        return ai_take
    except Exception as exc:
        logger.error("Radar AI failed: %s", exc)
        fallback = "<b>🛰️ Opportunity Radar</b>\n\n" + picks_block + "\n\n<b>AI Pick:</b> Top signal based on combined technical + insider + social factors."
        return fallback
