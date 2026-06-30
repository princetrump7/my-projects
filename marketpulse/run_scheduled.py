"""Script to execute scheduled hedge fund briefs for GitHub Actions."""

import argparse
import logging
import os
import sys

# Ensure imports resolve from this script's directory (handles GHA running from parent repo)
_script_dir = os.path.dirname(os.path.abspath(__file__))
if _script_dir not in sys.path:
    sys.path.insert(0, _script_dir)

from dotenv import load_dotenv

from brain import evening_recap, hf_evening_recap, hf_morning_brief, morning_brief
from hedge import hedge_brief, portfolio_overview
from market import get_prices
from news import get_news
from notifier import send_alert
from sentiment import analyze_sentiment
from signals import scan_signals

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s")
logger = logging.getLogger("scheduled")


def do_morning():
    """Send both the original alpha brief and the hedge fund morning brief."""
    prices = get_prices()
    news = get_news()
    sentiment = analyze_sentiment(news) if news else "No news."
    hf = hedge_brief()
    top_picks = hf.get("top_picks", [])
    portfolio = hf.get("portfolio", {})

    # Original alpha brief
    text1 = morning_brief(prices, news, sentiment)
    send_alert(text1)
    logger.info("Morning alpha brief sent")

    # Hedge fund brief
    text2 = hf_morning_brief(prices, news, sentiment, top_picks, portfolio)
    send_alert(text2)
    logger.info("Morning hedge brief sent")


def do_evening():
    """Send both the original recap and the hedge fund evening recap."""
    prices = get_prices()
    news = get_news()
    portfolio = portfolio_overview()
    signals = scan_signals()

    # Original recap
    text1 = evening_recap(prices, news)
    send_alert(text1)
    logger.info("Evening recap sent")

    # Hedge fund recap
    text2 = hf_evening_recap(prices, news, portfolio, signals)
    send_alert(text2)
    logger.info("Evening hedge recap sent")

if __name__ == "__main__":
    load_dotenv()
    parser = argparse.ArgumentParser()
    parser.add_argument("--type", choices=["morning", "evening"], required=True)
    args = parser.parse_args()
    if args.type == "morning":
        do_morning()
    else:
        do_evening()
