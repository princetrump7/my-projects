"""
AI Natural Language Screener using yfinance.
"""

from __future__ import annotations

import logging
from typing import List, Dict, Any

import yfinance as yf

from universe import LIQUID_100
from brain import translate_screener_query

logger = logging.getLogger(__name__)

def screen_stocks(nl_query: str) -> List[Dict[str, Any]]:
    criteria = translate_screener_query(nl_query)
    if not criteria:
        return []

    min_mc = criteria.get("min_market_cap")
    max_mc = criteria.get("max_market_cap")
    min_pe = criteria.get("min_pe")
    max_pe = criteria.get("max_pe")
    sector = criteria.get("sector", "").lower()
    min_vol = criteria.get("min_volume")

    results = []
    for ticker_symbol in LIQUID_100:
        try:
            info = yf.Ticker(ticker_symbol).info
            mc = info.get("marketCap", 0) / 1e9
            if min_mc and mc < min_mc: continue
            if max_mc and mc > max_mc: continue
            pe = info.get("trailingPE", 0)
            if min_pe and (pe == 0 or pe < min_pe): continue
            if max_pe and (pe == 0 or pe > max_pe): continue
            ts = info.get("sector", "").lower()
            if sector and sector not in ts: continue
            vol = info.get("averageVolume", 0) / 1e6
            if min_vol and vol < min_vol: continue
            results.append({"ticker": ticker_symbol, "name": info.get("shortName", ticker_symbol), "marketCap": mc, "pe": pe, "sector": info.get("sector", "Unknown"), "volume": vol})
            if len(results) >= 10: break
        except Exception:
            continue
    return results
