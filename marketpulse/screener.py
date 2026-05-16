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
    """
    Translates a natural language query into criteria and screens the universe.
    """
    criteria = translate_screener_query(nl_query)
    logger.info("Screener criteria from AI: %s", criteria)
    
    if not criteria:
        return []

    # Get optional filters
    min_mc = criteria.get("min_market_cap")
    max_mc = criteria.get("max_market_cap")
    min_pe = criteria.get("min_pe")
    max_pe = criteria.get("max_pe")
    sector = criteria.get("sector", "").lower()
    min_vol = criteria.get("min_volume")

    results = []
    
    # We'll download basic info for the universe.
    # To keep it fast for the MVP, we just use fast_info where possible or info.
    for ticker_symbol in LIQUID_100:
        try:
            ticker = yf.Ticker(ticker_symbol)
            info = ticker.info
            
            # Market Cap
            mc = info.get("marketCap", 0) / 1e9  # in billions
            if min_mc and mc < min_mc:
                continue
            if max_mc and mc > max_mc:
                continue
                
            # PE Ratio
            pe = info.get("trailingPE", 0)
            if min_pe and (pe == 0 or pe < min_pe):
                continue
            if max_pe and (pe == 0 or pe > max_pe):
                continue
                
            # Sector
            t_sector = info.get("sector", "").lower()
            if sector and sector not in t_sector:
                continue
                
            # Volume
            vol = info.get("averageVolume", 0) / 1e6  # in millions
            if min_vol and vol < min_vol:
                continue
                
            results.append({
                "ticker": ticker_symbol,
                "name": info.get("shortName", ticker_symbol),
                "marketCap": mc,
                "pe": pe,
                "sector": info.get("sector", "Unknown"),
                "volume": vol
            })
            
            # Stop early if we find enough
            if len(results) >= 10:
                break
                
        except Exception as exc:
            logger.debug("Failed to fetch info for %s: %s", ticker_symbol, exc)
            
    return results

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    res = screen_stocks("profitable tech companies over 200B market cap")
    for r in res:
        print(r)
