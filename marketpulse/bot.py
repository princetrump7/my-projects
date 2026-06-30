"""
MarketPulse Telegram bot — 17 command handlers + scheduled broadcasts.
"""

from __future__ import annotations

import datetime
import logging
import os
import re
from typing import Any

import pytz
import yfinance as yf
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

from alerts import ALERT_TYPES, scan_and_notify
from battle import battle as cmd_battle_fn
from brain import (
    analyze_trending_tickers,
    bull_bear_arguments,
    evening_recap,
    explain_signals,
    format_insider_brief,
    format_smartmoney_brief,
    hf_conviction_summary,
    morning_brief,
    why_did_it_move,
)
from hedge import conviction_rating, hedge_brief, portfolio_overview, top_conviction_picks
from catalyst import catalyst as cmd_catalyst_fn
from pulse import pulse as cmd_pulse_fn
from radar import radar as cmd_radar_fn
from setups import setups as cmd_setups_fn
from story import story as cmd_story_fn
from whales import whales as cmd_whales_fn
from db import (
    add_alert,
    add_ticker,
    clear_watchlist,
    get_user_tier,
    get_watchlist,
    init_db,
    remove_ticker,
    set_user_tier,
)
from db import (
    get_alerts as db_get_alerts,
)
from db import (
    remove_alert as db_remove_alert,
)
from earnings import summarize_earnings
from insights import generate_insights
from insider import get_insider_trades
from market import get_prices
from news import get_news, get_news_by_ticker
from payments import create_checkout_session
from payments import is_configured as stripe_configured
from premium import donation_links, get_watchlist_limit, tier_info, upgrade_message
from reddit import get_trending_tickers
from screener import screen_stocks
from sentiment import analyze_sentiment, analyze_ticker_sentiment
from signals import DEFAULT_UNIVERSE, scan_signals
from smartmoney import get_recent_13f
from twitter_sentiment import analyze_twitter_sentiment
from twitter_sentiment import is_configured as twitter_is_configured

logger = logging.getLogger(__name__)
_TICKER_RE = re.compile(r"^[A-Z]{1,5}$")
ET = pytz.timezone("US/Eastern")


async def _reply(update: Update, text: str):
    await update.message.reply_text(text, parse_mode="HTML", disable_web_page_preview=True)


def _ticker_news(ticker: str) -> list[str]:
    try:
        items = yf.Ticker(ticker).news or []
        titles = []
        for item in items[:10]:
            t = (item.get("content", {}).get("title") or item.get("title") or "")
            if t:
                titles.append(t.strip())
        return titles
    except Exception:
        return []


def _ticker_change(ticker: str) -> float:
    try:
        hist = yf.Ticker(ticker).history(period="2d")
        if hist is not None and len(hist) >= 2:
            prev, curr = float(hist["Close"].iloc[-2]), float(hist["Close"].iloc[-1])
            if prev > 0:
                return ((curr - prev) / prev) * 100
    except Exception:
        pass
    return 0.0


def _ticker_price(ticker: str) -> float:
    try:
        return float(yf.Ticker(ticker).history(period="2d")["Close"].iloc[-1])
    except Exception:
        return 0.0


async def _job_morning(context: ContextTypes.DEFAULT_TYPE):
    chat_id = os.getenv("TELEGRAM_CHAT_ID")
    if not chat_id:
        return
    try:
        prices = get_prices()
        news = get_news()
        sentiment = analyze_sentiment(news) if news else "No news."
        text = morning_brief(prices, news, sentiment)
        await context.bot.send_message(chat_id=chat_id, text=text, parse_mode="HTML", disable_web_page_preview=True)
    except Exception:
        logger.exception("Morning job failed")


async def _job_evening(context: ContextTypes.DEFAULT_TYPE):
    chat_id = os.getenv("TELEGRAM_CHAT_ID")
    if not chat_id:
        return
    try:
        prices = get_prices()
        news = get_news()
        text = evening_recap(prices, news)
        await context.bot.send_message(chat_id=chat_id, text=text, parse_mode="HTML", disable_web_page_preview=True)
    except Exception:
        logger.exception("Evening job failed")


