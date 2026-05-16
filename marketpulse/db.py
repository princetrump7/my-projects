"""
SQLite persistence layer.
Stores per-user watchlists. Lightweight — no ORM needed at this scale.
"""

from __future__ import annotations

import logging
import os
import sqlite3
from contextlib import contextmanager
from typing import Generator, List

logger = logging.getLogger(__name__)

DB_PATH = os.getenv("MARKETPULSE_DB", "marketpulse.db")


@contextmanager
def _conn() -> Generator[sqlite3.Connection, None, None]:
    """Context manager: open, commit or rollback, close."""
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    try:
        yield con
        con.commit()
    except Exception:
        con.rollback()
        raise
    finally:
        con.close()


def init_db() -> None:
    """Create schema if it doesn't exist yet."""
    with _conn() as con:
        con.execute("""
            CREATE TABLE IF NOT EXISTS watchlist (
                user_id  INTEGER NOT NULL,
                ticker   TEXT    NOT NULL COLLATE NOCASE,
                added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, ticker)
            )
        """)
    logger.info("DB ready at %s", DB_PATH)


# ---------------------------------------------------------------------------
# Watchlist CRUD
# ---------------------------------------------------------------------------

def get_watchlist(user_id: int) -> List[str]:
    """Return all tickers for a user, ordered by insertion time."""
    with _conn() as con:
        rows = con.execute(
            "SELECT ticker FROM watchlist WHERE user_id = ? ORDER BY added_at",
            (user_id,),
        ).fetchall()
    return [r["ticker"].upper() for r in rows]


def add_ticker(user_id: int, ticker: str) -> bool:
    """Add a ticker. Returns False if it already exists."""
    try:
        with _conn() as con:
            con.execute(
                "INSERT INTO watchlist (user_id, ticker) VALUES (?, ?)",
                (user_id, ticker.upper()),
            )
        return True
    except sqlite3.IntegrityError:
        return False  # duplicate


def remove_ticker(user_id: int, ticker: str) -> bool:
    """Remove a ticker. Returns False if it wasn't in the list."""
    with _conn() as con:
        cur = con.execute(
            "DELETE FROM watchlist WHERE user_id = ? AND ticker = ?",
            (user_id, ticker.upper()),
        )
    return cur.rowcount > 0


def clear_watchlist(user_id: int) -> int:
    """Remove all tickers for a user. Returns count removed."""
    with _conn() as con:
        cur = con.execute(
            "DELETE FROM watchlist WHERE user_id = ?", (user_id,)
        )
    return cur.rowcount
