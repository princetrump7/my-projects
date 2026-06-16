"""
MarketPulse web companion dashboard — FastAPI app.
Serves a read-only dashboard showing signals, insider trades, and market overview.
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime

import yfinance as yf
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

from insider import get_insider_trades
from market import get_prices
from news import get_news
from signals import DEFAULT_UNIVERSE, scan_signals

logger = logging.getLogger("marketpulse.web")

app = FastAPI(title="MarketPulse Dashboard", version="1.0.0")
try:
    templates = Jinja2Templates(directory="web/templates")
except Exception:
    templates = None

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_HTML_HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MarketPulse</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0d1117; color: #c9d1d9; padding: 20px; }
h1 { color: #58a6ff; margin-bottom: 8px; font-size: 1.5rem; }
h2 { color: #8b949e; font-size: 1rem; margin: 20px 0 8px; border-bottom: 1px solid #30363d; padding-bottom: 4px; }
.card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
table { width: 100%; border-collapse: collapse; }
th { text-align: left; color: #8b949e; font-size: 0.8rem; text-transform: uppercase; padding: 6px 8px; border-bottom: 1px solid #30363d; }
td { padding: 8px; border-bottom: 1px solid #21262d; font-size: 0.9rem; }
.up { color: #3fb950; }
.down { color: #f85149; }
.badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
.badge-bullish { background: #1b3a1b; color: #3fb950; }
.badge-bearish { background: #3a1b1b; color: #f85149; }
.badge-neutral { background: #1b2a3a; color: #58a6ff; }
a { color: #58a6ff; text-decoration: none; }
a:hover { text-decoration: underline; }
.footer { margin-top: 30px; color: #484f58; font-size: 0.8rem; text-align: center; }
.nav { margin-bottom: 20px; }
.nav a { margin-right: 16px; font-size: 0.9rem; }
.meta { color: #8b949e; font-size: 0.8rem; margin-bottom: 16px; }
</style>
</head>
<body>
<div class="nav">
<a href="/">🏠 Dashboard</a>
<a href="/signals">📈 Signals</a>
<a href="/insiders">🕵️ Insiders</a>
</div>
"""

_HTML_FOOTER = """
<div class="footer">
MarketPulse &mdash; Educational decision support. Not financial advice.<br>
Data updates once per page load.
</div>
</body>
</html>
"""


def _page(title: str, body: str) -> str:
    """Wrap body content in a full HTML page."""
    return f"{_HTML_HEAD}<h1>{title}</h1>\n{body}\n{_HTML_FOOTER}"


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/", response_class=HTMLResponse)
async def dashboard():
    """Main dashboard — signals, trending, market overview."""
    now = datetime.now(UTC).strftime("%b %d, %Y %H:%M UTC")

    try:
        signals = scan_signals(DEFAULT_UNIVERSE[:10])[:8]
    except Exception:
        signals = []

    try:
        prices = get_prices()
    except Exception:
        prices = {}

    try:
        headlines = get_news()[:10]
    except Exception:
        headlines = []

    # Price cards
    price_rows = ""
    for name, info in prices.items():
        change = info.get("change", 0)
        cls = "up" if change >= 0 else "down"
        price_rows += f"<tr><td><b>{name}</b></td><td>${info['price']:,.2f}</td><td class='{cls}'>{change:+.2f}%</td></tr>"

    # Signal cards
    signal_rows = ""
    for s in signals[:6]:
        signal_rows += f"""
<div class="card">
<b>{s['ticker']}</b> — {s['label']} <span style="float:right">{s['confidence']}% conf</span><br>
<span style="color:#8b949e;font-size:0.85rem">{s['detail']} · ${s['price']:.2f}</span>
</div>"""

    # News list
    news_list = "".join(f"<li>{h}</li>" for h in headlines)

    # Trending from DEFAULT_UNIVERSE with signals
    trending = sorted(set(
        s["ticker"] for s in signals if s["confidence"] >= 70
    ))[:8]
    trending_block = "  ".join(
        f'<a href="/ticker/{t}" class="badge badge-neutral">{t}</a>'
        for t in trending
    ) if trending else "<span style='color:#8b949e'>No strong signals right now</span>"

    body = f"""
<div class="meta">Last updated: {now}</div>

<h2>Market Overview</h2>
<div class="card">
<table>
<tr><th>Asset</th><th>Price</th><th>Change</th></tr>
{price_rows}
</table>
</div>

<h2>Top Signals</h2>
{signal_rows or '<div class="card" style="color:#8b949e">No signals detected right now.</div>'}

<h2>Trending Tickers</h2>
<div class="card">{trending_block}</div>

<h2>Latest Headlines</h2>
<div class="card"><ul style="margin-left:16px">{news_list}</ul></div>
"""
    return _page("MarketPulse Dashboard", body)


