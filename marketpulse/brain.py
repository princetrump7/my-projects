"""
MarketPulse brain — all AI prompts in one place.
Uses the unified provider layer (ai.py) — swap backends via env vars.
"""

from __future__ import annotations

import logging
from typing import Any

from ai import generate as _ai_generate

logger = logging.getLogger(__name__)


RETRY_LIMIT = 2


def _ask(prompt: str) -> str:
    for attempt in range(RETRY_LIMIT + 1):
        try:
            return _ai_generate(prompt)
        except Exception as exc:
            logger.warning("AI call attempt %d/%d failed: %s", attempt + 1, RETRY_LIMIT + 1, exc)
            if attempt < RETRY_LIMIT:
                import time
                time.sleep(1)
    logger.error("AI call failed after %d attempts", RETRY_LIMIT + 1)
    return "⚠️ AI analysis temporarily unavailable. Try again in a moment."


def why_did_it_move(ticker: str, change: float, headlines: list[str]) -> str:
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


def morning_brief(prices: dict[str, Any], headlines: list[str], sentiment: str) -> str:
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


def evening_recap(prices: dict[str, Any], headlines: list[str]) -> str:
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


def analyze_trending_tickers(tickers: list[tuple]) -> str:
    lines = "\n".join(f"- {t}: {c} mentions" for t, c in tickers[:10])
    return _ask(f"""You are MarketPulse. These tickers are trending on Reddit right now:

{lines}

For the top 3-5 tickers, give a one-line take on each — is this real momentum or just hype?

Format (HTML):
<b>AI Read on Trends</b>
- <b>TICKER</b> — [one sentence: driver + your read]

Each line under 15 words. Total under 80 words.""")


def format_insider_brief(trades: list[dict[str, Any]]) -> str:
    if not trades:
        return "No significant insider transactions found in recent filings."
    trade_lines = []
    for t in trades[:6]:
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


def explain_signals(signals: list[dict[str, Any]]) -> str:
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


def translate_screener_query(query: str) -> dict[str, Any]:
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


def format_smartmoney_brief(filings: list[dict[str, Any]]) -> str:
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


def bull_bear_arguments(ticker: str, price: float, change: float, headlines: list[str], insider_trades: list[dict[str, Any]], signals: list[dict[str, Any]]) -> str:
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


# ---------------------------------------------------------------------------
# v2.0 Flagship prompts
# ---------------------------------------------------------------------------


def format_pulse(ticker: str, score: int, sentiment: str, momentum: str,
                 inst_activity: str, news_impact: str, conclusion: str,
                 risks: list[str], buy_zone: str, resistance: str, stop: str) -> str:
    risk_lines = "\n".join(f"• {r}" for r in risks)
    return f"""<b>🧠 Market Pulse — {ticker}</b>

<b>Overall Score:</b> {score}/100
<b>Sentiment:</b> {sentiment}
<b>Momentum:</b> {momentum}
<b>Institutional Activity:</b> {inst_activity}
<b>News Impact:</b> {news_impact}

<b>AI Conclusion:</b>
{conclusion}

<b>Key Risks:</b>
{risk_lines}

<b>Action Zones:</b>
Buy Zone: {buy_zone}
Resistance: {resistance}
Stop Loss: {stop}"""


def format_radar(picks: list[dict[str, str]]) -> str:
    lines = ["<b>🛰️ Opportunity Radar</b>\n"]
    for p in picks:
        lines.append(f"<b>{p['ticker']}</b> — Conviction {p['confidence']}%")
        for factor in p.get("factors", []):
            lines.append(f"• {factor}")
        lines.append("")
    if picks:
        best = picks[0]
        lines.append(f"<b>AI Pick:</b> {best['ticker']} — strongest signal across combined factors.")
    return "\n".join(lines).strip()


def format_battle(ta: str, tb: str, growth_winner: str, val_winner: str,
                  inst_winner: str, mom_winner: str, overall: str, confidence: int,
                  take: str) -> str:
    return f"""<b>⚔️ Stock Battle</b>

<b>{ta}</b> vs <b>{tb}</b>

<b>Growth:</b> Winner → {growth_winner}
<b>Valuation:</b> Winner → {val_winner}
<b>Institutional:</b> Winner → {inst_winner}
<b>Momentum:</b> Winner → {mom_winner}

<b>🏆 Overall Winner: {overall}</b>
<b>Confidence: {confidence}%</b>

<b>AI Take:</b> {take}"""


# ---------------------------------------------------------------------------
# Insights formatting
# ---------------------------------------------------------------------------


