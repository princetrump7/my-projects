"""
Stock Battle — head-to-head comparison designed to be screenshotted and shared.
"""

from __future__ import annotations

import logging

import yfinance as yf

from ai import generate as _ai_generate
from insider import get_insider_trades
from signals import scan_signals

logger = logging.getLogger(__name__)


def _ticker_profile(ticker: str) -> dict:
    result = {"price": 0.0, "change": 0.0, "signals": [], "insider": "", "pe": "N/A", "eps_growth": "N/A", "volume": 0}
    try:
        t = yf.Ticker(ticker)
        info = t.info or {}
        hist = t.history(period="5d")
        if hist is not None and len(hist) >= 2:
            result["price"] = float(hist["Close"].iloc[-1])
            prev = float(hist["Close"].iloc[-2])
            result["change"] = ((result["price"] - prev) / prev) * 100
            result["volume"] = int(hist["Volume"].iloc[-1])
        pe = info.get("trailingPE") or info.get("forwardPE")
        if pe:
            result["pe"] = f"{float(pe):.1f}"
        eg = info.get("earningsGrowth") or info.get("revenueGrowth")
        if eg:
            result["eps_growth"] = f"{float(eg) * 100:+.1f}%"
    except Exception:
        pass

    sigs = scan_signals([ticker])
    result["signals"] = [s["label"] for s in sigs[:3]]

    trades = get_insider_trades(limit=5) or []
    ticker_insiders = [t for t in trades if t.get("ticker") == ticker]
    if ticker_insiders:
        total_buys = sum(t["value"] for t in ticker_insiders if t["type"] == "BUY")
        total_sells = sum(t["value"] for t in ticker_insiders if t["type"] == "SELL")
        if total_buys > total_sells:
            result["insider"] = f"🟢 ${total_buys:,.0f} bought"
        else:
            result["insider"] = f"🔴 ${total_sells:,.0f} sold"
    else:
        result["insider"] = "⚪ No activity"

    return result


def _winner(a: dict, b: dict, key: str, higher_is_better: bool = True) -> str:
    av = a.get(key, 0)
    bv = b.get(key, 0)
    if isinstance(av, str) or isinstance(bv, str):
        return "Draw"
    if higher_is_better:
        return a["ticker"] if av > bv else b["ticker"]
    return a["ticker"] if av < bv else b["ticker"]


def battle(ticker_a: str, ticker_b: str) -> str:
    ta = ticker_a.upper()
    tb = ticker_b.upper()

    pa = _ticker_profile(ta)
    pb = _ticker_profile(tb)
    pa["ticker"] = ta
    pb["ticker"] = tb

    growth_winner = _winner(pa, pb, "eps_growth") if pa["eps_growth"] != "N/A" or pb["eps_growth"] != "N/A" else "Draw"
    if growth_winner == "Draw":
        change_winner = _winner(pa, pb, "change")
        growth_winner = change_winner

    pe_a = float(pa["pe"]) if pa["pe"] != "N/A" else 0
    pe_b = float(pb["pe"]) if pb["pe"] != "N/A" else 0
    if pe_a > 0 and pe_b > 0:
        val_winner = ta if pe_a < pe_b else tb
    elif pe_a > 0:
        val_winner = ta
    elif pe_b > 0:
        val_winner = tb
    else:
        val_winner = "Draw"

    inst_winner = ta if pa["insider"].startswith("🟢") or pa["insider"].startswith("⚪") else tb
    if pb["insider"].startswith("🟢") or pb["insider"].startswith("⚪"):
        inst_winner = tb if pa["insider"].startswith("🔴") else (ta if pb["insider"].startswith("🔴") else "Draw")

    signal_diff = len(pa["signals"]) - len(pb["signals"])
    mom_winner = ta if signal_diff > 0 else (tb if signal_diff < 0 else "Draw")

    winners = [growth_winner, val_winner, inst_winner, mom_winner]
    ta_wins = sum(1 for w in winners if w == ta)
    tb_wins = sum(1 for w in winners if w == tb)
    total_decided = ta_wins + tb_wins
    confidence = int((max(ta_wins, tb_wins) / max(total_decided, 1)) * 100) if total_decided > 0 else 50
    overall = ta if ta_wins > tb_wins else (tb if tb_wins > ta_wins else "Draw")

    pa_sigs = ", ".join(pa["signals"]) if pa["signals"] else "None"
    pb_sigs = ", ".join(pb["signals"]) if pb["signals"] else "None"

    prompt = f"""You are MarketPulse. Two stocks are going head-to-head.

{ta}: ${pa['price']:.2f} ({pa['change']:+.2f}%) | PE: {pa['pe']} | Growth: {pa['eps_growth']} | Signals: {pa_sigs} | Insider: {pa['insider']}

{tb}: ${pb['price']:.2f} ({pb['change']:+.2f}%) | PE: {pb['pe']} | Growth: {pb['eps_growth']} | Signals: {pb_sigs} | Insider: {pb['insider']}

Computed winners:
- Growth → {growth_winner}
- Valuation → {val_winner}
- Institutional → {inst_winner}
- Momentum → {mom_winner}

Overall: {overall} ({confidence}% confidence)

Format this battle in EXACT HTML:

<b>⚔️ Stock Battle</b>

<b>{ta}</b> vs <b>{tb}</b>

<b>Growth:</b> Winner → {growth_winner}
<b>Valuation:</b> Winner → {val_winner}
<b>Institutional:</b> Winner → {inst_winner}
<b>Momentum:</b> Winner → {mom_winner}

<b>🏆 Overall Winner: {overall}</b>
<b>Confidence: {confidence}%</b>

<b>AI Take:</b> [one sentence verdict — why the winner beats the loser]

Rules: under 120 words, keep the scoreboard format exactly as shown, this is meant to be screenshotted."""

    try:
        return _ai_generate(prompt)
    except Exception as exc:
        logger.error("Battle failed: %s", exc)
        return (
            f"<b>⚔️ Stock Battle</b>\n\n"
            f"<b>{ta}</b> vs <b>{tb}</b>\n\n"
            f"<b>Growth:</b> Winner → {growth_winner}\n"
            f"<b>Valuation:</b> Winner → {val_winner}\n"
            f"<b>Institutional:</b> Winner → {inst_winner}\n"
            f"<b>Momentum:</b> Winner → {mom_winner}\n\n"
            f"<b>🏆 Overall Winner: {overall}</b>\n"
            f"<b>Confidence: {confidence}%</b>"
        )
