"""
MarketPulse Telegram bot — command handlers + scheduled broadcasts.

Commands
--------
/start        Welcome + feature list
/why TICKER   Why did this stock move today?
/trending     Hot tickers on Reddit right now
/brief        Morning alpha brief on demand
/watchlist    Manage your personal ticker list
/insiders     Recent SEC Form 4 insider buys/sells
/signals      Swing trade signals across top tickers
/screener     AI natural language stock screener
/smartmoney   Latest 13F filings from top investors
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

from brain import (
    analyze_trending_tickers,
    evening_recap,
    explain_signals,
    format_insider_brief,
    morning_brief,
    why_did_it_move,
    format_smartmoney_brief,
)
from db import add_ticker, clear_watchlist, get_watchlist, init_db, remove_ticker
from insider import get_insider_trades
from market import get_prices
from news import get_news
from reddit import get_trending_tickers
from sentiment import analyze_sentiment
from signals import DEFAULT_UNIVERSE, scan_signals
from screener import screen_stocks
from smartmoney import get_recent_13f

logger = logging.getLogger(__name__)

# Validate ticker: 1–5 uppercase letters
_TICKER_RE = re.compile(r"^[A-Z]{1,5}$")

ET = pytz.timezone("US/Eastern")

# ---------------------------------------------------------------------------
# Utility helpers
# ---------------------------------------------------------------------------


async def _reply(update: Update, text: str) -> None:
    """Send an HTML message back to the user."""
    await update.message.reply_text(
        text, parse_mode="HTML", disable_web_page_preview=True
    )


def _ticker_news(ticker: str) -> List[str]:
    """Fetch recent news headlines for a ticker via yfinance."""
    try:
        items = yf.Ticker(ticker).news or []
        headlines = []
        for item in items[:10]:
            # yfinance >= 0.2.37 nests title under content
            title = (
                item.get("content", {}).get("title")
                or item.get("title")
                or ""
            )
            if title:
                headlines.append(title.strip())
        return headlines
    except Exception as exc:
        logger.warning("News fetch failed for %s: %s", ticker, exc)
        return []


def _ticker_change(ticker: str) -> float:
    """Return today's % change for a ticker (0.0 on any error)."""
    try:
        hist = yf.Ticker(ticker).history(period="2d")
        if hist is not None and len(hist) >= 2:
            prev = float(hist["Close"].iloc[-2])
            curr = float(hist["Close"].iloc[-1])
            if prev > 0:
                return ((curr - prev) / prev) * 100
    except Exception:
        pass
    return 0.0


# ---------------------------------------------------------------------------
# Scheduled job callbacks (PTB JobQueue style)
# ---------------------------------------------------------------------------


async def _job_morning(context: ContextTypes.DEFAULT_TYPE) -> None:
    """Fire the morning alpha brief to the channel."""
    logger.info("Scheduled job: morning brief")
    chat_id = os.getenv("TELEGRAM_CHAT_ID")
    if not chat_id:
        return
    try:
        prices = get_prices()
        news = get_news()
        sentiment = analyze_sentiment(news) if news else "No news."
        text = morning_brief(prices, news, sentiment)
        await context.bot.send_message(
            chat_id=chat_id, text=text,
            parse_mode="HTML", disable_web_page_preview=True,
        )
    except Exception:
        logger.exception("Morning job failed")


async def _job_evening(context: ContextTypes.DEFAULT_TYPE) -> None:
    """Fire the evening recap to the channel."""
    logger.info("Scheduled job: evening recap")
    chat_id = os.getenv("TELEGRAM_CHAT_ID")
    if not chat_id:
        return
    try:
        prices = get_prices()
        news = get_news()
        text = evening_recap(prices, news)
        await context.bot.send_message(
            chat_id=chat_id, text=text,
            parse_mode="HTML", disable_web_page_preview=True,
        )
    except Exception:
        logger.exception("Evening job failed")


# ---------------------------------------------------------------------------
# Command handlers
# ---------------------------------------------------------------------------


