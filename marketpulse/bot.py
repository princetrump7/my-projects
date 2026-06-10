"""
MarketPulse Telegram bot - 17 command handlers + scheduled broadcasts.
"""

from __future__ import annotations

import datetime
import logging
import os
import re
from typing import Any, Dict, List

import pytz
import yfinance as yf
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

from alerts import ALERT_TYPES, scan_and_notify
from brain import (
    analyze_trending_tickers, bull_bear_arguments, evening_recap,
    explain_signals, format_insider_brief, morning_brief,
    why_did_it_move, format_smartmoney_brief,
)
from db import (
    add_alert, add_ticker, clear_watchlist, get_alerts as db_get_alerts,
    get_user_tier, get_watchlist, init_db, remove_alert as db_remove_alert,
    remove_ticker, set_user_tier,
)
from earnings import summarize_earnings
from insider import get_insider_trades
from market import get_prices
from news import get_news, get_news_by_ticker
from payments import create_checkout_session, is_configured as stripe_configured
from premium import donation_links, get_watchlist_limit, has_feature, upgrade_message
from reddit import get_trending_tickers
from sentiment import analyze_sentiment, analyze_ticker_sentiment
from signals import DEFAULT_UNIVERSE, scan_signals
from screener import screen_stocks
from smartmoney import get_recent_13f
from twitter_sentiment import analyze_twitter_sentiment, is_configured as twitter_is_configured

logger = logging.getLogger(__name__)
_TICKER_RE = re.compile(r"^[A-Z]{1,5}$")
ET = pytz.timezone("US/Eastern")

async def _reply(update, text):
    await update.message.reply_text(text, parse_mode="HTML", disable_web_page_preview=True)


def _ticker_news(ticker):
    try:
        items = yf.Ticker(ticker).news or []
        titles = []
        for item in items[:10]:
            t = (item.get("content", {}).get("title") or item.get("title") or "")
            if t: titles.append(t.strip())
        return titles
    except Exception:
        return []


def _ticker_change(ticker):
    try:
        hist = yf.Ticker(ticker).history(period="2d")
        if hist is not None and len(hist) >= 2:
            prev, curr = float(hist["Close"].iloc[-2]), float(hist["Close"].iloc[-1])
            if prev > 0: return ((curr - prev) / prev) * 100
    except Exception:
        pass
    return 0.0

async def _job_morning(context):
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


async def _job_evening(context):
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


async def _job_alert_scan(context):
    try:
        scan_and_notify(context)
    except Exception:
        logger.exception("Alert scan job failed")





async def cmd_start(update, context):
    name = (update.effective_user.first_name or "Trader") if update.effective_user else "Trader"
    msg = "<b>Welcome to MarketPulse, " + name + "!</b>\n\nYour AI market intelligence engine."
    msg += "\n\n<b>Commands</b>"
    msg += "\n/why TICKER - Why did this stock move?"
    msg += "\n/trending - Hot tickers on Reddit"
    msg += "\n/brief - Morning alpha brief"
    msg += "\n/insiders - SEC insider buys/sells"
    msg += "\n/signals - Swing trade setups"
    msg += "\n/screener - AI stock screener"
    msg += "\n/smartmoney - Latest 13F filings"
    msg += "\n/sentiment TICKER - AI sentiment"
    msg += "\n/bullbear TICKER - Bull vs Bear"
    msg += "\n/earnings TICKER - Earnings summary"
    msg += "\n/news TICKER - Ticker news"
    msg += "\n/watchlist - Manage watchlist"
    msg += "\n/alert - Set up alerts"
    msg += "\n/donate - Support & get premium"
    msg += "\n/premium - Check premium status"
    msg += "\n\n<i>Auto: Morning 9:15 AM ET - Evening 4:30 PM ET</i>"
    msg += "\n\n<i>Educational only. Not financial advice.</i>"
    await _reply(update, msg)


async def cmd_why(update, context):
    if not context.args:
        await _reply(update, "Usage: /why TICKER" + chr(10) + "Example: /why NVDA")
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


