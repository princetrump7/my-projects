"""
Hedge Fund Engine — conviction scoring, portfolio view, and actionable calls.
Computed live from yfinance + all MarketPulse signal sources. No DB needed.
"""

from __future__ import annotations

import logging
from typing import Any

import yfinance as yf

from insider import get_insider_trades
from market import get_prices
from news import get_news, get_news_by_ticker
from reddit import get_trending_tickers
from sentiment import analyze_ticker_sentiment
from signals import DEFAULT_UNIVERSE, scan_signals
from smartmoney import get_recent_13f

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Conviction labels
# ---------------------------------------------------------------------------

CONVICTION: list[dict[str, Any]] = [
    {"min": 9, "label": "Strong Buy", "icon": "🚀"},
    {"min": 7, "label": "Buy", "icon": "✅"},
    {"min": 5, "label": "Watch", "icon": "👀"},
    {"min": 3, "label": "Avoid", "icon": "⚠️"},
    {"min": 0, "label": "Short", "icon": "🔻"},
]


def conviction_label(score: int) -> str:
    for c in CONVICTION:
        if score >= c["min"]:
            return f"{c['icon']} {c['label']} (conviction {score}/10)"
    return "❓ Unknown"


# ---------------------------------------------------------------------------
# Level estimation (mirrors setups.py — entry/target/stop per ticker)
# ---------------------------------------------------------------------------

def _estimate_levels(ticker: str, signal_types: list[str], price: float) -> dict[str, float]:
    """Estimate entry, target, and stop levels based on signal type and recent price action."""
    levels: dict[str, float] = {"entry": price, "target": price * 1.04, "stop": price * 0.96}
    try:
        hist = yf.Ticker(ticker).history(period="40d")
        if hist is None or len(hist) < 10:
            return levels
        high_20d = float(hist["High"].iloc[-21:-1].max())
        low_20d = float(hist["Low"].iloc[-21:-1].min())
        close = hist["Close"].astype(float)
        ema21 = float(close.ewm(span=21, adjust=False).mean().iloc[-1])

        types_str = " ".join((s or "").upper() for s in signal_types)

        if "BREAKOUT" in types_str:
            levels = {"entry": price, "target": round(price + (price - low_20d) * 1.5, 2), "stop": round(low_20d, 2)}
        elif "MA_CROSS" in types_str:
            levels = {"entry": price, "target": round(price * 1.06, 2), "stop": round(ema21, 2)}
        elif "VOLUME" in types_str:
            levels = {"entry": price, "target": round(price * 1.035, 2), "stop": round(price * 0.965, 2)}
        elif "OVERSOLD" in types_str:
            levels = {"entry": price, "target": round(high_20d, 2), "stop": round(price * 0.94, 2)}
        elif "OVERBOUGHT" in types_str:
            levels = {"entry": price, "target": round(price * 0.94, 2), "stop": round(price * 1.06, 2)}
        elif "GAP" in types_str:
            levels = {"entry": price, "target": round(price * 1.04, 2), "stop": round(price * 0.97, 2)}
    except Exception as exc:
        logger.debug("Level estimate failed for %s: %s", ticker, exc)
    return levels


def _rr(entry: float, target: float, stop: float) -> str:
    if stop >= entry:
        return "N/A"
    risk = entry - stop
    reward = target - entry
    if risk <= 0:
        return "N/A"
    return f"{reward/risk:.1f}:1"


# ---------------------------------------------------------------------------
# Conviction scoring
# ---------------------------------------------------------------------------

