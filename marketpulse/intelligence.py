"""
Decision brief builder for MarketPulse alerts.
"""

from __future__ import annotations

from html import escape
from typing import Any, Dict, Iterable, List

MOVE_ALERT_THRESHOLD = 0.75
STRONG_MOVE_THRESHOLD = 1.5


def _sentiment_bias(sentiment: str) -> str:
    t = sentiment.lower()
    if "bearish" in t and "bullish" not in t: return "bearish"
    if "bullish" in t and "bearish" not in t: return "bullish"
    return "mixed"


def _risk_level(prices: Dict[str, Any], sentiment: str) -> tuple[str, str]:
    max_move = max((abs(float(v.get("change", 0))) for v in prices.values()), default=0)
    bias = _sentiment_bias(sentiment)
    if max_move >= STRONG_MOVE_THRESHOLD:
        return "High", "Large cross-market move detected. Review exposure before adding risk."
    if max_move >= MOVE_ALERT_THRESHOLD or bias in {"bullish", "bearish"}:
        return "Medium", "Market conditions are active. Wait for confirmation before acting."
    return "Low", "No urgent dislocation detected."


def _top_moves(prices: Dict[str, Any]) -> List[str]:
    ranked = sorted(prices.items(), key=lambda i: abs(float(i[1].get("change", 0))), reverse=True)
    return [f"{n} {float(i.get('change', 0)):+.2f}%" for n, i in ranked[:3]]


def _news_digest(headlines: Iterable[str], limit: int = 5) -> List[str]:
    return [h.strip() for h in headlines if h and h.strip()][:limit]


def build_decision_brief(prices: Dict[str, Any], headlines: List[str], sentiment: str) -> Dict[str, Any]:
    risk, action = _risk_level(prices, sentiment)
    return {"headline": f"MarketPulse: {'high-attention' if risk == 'High' else _sentiment_bias(sentiment) + ' pressure building' if _sentiment_bias(sentiment) in ('bullish','bearish') else 'routine market scan'}", "risk": risk, "action": action, "top_moves": _top_moves(prices), "news_digest": _news_digest(headlines), "sentiment": sentiment.strip()}


def format_telegram_brief(prices: Dict[str, Any], brief: Dict[str, Any]) -> str:
    lines = [f"<b>{escape(str(brief['headline']))}</b>", "", f"<b>Risk level:</b> {escape(str(brief['risk']))}", f"<b>Suggested posture:</b> {escape(str(brief['action']))}", "", "<b>Prices</b>"]
    for asset, info in prices.items():
        d = "+" if info.get("change", 0) >= 0 else "-"
        lines.append(f"{d} <b>{escape(str(asset))}</b>: <code>${float(info.get('price',0)):,.2f}</code> ({float(info.get('change',0)):+.2f}%)")
    if brief.get("top_moves"):
        lines.extend(["", "<b>Largest moves</b>"] + [f"- {escape(m)}" for m in brief["top_moves"]])
    if brief.get("news_digest"):
        lines.extend(["", "<b>News drivers</b>"] + [f"- {escape(h)}" for h in brief["news_digest"]])
    lines.extend(["", "<b>AI read</b>", escape(str(brief.get("sentiment",""))), "", "<i>Educational decision support only. Not financial advice.</i>"])
    return "\n".join(lines)