async def cmd_trending(update, context):
    await _reply(update, "Scanning Reddit...")
    tickers = get_trending_tickers(min_mentions=3)
    if not tickers:
        await _reply(update, "Nothing trending right now.")
        return
    count_block = chr(10).join(f"{i+1}. <b>{t}</b> - {c} mentions" for i, (t, c) in enumerate(tickers[:8]))
    ai_take = analyze_trending_tickers(tickers)
    await _reply(update, f"<b>Reddit Trending Tickers</b>" + chr(10) + chr(10) + count_block + chr(10) + chr(10) + ai_take)


async def cmd_brief(update, context):
    await _reply(update, "Building your alpha brief...")
    try:
        prices = get_prices()
        news = get_news()
        sentiment = analyze_sentiment(news) if news else "No news."
        text = morning_brief(prices, news, sentiment)
        await _reply(update, text)
    except Exception as exc:
        await _reply(update, f"Brief failed: {exc}")


async def cmd_watchlist(update, context):
    user_id = update.effective_user.id
    args = context.args or []
    if not args or args[0].lower() in ("show", "list"):
        tickers = get_watchlist(user_id)
        if not tickers:
            await _reply(update, "Your watchlist is empty." + chr(10) + "Add: /watchlist add AAPL")
        else:
            chips = "  ".join(f"<code>{t}</code>" for t in tickers)
            await _reply(update, f"<b>Your Watchlist</b>" + chr(10) + chr(10) + chips)
        return
    action = args[0].lower()
    if action == "add":
        if len(args) < 2:
            await _reply(update, "Usage: /watchlist add TICKER")
            return
        ticker = args[1].upper()
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
    elif action == "remove":
        if len(args) < 2:
            await _reply(update, "Usage: /watchlist remove TICKER")
            return
        ticker = args[1].upper()
        if remove_ticker(user_id, ticker):
            await _reply(update, f"Removed {ticker}.")
        else:
            await _reply(update, f"{ticker} not in watchlist.")
    elif action == "clear":
        c = clear_watchlist(user_id)
        await _reply(update, f"Cleared {c} ticker(s).")
    else:
        await _reply(update, "Try: add, remove, clear")


async def cmd_insiders(update, context):
    await _reply(update, "Fetching SEC insider filings...")
    try:
        trades = get_insider_trades(limit=6)
        text = format_insider_brief(trades)
        await _reply(update, text)
    except Exception as exc:
        await _reply(update, f"Insider fetch failed: {exc}")


async def cmd_signals(update, context):
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


async def cmd_screener(update, context):
    if not context.args:
        await _reply(update, "Usage: /screener QUERY" + chr(10) + "Example: /screener profitable tech over 200B")
        return
    query = " ".join(context.args)
    await _reply(update, f"Running screener: {query}...")
    try:
        results = screen_stocks(query)
        if not results:
            await _reply(update, "No stocks found.")
            return
        lines_list = ["<b>" + r["ticker"] + "</b> (" + r["name"] + "): $" + str(r["marketCap"]) + "B | PE: " + str(r["pe"]) for r in results]
        await _reply(update, "<b>Screener Results</b>" + chr(10) + chr(10) + chr(10).join(lines_list))
    except Exception as exc:
        await _reply(update, f"Screener failed: {exc}")


async def cmd_smartmoney(update, context):
    await _reply(update, "Checking EDGAR for 13F filings...")
    try:
        filings = get_recent_13f(days_back=90)
        text = format_smartmoney_brief(filings)
        await _reply(update, text)
    except Exception as exc:
        await _reply(update, f"Smart money scan failed: {exc}")

async def cmd_earnings(update, context):
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

async def cmd_bullbear(update, context):
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
        try:
            price = float(yf.Ticker(ticker).history(period="2d")["Close"].iloc[-1])
        except Exception:
            price = 0.0
        text = bull_bear_arguments(ticker, price, change, headlines, ticker_insiders, signals)
        await _reply(update, text)
    except Exception as exc:
        await _reply(update, f"Bull/bear failed: {exc}")

async def cmd_sentiment(update, context):
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
        scores, news_summary = analyze_ticker_sentiment(ticker, headlines, change)
        if twitter_is_configured():
            tw_scores, tw_summary = analyze_twitter_sentiment(ticker)
            if tw_scores:
                await _reply(update, news_summary + "\n\n--- Twitter/X ---\n" + tw_summary)
                return
        await _reply(update, news_summary)
    except Exception as exc:
        await _reply(update, f"Sentiment failed: {exc}")

async def cmd_news(update, context):
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

