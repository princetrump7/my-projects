"""
Reddit & social sentiment scraper — public JSON endpoints, no credentials needed.
"""

from __future__ import annotations

import json
import logging
import re
import urllib.request
from collections import Counter
from typing import List, Tuple

logger = logging.getLogger(__name__)

SUBREDDITS = ["wallstreetbets", "stocks", "investing", "stockmarket", "options"]
MAX_POSTS = 25
_TICKER_RE = re.compile(r"\b([A-Z]{1,5})\b")

_NOISE = {
    "A", "I", "AN", "OR", "THE", "FOR", "NOT", "BUT", "ARE", "WAS", "HAS", "HAD",
    "ALL", "NEW", "TO", "UP", "AT", "IN", "OF", "ON", "BY", "AS", "IS", "BE", "MY",
    "WE", "NO", "SO", "IF", "DO", "GET", "GOT", "HIM", "HER", "ITS", "OUR", "OUT",
    "FROM", "WITH", "WHAT", "WHY", "HOW", "WHO", "CAN", "DID", "WILL", "THIS", "THAT",
    "NOW", "JUST", "MORE", "THAN", "THEN", "THEY", "THEM", "BEEN", "GOOD", "ALSO",
    "WHEN", "MUCH", "OVER", "VERY", "INTO", "ONLY",
    "AI", "TA", "DD", "OG", "YTD", "ATH", "YOY", "EPS", "PE", "IPO", "ETF", "SEC",
    "FED", "GDP", "CPI", "CEO", "CFO", "IMF", "USD", "EUR", "GBP", "YOLO", "LOL",
    "IMO", "TBH", "USA", "UK", "EU", "IV", "PT", "OP", "PM", "RH", "WSB", "DCA", "FOMO",
    "OTM", "ITM", "ATM", "CALL", "PUT", "PUTS", "CALLS", "LEAPS", "DTE", "ROI", "ROE",
    "IRA", "ROTH", "K", "LLC", "INC", "LTD", "REIT", "OC", "TL", "DR", "TLDR", "AMA",
    "ETA", "FYI", "NGL", "SMH", "LFG", "NFT", "DAO", "API", "SaaS",
}


def _fetch_posts(subreddit: str) -> List[str]:
    url = f"https://old.reddit.com/r/{subreddit}/hot.json?limit={MAX_POSTS}"
    req = urllib.request.Request(url, headers={"User-Agent": "MarketPulse/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read().decode())
        return [p["data"]["title"] for p in data.get("data", {}).get("children", []) if p.get("data", {}).get("title")]
    except Exception:
        return []


def _count_tickers(texts: List[str]) -> Counter:
    c = Counter()
    for text in texts:
        for word in _TICKER_RE.findall(text):
            if len(word) >= 2 and word not in _NOISE:
                c[word] += 1
    return c


def get_trending_tickers(min_mentions: int = 3) -> List[Tuple[str, int]]:
    titles = []
    for sub in SUBREDDITS:
        titles.extend(_fetch_posts(sub))
    counts = _count_tickers(titles)
    return [(t, c) for t, c in counts.most_common(20) if c >= min_mentions]
