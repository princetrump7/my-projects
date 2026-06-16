"""
Premium tier system — Free / Pro ($15/mo) / Elite ($39/mo) with feature gating.
"""

from __future__ import annotations

import os

from db import get_user_tier

TIER_DEFS = {
    "free": {"watchlist_limit": 10, "label": "🟢 Free", "price": "$0"},
    "pro": {"watchlist_limit": 100, "label": "🔵 Pro", "price": "$15/mo"},
    "elite": {"watchlist_limit": 250, "label": "🔴 Elite", "price": "$39/mo"},
    "patron": {"watchlist_limit": 250, "label": "🟣 Patron", "price": "donation"},
}

ELITE_FEATURES = ["portfolio_analysis", "ai_trade_journal", "early_catalyst", "priority_ai"]
PRO_FEATURES = ["real_time_alerts", "insider_alpha", "catalyst_scanner", "radar", "conviction_engine", "battle"] + ELITE_FEATURES

DONATION_URLS = {"buymeacoffee": os.getenv("BUYMEACOFFEE_URL"), "github_sponsors": os.getenv("GITHUB_SPONSORS_URL")}


def _tier_rank(tier: str) -> int:
    return {"elite": 3, "patron": 3, "pro": 2, "free": 1}.get(tier, 1)


def get_watchlist_limit(user_id: int) -> int:
    tier = get_user_tier(user_id)
    return TIER_DEFS.get(tier, TIER_DEFS["free"])["watchlist_limit"]


def has_feature(user_id: int, feature: str) -> bool:
    tier = get_user_tier(user_id)
    rank = _tier_rank(tier)
    if feature in PRO_FEATURES and rank >= 2:
        return True
    if feature in ELITE_FEATURES and rank >= 3:
        return True
    return False


def upgrade_message(user_id: int) -> str:
    return (
        "🔒 <b>Premium Feature</b>\n\n"
        "This requires <b>MarketPulse Pro</b> or <b>Elite</b>.\n\n"
        "<b>Pro</b> — $15/mo\n"
        "• Real-time alerts\n"
        "• Insider Alpha interpretation\n"
        "• Catalyst scanner\n"
        "• Opportunity Radar\n"
        "• Conviction Engine\n"
        "• Stock Battles\n\n"
        "<b>Elite</b> — $39/mo\n"
        "• Everything in Pro\n"
        "• Portfolio analysis\n"
        "• AI trade journal\n"
        "• Early catalyst detection\n"
        "• Priority AI processing\n"
        "• 250-ticker watchlist\n\n"
        "Use /premium to learn more.\n"
        "<i>Already a patron? /redeem CODE</i>"
    )


def tier_info() -> str:
    return (
        "<b>⚡ MarketPulse Tiers</b>\n\n"
        "🟢 <b>Free</b> — $0\n"
        "Pulse score, basic setups, news, /why, /story\n\n"
        "🔵 <b>Pro</b> — $15/mo\n"
        "Real-time alerts, Insider Alpha, Catalyst scanner, Radar, /battle\n\n"
        "🔴 <b>Elite</b> — $39/mo\n"
        "Unlimited alerts, portfolio analysis, AI trade journal, early catalysts\n\n"
        "Use /donate to support and get access."
    )


def donation_links() -> str:
    links = []
    if DONATION_URLS.get("buymeacoffee"):
        links.append(f"☕ <a href='{DONATION_URLS['buymeacoffee']}'>Buy Me a Coffee</a>")
    if DONATION_URLS.get("github_sponsors"):
        links.append(f"❤️ <a href='{DONATION_URLS['github_sponsors']}'>GitHub Sponsors</a>")
    if not links:
        return ("💖 <b>Support MarketPulse</b>\n\n"
                "No donation links configured.\nSet BUYMEACOFFEE_URL or GITHUB_SPONSORS_URL in .env")
    return "💖 <b>Support MarketPulse</b>\n\n" + "\n".join(links) + "\n\n<i>Donors get premium access!</i>"
