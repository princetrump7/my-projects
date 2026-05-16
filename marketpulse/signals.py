"""
Technical signal engine — detects high-conviction swing setups.

Signals detected
----------------
VOLUME_SPIKE   : Volume > 2x 20-day average (unusual activity)
MA_CROSS       : 9 EMA crosses above 21 EMA (bullish momentum shift)
BREAKOUT       : Close above 20-day high (resistance break)
RSI_OVERSOLD   : RSI < 32 (potential bounce)
RSI_OVERBOUGHT : RSI > 72 (potential exhaustion)
GAP_UP         : Opens > 2% above prior close (institutional interest)
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List

import pandas as pd
import yfinance as yf

logger = logging.getLogger(__name__)

# Default liquid universe scanned when user has no watchlist
DEFAULT_UNIVERSE = [
    "AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA",
    "AMD",  "PLTR", "NFLX", "CRM",  "UBER", "COIN", "AVGO",
    "SOFI", "ARM",  "SMCI", "TSM",  "MSTR", "RKLB",
]

# Thresholds
VOL_MULT  = 2.0    # volume spike multiplier vs 20-day avg
RSI_LOW   = 32
RSI_HIGH  = 72
GAP_PCT   = 2.0    # % gap threshold


# ---------------------------------------------------------------------------
# Indicator helpers
# ---------------------------------------------------------------------------

def _rsi(close: pd.Series, period: int = 14) -> float:
    """Compute the most recent RSI value."""
    delta = close.diff()
    gain  = delta.clip(lower=0).rolling(period).mean()
    loss  = (-delta.clip(upper=0)).rolling(period).mean()
    rs    = gain / loss.replace(0, float("nan"))
    rsi   = 100 - (100 / (1 + rs))
    return float(rsi.iloc[-1]) if not rsi.empty else 50.0


def _ema(close: pd.Series, span: int) -> pd.Series:
    return close.ewm(span=span, adjust=False).mean()


# ---------------------------------------------------------------------------
# Single-ticker analysis
# ---------------------------------------------------------------------------

def _analyze(ticker: str) -> List[Dict[str, Any]]:
    """Return all signals detected for a single ticker."""
    signals: List[Dict] = []

    try:
        hist = yf.Ticker(ticker).history(period="60d")
    except Exception as exc:
        logger.warning("%s history failed: %s", ticker, exc)
        return []

    if hist is None or len(hist) < 22:
        return []  # Not enough data

    close  = hist["Close"].astype(float)
    volume = hist["Volume"].astype(float)
    high   = hist["High"].astype(float)

    price      = float(close.iloc[-1])
    prev_close = float(close.iloc[-2])
    today_open = float(hist["Open"].iloc[-1])
    today_vol  = float(volume.iloc[-1])
    avg_vol    = float(volume.iloc[-21:-1].mean())  # 20-day avg (exclude today)

    # 1. Volume spike
    if avg_vol > 0 and today_vol > avg_vol * VOL_MULT:
        signals.append({
            "ticker":     ticker,
            "signal":     "VOLUME_SPIKE",
            "label":      "Volume Spike",
            "detail":     f"{today_vol / avg_vol:.1f}x avg volume",
            "price":      price,
            "confidence": min(90, int(60 + (today_vol / avg_vol - VOL_MULT) * 10)),
        })

    # 2. EMA 9/21 cross (bullish: 9 crosses above 21 today, was below yesterday)
    ema9  = _ema(close, 9)
    ema21 = _ema(close, 21)
    if ema9.iloc[-1] > ema21.iloc[-1] and ema9.iloc[-2] <= ema21.iloc[-2]:
        signals.append({
            "ticker":     ticker,
            "signal":     "MA_CROSS",
            "label":      "Bull EMA Cross",
            "detail":     "9 EMA crossed above 21 EMA",
            "price":      price,
            "confidence": 72,
        })

    # 3. 20-day high breakout
    high_20d = float(high.iloc[-21:-1].max())
    if price > high_20d and high_20d > 0:
        pct_above = (price - high_20d) / high_20d * 100
        signals.append({
            "ticker":     ticker,
            "signal":     "BREAKOUT",
            "label":      "20-Day Breakout",
            "detail":     f"{pct_above:+.1f}% above 20-day high",
            "price":      price,
            "confidence": min(85, int(65 + pct_above * 2)),
        })

    # 4. RSI extremes
    rsi = _rsi(close)
    if rsi < RSI_LOW:
        signals.append({
            "ticker":     ticker,
            "signal":     "RSI_OVERSOLD",
            "label":      "RSI Oversold",
            "detail":     f"RSI {rsi:.0f} — potential bounce",
            "price":      price,
            "confidence": 68,
        })
    elif rsi > RSI_HIGH:
        signals.append({
            "ticker":     ticker,
            "signal":     "RSI_OVERBOUGHT",
            "label":      "RSI Overbought",
            "detail":     f"RSI {rsi:.0f} — watch for exhaustion",
            "price":      price,
            "confidence": 65,
        })

    # 5. Gap up
    if prev_close > 0:
        gap_pct = (today_open - prev_close) / prev_close * 100
        if gap_pct >= GAP_PCT:
            signals.append({
                "ticker":     ticker,
                "signal":     "GAP_UP",
                "label":      "Gap Up",
                "detail":     f"Opened +{gap_pct:.1f}% above prior close",
                "price":      price,
                "confidence": 70,
            })

    return signals


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def scan_signals(tickers: List[str] | None = None) -> List[Dict[str, Any]]:
    """
    Scan a list of tickers for swing trade signals.

    Parameters
    ----------
    tickers : list of str, optional
        Tickers to scan. Defaults to DEFAULT_UNIVERSE.

    Returns
    -------
    list of signal dicts sorted by confidence descending.
    """
    universe = tickers if tickers else DEFAULT_UNIVERSE
    all_signals: List[Dict] = []

    for ticker in universe:
        found = _analyze(ticker)
        all_signals.extend(found)
        if found:
            logger.info("%s: %d signal(s) detected", ticker, len(found))

    # Sort best confidence first
    all_signals.sort(key=lambda s: s["confidence"], reverse=True)
    logger.info("Total signals found: %d across %d tickers", len(all_signals), len(universe))
    return all_signals


if __name__ == "__main__":
    import json
    logging.basicConfig(level=logging.INFO)
    results = scan_signals(["NVDA", "TSLA", "AAPL", "AMD", "PLTR"])
    print(json.dumps(results, indent=2, default=str))