async def _job_alert_scan(context: ContextTypes.DEFAULT_TYPE):
    try:
        scan_and_notify(context)
    except Exception:
        logger.exception("Alert scan job failed")


# ---------------------------------------------------------------------------
# Command handlers
# ---------------------------------------------------------------------------

async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    name = (update.effective_user.first_name or "Trader") if update.effective_user else "Trader"
    tier_tag = ""
    try:
        tier = get_user_tier(update.effective_user.id) if update.effective_user else "free"
        tier_map = {"elite": "🔴 <b>Elite</b>", "pro": "🔵 <b>Pro</b>", "patron": "🟣 <b>Patron</b>", "free": "🟢 <b>Free</b>"}
        tier_tag = tier_map.get(tier, "🟢 <b>Free</b>")
    except Exception:
        tier_tag = "🟢 <b>Free</b>"

    msg = (
        f"Welcome, <b>{name}</b>.\n\n"
        "You are connected to MarketPulse v2.0 — AI Market Intelligence.\n\n"
        "<b>⚡ Start Here</b>\n\n"
        "/hf → Hedge Fund briefing (portfolio + conviction calls)\n"
        "/conviction TICKER → Get a buy/hold/short call with levels\n"
        "/topideas → Top 5 highest-conviction picks\n"
        "/pulse TICKER → Full AI pulse (flagship)\n"
        "/story → Today's market narrative\n"
        "/radar → Multi-factor opportunity scan\n\n"
        "<b>🧠 Intelligence</b>\n"
        "/insights → Cross-module intelligence report\n"
        "/setups → Trade setups with entry/target/stop\n"
        "/bullbear TICKER → Bull vs Bear case\n"
        "/catalyst → Emerging catalyst detection\n"
        "/whales → Track Berkshire/ARK/insider whales\n\n"
        "<b>⚔️ Viral</b>\n"
        "/battle TICKER1 TICKER2 → Head-to-head stock battle\n\n"
        "<b>📊 Market Data</b>\n"
        "/brief → Alpha brief\n"
        "/why TICKER → Why did it move?\n"
        "/news TICKER → News breakdown\n"
        "/sentiment TICKER → Sentiment score\n"
        "/earnings TICKER → Earnings impact\n"
        "/trending → Retail trending\n"
        "/screener → Natural language stock filter\n\n"
        "<b>🐋 Smart Money</b>\n"
        "/smartmoney → 13F institutional tracker\n"
        "/insiders → Insider activity\n\n"
        "<b>🔔 Portfolio</b>\n"
        "/watchlist → Manage watchlist\n"
        "/alert → Set alerts\n"
        "/premium → Check your tier\n\n"
        f"Your tier: {tier_tag}\n"
        "/premium → Upgrade for Pro ($15/mo) or Elite ($39/mo)"
    )
    await _reply(update, msg)


