"""One-shot end-to-end smoke test for MarketPulse."""

import logging
import os
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s")
logger = logging.getLogger("test")

from market import get_prices
from news import get_news
from sentiment import analyze_sentiment
from intelligence import build_decision_brief, format_telegram_brief
from notifier import send_alert

def run():
    print("=" * 50)
    print("Running one full MarketPulse cycle...")
    print("=" * 50)

    prices = get_prices()
    logger.info("Prices: %s", {k: v.get("change") for k, v in prices.items()})

    headlines = get_news()
    logger.info("Headlines: %d fetched", len(headlines))

    sentiment = analyze_sentiment(headlines) if headlines else "No news."
    logger.info("Sentiment: %s", sentiment[:100] if sentiment else "None")

    brief = build_decision_brief(prices, headlines, sentiment)
    message = format_telegram_brief(prices, brief)

    print()
    print(message)
    print()

    sent = send_alert(message)
    logger.info("Alert sent: %s", sent)
    print("Done.")

if __name__ == "__main__":
    run()