def format_insights(
    regime: dict,
    top_confluence: list[dict],
    additional_signals: list[dict],
    catalysts: list[str],
    watchlist_items: list[dict],
    headlines: list[str],
    user_watchlist: list[str],
) -> str:
    """Format the structured insights data into a concise Telegram HTML report."""
    regime_line = f"<b>Regime:</b> {regime['regime']} | SPY: ${regime['spy_price']} ({regime['spy_change']:+.2f}%) | VIX: ${regime['vix']}"
    regime_read = regime.get("read", "")

    picks_block_lines = []
    for p in top_confluence:
        sources_str = ", ".join(p["sources"])
        picks_block_lines.append(
            f"- <b>{p['ticker']}</b> — {p['confluence']} sources ({sources_str}) | Action: {p['action']}"
        )
    picks_block = "\n".join(picks_block_lines) if picks_block_lines else "- No strong confluence signals today."

    extra_lines = []
    for s in additional_signals:
        sig_detail = (s["signals"][:2] if s["signals"] else [])
        sig_str = ", ".join(sig_detail) if sig_detail else s.get("detail", "Signal detected")
        extra_lines.append(f"- <b>{s['ticker']}</b> — {sig_str}")
    extra_block = "\n".join(extra_lines) if extra_lines else "- No standalone signals."

    wl_lines = []
    for w in watchlist_items:
        sigs_str = ", ".join(w["signals"][:2]) if w["signals"] else "No active signals"
        wl_lines.append(f"- <b>{w['ticker']}</b>: {'✅' if 'Buy' in w['action'] else '👀'} {sigs_str}")
    if not wl_lines:
        ticker_list = ", ".join(f"<code>{t}</code>" for t in user_watchlist[:10]) if user_watchlist else "empty"
        wl_lines.append(f"- Your watchlist ({ticker_list})")
    wl_block = "\n".join(wl_lines)

    catalyst_str = ", ".join(catalysts[:5]) if catalysts else "Check earnings calendar"

    prompt = f"""You are MarketPulse, a sharp market intelligence engine.
A trader just ran /insights — turn this structured data into ONE concise report.

MARKET REGIME:
{regime_line}
{regime_read}

TOP CONFLUENCE PICKS (tickers with 2+ signal sources):
{picks_block}

ADDITIONAL SIGNALS:
{extra_block}

CATALYSTS DETECTED: {catalyst_str}

WATCHLIST:
{wl_block}

Write a Telegram message in this EXACT HTML format — every section is REQUIRED:

<b>🧠 MarketPulse Insights</b>

<b>📊 Market Regime: {regime['regime']}</b>
SPY ${regime['spy_price']} ({regime['spy_change']:+.2f}%) | VIX {regime['vix']}
{regime_read}

<b>🥇 Top Confluence{" Pick" if len(top_confluence) >= 1 else ""}</b>
[1-2 lines explaining the strongest signal convergence, why it matters NOW, and the action]

<b>⚡ Signals In Play</b>
[One line per signal — ticker + what's happening + action]

<b>🔮 Catalyst Watch</b>
[1-2 lines on upcoming catalysts from headlines]

<b>📋 Your Watchlist</b>
[For each watchlist ticker with signals]

<b>💡 Bottom Line</b>
[ONE sentence — the single most important action today]

Rules:
- Under 250 words
- Only <b> bold tags, no other HTML
- Every section present even if brief
- Actionable language — tell them what to do
- No disclaimers, no fluff
- If no strong confluence: "No multi-source signals today — see Signals In Play"
- Bottom line must name a ticker, level, or trade direction"""

    return _ask(prompt)


# ---------------------------------------------------------------------------
# Hedge Fund prompts — replaces the informational tone with actionable calls
# ---------------------------------------------------------------------------


def hf_morning_brief(prices: dict[str, Any], headlines: list[str], sentiment: str,
                     top_picks: list[dict[str, Any]], portfolio: dict[str, Any]) -> str:
    """Hedge fund manager morning brief — specific calls with conviction."""
    price_lines = "\n".join(f"- {n}: ${i['price']:,.2f} ({i['change']:+.2f}%)" for n, i in prices.items())
    top_news = "\n".join(f"- {h}" for h in headlines[:5]) if headlines else "- No major headlines."
    pf_change = portfolio.get("avg_return", 0)
    picks_block = _format_picks_for_prompt(top_picks)
    return _ask(f"""You are MarketPulse HF, a disciplined hedge fund manager.

Current market prices:
{price_lines}

Top headlines:
{top_news}

Sentiment:
{sentiment}

Portfolio avg return today: {pf_change:+.2f}%

TOP CONVICTION CALLS TODAY:
{picks_block}

Generate a CONCISE morning brief in this EXACT HTML format (every section REQUIRED):

<b>🏛️ MarketPulse HF — Morning Brief</b>

<b>Fund Status:</b> [+{pf_change:.2f}% today | Pick a reasonable exposure split e.g. "70% long, 20% cash, 10% hedges"]
<b>Market Read:</b> [regime based on sentiment + prices — one sentence with conviction]

<b>Top Calls Today:</b>
[For each of the top 2-3 picks:]
• <b>TICKER</b> — [Strong Buy/Buy/Hold/Avoid/Short] (conviction X/10)
  Entry: $[X] | Target: $[X] | Stop: $[X] | R:R [X:1]
  Thesis: [one sentence]

<b>Risk Overlay:</b> [one specific risk to hedge or level to watch]
<b>Move of the Day:</b> [single highest-conviction action to take — name a ticker and direction]

Rules: under 200 words, <b> bold tags only, every section present, no disclaimers, no fluff, specific numbers.""")


