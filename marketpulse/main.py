"""
MarketPulse MVP v1 — Main orchestration loop.
"""

import logging
import os
import signal
import sys
import time
from typing import Dict, List, Any

from dotenv import load_dotenv

from market import get_prices
from news import get_news
from sentiment import analyze_sentiment
from notifier import send_alert

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SCAN_INTERVAL_SECONDS = 86400  # 24 hours

REQUIRED_ENV_VARS = [
    "OPENAI_API_KEY",
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
# Graceful shutdown
# ---------------------------------------------------------------------------

_shutdown_requested = False


def _signal_handler(signum: int, frame: Any) -> None:
    global _shutdown_requested
    logger.info("Shutdown signal received (%s), finishing current cycle...", signum)
    _shutdown_requested = True


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


def _format_alert(prices: Dict[str, Any], sentiment: str) -> str:
    """Build a nicely formatted HTML message for Telegram."""
    lines: List[str] = [
        "📊 <b>MarketPulse Update</b>",
        "",
        "💰 <b>Prices</b>"
    ]

    for asset, info in prices.items():
        emoji = "🟢" if info["change"] >= 0 else "🔴"
        lines.append(
            f"{emoji} <b>{asset}</b>: <code>${info['price']:,.2f}</code> "
            f"({info['change']:+.2f}%)"
        )

    lines.extend([
        "",
        "🧠 <b>Sentiment Analysis</b>",
        sentiment
    ])

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------

def run_bot() -> None:
    """Run the continuous market scanning loop."""
    logger.info("=" * 50)
    logger.info("MarketPulse Bot started")
    logger.info("Scan interval: %d seconds", SCAN_INTERVAL_SECONDS)
    logger.info("=" * 50)

    cycle = 0
    while not _shutdown_requested:
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
            sentiment = analyze_sentiment(news)
        except Exception:
            logger.exception("Sentiment analysis failed")
            sentiment = "Analysis unavailable."

        if prices:
            message = _format_alert(prices, sentiment)
            send_alert(message)
        else:
            logger.warning("No price data available; skipping alert.")

        if _shutdown_requested:
            break

        logger.info("Sleeping for %d seconds...", SCAN_INTERVAL_SECONDS)
        time.sleep(SCAN_INTERVAL_SECONDS)

    logger.info("MarketPulse Bot stopped gracefully.")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    load_dotenv()
    _validate_env()
    run_bot()
