"""
MarketPulse — entry point.
"""

import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import logging
import os
import runpy

from dotenv import load_dotenv
load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s")
logger = logging.getLogger("marketpulse")

REQUIRED = ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"]
AI_KEYS = ["GOOGLE_API_KEY", "OPENROUTER_API_KEY", "OPENCODE_API_KEY"]

def _validate_env():
    missing = [v for v in REQUIRED if not os.getenv(v)]
    if missing:
        logger.error("Missing required env vars: %s", ", ".join(missing))
        sys.exit(1)
    if not any(os.getenv(k) for k in AI_KEYS):
        logger.error("No AI provider configured. Set one of: %s", ", ".join(AI_KEYS))
        sys.exit(1)

if __name__ == "__main__":
    _validate_env()
    if os.getenv("CI_ONE_SHOT", "false").lower() in {"1", "true", "yes"}:
        runpy.run_path(os.path.join(os.path.dirname(__file__), "test_cycle.py"), run_name="__main__")
    else:
        from bot import run_bot
        run_bot()
