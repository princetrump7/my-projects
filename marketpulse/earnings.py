"""
Earnings call analysis — metrics extraction + AI summary via yfinance.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional

import yfinance as yf

from brain import _ask

logger = logging.getLogger(__name__)


def _safe(val: Any, fmt: str = ".2f") -> str:
    if val is None: return "N/A"
    try: return f"{float(val):{fmt}}"
    except: return "N/A"


def _fmt_money(val: Any) -> str:
    if val is None: return "N/A"
    try:
        v = float(val)
        if abs(v) >= 1e9: return f"${v/1e9:.2f}B"
        if abs(v) >= 1e6: return f"${v/1e6:.2f}M"
        return f"${v:,.0f}"
    except: return "N/A"


def _get_earnings_data(ticker_symbol: str) -> Optional[Dict[str, Any]]:
    try:
        ticker = yf.Ticker(ticker_symbol)
    except Exception:
        return None
    data = {"ticker": ticker_symbol.upper()}
    try:
        info = ticker.info or {}
        data["company"] = info.get("shortName") or info.get("longName")
        data["sector"] = info.get("sector")
    except Exception:
        pass
    try:
        qe = ticker.quarterly_earnings
        if qe is not None and not qe.empty:
            data["quarterly_earnings"] = qe.tail(4).to_dict("index")
    except Exception:
        pass
    try:
        qf = ticker.quarterly_financials
        if qf is not None and not qf.empty:
            pared = {}
            for col in qf.columns[:4]:
                qd = {}
                for k in ["Total Revenue", "Net Income", "Operating Income", "Gross Profit"]:
                    try: qd[k] = float(qf.loc[k, col]) if k in qf.index else None
                    except: qd[k] = None
                pared[str(col.date())] = qd
            data["financials"] = pared
    except Exception:
        pass
    try:
        hist = ticker.history(period="5d")
        if hist is not None and not hist.empty:
            data["current_price"] = float(hist["Close"].iloc[-1])
    except Exception:
        pass
    return data


def summarize_earnings(ticker_symbol: str, compare: bool = False) -> str:
    data = _get_earnings_data(ticker_symbol)
    if not data:
        return f"⚠️ Could not fetch earnings data for <b>{ticker_symbol.upper()}</b>."
    ticker = data["ticker"]
    company = data.get("company") or ticker
    qe = data.get("quarterly_earnings", {})
    eps_lines = []
    for date_str, vals in qe.items():
        ea = _safe(vals.get("epsActual"))
        ee = _safe(vals.get("epsEstimate"))
        beat = ""
        if vals.get("epsActual") and vals.get("epsEstimate"):
            d = float(vals["epsActual"]) - float(vals["epsEstimate"])
            beat = f" (beat by ${d:.2f})" if d > 0 else f" (miss by ${abs(d):.2f})"
        eps_lines.append(f"- {date_str}: Actual EPS ${ea}, Estimated ${ee}{beat}")
    eps_block = "\n".join(eps_lines) if eps_lines else "No quarterly EPS data."
    fins = data.get("financials", {})
    fin_lines = []
    for period_str, vals in fins.items():
        rev = _fmt_money(vals.get("Total Revenue"))
        ni = _fmt_money(vals.get("Net Income"))
        fin_lines.append(f"- {period_str}: Revenue {rev}, Net Income {ni}")
    fin_block = "\n".join(fin_lines) if fin_lines else "No financials data."
    price = data.get("current_price")
    price_ctx = f"${price:.2f}" if price else "N/A"

    context = f"""{ticker} ({company})
Current Price: {price_ctx}
Sector: {data.get('sector') or 'N/A'}

Recent Quarterly EPS:
{eps_block}

Recent Quarterly Financials:
{fin_block}
"""

    if compare:
        return _ask(f"""You are MarketPulse. A trader wants a quarterly comparison for {ticker}.

DATA:
{context}

Write in this format:
<b>Earnings Compare — {ticker}</b>

Comparisons:
- <b>Q vs Q:</b> [2 sentences on revenue + EPS trends]
- <b>Margin Trend:</b> [1 sentence on operating margins]
- <b>Key Takeaway:</b> [1 sentence on trajectory]

Under 100 words.""")
    else:
        return _ask(f"""You are MarketPulse. A trader wants an earnings summary for {ticker}.

DATA:
{context}

Write in this format:
<b>Earnings Summary — {ticker}</b>

<b>Revenue:</b> [last quarter revenue + compare]
<b>Earnings:</b> [EPS actual vs estimate + beat/miss]
<b>Guidance/Outlook:</b> [implied guidance or outlook]
<b>Takeaway:</b> [1 sentence verdict]

Under 120 words.""")
