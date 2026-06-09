"""Script to execute scheduled briefs for GitHub Actions."""

import argparse
import logging
import sys

from dotenv import load_dotenv
from brain import morning_brief, evening_recap
from market import get_prices
from news import get_news
from sentiment import analyze_sentiment
from notifier import send_alert

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s")
logger = logging.getLogger("scheduled")

def do_morning():
    prices = get_prices()
    news = get_news()
    sentiment = analyze_sentiment(news) if news else "No news."
    send_alert(morning_brief(prices, news, sentiment))

def do_evening():
    prices = get_prices()
    news = get_news()
    send_alert(evening_recap(prices, news))

if __name__ == "__main__":
    load_dotenv()
    parser = argparse.ArgumentParser()
    parser.add_argument("--type", choices=["morning", "evening"], required=True)
    args = parser.parse_args()
    if args.type == "morning":
        do_morning()
    else:
        do_evening()
