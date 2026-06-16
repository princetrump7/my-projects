"""
Whale Activity — combines 13F filings + insider trades with AI interpretation.
Tracks Berkshire, ARK, Soros, Druckenmiller, Pershing Square, Renaissance.
"""

from __future__ import annotations

import logging

from ai import generate as _ai_generate
from insider import get_insider_trades
from smartmoney import get_recent_13f

logger = logging.getLogger(__name__)


def whales() -> str:
    filings = get_recent_13f(days_back=90) or []
    trades = get_insider_trades(limit=8) or []

    filing_lines = []
    for f in filings[:5]:
        filing_lines.append(f"- {f['investor']} filed {f['form']} on {f['date']}")

    trade_lines = []
    for t in trades[:6]:
        direction = "🟢 Bought" if t["type"] == "BUY" else "🔴 Sold"
        trade_lines.append(f"- {direction} {t['ticker']}: {t['owner']} ({t['role']}), ${t['value']:,.0f} @ ${t['price']:.2f}")

    filing_block = "\n".join(filing_lines) if filing_lines else "No recent 13F filings."
    trade_block = "\n".join(trade_lines) if trade_lines else "No recent insider trades."

    prompt = f"""You are MarketPulse, a whale-tracking intelligence engine.

RECENT INSTITUTIONAL FILINGS (13F):
{filing_block}

RECENT INSIDER TRADES:
{trade_block}

Format a concise whale activity report in this EXACT HTML:

<b>🐋 Whale Activity</b>

[For each notable item:]
<b>[Fund/Person]</b>: [What they did + why it matters in one sentence]

Then add:
<b>AI Take:</b> [1-2 sentences on the overall signal from whale activity]
<b>Watch:</b> [one ticker or sector whales are converging on]

Rules: under 160 words, bold fund names, actionable takeaway."""

    try:
        return _ai_generate(prompt)
    except Exception as exc:
        logger.error("Whales AI failed: %s", exc)
        fallback_lines = ["<b>🐋 Whale Activity</b>\n"]
        for f in filings[:4]:
            fallback_lines.append(f"<b>{f['investor']}</b>: Filed {f['form']} on {f['date']}")
        for t in trades[:4]:
            direction = "🟢 Bought" if t["type"] == "BUY" else "🔴 Sold"
            fallback_lines.append(f"<b>{t['ticker']}</b>: {direction} ${t['value']:,.0f} by {t['owner']}")
        fallback_lines.append("\n<b>AI Take:</b> Combining insider and institutional signals for a complete picture.")
        return "\n".join(fallback_lines)
