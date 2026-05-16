"""
Script to execute scheduled briefs for GitHub Actions.
"""

import argparse
import logging
import sys

from dotenv import load_dotenv

from brain import morning_brief, evening_recap
from market import get_prices
from news import get_news
from sentiment import analyze_sentiment
from notifier import send_alert

# Ensure emojis print correctly
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
)
logger = logging.getLogger("scheduled")

def do_morning():
    logger.info("Running Morning Brief...")
    prices = get_prices()
    news = get_news()
    sentiment = analyze_sentiment(news) if news else "No news."
    text = morning_brief(prices, news, sentiment)
    send_alert(text)
    logger.info("Morning Brief complete.")

def do_evening():
    logger.info("Running Evening Recap...")
    prices = get_prices()
    news = get_news()
    text = evening_recap(prices, news)
    send_alert(text)
    logger.info("Evening Recap complete.")

if __name__ == "__main__":
    load_dotenv()
    
    parser = argparse.ArgumentParser(description="Run scheduled MarketPulse briefs")
    parser.add_argument("--type", choices=["morning", "evening"], required=True, help="Type of brief to run")
    args = parser.add_argument()
    
    # Bug fix: use parse_args()
    args = parser.parse_args()
    
    if args.type == "morning":
        do_morning()
    elif args.type == "evening":
        do_evening()