def hf_evening_recap(prices: dict[str, Any], headlines: list[str],
                     portfolio: dict[str, Any], signals: list[dict[str, Any]]) -> str:
    """Hedge fund manager evening recap — P&L, closed trades, tomorrow's watch."""
    price_lines = "\n".join(f"- {n}: ${i['price']:,.2f} ({i['change']:+.2f}%)" for n, i in prices.items())
    top_news = "\n".join(f"- {h}" for h in headlines[:5]) if headlines else "- No major headlines."
    pf_change = portfolio.get("avg_return", 0)
    win_rate = portfolio.get("win_rate", 0)
    best = portfolio.get("best", {})
    worst = portfolio.get("worst", {})
    best_str = f"{best['ticker']} ({best['change']:+.2f}%)" if best else "N/A"
    worst_str = f"{worst['ticker']} ({worst['change']:+.2f}%)" if worst else "N/A"

    sig_lines = "\n".join(f"- {s['ticker']}: {s['label']}" for s in signals[:5]) if signals else "- No new signals."

    return _ask(f"""You are MarketPulse HF, a disciplined hedge fund manager reviewing the day.

CLOSES:
{price_lines}

TOP NEWS:
{top_news}

PORTFOLIO: +{pf_change:.2f}% today | Win rate: {win_rate}%
Best performer: {best_str}
Worst performer: {worst_str}

SIGNALS IN PLAY:
{sig_lines}

Generate a CONCISE evening recap in this EXACT HTML format:

<b>🏛️ MarketPulse HF — Evening Recap</b>

<b>Portfolio vs Market:</b> +{pf_change:.2f}% | SPY [match to prices] | Win rate: {win_rate}%
<b>Best: {best_str}</b> | <b>Worst: {worst_str}</b>

<b>What Mattered Today:</b> [2 sentences on the key event that drove the fund]
<b>Ideas Closed:</b> [any calls that hit target or stop today — "TICKER hit target at $X (+Y%)" or "TICKER stopped at $X (-Y%)"]
<b>Carry Over:</b> [1 setup that's still alive and worth watching into tomorrow]

<b>Pre-Market Watch:</b>
• [catalyst or event to check before open]
• [key level or data point]
• [one ticket to watch]

<b>Bottom Line:</b> [ONE sentence — what to do with the portfolio tomorrow]

Rules: under 180 words, <b> bold tags only, every section present, direct tone, no disclaimers.""")


def hf_conviction_summary(picks: list[dict[str, Any]]) -> str:
    """Format top conviction picks into a clean rank-ordered Telegram message."""
    picks_block = _format_picks_for_prompt(picks)
    return _ask(f"""You are MarketPulse HF, a disciplined hedge fund manager.

HIGHEST CONVICTION CALLS RIGHT NOW:
{picks_block}

Generate a rank-ordered conviction list in this EXACT HTML format:

<b>🏛️ Top Conviction Ideas</b>

[For each pick, ranked by conviction:]
<b>1. TICKER</b> — [Strong Buy/Buy/Watch/Avoid/Short] (score X/10)
Entry: $[X] | Target: $[X] | Stop: $[X] | R:R [X:1]
Thesis: [one sentence]

[No intro paragraph, no outro — just the list and:]
<b>Highest Conviction:</b> [name the #1 pick and say why it stands above the rest in one sentence]

Rules: under 120 words, <b> bold tags only, ranked by conviction descending, include entry/target/stop for each, one bottom line.""")


def _format_picks_for_prompt(picks: list[dict[str, Any]]) -> str:
    """Build a raw text block of picks for prompt injection."""
    lines = []
    for p in picks[:5]:
        t = p.get("ticker", "?")
        s = p.get("score", 0)
        lab = p.get("action", "Hold")
        entry = p.get("entry", 0)
        target = p.get("target", 0)
        stop = p.get("stop", 0)
        rr = p.get("rr", "N/A")
        change = p.get("change", 0)
        sigs = ", ".join(p.get("signal_types", [])) or "none"
        lines.append(f"- {t}: score {s}/10 ({lab}) | ${entry:.2f}→${target:.2f} stop ${stop:.2f} R:R {rr} | change {change:+.2f}% | signals: {sigs}")
    return "\n".join(lines)
