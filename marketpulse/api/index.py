"""
MarketPulse — Vercel webhook entry point.
Handles Telegram updates via FastAPI + python-telegram-bot.
"""

import asyncio
import logging
import os
import sys

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, Response
from telegram import Update
from telegram.ext import Application

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Import the bot's command handlers and helpers
from bot import init_db
from bot import (
    cmd_start,
    cmd_why,
    cmd_trending,
    cmd_brief,
    cmd_watchlist,
    cmd_insiders,
    cmd_signals,
    cmd_screener,
    cmd_smartmoney,
    cmd_earnings,
    cmd_bullbear,
    cmd_sentiment,
    cmd_news,
    cmd_donate,
    cmd_redeem,
    cmd_subscribe,
    cmd_premium,
    cmd_alert,
    cmd_pulse,
    cmd_radar,
    cmd_setups,
    cmd_catalyst,
    cmd_whales,
    cmd_battle,
    cmd_story,
)
from telegram.ext import CommandHandler

from db import init_db as ensure_db

logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger("marketpulse.webhook")

app = FastAPI(title="MarketPulse Webhook", version="2.0.0")

# ---------------------------------------------------------------------------
# Global PTB Application (lazy init across warm invocations)
# ---------------------------------------------------------------------------

_ptb: Application | None = None
_ptb_ready: bool = False
_init_lock = asyncio.Lock()


def _build_app() -> Application:
    token = os.environ["TELEGRAM_BOT_TOKEN"]
    ptb = Application.builder().updater(None).token(token).build()
    ptb.add_handler(CommandHandler("start", cmd_start))
    ptb.add_handler(CommandHandler("why", cmd_why))
    ptb.add_handler(CommandHandler("trending", cmd_trending))
    ptb.add_handler(CommandHandler("brief", cmd_brief))
    ptb.add_handler(CommandHandler("watchlist", cmd_watchlist))
    ptb.add_handler(CommandHandler("insiders", cmd_insiders))
    ptb.add_handler(CommandHandler("signals", cmd_signals))
    ptb.add_handler(CommandHandler("screener", cmd_screener))
    ptb.add_handler(CommandHandler("smartmoney", cmd_smartmoney))
    ptb.add_handler(CommandHandler("earnings", cmd_earnings))
    ptb.add_handler(CommandHandler("bullbear", cmd_bullbear))
    ptb.add_handler(CommandHandler("sentiment", cmd_sentiment))
    ptb.add_handler(CommandHandler("news", cmd_news))
    ptb.add_handler(CommandHandler("donate", cmd_donate))
    ptb.add_handler(CommandHandler("redeem", cmd_redeem))
    ptb.add_handler(CommandHandler("subscribe", cmd_subscribe))
    ptb.add_handler(CommandHandler("premium", cmd_premium))
    ptb.add_handler(CommandHandler("alert", cmd_alert))
    ptb.add_handler(CommandHandler("pulse", cmd_pulse))
    ptb.add_handler(CommandHandler("radar", cmd_radar))
    ptb.add_handler(CommandHandler("setups", cmd_setups))
    ptb.add_handler(CommandHandler("catalyst", cmd_catalyst))
    ptb.add_handler(CommandHandler("whales", cmd_whales))
    ptb.add_handler(CommandHandler("battle", cmd_battle))
    ptb.add_handler(CommandHandler("story", cmd_story))
    return ptb


async def _ensure_ptb():
    global _ptb, _ptb_ready
    if _ptb_ready and _ptb is not None:
        return
    async with _init_lock:
        if _ptb_ready:
            return
        ensure_db()
        _ptb = _build_app()
        await _ptb.initialize()
        await _ptb.start()
        _ptb_ready = True
        logger.info("PTB Application ready")

        # Set webhook on first init
        vercel_url = os.environ.get("VERCEL_URL") or os.environ.get("VERCEL_BRANCH_URL")
        if vercel_url:
            webhook_url = f"https://{vercel_url}/webhook"
            try:
                await _ptb.bot.set_webhook(url=webhook_url)
                logger.info("Webhook set to %s", webhook_url)
            except Exception as exc:
                logger.warning("Failed to set webhook: %s", exc)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/")
async def root():
    return {"ok": True, "app": "MarketPulse", "version": "2.0.0"}


@app.get("/health")
async def health():
    return {"ok": True, "ptb_ready": _ptb_ready}


@app.post("/webhook")
async def webhook(request: Request):
    try:
        await _ensure_ptb()
        data = await request.json()
        update = Update.de_json(data, _ptb.bot)
        await _ptb.process_update(update)
        return Response(status_code=200)
    except Exception as exc:
        logger.exception("Webhook error")
        return JSONResponse(status_code=500, content={"error": str(exc)})