async def cmd_why(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await _reply(update, "Usage: /why TICKER\nExample: /why NVDA")
        return
    ticker = context.args[0].upper()
    if not _TICKER_RE.match(ticker):
        await _reply(update, f"Invalid ticker: {ticker}")
        return
    await _reply(update, "Analyzing...")
    change = _ticker_change(ticker)
    headlines = _ticker_news(ticker)
    result = why_did_it_move(ticker, change, headlines)
    await _reply(update, result)


async def cmd_trending(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await _reply(update, "Scanning Reddit...")
    tickers = get_trending_tickers(min_mentions=3)
    if not tickers:
        await _reply(update, "Nothing trending right now.")
        return
    count_block = "\n".join(f"{i+1}. <b>{t}</b> - {c} mentions" for i, (t, c) in enumerate(tickers[:8]))
    ai_take = analyze_trending_tickers(tickers)
    await _reply(update, f"<b>Reddit Trending Tickers</b>\n\n{count_block}\n\n{ai_take}")


async def cmd_brief(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await _reply(update, "Building your alpha brief...")
    try:
        prices = get_prices()
        news = get_news()
        sentiment = analyze_sentiment(news) if news else "No news."
        text = morning_brief(prices, news, sentiment)
        await _reply(update, text)
    except Exception as exc:
        await _reply(update, f"Brief failed: {exc}")


# ---------------------------------------------------------------------------
# Watchlist sub-commands
# ---------------------------------------------------------------------------

async def _watchlist_show(update: Update, user_id: int):
    tickers = get_watchlist(user_id)
    if not tickers:
        await _reply(update, "Your watchlist is empty.\nAdd: /watchlist add AAPL")
        return
    chips = "  ".join(f"<code>{t}</code>" for t in tickers)
    await _reply(update, f"<b>Your Watchlist</b>\n\n{chips}")


async def _watchlist_add(update: Update, user_id: int, ticker: str):
    if not _TICKER_RE.match(ticker):
        await _reply(update, f"Invalid: {ticker}")
        return
    limit = get_watchlist_limit(user_id)
    current = len(get_watchlist(user_id))
    if current >= limit:
        await _reply(update, f"Limit reached ({limit}). Remove or /donate for unlimited.")
        return
    if add_ticker(user_id, ticker):
        await _reply(update, f"Added {ticker} ({current+1}/{limit}).")
    else:
        await _reply(update, f"{ticker} already in watchlist.")


async def _watchlist_remove(update: Update, user_id: int, ticker: str):
    if remove_ticker(user_id, ticker):
        await _reply(update, f"Removed {ticker}.")
    else:
        await _reply(update, f"{ticker} not in watchlist.")


async def _watchlist_clear(update: Update, user_id: int):
    c = clear_watchlist(user_id)
    await _reply(update, f"Cleared {c} ticker(s).")


_WATCHLIST_ACTIONS: dict[str, Any] = {
    "add": _watchlist_add,
    "remove": _watchlist_remove,
    "clear": _watchlist_clear,
}


async def cmd_watchlist(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    args = context.args or []
    if not args or args[0].lower() in ("show", "list"):
        await _watchlist_show(update, user_id)
        return
    action = args[0].lower()
    handler = _WATCHLIST_ACTIONS.get(action)
    if not handler:
        await _reply(update, "Try: add, remove, clear")
        return
    if action in ("add", "remove") and len(args) < 2:
        await _reply(update, f"Usage: /watchlist {action} TICKER")
        return
    ticker = args[1].upper() if len(args) > 1 else ""
    await handler(update, user_id, ticker)


# ---------------------------------------------------------------------------

async def cmd_insiders(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await _reply(update, "Fetching SEC insider filings...")
    try:
        trades = get_insider_trades(limit=6)
        text = format_insider_brief(trades)
        await _reply(update, text)
    except Exception as exc:
        await _reply(update, f"Insider fetch failed: {exc}")


async def cmd_signals(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    watchlist = get_watchlist(user_id)
    universe = watchlist if watchlist else DEFAULT_UNIVERSE
    source = "your watchlist" if watchlist else "top 20 liquid tickers"
    await _reply(update, f"Scanning {source}...")
    try:
        found = scan_signals(universe)
        if not found:
            await _reply(update, "No high-confidence signals right now.")
            return
        text = explain_signals(found[:6])
        await _reply(update, text)
    except Exception as exc:
        await _reply(update, f"Signal scan failed: {exc}")


async def cmd_screener(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await _reply(update, "Usage: /screener QUERY\nExample: /screener profitable tech over 200B")
        return
    query = " ".join(context.args)
    await _reply(update, f"Running screener: {query}...")
    try:
        results = screen_stocks(query)
        if not results:
            await _reply(update, "No stocks found.")
            return
        lines_list = [f"<b>{r['ticker']}</b> ({r['name']}): ${r['marketCap']}B | PE: {r['pe']}" for r in results]
        await _reply(update, "<b>Screener Results</b>\n\n" + "\n".join(lines_list))
    except Exception as exc:
        await _reply(update, f"Screener failed: {exc}")


async def cmd_smartmoney(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await _reply(update, "Checking EDGAR for 13F filings...")
    try:
        filings = get_recent_13f(days_back=90)
        text = format_smartmoney_brief(filings)
        await _reply(update, text)
    except Exception as exc:
        await _reply(update, f"Smart money scan failed: {exc}")


async def cmd_earnings(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await _reply(update, "Usage: /earnings TICKER")
        return
    ticker = context.args[0].upper()
    if not _TICKER_RE.match(ticker):
        await _reply(update, f"Invalid ticker: {ticker}")
        return
    compare = "--compare" in context.args[1:] or "-c" in context.args[1:]
    await _reply(update, f"Fetching earnings for {ticker}...")
    try:
        text = summarize_earnings(ticker, compare=compare)
        await _reply(update, text)
    except Exception as exc:
        await _reply(update, f"Earnings failed: {exc}")


async def cmd_bullbear(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await _reply(update, "Usage: /bullbear TICKER")
        return
    ticker = context.args[0].upper()
    if not _TICKER_RE.match(ticker):
        await _reply(update, f"Invalid ticker: {ticker}")
        return
    await _reply(update, f"Building Bull vs Bear case for {ticker}...")
    try:
        change = _ticker_change(ticker)
        headlines = _ticker_news(ticker)
        trades = get_insider_trades(limit=5)
        signals = scan_signals([ticker])
        ticker_insiders = [t for t in (trades or []) if t.get("ticker") == ticker]
        price = _ticker_price(ticker)
        text = bull_bear_arguments(ticker, price, change, headlines, ticker_insiders, signals)
        await _reply(update, text)
    except Exception as exc:
        await _reply(update, f"Bull/bear failed: {exc}")


# ---------------------------------------------------------------------------
# v2.0 Command handlers
# ---------------------------------------------------------------------------


async def cmd_pulse(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await _reply(update, "Usage: /pulse TICKER\nExample: /pulse NVDA")
        return
    ticker = context.args[0].upper()
    if not _TICKER_RE.match(ticker):
        await _reply(update, f"Invalid ticker: {ticker}")
        return
    await _reply(update, f"Taking pulse of {ticker}...")
    try:
        result = cmd_pulse_fn(ticker)
        await _reply(update, result)
    except Exception as exc:
        await _reply(update, f"Pulse failed: {exc}")


async def cmd_radar(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await _reply(update, "Scanning for opportunities...")
    try:
        result = cmd_radar_fn()
        await _reply(update, result)
    except Exception as exc:
        await _reply(update, f"Radar failed: {exc}")


async def cmd_setups(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await _reply(update, "Building trade setups...")
    try:
        result = cmd_setups_fn()
        await _reply(update, result)
    except Exception as exc:
        await _reply(update, f"Setups failed: {exc}")


async def cmd_catalyst(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await _reply(update, "Scanning for emerging catalysts...")
    try:
        result = cmd_catalyst_fn()
        await _reply(update, result)
    except Exception as exc:
        await _reply(update, f"Catalyst scan failed: {exc}")


async def cmd_whales(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await _reply(update, "Tracking whale activity...")
    try:
        result = cmd_whales_fn()
        await _reply(update, result)
    except Exception as exc:
        await _reply(update, f"Whale tracking failed: {exc}")


async def cmd_battle(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args or len(context.args) < 2:
        await _reply(update, "Usage: /battle TICKER1 TICKER2\nExample: /battle NVDA AMD")
        return
    ta = context.args[0].upper()
    tb = context.args[1].upper()
    if not _TICKER_RE.match(ta) or not _TICKER_RE.match(tb):
        await _reply(update, "Invalid ticker(s).")
        return
    await _reply(update, f"Battling {ta} vs {tb}...")
    try:
        result = cmd_battle_fn(ta, tb)
        await _reply(update, result)
    except Exception as exc:
        await _reply(update, f"Battle failed: {exc}")


async def cmd_story(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await _reply(update, "Writing today's story...")
    try:
        result = cmd_story_fn()
        await _reply(update, result)
    except Exception as exc:
        await _reply(update, f"Story failed: {exc}")


async def cmd_insights(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await _reply(update, "Generating cross-module insights...")
    try:
        user_id = update.effective_user.id if update.effective_user else None
        result = generate_insights(user_id=user_id)
        await _reply(update, result)
    except Exception as exc:
        await _reply(update, f"Insights failed: {exc}")


# ---------------------------------------------------------------------------

async def cmd_sentiment(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await _reply(update, "Usage: /sentiment TICKER")
        return
    ticker = context.args[0].upper()
    if not _TICKER_RE.match(ticker):
        await _reply(update, f"Invalid ticker: {ticker}")
        return
    await _reply(update, f"Analyzing sentiment for {ticker}...")
    try:
        change = _ticker_change(ticker)
        headlines = _ticker_news(ticker) or get_news()[:10]
        _, news_summary = analyze_ticker_sentiment(ticker, headlines, change)
        if twitter_is_configured():
            tw_scores, tw_summary = analyze_twitter_sentiment(ticker)
            if tw_scores:
                await _reply(update, news_summary + "\n\n--- Twitter/X ---\n" + tw_summary)
                return
        await _reply(update, news_summary)
    except Exception as exc:
        await _reply(update, f"Sentiment failed: {exc}")


async def cmd_news(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await _reply(update, "Usage: /news TICKER")
        return
    ticker = context.args[0].upper()
    if not _TICKER_RE.match(ticker):
        await _reply(update, f"Invalid ticker: {ticker}")
        return
    await _reply(update, f"Fetching news for {ticker}...")
    try:
        ticker_news, _ = get_news_by_ticker(ticker)
        if not ticker_news:
            await _reply(update, f"No recent news for {ticker}.")
            return
        lines_list = "\n".join(f"- {h}" for h in ticker_news[:10])
        await _reply(update, f"<b>News - {ticker}</b>\n\n{lines_list}")
    except Exception as exc:
        await _reply(update, f"News fetch failed: {exc}")


async def cmd_donate(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await _reply(update, donation_links())


async def cmd_redeem(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await _reply(update, "Usage: /redeem CODE")
        return
    code = context.args[0].strip()
    expected = os.getenv("PREMIUM_ACCESS_CODE", "").strip()
    if not expected:
        await _reply(update, "No premium codes configured. Use /donate.")
        return
    if code == expected:
        set_user_tier(update.effective_user.id, "premium", source="donation")
        await _reply(update, "Premium activated! Thanks for supporting!")
    else:
        await _reply(update, "Invalid code.")


async def cmd_subscribe(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not stripe_configured():
        await _reply(update, "Stripe not configured. Use /donate.")
        return
    tier = "patron" if (context.args and context.args[0].lower() in ("patron", "donate")) else "premium"
    url, error = create_checkout_session(update.effective_user.id, tier=tier)
    if url:
        await _reply(update, f"Subscribe: {url}")
    else:
        await _reply(update, f"Checkout failed: {error}")


async def cmd_premium(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    tier = get_user_tier(user_id)
    if tier == "free":
        await _reply(update, tier_info())
    else:
        tier_labels = {"pro": "🔵 Pro", "elite": "🔴 Elite", "patron": "🟣 Patron"}
        label = tier_labels.get(tier, tier.upper())
        await _reply(update, f"<b>Your Tier: {label}</b>\n\n✓ Real-time alerts\n✓ Insider Alpha\n✓ Catalyst scanner\n✓ Opportunity Radar\n✓ Unlimited watchlist\n\nThanks for supporting MarketPulse!")


# ---------------------------------------------------------------------------
# Alert sub-commands
# ---------------------------------------------------------------------------

async def _alert_show(update: Update, user_id: int):
    alerts = db_get_alerts(user_id)
    if not alerts:
        await _reply(update, "No alerts.\n/alert add AAPL insider\n/alert add NVDA volume_spike\n/alert list")
        return
    al = [f"<b>{a['ticker']}</b> - {ALERT_TYPES.get(a['signal_type'], a['signal_type'])}" for a in alerts]
    await _reply(update, "<b>Your Alerts</b>\n\n" + "\n".join(al))


async def _alert_add(update: Update, user_id: int, ticker: str, st: str):
    if not _TICKER_RE.match(ticker):
        await _reply(update, f"Invalid: {ticker}")
        return
    if st not in ALERT_TYPES:
        await _reply(update, f"Unknown type: {st}")
        return
    cid = update.effective_chat.id if update.effective_chat else None
    if add_alert(user_id, ticker, st, cid):
        await _reply(update, f"Alert set: {ticker} ({ALERT_TYPES[st]})")
    else:
        await _reply(update, f"Alert exists: {ticker} ({st})")


async def _alert_remove(update: Update, user_id: int, ticker: str, st: str):
    if db_remove_alert(user_id, ticker, st):
        await _reply(update, f"Removed alert for {ticker}")
    else:
        await _reply(update, "No matching alert")


_ALERT_ACTIONS: dict[str, Any] = {
    "add": _alert_add,
    "remove": _alert_remove,
}


async def cmd_alert(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    args = context.args or []
    if not args or args[0].lower() in ("list", "show"):
        await _alert_show(update, user_id)
        return
    action = args[0].lower()
    handler = _ALERT_ACTIONS.get(action)
    if not handler:
        await _reply(update, "Try: add, list, remove")
        return
    if action == "add" and len(args) < 3:
        await _reply(update, "Usage: /alert add TICKER TYPE\nTypes: insider, volume_spike, breakout, rsi_oversold")
        return
    if action == "remove" and len(args) < 3:
        await _reply(update, "Usage: /alert remove TICKER TYPE")
        return
    ticker = args[1].upper() if len(args) > 1 else ""
    st = args[2].lower() if len(args) > 2 else ""
    await handler(update, user_id, ticker, st)


# ---------------------------------------------------------------------------
# Hedge Fund commands
# ---------------------------------------------------------------------------

from brain import hf_conviction_summary as _hf_summary

async def cmd_hf(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Full hedge fund briefing — portfolio, top picks, risk overlay."""
    await _reply(update, "Running hedge fund analysis...")
    try:
        from brain import hf_morning_brief as _hf_brief_fn
        brief_data = hedge_brief()
        prices = brief_data["prices"]
        news = brief_data["news"]
        picks = brief_data["top_picks"]
        portfolio = brief_data["portfolio"]
        from sentiment import analyze_sentiment
        sentiment = analyze_sentiment(news) if news else "No news."
        text = _hf_brief_fn(prices, news, sentiment, picks, portfolio)
        await _reply(update, text)
    except Exception as exc:
        logger.exception("HF brief failed")
        await _reply(update, f"HF analysis failed: {exc}")


async def cmd_conviction(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Conviction call on a specific ticker with entry/target/stop."""
    if not context.args:
        await _reply(update, "Usage: /conviction TICKER\nExample: /conviction NVDA")
        return
    ticker = context.args[0].upper()
    if not _TICKER_RE.match(ticker):
        await _reply(update, f"Invalid ticker: {ticker}")
        return
    await _reply(update, f"Scoring {ticker}...")
    try:
        result = conviction_rating(ticker)
        score = result["score"]
        label = "🚀 Strong Buy" if score >= 9 else "✅ Buy" if score >= 7 else "👀 Watch" if score >= 5 else "⚠️ Avoid" if score >= 3 else "🔻 Short"
        breakdown = "\n".join(f"  • {b}" for b in result.get("breakdown", []))
        entry = result.get("entry", 0)
        target = result.get("target", 0)
        stop = result.get("stop", 0)
        rr = result.get("rr", "N/A")
        price = result.get("price", 0)
        change = result.get("change", 0)
        msg = (
            f"<b>🏛️ Conviction Call — {ticker}</b>\n\n"
            f"<b>{label}</b> — {score}/10\n"
            f"Price: ${price:.2f} ({change:+.2f}%)\n\n"
            f"<b>Action Zones:</b>\n"
            f"  Entry: ${entry:.2f}\n"
            f"  Target: ${target:.2f}\n"
            f"  Stop: ${stop:.2f}\n"
            f"  R:R: {rr}\n\n"
            f"<b>Signal Breakdown:</b>\n"
            f"{breakdown}"
        )
        await _reply(update, msg)
    except Exception as exc:
        await _reply(update, f"Conviction scoring failed: {exc}")


async def cmd_topideas(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Top 5 highest-conviction ideas right now."""
    await _reply(update, "Finding highest-conviction ideas...")
    try:
        picks = top_conviction_picks(limit=5)
        if not picks:
            await _reply(update, "No high-conviction ideas right now. Market may be in a low-signal zone.")
            return
        text = _hf_summary(picks)
        await _reply(update, text)
    except Exception as exc:
        await _reply(update, f"Top ideas failed: {exc}")


# ---------------------------------------------------------------------------
# Scheduled jobs
# ---------------------------------------------------------------------------

async def _post_init(app):
    jq = app.job_queue
    if jq is None:
        return
    jq.run_daily(_job_morning, time=datetime.time(9, 15, tzinfo=ET), days=(0, 1, 2, 3, 4), name="morning_brief")
    jq.run_daily(_job_evening, time=datetime.time(16, 30, tzinfo=ET), days=(0, 1, 2, 3, 4), name="evening_recap")
    jq.run_repeating(_job_alert_scan, interval=datetime.timedelta(minutes=30), first=datetime.time(9, 30, tzinfo=ET), last=datetime.time(16, 0, tzinfo=ET), name="alert_scan")


# ---------------------------------------------------------------------------
# App builder
# ---------------------------------------------------------------------------

def build_app():
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        raise RuntimeError("TELEGRAM_BOT_TOKEN not set")
    app = Application.builder().token(token).post_init(_post_init).build()
    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("why", cmd_why))
    app.add_handler(CommandHandler("trending", cmd_trending))
    app.add_handler(CommandHandler("brief", cmd_brief))
    app.add_handler(CommandHandler("watchlist", cmd_watchlist))
    app.add_handler(CommandHandler("insiders", cmd_insiders))
    app.add_handler(CommandHandler("signals", cmd_signals))
    app.add_handler(CommandHandler("screener", cmd_screener))
    app.add_handler(CommandHandler("smartmoney", cmd_smartmoney))
    app.add_handler(CommandHandler("earnings", cmd_earnings))
    app.add_handler(CommandHandler("bullbear", cmd_bullbear))
    app.add_handler(CommandHandler("sentiment", cmd_sentiment))
    app.add_handler(CommandHandler("news", cmd_news))
    app.add_handler(CommandHandler("donate", cmd_donate))
    app.add_handler(CommandHandler("redeem", cmd_redeem))
    app.add_handler(CommandHandler("subscribe", cmd_subscribe))
    app.add_handler(CommandHandler("premium", cmd_premium))
    app.add_handler(CommandHandler("alert", cmd_alert))
    app.add_handler(CommandHandler("pulse", cmd_pulse))
    app.add_handler(CommandHandler("radar", cmd_radar))
    app.add_handler(CommandHandler("setups", cmd_setups))
    app.add_handler(CommandHandler("catalyst", cmd_catalyst))
    app.add_handler(CommandHandler("whales", cmd_whales))
    app.add_handler(CommandHandler("battle", cmd_battle))
    app.add_handler(CommandHandler("story", cmd_story))
    app.add_handler(CommandHandler("insights", cmd_insights))
    app.add_handler(CommandHandler("hf", cmd_hf))
    app.add_handler(CommandHandler("conviction", cmd_conviction))
    app.add_handler(CommandHandler("topideas", cmd_topideas))
    return app


def run_bot():
    init_db()
    build_app().run_polling(drop_pending_updates=True)
