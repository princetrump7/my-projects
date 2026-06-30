"""
Telegram notification sender.
"""

import logging
import os

import requests

logger = logging.getLogger(__name__)

TELEGRAM_API_URL = "https://api.telegram.org/bot{token}/sendMessage"


def send_alert(message: str) -> bool:
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    chat_id = os.getenv("TELEGRAM_CHAT_ID")
    if not token or not chat_id:
        logger.error("TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set")
        return False
    try:
        msg_preview = message[:80].replace("\n", " ")
        resp = requests.post(
            TELEGRAM_API_URL.format(token=token),
            data={
                "chat_id": chat_id,
                "text": message,
                "parse_mode": "HTML",
                "disable_web_page_preview": True,
            },
            timeout=30,
        )
        resp.raise_for_status()
        logger.info("Telegram message sent successfully (preview: %s)", msg_preview)
        return True
    except Exception as exc:
        logger.error("Failed to send alert: %s", exc)
        return False
