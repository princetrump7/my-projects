"""
Decision brief builder for MarketPulse alerts.
"""

from __future__ import annotations

from html import escape
from typing import Any, Dict, Iterable, List


MOVE_ALERT_THRESHOLD = 0.75
STRONG_MOVE_THRESHOLD = 1.5


def _sentiment_bias(sentiment: str) -> str:
    text = sentiment.lower()
    if "bearish" in text and "bullish" not in text:
        return "bearish"
    if "bullish" in text and "bearish" not in text:
        return "bullish"
    return "mixed"


def _risk_level(prices: Dict[str, Any], sentiment: str) -> tuple[str, str]:
    max_move = max((abs(float(v.get("change", 0))) for v in prices.values()), default=0)
    bias = _sentiment_bias(sentiment)

    if max_move >= STRONG_MOVE_THRESHOLD:
        return "High", "Large cross-market move detected. Review exposure before adding risk."
    if max_move >= MOVE_ALERT_THRESHOLD or bias in {"bullish", "bearish"}:
        return "Medium", "Market conditions are active. Wait for confirmation before acting."
    return "Low", "No urgent dislocation detected. Keep the watchlist active."


def _top_moves(prices: Dict[str, Any]) -> List[str]:
    ranked = sorted(
        prices.items(),
        key=lambda item: abs(float(item[1].get("change", 0))),
        reverse=True,
    )
    return [
        f"{name} {float(info.get('change', 0)):+.2f}%"
        for name, info in ranked[:3]
    ]


def _news_digest(headlines: Iterable[str], limit: int = 5) -> List[str]:
    return [headline.strip() for headline in headlines if headline and headline.strip()][:limit]


def build_decision_brief(
    prices: Dict[str, Any],
    headlines: List[str],
    sentiment: str,
) -> Dict[str, Any]:
    """
    Convert market data and LLM sentiment into a concise customer-facing brief.
    """
    risk, action = _risk_level(prices, sentiment)
    top_moves = _top_moves(prices)
    bias = _sentiment_bias(sentiment)

    if risk == "High":
        headline = "MarketPulse: high-attention setup"
    elif bias in {"bullish", "bearish"}:
        headline = f"MarketPulse: {bias} news pressure building"
    else:
        headline = "MarketPulse: routine market scan"

    return {
        "headline": headline,
        "risk": risk,
        "action": action,
        "top_moves": top_moves,
        "news_digest": _news_digest(headlines),
        "sentiment": sentiment.strip(),
    }


def format_telegram_brief(prices: Dict[str, Any], brief: Dict[str, Any]) -> str:
    """Format a Telegram-safe HTML decision brief."""
    lines: List[str] = [
        f"<b>{escape(str(brief['headline']))}</b>",
        "",
        f"<b>Risk level:</b> {escape(str(brief['risk']))}",
        f"<b>Suggested posture:</b> {escape(str(brief['action']))}",
        "",
        "<b>Prices</b>",
    ]

    for asset, info in prices.items():
        price = float(info.get("price", 0))
        change = float(info.get("change", 0))
        direction = "+" if change >= 0 else "-"
        lines.append(
            f"{direction} <b>{escape(str(asset))}</b>: "
            f"<code>${price:,.2f}</code> ({change:+.2f}%)"
        )

    if brief.get("top_moves"):
        lines.extend(["", "<b>Largest moves</b>"])
        lines.extend(f"- {escape(move)}" for move in brief["top_moves"])

    if brief.get("news_digest"):
        lines.extend(["", "<b>News drivers</b>"])
        lines.extend(f"- {escape(headline)}" for headline in brief["news_digest"])

    lines.extend([
        "",
        "<b>AI read</b>",
        escape(str(brief.get("sentiment", "No sentiment available."))),
        "",
        "<i>Educational decision support only. Not financial advice.</i>",
    ])

    return "\n".join(lines)