async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    name = (update.effective_user.first_name or "Trader") if update.effective_user else "Trader"
    await _reply(update, (
        f"👋 <b>Welcome to MarketPulse, {name}!</b>\n\n"
        "Your AI market intelligence engine. I surface alpha, not noise.\n\n"
        "<b>Commands</b>\n"
        "• /why <code>TICKER</code> — Why did this stock move?\n"
        "• /trending — Hot tickers on Reddit right now\n"
        "• /brief — Morning alpha brief on demand\n"
        "• /insiders — Recent SEC insider buys/sells\n"
        "• /signals — Swing trade setups right now\n"
        "• /screener — AI stock screener\n"
        "• /smartmoney — Latest 13F filings from top investors\n"
        "• /watchlist — Manage your ticker watchlist\n\n"
        "<i>Auto-sends: Morning brief 9:15 AM ET · Evening recap 4:30 PM ET</i>\n\n"
        "⚠️ <i>Educational only. Not financial advice.</i>"
    ))


async def cmd_why(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not context.args:
        await _reply(update, "⚠️ Usage: /why <code>TICKER</code>\nExample: /why NVDA")
        return

    ticker = context.args[0].upper()
    if not _TICKER_RE.match(ticker):
        await _reply(update, f"⚠️ <code>{ticker}</code> doesn't look like a valid ticker.")
        return

    await _reply(update, f"🔍 Analyzing <b>{ticker}</b>…")
    change = _ticker_change(ticker)
    headlines = _ticker_news(ticker)
    result = why_did_it_move(ticker, change, headlines)
    await _reply(update, result)


async def cmd_trending(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await _reply(update, "⏳ Scanning Reddit for trending tickers…")
    tickers = get_trending_tickers(min_mentions=3)

    if not tickers:
        await _reply(update, "😶 Nothing trending right now. Try again later.")
        return

    count_block = "\n".join(
        f"  {i+1}. <b>{t}</b> — {c} mentions"
        for i, (t, c) in enumerate(tickers[:8])
    )
    ai_take = analyze_trending_tickers(tickers)
    await _reply(update, f"📊 <b>Reddit Trending Tickers</b>\n\n{count_block}\n\n{ai_take}")


async def cmd_brief(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await _reply(update, "⏳ Building your alpha brief…")
    try:
        prices = get_prices()
        news = get_news()
        sentiment = analyze_sentiment(news) if news else "No news."
        text = morning_brief(prices, news, sentiment)
        await _reply(update, text)
    except Exception as exc:
        logger.exception("Brief command failed")
        await _reply(update, f"⚠️ Brief failed: {exc}")


async def cmd_watchlist(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user_id = update.effective_user.id
    args = context.args or []

    # /watchlist  or  /watchlist show
    if not args or args[0].lower() in ("show", "list"):
        tickers = get_watchlist(user_id)
        if not tickers:
            await _reply(update, (
                "📋 Your watchlist is empty.\n\n"
                "Add tickers: /watchlist add AAPL"
            ))
        else:
            chips = "  ".join(f"<code>{t}</code>" for t in tickers)
            await _reply(update, (
                f"📋 <b>Your Watchlist</b>\n\n{chips}\n\n"
                "Add: /watchlist add TICKER\n"
                "Remove: /watchlist remove TICKER\n"
                "Clear: /watchlist clear"
            ))
        return

    action = args[0].lower()

    if action == "add":
        if len(args) < 2:
            await _reply(update, "⚠️ Usage: /watchlist add <code>TICKER</code>")
            return
        ticker = args[1].upper()
        if not _TICKER_RE.match(ticker):
            await _reply(update, f"⚠️ <code>{ticker}</code> doesn't look like a valid ticker.")
            return
        if add_ticker(user_id, ticker):
            await _reply(update, f"✅ <b>{ticker}</b> added to your watchlist.")
        else:
            await _reply(update, f"ℹ️ <b>{ticker}</b> is already in your watchlist.")

    elif action == "remove":
        if len(args) < 2:
            await _reply(update, "⚠️ Usage: /watchlist remove <code>TICKER</code>")
            return
        ticker = args[1].upper()
        if remove_ticker(user_id, ticker):
            await _reply(update, f"✅ <b>{ticker}</b> removed.")
        else:
            await _reply(update, f"ℹ️ <b>{ticker}</b> wasn't in your watchlist.")

    elif action == "clear":
        count = clear_watchlist(user_id)
        await _reply(update, f"🗑️ Cleared {count} ticker(s) from your watchlist.")

    else:
        await _reply(update, (
            "⚠️ Unknown action. Try:\n"
            "/watchlist\n"
            "/watchlist add <code>TICKER</code>\n"
            "/watchlist remove <code>TICKER</code>\n"
            "/watchlist clear"
        ))


async def cmd_insiders(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Fetch recent SEC Form 4 insider trades and format with AI."""
    await _reply(update, "🔎 Fetching SEC insider filings… (may take ~15 sec)")
    try:
        trades = get_insider_trades(limit=6)
        text = format_insider_brief(trades)
        await _reply(update, text)
    except Exception as exc:
        logger.exception("Insiders command failed")
        await _reply(update, f"⚠️ Insider data fetch failed: {exc}")


async def cmd_signals(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """/signals — scan watchlist (or default universe) for swing setups."""
    user_id = update.effective_user.id
    watchlist = get_watchlist(user_id)
    universe  = watchlist if watchlist else DEFAULT_UNIVERSE
    source    = "your watchlist" if watchlist else "top 20 liquid tickers"

    await _reply(update, f"📡 Scanning {source} for swing signals…")
    try:
        found = scan_signals(universe)
        if not found:
            await _reply(update, "No high-confidence signals right now. Check back later.")
            return
        text = explain_signals(found[:6])
        await _reply(update, text)
    except Exception as exc:
        logger.exception("Signals command failed")
        await _reply(update, f"⚠️ Signal scan failed: {exc}")


async def cmd_screener(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """/screener <query> — Run AI screener."""
    if not context.args:
        await _reply(update, "⚠️ Usage: /screener <code>YOUR QUERY</code>\nExample: /screener profitable tech companies over 200B market cap")
        return

    query = " ".join(context.args)
    await _reply(update, f"🤖 Asking AI to build screener for: <i>{query}</i>… (this checks 100 top stocks)")
    try:
        results = screen_stocks(query)
        if not results:
            await _reply(update, "No stocks found matching those criteria in our top 100 universe.")
            return
            
        lines = [f"<b>{r['ticker']}</b> ({r['name']}): ${r['marketCap']:.1f}B | PE: {r['pe']:.1f} | {r['sector']}" for r in results]
        await _reply(update, "<b>Screener Results</b>\n\n" + "\n".join(lines))
    except Exception as exc:
        logger.exception("Screener command failed")
        await _reply(update, f"⚠️ Screener failed: {exc}")


async def cmd_smartmoney(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """/smartmoney — Check 13F filings for big funds."""
    await _reply(update, "🏦 Checking EDGAR for latest 13F-HR filings from top funds…")
    try:
        filings = get_recent_13f(days_back=90)
        text = format_smartmoney_brief(filings)
        await _reply(update, text)
    except Exception as exc:
        logger.exception("Smartmoney command failed")
        await _reply(update, f"⚠️ Smart money scan failed: {exc}")


# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------


async def _post_init(app: Application) -> None:
    """Register scheduled jobs after the bot is ready."""
    jq = app.job_queue
    if jq is None:
        logger.warning("JobQueue not available — install python-telegram-bot[job-queue]")
        return

    # 9:15 AM ET Mon–Fri
    jq.run_daily(
        _job_morning,
        time=datetime.time(9, 15, tzinfo=ET),
        days=(0, 1, 2, 3, 4),
        name="morning_brief",
    )
    # 4:30 PM ET Mon–Fri
    jq.run_daily(
        _job_evening,
        time=datetime.time(16, 30, tzinfo=ET),
        days=(0, 1, 2, 3, 4),
        name="evening_recap",
    )
    logger.info("Scheduled jobs registered: morning_brief, evening_recap")


def build_app() -> Application:
    """Build and return the configured Telegram Application."""
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        raise RuntimeError("TELEGRAM_BOT_TOKEN not set")

    app = Application.builder().token(token).post_init(_post_init).build()

    app.add_handler(CommandHandler("start",     cmd_start))
    app.add_handler(CommandHandler("why",       cmd_why))
    app.add_handler(CommandHandler("trending",  cmd_trending))
    app.add_handler(CommandHandler("brief",     cmd_brief))
    app.add_handler(CommandHandler("watchlist", cmd_watchlist))
    app.add_handler(CommandHandler("insiders",  cmd_insiders))
    app.add_handler(CommandHandler("signals",   cmd_signals))
    app.add_handler(CommandHandler("screener",  cmd_screener))
    app.add_handler(CommandHandler("smartmoney", cmd_smartmoney))

    logger.info("Bot app built with 9 command handlers")
    return app


def run_bot() -> None:
    """Entry point: init DB, build app, start polling."""
    init_db()
    app = build_app()
    logger.info("MarketPulse bot starting (polling)…")
    app.run_polling(drop_pending_updates=True)


if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    
    # Configure logging if run directly
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    
    # Ensure emojis print correctly on Windows
    import sys
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
        
    run_bot()
