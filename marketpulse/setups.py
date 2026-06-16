"""
AI Trade Setups — replaces /signals with entry, target, stop, and risk/reward.
"""

from __future__ import annotations

import logging

import yfinance as yf

from ai import generate as _ai_generate
from signals import DEFAULT_UNIVERSE, scan_signals

logger = logging.getLogger(__name__)


def _estimate_levels(ticker: str, signal_type: str, price: float) -> dict:
    levels = {"entry": price, "target": price * 1.04, "stop": price * 0.96}
    try:
        hist = yf.Ticker(ticker).history(period="40d")
        if hist is None or len(hist) < 10:
            return levels
        high_20d = float(hist["High"].iloc[-21:-1].max())
        low_20d = float(hist["Low"].iloc[-21:-1].min())
        close = hist["Close"].astype(float)
        ema21 = float(close.ewm(span=21, adjust=False).mean().iloc[-1])

        if "BREAKOUT" in signal_type:
            levels = {"entry": price, "target": round(price + (price - low_20d) * 1.5, 2), "stop": round(low_20d, 2)}
        elif "MA_CROSS" in signal_type:
            levels = {"entry": price, "target": round(price * 1.06, 2), "stop": round(ema21, 2)}
        elif "VOLUME" in signal_type:
            levels = {"entry": price, "target": round(price * 1.035, 2), "stop": round(price * 0.965, 2)}
        elif "OVERSOLD" in signal_type:
            levels = {"entry": price, "target": round(high_20d, 2), "stop": round(price * 0.94, 2)}
        elif "OVERBOUGHT" in signal_type:
            levels = {"entry": price, "target": round(price * 0.94, 2), "stop": round(price * 1.06, 2)}
        elif "GAP" in signal_type:
            levels = {"entry": price, "target": round(price * 1.04, 2), "stop": round(price * 0.97, 2)}
    except Exception:
        pass
    return levels


def _rr(entry: float, target: float, stop: float) -> str:
    if stop >= entry:
        return "N/A"
    risk = entry - stop
    reward = target - entry
    if risk <= 0:
        return "N/A"
    ratio = reward / risk
    return f"{ratio:.1f}:1"


def setups() -> str:
    all_signals = scan_signals(DEFAULT_UNIVERSE)
    if not all_signals:
        return "No high-confidence trade setups right now."

    top = all_signals[:6]
    lines = []
    for s in top:
        t = s["ticker"]
        price = s["price"]
        levels = _estimate_levels(t, s["signal"], price)
        rr = _rr(levels["entry"], levels["target"], levels["stop"])
        conf = s.get("confidence", 60)
        conf_label = "High" if conf >= 80 else ("Medium" if conf >= 65 else "Low")
        lines.append(f"<b>{t}</b> | Score: {conf} | {conf_label}")
        lines.append(f"Setup: {s['label']} — {s['detail']}")
        lines.append(f"Entry: ${levels['entry']:.2f} | Target: ${levels['target']:.2f} | Stop: ${levels['stop']:.2f}")
        lines.append(f"Risk/Reward: {rr}")
        lines.append("")

    block = "\n".join(lines).strip()

    prompt = f"""You are MarketPulse. Present these trade setups to a trader.

SETUPS:
{block}

Format in this EXACT HTML:

<b>🎯 Top AI Setups Today</b>

[For each setup:]
<b>TICKER</b> | Score: [X] | [Confidence Label]
Setup: [Signal name] — [detail]
Entry: $[X] | Target: $[X] | Stop: $[X]
Risk/Reward: [X:X]

<b>Best Bet:</b> [one sentence on the highest-conviction setup]

Rules: under 180 words, bold tickers, no fluff."""

    try:
        return _ai_generate(prompt)
    except Exception as exc:
        logger.error("Setups AI failed: %s", exc)
        return f"<b>🎯 Top AI Setups Today</b>\n\n{block}"
