"""
MarketPulse — entry point.

Run modes
---------
Normal:    python main.py          → starts the interactive Telegram bot
CI/test:   CI_ONE_SHOT=true        → runs test_cycle.py once and exits
"""

# Ensure emoji / non-ASCII output works on Windows (cp1252 console).
import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import logging
import os
import runpy
import sys

from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("marketpulse")

# ---------------------------------------------------------------------------
# Env validation
# ---------------------------------------------------------------------------

REQUIRED = ["GOOGLE_API_KEY", "TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"]

def _validate_env() -> None:
    missing = [v for v in REQUIRED if not os.getenv(v)]
    if missing:
        logger.error("Missing env vars: %s", ", ".join(missing))
        sys.exit(1)

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    _validate_env()

    if os.getenv("CI_ONE_SHOT", "false").lower() in {"1", "true", "yes"}:
        # Lightweight CI smoke-test — no bot polling needed
        runpy.run_path(
            os.path.join(os.path.dirname(__file__), "test_cycle.py"),
            run_name="__main__",
        )
    else:
        from bot import run_bot
        run_bot()
