"""
Market data fetcher for configurable public-market watchlists.
"""

import logging
import os
from datetime import datetime
from typing import Any

import yfinance as yf

logger = logging.getLogger(__name__)

ASSETS = {"GOLD": "GC=F", "SPY": "SPY", "NASDAQ": "^IXIC"}
MIN_REASONABLE_PRICE = 0.01
MAX_REASONABLE_DAILY_CHANGE = 20.0


def _configured_assets() -> dict[str, str]:
    raw = os.getenv("MARKETPULSE_ASSETS", "").strip()
    if not raw:
        return ASSETS
    assets = {}
    for pair in raw.split(","):
        if "=" not in pair:
            continue
        name, ticker = pair.split("=", 1)
        assets[name.strip().upper()] = ticker.strip()
    return assets or ASSETS


def _is_market_open() -> bool:
    now = datetime.now()
    if now.weekday() >= 5:
        return False
    if now.hour < 9 or now.hour >= 16:
        return False
    if now.hour == 9 and now.minute < 30:
        return False
    return True


def _get_current_price(ticker: yf.Ticker) -> float | None:
    try:
        try:
            fi = ticker.fast_info
            price = fi.get('lastPrice') or fi.get('last_price')
            if price:
                return float(price)
        except Exception:
            pass
        hist = ticker.history(period="2d")
        if hist is not None and not hist.empty:
            return float(hist['Close'].iloc[-1])
    except Exception:
        pass
    return None


def get_prices() -> dict[str, Any]:
    data = {}
    for name, ticker_symbol in _configured_assets().items():
        try:
            t = yf.Ticker(ticker_symbol)
            price = _get_current_price(t)
            if price is None or price < MIN_REASONABLE_PRICE:
                continue
            hist = t.history(period="5d")
            prev = float(hist['Close'].iloc[-2]) if hist is not None and len(hist) >= 2 else price
            change = ((price - prev) / prev) * 100
            if abs(change) > MAX_REASONABLE_DAILY_CHANGE:
                continue
            data[name] = {"price": round(price, 2), "change": round(change, 2)}
        except Exception as exc:
            logger.debug("Failed %s: %s", name, exc)
    return data
