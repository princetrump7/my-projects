"""
Financial news scraper via RSS feeds.
"""

import logging
from typing import List

import feedparser

logger = logging.getLogger(__name__)

RSS_FEEDS = [
    "https://www.investing.com/rss/news_25.rss",
    "https://feeds.finance.yahoo.com/rss/2.0/headline?s=gold",
    "https://www.cnbc.com/id/100003114/device/rss/rss.html"
]

MAX_HEADLINES_PER_FEED = 5
MAX_TOTAL_HEADLINES = 15


def get_news() -> List[str]:
    """
    Scrape latest headlines from configured RSS feeds.

    Returns
    -------
    list of str
        Up to 15 headline strings.
    """
    headlines: List[str] = []

    for url in RSS_FEEDS:
        try:
            feed = feedparser.parse(url)

            if feed.bozo and feed.get("bozo_exception"):
                logger.warning(
                    "Feed warning for %s: %s", url, feed.bozo_exception
                )
                # Continue anyway; partial data may still be useful

            entries = feed.entries[:MAX_HEADLINES_PER_FEED]
            for entry in entries:
                title = getattr(entry, "title", None)
                if title and isinstance(title, str):
                    headlines.append(title.strip())

            logger.info("Fetched %d headlines from %s", len(entries), url)

        except Exception as exc:
            logger.error("Failed to parse feed %s: %s", url, exc)

    # Deduplicate while preserving order
    seen: set[str] = set()
    deduped: List[str] = []
    for h in headlines:
        lower = h.lower()
        if lower not in seen:
            seen.add(lower)
            deduped.append(h)

    result = deduped[:MAX_TOTAL_HEADLINES]
    logger.info("Total unique headlines: %d", len(result))
    return result


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    for headline in get_news():
        print(headline)