async def cmd_donate(update, context):
    await _reply(update, donation_links())

async def cmd_redeem(update, context):
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

async def cmd_subscribe(update, context):
    if not stripe_configured():
        await _reply(update, "Stripe not configured. Use /donate.")
        return
    tier = "patron" if (context.args and context.args[0].lower() in ("patron","donate")) else "premium"
    url, error = create_checkout_session(update.effective_user.id, tier=tier)
    if url:
        await _reply(update, f"Subscribe: {url}")
    else:
        await _reply(update, f"Checkout failed: {error}")

async def cmd_premium(update, context):
    user_id = update.effective_user.id
    tier = get_user_tier(user_id)
    if tier == "free":
        await _reply(update, upgrade_message(user_id))
    else:
        await _reply(update, f"Your tier: {tier.upper()}\n\nUnlimited watchlist, 90-day insider lookback, real-time alerts. Thanks!")

async def cmd_alert(update, context):
    user_id = update.effective_user.id
    args = context.args or []
    if not args or args[0].lower() in ("list","show"):
        alerts = db_get_alerts(user_id)
        if not alerts:
            await _reply(update, "No alerts.\n/alert add AAPL insider\n/alert add NVDA volume_spike\n/alert list")
        else:
            al = [f"<b>{a['ticker']}</b> - {ALERT_TYPES.get(a['signal_type'], a['signal_type'])}" for a in alerts]
            await _reply(update, "<b>Your Alerts</b>\n\n" + "\n".join(al))
        return
    action = args[0].lower()
    if action == "add":
        if len(args) < 3:
            await _reply(update, "Usage: /alert add TICKER TYPE\nTypes: insider, volume_spike, breakout, rsi_oversold")
            return
        ticker = args[1].upper()
        st = args[2].lower()
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
    elif action == "remove":
        if len(args) < 3:
            await _reply(update, "Usage: /alert remove TICKER TYPE")
            return
        if db_remove_alert(user_id, args[1].upper(), args[2].lower()):
            await _reply(update, f"Removed alert for {args[1].upper()}")
        else:
            await _reply(update, f"No matching alert")
    else:
        await _reply(update, "Try: add, list, remove")

async def _post_init(app):
    jq = app.job_queue
    if jq is None: return
    jq.run_daily(_job_morning, time=datetime.time(9,15,tzinfo=ET), days=(0,1,2,3,4), name="morning_brief")
    jq.run_daily(_job_evening, time=datetime.time(16,30,tzinfo=ET), days=(0,1,2,3,4), name="evening_recap")
    jq.run_repeating(_job_alert_scan, interval=datetime.timedelta(minutes=30), first=datetime.time(9,30,tzinfo=ET), last=datetime.time(16,0,tzinfo=ET), name="alert_scan")

def build_app():
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token: raise RuntimeError("TELEGRAM_BOT_TOKEN not set")
    app = Application.builder().token(token).post_init(_post_init).build()
    app.add_handler(CommandHandler("start",     cmd_start))
    app.add_handler(CommandHandler("why",       cmd_why))
    app.add_handler(CommandHandler("trending",  cmd_trending))
    app.add_handler(CommandHandler("brief",     cmd_brief))
    app.add_handler(CommandHandler("watchlist", cmd_watchlist))
    app.add_handler(CommandHandler("insiders",  cmd_insiders))
    app.add_handler(CommandHandler("signals",   cmd_signals))
    app.add_handler(CommandHandler("screener",  cmd_screener))
    app.add_handler(CommandHandler("smartmoney",cmd_smartmoney))
    app.add_handler(CommandHandler("earnings",  cmd_earnings))
    app.add_handler(CommandHandler("bullbear",  cmd_bullbear))
    app.add_handler(CommandHandler("sentiment", cmd_sentiment))
    app.add_handler(CommandHandler("news",      cmd_news))
    app.add_handler(CommandHandler("donate",    cmd_donate))
    app.add_handler(CommandHandler("redeem",    cmd_redeem))
    app.add_handler(CommandHandler("subscribe", cmd_subscribe))
    app.add_handler(CommandHandler("premium",   cmd_premium))
    app.add_handler(CommandHandler("alert",     cmd_alert))
    return app

def run_bot():
    init_db()
    build_app().run_polling(drop_pending_updates=True)
