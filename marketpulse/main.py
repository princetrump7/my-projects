"""
MarketPulse MVP v1 — Main orchestration loop.
"""

import logging
import os
import runpy
import signal
import sys
from threading import Event
from typing import Any

from dotenv import load_dotenv

load_dotenv()

from market import get_prices
from news import get_news
from sentiment import analyze_sentiment
from notifier import send_alert
from intelligence import build_decision_brief, format_telegram_brief

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SCAN_INTERVAL_SECONDS = int(os.getenv("SCAN_INTERVAL_SECONDS", "600"))

# Default to a safe one-shot run when executed in CI.
CI_ONE_SHOT = os.getenv("CI_ONE_SHOT", "true").lower() in {"1", "true", "yes"}

REQUIRED_ENV_VARS = [
    "GOOGLE_API_KEY",
    "TELEGRAM_BOT_TOKEN",
    "TELEGRAM_CHAT_ID"
]

# ---------------------------------------------------------------------------
# Logging setup
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("marketpulse")

# ---------------------------------------------------------------------------
# Graceful shutdown (Using threading.Event)
# ---------------------------------------------------------------------------

# Replaces the boolean flag to allow interruptible sleeping
shutdown_event = Event()

def _signal_handler(signum: int, frame: Any) -> None:
    logger.info("Shutdown signal received (%s), signaling thread to stop...", signum)
    shutdown_event.set()

signal.signal(signal.SIGINT, _signal_handler)
signal.signal(signal.SIGTERM, _signal_handler)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _validate_env() -> None:
    """Ensure all required environment variables are present."""
    missing = [var for var in REQUIRED_ENV_VARS if not os.getenv(var)]
    if missing:
        logger.error("Missing required environment variables: %s", ", ".join(missing))
        sys.exit(1)

def run_bot() -> None:
    """Run the continuous market scanning loop."""
    logger.info("=" * 50)
    logger.info("MarketPulse Bot started")
    logger.info("Scan interval: %d seconds", SCAN_INTERVAL_SECONDS)
    logger.info("=" * 50)

    cycle = 0
    while not shutdown_event.is_set():
        cycle += 1
        logger.info("--- Cycle %d ---", cycle)

        try:
            prices = get_prices()
        except Exception:
            logger.exception("Market data fetch failed")
            prices = {}

        try:
            news = get_news()
        except Exception:
            logger.exception("News fetch failed")
            news = []

        try:
            sentiment = analyze_sentiment(news) if news else "No news fetched; analysis skipped."
        except Exception:
            logger.exception("Sentiment analysis failed")
            sentiment = "Analysis unavailable due to an error."

        if prices:
            try:
                brief = build_decision_brief(prices, news, sentiment)
                message = format_telegram_brief(prices, brief)
                send_alert(message)
            except Exception:
                logger.exception("Failed to format or send alert")
        else:
            logger.warning("No price data available; skipping alert.")

        logger.info("Sleeping for %d seconds...", SCAN_INTERVAL_SECONDS)
        
        # Event.wait() returns True if the flag is set (e.g., via SIGINT)
        # It returns False if the timeout is reached naturally.
        if shutdown_event.wait(SCAN_INTERVAL_SECONDS):
            logger.info("Sleep interrupted by shutdown request.")
            break

    logger.info("MarketPulse Bot stopped gracefully.")

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    _validate_env()

    if CI_ONE_SHOT:
        runpy.run_path(
            os.path.join(os.path.dirname(__file__), "test_cycle.py"),
            run_name="__main__"
        )
    else:
        run_bot()
