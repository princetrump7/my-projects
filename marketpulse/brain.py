"""
MarketPulse brain — all Gemini prompts live here.
One place to tune AI behaviour for every feature.
"""

from __future__ import annotations

import logging
import os
from typing import Any, Dict, List

from google import genai

logger = logging.getLogger(__name__)

_client = None


def _get_client() -> genai.Client:
    """Lazy-init the Gemini client once."""
    global _client
    if _client is None:
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise RuntimeError("GOOGLE_API_KEY not set")
        _client = genai.Client(api_key=api_key)
    return _client


def _ask(prompt: str) -> str:
    """Single entry-point for all Gemini calls with error handling."""
    try:
        resp = _get_client().models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        return resp.text.strip() if resp.text else "AI analysis unavailable."
    except Exception as exc:
        logger.error("Gemini call failed: %s", exc)
        return "⚠️ AI analysis temporarily unavailable."


# ---------------------------------------------------------------------------
# Feature prompts
# ---------------------------------------------------------------------------

def why_did_it_move(ticker: str, change: float, headlines: List[str]) -> str:
    """Explain why a specific stock moved today."""
    news_block = (
        "\n".join(f"- {h}" for h in headlines[:8])
        if headlines else "- No specific news found."
    )
    return _ask(f"""You are MarketPulse, a sharp market intelligence engine.

A trader asked: "Why did {ticker} move today?"
Price change today: {change:+.2f}%

Recent headlines for {ticker}:
{news_block}

Reply in this exact Telegram-friendly format using HTML bold tags:
<b>Why Did {ticker} Move?</b>

<b>{change:+.2f}% today because:</b>
- [Most important reason]
- [Second reason]
- [Third reason if relevant]

Watch next: [one specific catalyst or level to monitor]

Rules: under 150 words, direct, no fluff, no disclaimers.""")


def morning_brief(prices: Dict[str, Any], headlines: List[str], sentiment: str) -> str:
    """Generate the morning alpha brief."""
    price_lines = "\n".join(
        f"- {n}: ${i['price']:,.2f} ({i['change']:+.2f}%)"
        for n, i in prices.items()
    )
    top_news = "\n".join(f"- {h}" for h in headlines[:5])
    return _ask(f"""You are MarketPulse. Generate a punchy morning alpha brief.

PRICES:
{price_lines}

TOP HEADLINES:
{top_news}

SENTIMENT:
{sentiment}

Use this EXACT HTML format:
<b>Morning Alpha Brief</b>

- <b>Mood:</b> [bullish/bearish/mixed + one sentence why]
- <b>Top mover:</b> [ticker + change + one reason]
- <b>Key risk:</b> [one specific risk to watch]
- <b>Opportunity:</b> [one setup or event]
- <b>Watch:</b> [one data point or level today]

Under 120 words. Traders are busy.""")


def evening_recap(prices: Dict[str, Any], headlines: List[str]) -> str:
    """Generate the end-of-day recap."""
    price_lines = "\n".join(
        f"- {n}: ${i['price']:,.2f} ({i['change']:+.2f}%)"
        for n, i in prices.items()
    )
    top_news = "\n".join(f"- {h}" for h in headlines[:5])
    return _ask(f"""You are MarketPulse. Generate a brief end-of-day recap.

TODAY'S CLOSES:
{price_lines}

TOP HEADLINES:
{top_news}

Use this EXACT HTML format:
<b>Evening Recap</b>

<b>Today:</b> [2 sentences on what mattered]
<b>Tomorrow:</b> [2 key things to watch pre-market]
<b>Edge:</b> [one non-obvious insight]

Under 100 words. Direct.""")


def analyze_trending_tickers(tickers: List[tuple]) -> str:
    """Give a quick AI read on trending social tickers."""
    lines = "\n".join(f"- {t}: {c} mentions" for t, c in tickers[:10])
    return _ask(f"""You are MarketPulse. These tickers are trending on Reddit right now:

{lines}

For the top 3-5 tickers, give a one-line take on each — is this real momentum or just hype?

Format (HTML):
<b>AI Read on Trends</b>
- <b>TICKER</b> — [one sentence: driver + your read]

Each line under 15 words. Total under 80 words.""")


