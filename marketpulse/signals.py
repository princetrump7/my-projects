"""
Technical signal engine — 6 signal types using yfinance data.
"""

from __future__ import annotations

import logging
from typing import Any

import pandas as pd
import yfinance as yf

logger = logging.getLogger(__name__)

DEFAULT_UNIVERSE = [
    "AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA",
    "AMD", "PLTR", "NFLX", "CRM", "UBER", "COIN", "AVGO",
    "SOFI", "ARM", "SMCI", "TSM", "MSTR", "RKLB",
    # User additions
    "AMAT", "LRCX", "LLY", "CRWD", "TEM", "PANW", "EOSE", "ASTS",
    "NBIS", "KYTX", "ENVX", "ABCL", "POETF", "AAOI", "MP", "CRWV",
    "OUST", "SMR", "HLIT", "000660.KS", "PWR", "UNH", "VRT", "ALAB",
    "CRDO", "POET", "IONQ", "LUNR", "APLD", "MRVL", "RGTI", "QUBT",
    "QBTS", "KULR", "INFQ", "AMBQ", "ONDS", "PENG", "LWLG", "DOCN",
    "MRAM", "HYLN", "FLY", "TE", "AMPG", "ALMU",
]

VOL_MULT = 2.0
RSI_LOW = 32
RSI_HIGH = 72
GAP_PCT = 2.0


def _rsi(close: pd.Series, period: int = 14) -> float:
    delta = close.diff()
    gain = delta.clip(lower=0).rolling(period).mean()
    loss = (-delta.clip(upper=0)).rolling(period).mean()
    rs = gain / loss.replace(0, float("nan"))
    rsi = 100 - (100 / (1 + rs))
    return float(rsi.iloc[-1]) if not rsi.empty else 50.0


def _ema(close: pd.Series, span: int) -> pd.Series:
    return close.ewm(span=span, adjust=False).mean()


def _analyze(ticker: str) -> list[dict[str, Any]]:
    signals = []
    try:
        hist = yf.Ticker(ticker).history(period="60d")
    except Exception:
        return []
    if hist is None or len(hist) < 22:
        return []

    close = hist["Close"].astype(float)
    volume = hist["Volume"].astype(float)
    high = hist["High"].astype(float)
    price = float(close.iloc[-1])
    prev_close = float(close.iloc[-2])
    today_open = float(hist["Open"].iloc[-1])
    today_vol = float(volume.iloc[-1])
    avg_vol = float(volume.iloc[-21:-1].mean())

    if avg_vol > 0 and today_vol > avg_vol * VOL_MULT:
        signals.append({"ticker": ticker, "signal": "VOLUME_SPIKE", "label": "Volume Spike", "detail": f"{today_vol / avg_vol:.1f}x avg volume", "price": price, "confidence": min(90, int(60 + (today_vol / avg_vol - VOL_MULT) * 10))})

    ema9 = _ema(close, 9)
    ema21 = _ema(close, 21)
    if ema9.iloc[-1] > ema21.iloc[-1] and ema9.iloc[-2] <= ema21.iloc[-2]:
        signals.append({"ticker": ticker, "signal": "MA_CROSS", "label": "Bull EMA Cross", "detail": "9 EMA crossed above 21 EMA", "price": price, "confidence": 72})

    high_20d = float(high.iloc[-21:-1].max())
    if price > high_20d and high_20d > 0:
        pct = (price - high_20d) / high_20d * 100
        signals.append({"ticker": ticker, "signal": "BREAKOUT", "label": "20-Day Breakout", "detail": f"{pct:+.1f}% above 20-day high", "price": price, "confidence": min(85, int(65 + pct * 2))})

    rsi = _rsi(close)
    if rsi < RSI_LOW:
        signals.append({"ticker": ticker, "signal": "RSI_OVERSOLD", "label": "RSI Oversold", "detail": f"RSI {rsi:.0f} — potential bounce", "price": price, "confidence": 68})
    elif rsi > RSI_HIGH:
        signals.append({"ticker": ticker, "signal": "RSI_OVERBOUGHT", "label": "RSI Overbought", "detail": f"RSI {rsi:.0f} — watch for exhaustion", "price": price, "confidence": 65})

    if prev_close > 0:
        gap = (today_open - prev_close) / prev_close * 100
        if gap >= GAP_PCT:
            signals.append({"ticker": ticker, "signal": "GAP_UP", "label": "Gap Up", "detail": f"Opened +{gap:.1f}% above prior close", "price": price, "confidence": 70})

    return signals


def scan_signals(tickers: list[str] | None = None) -> list[dict[str, Any]]:
    universe = tickers if tickers else DEFAULT_UNIVERSE
    all_s = []
    for t in universe:
        all_s.extend(_analyze(t))
    all_s.sort(key=lambda s: s["confidence"], reverse=True)
    return all_s