def _score_ticker_data(ticker: str) -> dict[str, Any]:
    """
    Gather all signal sources for a ticker and produce a conviction score 0-10.
    Returns a rich dict with breakdown.
    """
    result: dict[str, Any] = {
        "ticker": ticker,
        "score": 0,
        "breakdown": [],
        "signals": [],
        "signal_types": [],
        "action": "Hold",
    }

    price = 0.0
    change = 0.0
    try:
        hist = yf.Ticker(ticker).history(period="5d")
        if hist is not None and len(hist) >= 2:
            price = float(hist["Close"].iloc[-1])
            prev = float(hist["Close"].iloc[-2])
            change = ((price - prev) / prev) * 100
    except Exception:
        pass
    result["price"] = price
    result["change"] = change

    # 1. Technical signals (max +3)
    all_signals = scan_signals([ticker])
    ticker_signals = [s for s in all_signals if s["ticker"] == ticker]
    result["signals"] = ticker_signals
    for s in ticker_signals:
        result["signal_types"].append(s.get("signal", ""))
        if s["signal"] in ("BREAKOUT", "MA_CROSS"):
            result["score"] += 2
            result["breakdown"].append(f"Technical: {s['label']} (+2)")
        elif s["signal"] in ("VOLUME_SPIKE", "GAP_UP", "RSI_OVERSOLD"):
            result["score"] += 1
            result["breakdown"].append(f"Technical: {s['label']} (+1)")
        elif s["signal"] == "RSI_OVERBOUGHT":
            result["score"] -= 1
            result["breakdown"].append(f"Technical: {s['label']} (-1)")

    # 2. Insider activity (max +2 / -2)
    trades = get_insider_trades(limit=10) or []
    ticker_insiders = [t for t in trades if t.get("ticker") == ticker]
    buys = sum(1 for t in ticker_insiders if t.get("type") == "BUY")
    sells = sum(1 for t in ticker_insiders if t.get("type") == "SELL")
    if buys > sells:
        result["score"] += 2
        result["breakdown"].append(f"Insider: {buys} BUY trades (+2)")
    elif sells > buys:
        result["score"] -= 2
        result["breakdown"].append(f"Insider: {sells} SELL trades (-2)")
    elif buys > 0 and sells > 0:
        result["breakdown"].append("Insider: mixed (0)")
    result["insider_buys"] = buys
    result["insider_sells"] = sells

    # 3. Sentiment (max +2 / -1)
    try:
        headlines = []
        for item in (yf.Ticker(ticker).news or [])[:10]:
            t = (item.get("content", {}).get("title") or item.get("title") or "")
            if t:
                headlines.append(t.strip())
        if headlines:
            _, sentiment_text = analyze_ticker_sentiment(ticker, headlines, change)
            result["sentiment"] = sentiment_text[:100]
            st = sentiment_text.lower()
            if "bullish" in st and "bearish" not in st:
                result["score"] += 2
                result["breakdown"].append("Sentiment: bullish (+2)")
            elif "bullish" in st:
                result["score"] += 1
                result["breakdown"].append("Sentiment: leaning bullish (+1)")
            elif "bearish" in st:
                result["score"] -= 1
                result["breakdown"].append("Sentiment: bearish (-1)")
            else:
                result["breakdown"].append("Sentiment: neutral (0)")
    except Exception as exc:
        logger.debug("Sentiment fetch failed for %s: %s", ticker, exc)

    # 4. Reddit buzz (max +1)
    try:
        reddit = dict(get_trending_tickers(min_mentions=2))
        if ticker in reddit:
            result["score"] += 1
            result["breakdown"].append(f"Reddit buzz: {reddit[ticker]} mentions (+1)")
    except Exception:
        pass

    # 5. 13F institutional interest (max +1)
    try:
        filings = get_recent_13f(days_back=90) or []
        # Crude proxy — flag if any 13F was filed recently (indicates institutional activity)
        if filings:
            result["score"] += 1
            result["breakdown"].append("Institutional: recent 13F filing activity (+1)")
    except Exception:
        pass

    # 6. News catalyst (max +1)
    try:
        ticker_news, _ = get_news_by_ticker(ticker) if callable(get_news_by_ticker) else ([], "")
        if ticker_news:
            catalyst_kw = ["earnings", "fda", "approval", "acquisition", "ipo",
                          "buyback", "dividend", "guidance", "launch", "partner"]
            catalyst_found = [kw for kw in catalyst_kw if any(kw in h.lower() for h in ticker_news[:5])]
            if catalyst_found:
                result["score"] += 1
                result["breakdown"].append(f"Catalyst: {', '.join(catalyst_found)} (+1)")
            else:
                result["breakdown"].append("Catalyst: none detected (0)")
    except Exception:
        pass

    # Clamp score to 0-10
    result["score"] = max(0, min(10, result["score"]))

    # Determine action
    if result["score"] >= 7:
        result["action"] = "Buy"
    elif result["score"] <= 2:
        result["action"] = "Short"
    elif result["score"] <= 4:
        result["action"] = "Avoid"
    else:
        result["action"] = "Watch"

    # Estimate entry/target/stop
    levels = _estimate_levels(ticker, result["signal_types"], price)
    result["entry"] = levels["entry"]
    result["target"] = levels["target"]
    result["stop"] = levels["stop"]
    result["rr"] = _rr(levels["entry"], levels["target"], levels["stop"])

    return result


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def conviction_rating(ticker: str) -> dict[str, Any]:
    """Score a single ticker 1-10 with full breakdown. The flagship call."""
    return _score_ticker_data(ticker)


