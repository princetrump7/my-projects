"""
Telegram notification sender.
"""

import logging
import os
from typing import Optional

import requests

logger = logging.getLogger(__name__)

TELEGRAM_API_URL = "https://api.telegram.org/bot{token}/sendMessage"


def _get_credentials() -> tuple[str, str]:
    """Validate and return Telegram credentials from environment."""
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    chat_id = os.getenv("TELEGRAM_CHAT_ID")
    if not token or not chat_id:
        raise RuntimeError(
            "TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set in environment"
        )
    return token, chat_id


def send_alert(message: str) -> bool:
    """
    Send a message to the configured Telegram chat.

    Parameters
    ----------
    message : str
        The message text to send.

    Returns
    -------
    bool
        True if the message was sent successfully, False otherwise.
    """
    try:
        token, chat_id = _get_credentials()
    except RuntimeError as exc:
        logger.error(str(exc))
        return False

    url = TELEGRAM_API_URL.format(token=token)
    payload = {
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "HTML",
        "disable_web_page_preview": True
    }

    try:
        response = requests.post(url, data=payload, timeout=30)
        response.raise_for_status()
        logger.info("Telegram alert sent successfully")
        return True

    except requests.exceptions.RequestException as exc:
        logger.error("Failed to send Telegram alert: %s", exc)
        return False


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    from dotenv import load_dotenv

    load_dotenv()
    send_alert("🧪 *Test Alert*\nMarketPulse bot is online!")
