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