def top_conviction_picks(limit: int = 5) -> list[dict[str, Any]]:
    """Score all known tickers and return top N ranked by conviction."""
    scored = []
    for ticker in DEFAULT_UNIVERSE:
        try:
            result = _score_ticker_data(ticker)
            scored.append(result)
        except Exception as exc:
            logger.debug("Conviction score failed for %s: %s", ticker, exc)
            continue
    scored.sort(key=lambda x: (-x["score"], -abs(x.get("change", 0))))
    return scored[:limit]


def portfolio_overview(universe: list[str] | None = None) -> dict[str, Any]:
    """
    Compute a live portfolio snapshot for a given universe of tickers.
    Returns dict with positions, best/worst, total return.
    """
    tickers = universe or DEFAULT_UNIVERSE[:10]
    positions = []
    total_return = 0.0
    count = 0

    for ticker in tickers:
        try:
            result = _score_ticker_data(ticker)
            positions.append({
                "ticker": ticker,
                "price": result.get("price", 0),
                "change": result.get("change", 0),
                "score": result["score"],
                "label": conviction_label(result["score"]),
                "action": result["action"],
                "signals": [s["label"] for s in result.get("signals", [])],
                "entry": result.get("entry", 0),
                "target": result.get("target", 0),
                "stop": result.get("stop", 0),
                "rr": result.get("rr", "N/A"),
            })
            total_return += result.get("change", 0)
            count += 1
        except Exception as exc:
            logger.debug("Portfolio entry failed for %s: %s", ticker, exc)
            continue

    avg_return = total_return / count if count else 0.0
    sorted_pos = sorted(positions, key=lambda p: -p["score"])
    winners = [p for p in positions if p["change"] > 0]
    losers = [p for p in positions if p["change"] < 0]
    best = max(positions, key=lambda p: p["change"]) if positions else None
    worst = min(positions, key=lambda p: p["change"]) if positions else None

    # Read market prices for macro section
    prices = get_prices()
    spy_info = prices.get("SPY", {})
    spy_change = spy_info.get("change", 0)

    return {
        "positions": sorted_pos,
        "total_return": round(total_return, 2),
        "avg_return": round(avg_return, 2),
        "winners": len(winners),
        "losers": len(losers),
        "total": count,
        "win_rate": round(len(winners) / count * 100, 1) if count else 0,
        "best": best,
        "worst": worst,
        "top_picks": sorted_pos[:limit(5)] if callable(limit) else sorted_pos[:5],
        "spy_change": spy_change,
    }


def hedge_brief() -> dict[str, Any]:
    """
    Full hedge fund daily brief = market regime + top conviction picks + portfolio snapshot.
    Returns structured data for brain.py prompts to format.
    """
    prices = get_prices()
    headlines = get_news()
    picks = top_conviction_picks(limit=5)
    portfolio = portfolio_overview()
    return {
        "prices": prices,
        "news": headlines,
        "top_picks": picks,
        "portfolio": portfolio,
    }