@app.get("/signals", response_class=HTMLResponse)
async def signals_page():
    """Full signals list."""
    try:
        signals = scan_signals(DEFAULT_UNIVERSE)
    except Exception:
        signals = []

    if not signals:
        return _page("Signals", '<div class="card" style="color:#8b949e">No signals detected.</div>')

    rows = ""
    for s in signals:
        conf_color = "up" if s["confidence"] >= 75 else ("#d29922" if s["confidence"] >= 60 else "down")
        rows += f"""
<div class="card">
<b>{s['ticker']}</b> — {s['label']}<br>
<span style="color:#8b949e;font-size:0.85rem">{s['detail']} · ${s['price']:.2f} · confidence <span style="color:{conf_color}">{s['confidence']}%</span></span>
</div>"""

    return _page("Swing Trade Signals", rows)


@app.get("/insiders", response_class=HTMLResponse)
async def insiders_page():
    """Recent insider trades."""
    try:
        trades = get_insider_trades(limit=15)
    except Exception:
        trades = []

    if not trades:
        return _page("Insider Trades", '<div class="card" style="color:#8b949e">No recent insider trades.</div>')

    rows = ""
    for t in trades:
        direction = "🔴 SELL" if t["type"] == "SELL" else "🟢 BUY"
        rows += f"""
<div class="card">
<b>{t['ticker']}</b> ({t['company']}) — {direction}<br>
<span style="color:#8b949e;font-size:0.85rem">
{t['role']} · {t['shares']:,} shares @ ${t['price']:.2f} · ${t['value']:,.0f} total · {t.get('date', '')}
</span>
</div>"""

    return _page("Insider Trades", rows)


@app.get("/ticker/{ticker_symbol}", response_class=HTMLResponse)
async def ticker_page(ticker_symbol: str):
    """Ticker detail page."""
    ticker = ticker_symbol.upper()

    # Price & change
    price_info = {}
    change = 0.0
    try:
        t = yf.Ticker(ticker)
        hist = t.history(period="5d")
        if hist is not None and not hist.empty:
            price = float(hist["Close"].iloc[-1])
            prev = float(hist["Close"].iloc[-2]) if len(hist) >= 2 else price
            change = ((price - prev) / prev) * 100
            price_info = {"price": price, "change": change}
    except Exception:
        pass

    # News
    try:
        news_items = yf.Ticker(ticker).news or []
        headlines = []
        for item in news_items[:8]:
            title = item.get("content", {}).get("title") or item.get("title") or ""
            if title:
                headlines.append(title.strip())
    except Exception:
        headlines = []

    # Insider trades
    try:
        trades = get_insider_trades(limit=5)
        ticker_trades = [t for t in trades if t.get("ticker", "").upper() == ticker]
    except Exception:
        ticker_trades = []

    price_line = ""
    if price_info:
        cls = "up" if change >= 0 else "down"
        price_line = f"<tr><td>Price</td><td class='{cls}'>${price_info['price']:.2f} ({change:+.2f}%)</td></tr>"

    news_lines = "".join(f"<li>{h}</li>" for h in headlines)

    insider_lines = ""
    for t in ticker_trades:
        direction = "🔴 SELL" if t["type"] == "SELL" else "🟢 BUY"
        insider_lines += f"<tr><td>{direction}</td><td>{t['role']}</td><td>{t['shares']:,} @ ${t['price']:.2f}</td><td>${t['value']:,.0f}</td></tr>"

    body = f"""
<div class="meta"><a href="/">← Back to Dashboard</a></div>

<h1>{ticker}</h1>

<div class="card">
<table>
{price_line}
</table>
</div>

<h2>News</h2>
<div class="card"><ul style="margin-left:16px">{news_lines or '<li style="color:#8b949e">No recent news.</li>'}</ul></div>

<h2>Insider Activity</h2>
<div class="card">
{'<table><tr><th>Type</th><th>Role</th><th>Shares</th><th>Value</th></tr>' + insider_lines + '</table>' if insider_lines else '<span style="color:#8b949e">No recent insider activity.</span>'}
</div>
"""
    return _page(f"{ticker} — MarketPulse", body)


@app.get("/api/signals")
async def api_signals():
    """JSON endpoint for signals."""
    try:
        signals = scan_signals(DEFAULT_UNIVERSE)
        return {"ok": True, "count": len(signals), "signals": signals[:20]}
    except Exception as exc:
        return {"ok": False, "error": str(exc)}


@app.get("/api/insiders")
async def api_insiders():
    """JSON endpoint for insider trades."""
    try:
        trades = get_insider_trades(limit=10)
        return {"ok": True, "count": len(trades), "trades": trades}
    except Exception as exc:
        return {"ok": False, "error": str(exc)}


@app.get("/api/market")
async def api_market():
    """JSON endpoint for market overview."""
    try:
        prices = get_prices()
        headlines = get_news()[:5]
        return {"ok": True, "prices": prices, "headlines": headlines}
    except Exception as exc:
        return {"ok": False, "error": str(exc)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
