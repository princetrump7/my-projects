"""
Financial news scraper via RSS feeds — expanded to 7 sources + ticker extraction.
"""

import logging
import re
from typing import List, Tuple

import feedparser

logger = logging.getLogger(__name__)

RSS_FEEDS = [
    "https://www.investing.com/rss/news_25.rss",
    "https://feeds.finance.yahoo.com/rss/2.0/headline?s=gold",
    "https://www.cnbc.com/id/100003114/device/rss/rss.html",
    "https://www.marketwatch.com/rss/topstories",
    "https://feeds.content.dowjones.io/public/rss/mw_topstories",
    "https://seekingalpha.com/feed.xml",
    "https://www.benzinga.com/feed.xml",
]

MAX_PER_FEED = 5
MAX_TOTAL = 20

_TICKER_RE = re.compile(r"\$?([A-Z]{1,5})")
_COMMON_WORDS = {
    "A", "I", "AN", "OR", "AND", "THE", "FOR", "NOT", "BUT", "ARE",
    "WAS", "HAS", "HAD", "ALL", "NEW", "TO", "UP", "AT", "IN", "OF",
    "ON", "BY", "AS", "IS", "BE", "MY", "WE", "NO", "SO", "IF", "DO",
    "CEO", "CFO", "EPS", "IPO", "ETF", "SEC", "FED", "GDP", "CPI",
    "USA", "UK", "EU", "USD", "EUR", "GBP", "JPY", "AI", "ATH", "YTD",
}


def get_news() -> List[str]:
    headlines = []
    for url in RSS_FEEDS:
        try:
            feed = feedparser.parse(url)
            entries = feed.entries[:MAX_PER_FEED]
            for entry in entries:
                title = getattr(entry, "title", None)
                if title and isinstance(title, str):
                    headlines.append(title.strip())
        except Exception as exc:
            logger.debug("Feed error %s: %s", url, exc)

    seen = set()
    deduped = []
    for h in headlines:
        if h.lower() not in seen:
            seen.add(h.lower())
            deduped.append(h)
    return deduped[:MAX_TOTAL]


def _extract_tickers(headline: str) -> List[str]:
    return [c for c in _TICKER_RE.findall(headline) if len(c) >= 2 and c not in _COMMON_WORDS]


def get_news_by_ticker(ticker: str) -> Tuple[List[str], List[str]]:
    all_news = get_news()
    tu = ticker.upper()
    filtered = [h for h in all_news if tu in _extract_tickers(h)]
    if len(filtered) < 1 and all_news:
        filtered = all_news[:12]
    return filtered, all_news