def format_insider_brief(trades: List[Dict[str, Any]]) -> str:
    """Format a list of SEC insider trades into a punchy Telegram alert."""
    if not trades:
        return "No significant insider transactions found in recent filings."

    trade_lines = []
    for t in trades[:6]:
        sign = "+" if t["type"] == "BUY" else "-"
        trade_lines.append(
            f"- {t['ticker']} ({t['company']}): {t['role']} {t['type']} "
            f"{t['shares']:,} shares @ ${t['price']:.2f} = ${t['value']:,.0f}"
        )
    block = "\n".join(trade_lines)

    return _ask(f"""You are MarketPulse. Format these recent SEC insider trades for Telegram traders.

RAW TRADES:
{block}

Output in this EXACT HTML format:
<b>Insider Activity Alert</b>

For each trade:
- <b>TICKER</b> [BUY/SELL]: [insider role] [action summary] — [one-sentence market read]

Then add:
<b>Key Takeaway:</b> [1 sentence on what this insider activity signals overall]

Rules: bold tickers, under 150 words total, flag buys as potentially bullish.""")


def explain_signals(signals: List[Dict[str, Any]]) -> str:
    """Produce an AI swing trade brief from a list of detected signals."""
    if not signals:
        return "No high-confidence signals detected in the current scan."

    sig_lines = "\n".join(
        f"- {s['ticker']}: {s['label']} | {s['detail']} | price ${s['price']:.2f} | confidence {s['confidence']}%"
        for s in signals[:6]
    )

    return _ask(f"""You are MarketPulse, a swing trade signal engine.

DETECTED SIGNALS:
{sig_lines}

For each signal, write a concise trader-grade alert in this HTML format:
<b>Swing Signals</b>

- <b>TICKER</b> [Signal Type]: [what it means + entry zone or level to watch] — Risk: [Low/Med/High]

Then:
<b>Best Setup:</b> [pick the single strongest setup and say why in one sentence]

Rules: under 160 words, actionable language, no fluff.""")


def translate_screener_query(query: str) -> Dict[str, Any]:
    """Translate a natural language query into JSON filter criteria."""
    import json
    prompt = f"""You are MarketPulse. A user wants to screen stocks.
User query: "{query}"

Convert this into a JSON object with the following optional keys:
"min_market_cap" (number in billions, e.g., 200 for 200B)
"max_market_cap" (number in billions)
"min_pe" (number)
"max_pe" (number)
"sector" (string, e.g. "Technology", "Healthcare")
"min_volume" (number in millions, e.g. 5 for 5M)

Output ONLY valid JSON. Nothing else. If a parameter isn't mentioned, omit it.
"""
    response_text = _ask(prompt)
    try:
        # Strip out markdown formatting if Gemini adds it
        cleaned = response_text.replace("```json", "").replace("```", "").strip()
        return json.loads(cleaned)
    except Exception as exc:
        logger.error("Failed to parse Gemini screener JSON: %s (Raw: %s)", exc, response_text)
        return {}


def format_smartmoney_brief(filings: List[Dict[str, Any]]) -> str:
    """Format a list of 13F/smart money filings into a Telegram alert."""
    if not filings:
        return "No recent major smart money (13F) filings detected."

    lines = "\n".join(
        f"- {f['investor']} filed {f['form']} on {f['date']} (URL: {f['url']})"
        for f in filings[:5]
    )

    return _ask(f"""You are MarketPulse. Format these recent SEC 13F/institutional filings for Telegram traders.

RAW FILINGS:
{lines}

Output in this EXACT HTML format:
<b>Smart Money Radar</b>

For each filing:
- <b>INVESTOR</b>: [Briefly explain who they are and why traders watch their 13F filings]

Rules: under 120 words total, direct, no fluff. Provide context on the investor.""")

