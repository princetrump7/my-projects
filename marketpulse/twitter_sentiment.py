"""
Twitter/X sentiment integration.
Requires TWITTER_BEARER_TOKEN env var for live data.
"""

from __future__ import annotations

import logging
import os

import requests

from ai import generate as _ai_generate
from sentiment import parse_sentiment_scores

logger = logging.getLogger(__name__)

_TWITTER_API = "https://api.twitter.com/2"


def _headers() -> dict[str, str] | None:
    token = os.getenv("TWITTER_BEARER_TOKEN")
    return {"Authorization": f"Bearer {token}"} if token else None


def is_configured() -> bool:
    return bool(os.getenv("TWITTER_BEARER_TOKEN"))


def search_tweets(query: str, max_results: int = 20) -> list[dict]:
    h = _headers()
    if not h:
        return []
    params = {"query": query, "max_results": min(max(10, max_results), 100), "tweet.fields": "created_at,public_metrics", "sort_order": "relevancy"}
    try:
        resp = requests.get(f"{_TWITTER_API}/tweets/search/recent", headers=h, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json().get("data", [])
        return [{"id": t["id"], "text": t.get("text", ""), "created_at": t.get("created_at", ""), "likes": t.get("public_metrics", {}).get("like_count", 0)} for t in data]
    except Exception as exc:
        logger.error("Twitter API error: %s", exc)
        return []


def analyze_twitter_sentiment(ticker: str) -> tuple[dict[str, float] | None, str]:
    if not is_configured():
        return None, "⚠️ Twitter/X sentiment requires a <b>TWITTER_BEARER_TOKEN</b>. Set it in .env."

    tweets = search_tweets(f"${ticker} lang:en -is:retweet", 20)
    if not tweets:
        return None, f"😶 No recent tweets for <b>{ticker}</b>."

    tweet_block = "\n".join(f'- "{t["text"][:280]}"' for t in tweets[:15])
    text = _ai_generate(f"""Analyze Twitter/X sentiment for {ticker} based on these tweets:

{tweet_block}

Output:
Ticker: {ticker}
Overall sentiment: bullish / bearish / neutral
Score: 0-100
Bullish signals:
Bearish signals:
Key narrative:
Notable:""")

    scores = parse_sentiment_scores(text)
    return scores, text
