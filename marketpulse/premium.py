"""
Premium tier system — feature gating, tier checks, and donation info.
"""

from __future__ import annotations

import os

from db import get_user_tier, is_premium, set_user_tier

WATCHLIST_LIMITS = {"free": 10, "premium": 100, "patron": 100}
PREMIUM_FEATURES = ["insiders_90day", "real_time_alerts", "unlimited_watchlist"]
DONATION_URLS = {"buymeacoffee": os.getenv("BUYMEACOFFEE_URL"), "github_sponsors": os.getenv("GITHUB_SPONSORS_URL")}


def get_watchlist_limit(user_id: int) -> int:
    return WATCHLIST_LIMITS.get(get_user_tier(user_id), 10)


def has_feature(user_id: int, feature: str) -> bool:
    return True if is_premium(user_id) else feature not in PREMIUM_FEATURES


def upgrade_message(user_id: int) -> str:
    return ("🔒 <b>Premium Feature</b>\n\nThis requires <b>MarketPulse Premium</b>.\n\n"
            "Premium unlocks:\n• 90-day insider lookback\n• Real-time signal alerts\n• Unlimited watchlist\n\n"
            "Support via donation: /donate\n<i>Already a patron? /redeem CODE</i>")


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
