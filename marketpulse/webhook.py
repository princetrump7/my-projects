"""
MarketPulse — FastAPI webhook server for production deployment.

Same pattern as the Telegram AI Agent's webhook, adapted for MarketPulse's
PTB Application structure. Runs as a persistent web service (Render / Railway).
"""

import logging
import os
import sys

import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, Response
from telegram import Update

from bot import build_app, init_db

logger = logging.getLogger("marketpulse.webhook")

# ---------------------------------------------------------------------------
# Build the PTB Application once (module-level, reused across invocations)
# ---------------------------------------------------------------------------
init_db()
_application = build_app()


async def _init_webhook() -> None:
    """Start the PTB application and register the webhook with Telegram."""
    await _application.initialize()
    await _application.start()

    # Determine the public webhook URL
    webhook_url = os.getenv("WEBHOOK_URL", "")
    render_url = os.getenv("RENDER_EXTERNAL_URL", "")

    if not webhook_url and render_url:
        webhook_url = render_url

    if webhook_url:
        full_url = webhook_url.rstrip("/") + "/webhook"
        try:
            await _application.bot.set_webhook(url=full_url)
            logger.info("Webhook registered: %s", full_url)
        except Exception as exc:
            logger.warning("Failed to set webhook: %s", exc)
    else:
        logger.warning("No WEBHOOK_URL set — webhook not registered (polling mode?)")


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(
    title="MarketPulse",
    description="AI Market Intelligence Telegram Bot",
    version="2.0.0",
)


@app.on_event("startup")
async def startup() -> None:
    await _init_webhook()


@app.on_event("shutdown")
async def shutdown() -> None:
    await _application.stop()
    await _application.shutdown()


@app.get("/")
async def root():
    return {
        "ok": True,
        "app": "MarketPulse",
        "version": "2.0.0",
        "bot_running": _application.running,
    }


@app.get("/health")
async def health():
    bot_info = None
    try:
        bot_info = await _application.bot.get_me()
    except Exception:
        pass
    return {
        "status": "ok",
        "bot": bot_info.username if bot_info else None,
        "running": _application.running,
    }


@app.post("/webhook")
async def webhook(request: Request):
    """Telegram webhook endpoint — receives updates from Telegram."""
    try:
        data = await request.json()
        update = Update.de_json(data, _application.bot)
        if update:
            await _application.process_update(update)
        return Response(status_code=200)
    except Exception as exc:
        logger.exception("Webhook error")
        return JSONResponse(status_code=500, content={"error": str(exc)})


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def run() -> None:
    """Run the FastAPI webhook server (called by main.py in production mode)."""
    host = os.getenv("WEBHOOK_HOST", "0.0.0.0")
    port = int(os.getenv("PORT", os.getenv("WEBHOOK_PORT", "8080")))
    log_level = os.getenv("LOG_LEVEL", "info").lower()

    logger.info("Starting webhook server on %s:%s", host, port)
    uvicorn.run(
        "webhook:app",
        host=host,
        port=port,
        log_level=log_level,
    )


if __name__ == "__main__":
    run()
