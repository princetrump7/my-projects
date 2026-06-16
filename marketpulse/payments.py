"""
Stripe payment integration — lazy import, no-ops gracefully when not configured.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any

from db import set_user_tier

logger = logging.getLogger(__name__)


def _configured() -> bool:
    return bool(os.getenv("STRIPE_SECRET_KEY"))


def _client() -> Any | None:
    key = os.getenv("STRIPE_SECRET_KEY")
    if not key:
        return None
    try:
        import stripe
        stripe.api_key = key
        return stripe
    except ImportError:
        logger.warning("stripe not installed — run: pip install stripe")
        return None


def create_checkout_session(user_id: int, tier: str = "premium", success_url: str = "https://t.me/YourBot", cancel_url: str = "https://t.me/YourBot") -> tuple[str | None, str | None]:
    s = _client()
    if not _configured() or not s:
        return None, "Stripe not configured. Use /donate."
    price_id = os.getenv(f"STRIPE_{tier.upper()}_PRICE_ID", "")
    if not price_id:
        return None, f"No price ID for tier '{tier}'."
    try:
        session = s.checkout.Session.create(
            mode="subscription" if tier == "premium" else "payment",
            line_items=[{"price": price_id, "quantity": 1}],
            success_url=success_url, cancel_url=cancel_url,
            client_reference_id=str(user_id),
            metadata={"tier": tier, "user_id": str(user_id)},
        )
        return session.url, session.id
    except Exception as exc:
        logger.error("Stripe session failed: %s", exc)
        return None, str(exc)


def handle_webhook(payload: bytes, sig_header: str) -> tuple[bool, str]:
    secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    try:
        if secret:
            import stripe
            event = stripe.Webhook.construct_event(payload, sig_header, secret)
        else:
            event = json.loads(payload)
    except Exception as exc:
        return False, str(exc)

    etype = event.get("type", "")
    if etype == "checkout.session.completed":
        s = event.get("data", {}).get("object", {})
        uid = s.get("metadata", {}).get("user_id") or s.get("client_reference_id")
        tier = s.get("metadata", {}).get("tier", "premium")
        if uid:
            try: set_user_tier(int(uid), tier, source="stripe")
            except: pass
        return True, "Provisioned"
    return True, f"Event {etype} received"


def is_configured() -> bool:
    return _configured()
