"""
Reddit & social sentiment scraper.
Uses public JSON endpoints — zero credentials required.
"""

from __future__ import annotations

import json
import logging
import re
import urllib.request
from collections import Counter
from typing import List, Tuple

logger = logging.getLogger(__name__)

# Subreddits to monitor
SUBREDDITS = ["wallstreetbets", "stocks", "investing", "stockmarket", "options"]
MAX_POSTS = 25  # per subreddit

# Match 1-5 uppercase letters (potential tickers)
_TICKER_RE = re.compile(r"\b([A-Z]{1,5})\b")

# Common uppercase words that are NOT tickers
_NOISE = {
    # Common words
    "A", "I", "AN", "OR", "AND", "THE", "FOR", "NOT", "BUT", "ARE",
    "WAS", "HAS", "HAD", "ALL", "NEW", "TO", "UP", "AT", "IN", "OF",
    "ON", "BY", "AS", "IS", "BE", "MY", "WE", "NO", "SO", "IF", "DO",
    "GET", "GOT", "HIM", "HER", "ITS", "OUR", "OUT", "FROM", "WITH",
    "WHAT", "WHY", "HOW", "WHO", "CAN", "DID", "WILL", "THIS", "THAT",
    "NOW", "JUST", "MORE", "THAN", "THEN", "THEY", "THEM", "BEEN",
    "GOOD", "ALSO", "WHEN", "MUCH", "OVER", "VERY", "INTO", "ONLY",
    # Market/finance jargon (not tickers)
    "AI", "TA", "DD", "OG", "YTD", "ATH", "YOY", "QOQ", "EPS", "PE",
    "IPO", "ETF", "SEC", "FED", "GDP", "CPI", "CEO", "CFO", "IMF",
    "USD", "EUR", "GBP", "YOLO", "LOL", "IMO", "TBH", "USA", "US",
    "UK", "EU", "IV", "PT", "OP", "PM", "RH", "WSB", "DCA", "FOMO",
    # Options jargon
    "OTM", "ITM", "ATM", "CALL", "PUT", "PUTS", "CALLS", "LEAPS",
    "DTE", "PNL", "PL", "ROI", "ROE", "EBIT", "FCF", "DCF",
    # Retirement / legal
    "IRA", "ROTH", "HSA", "K", "LLC", "INC", "LTD", "ETF", "REIT",
    # Reddit/social
    "OP", "OC", "TL", "DR", "TLDR", "AMA", "ETA", "FYI", "NGL",
    "SMH", "LFG", "NFT", "DAO", "API", "SaaS",
    # Units / misc
    "USD", "CAD", "AUD", "JPY", "BPS", "YR", "MO", "WK",
}


def _fetch_posts(subreddit: str) -> List[str]:
    """Pull hot post titles from a subreddit via its public JSON feed."""
    url = f"https://old.reddit.com/r/{subreddit}/hot.json?limit={MAX_POSTS}"
    req = urllib.request.Request(url, headers={"User-Agent": "MarketPulse/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read().decode())
        posts = data.get("data", {}).get("children", [])
        titles = [p["data"]["title"] for p in posts if p.get("data", {}).get("title")]
        logger.info("r/%s: fetched %d titles", subreddit, len(titles))
        return titles
    except Exception as exc:
        logger.warning("r/%s fetch failed: %s", subreddit, exc)
        return []


def _count_tickers(texts: List[str]) -> Counter:
    """Extract and count ticker-like tokens from a list of text strings."""
    counter: Counter = Counter()
    for text in texts:
        for word in _TICKER_RE.findall(text):
            if len(word) >= 2 and word not in _NOISE:
                counter[word] += 1
    return counter


def get_trending_tickers(min_mentions: int = 3) -> List[Tuple[str, int]]:
    """
    Scrape Reddit for trending tickers.

    Returns
    -------
    list of (ticker, mention_count) sorted descending by count.
    """
    all_titles: List[str] = []
    for sub in SUBREDDITS:
        all_titles.extend(_fetch_posts(sub))

    if not all_titles:
        logger.warning("No Reddit posts fetched across all subreddits")
        return []

    counts = _count_tickers(all_titles)
    result = [
        (ticker, count)
        for ticker, count in counts.most_common(20)
        if count >= min_mentions
    ]
    logger.info("Found %d trending tickers (min_mentions=%d)", len(result), min_mentions)
    return result


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    for ticker, count in get_trending_tickers():
        print(f"{ticker}: {count}")
