"""
MarketPulse brain — all AI prompts in one place.
Uses the unified provider layer (ai.py) — swap backends via env vars.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List

from ai import generate as _ai_generate

logger = logging.getLogger(__name__)


def _ask(prompt: str) -> str:
    try:
        return _ai_generate(prompt)
    except Exception as exc:
        logger.error("AI call failed: %s", exc)
        return "⚠️ AI analysis temporarily unavailable."


def why_did_it_move(ticker: str, change: float, headlines: List[str]) -> str:
    news_block = "\n".join(f"- {h}" for h in headlines[:8]) if headlines else "- No specific news found."
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
    price_lines = "\n".join(f"- {n}: ${i['price']:,.2f} ({i['change']:+.2f}%)" for n, i in prices.items())
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
    price_lines = "\n".join(f"- {n}: ${i['price']:,.2f} ({i['change']:+.2f}%)" for n, i in prices.items())
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
    lines = "\n".join(f"- {t}: {c} mentions" for t, c in tickers[:10])
    return _ask(f"""You are MarketPulse. These tickers are trending on Reddit right now:

{lines}

For the top 3-5 tickers, give a one-line take on each — is this real momentum or just hype?

Format (HTML):
<b>AI Read on Trends</b>
- <b>TICKER</b> — [one sentence: driver + your read]

Each line under 15 words. Total under 80 words.""")


def format_insider_brief(trades: List[Dict[str, Any]]) -> str:
    if not trades:
        return "No significant insider transactions found in recent filings."
    trade_lines = []
    for t in trades[:6]:
        sign = "+" if t["type"] == "BUY" else "-"
        trade_lines.append(f"- {t['ticker']} ({t['company']}): {t['role']} {t['type']} {t['shares']:,} shares @ ${t['price']:.2f} = ${t['value']:,.0f}")
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
    if not signals:
        return "No high-confidence signals detected in the current scan."
    sig_lines = "\n".join(f"- {s['ticker']}: {s['label']} | {s['detail']} | price ${s['price']:.2f} | confidence {s['confidence']}%" for s in signals[:6])
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
        cleaned = response_text.replace("```json", "").replace("```", "").strip()
        return json.loads(cleaned)
    except Exception as exc:
        logger.error("Failed to parse screener JSON: %s (Raw: %s)", exc, response_text)
        return {}


def format_smartmoney_brief(filings: List[Dict[str, Any]]) -> str:
    if not filings:
        return "No recent major smart money (13F) filings detected."
    lines = "\n".join(f"- {f['investor']} filed {f['form']} on {f['date']} (URL: {f['url']})" for f in filings[:5])
    return _ask(f"""You are MarketPulse. Format these recent SEC 13F/institutional filings for Telegram traders.

RAW FILINGS:
{lines}

Output in this EXACT HTML format:
<b>Smart Money Radar</b>

For each filing:
- <b>INVESTOR</b>: [Briefly explain who they are and why traders watch their 13F filings]

Rules: under 120 words total, direct, no fluff. Provide context on the investor.""")


def bull_bear_arguments(ticker: str, price: float, change: float, headlines: List[str], insider_trades: List[Dict[str, Any]], signals: List[Dict[str, Any]]) -> str:
    news_block = "\n".join(f"- {h}" for h in headlines[:8]) if headlines else "- No recent news."
    insider_block = "\n".join(f"- {t['ticker']}: {t['role']} {'bought' if t['type']=='BUY' else 'sold'} ${t['value']:,.0f} worth" for t in insider_trades[:3]) if insider_trades else "- No recent insider activity."
    signal_map = {}
    for s in signals[:5]:
        signal_map.setdefault(s["ticker"], []).append(s["label"])
    signal_block = "\n".join(f"- {t}: {', '.join(labels)}" for t, labels in signal_map.items()) if signal_map else "- No signals detected."
    return _ask(f"""You are MarketPulse, a balanced market analyst. Present both sides of the trade.

A trader is evaluating {ticker} (${price:.2f}, {change:+.2f}% today).

RECENT NEWS:
{news_block}

INSIDER ACTIVITY:
{insider_block}

TECHNICAL SIGNALS:
{signal_block}

Format a balanced bull vs bear summary in this EXACT format:

<b>Bull vs Bear — {ticker}</b>

<b>🐂 Bull Case</b>
- [reason 1 — tie to news/signal/insider]
- [reason 2]
- [reason 3]

<b>🐻 Bear Case</b>
- [reason 1]
- [reason 2]
- [reason 3]

<b>Edge:</b> [1-sentence verdict based on weight of evidence]

Rules: under 140 words, balanced, evidence-based.""")
