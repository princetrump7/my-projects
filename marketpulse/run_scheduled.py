"""Script to execute scheduled briefs for GitHub Actions."""

import argparse
import logging
import os
import sys

# Ensure imports resolve from this script's directory (handles GHA running from parent repo)
_script_dir = os.path.dirname(os.path.abspath(__file__))
if _script_dir not in sys.path:
    sys.path.insert(0, _script_dir)

from dotenv import load_dotenv

from brain import evening_recap, morning_brief
from market import get_prices
from news import get_news
from notifier import send_alert
from sentiment import analyze_sentiment

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
