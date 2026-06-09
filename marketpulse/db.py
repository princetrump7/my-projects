"""
SQLite persistence layer — watchlists, user tiers, alerts, sentiment history.
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
    with _conn() as con:
        con.execute("""
            CREATE TABLE IF NOT EXISTS watchlist (
                user_id  INTEGER NOT NULL,
                ticker   TEXT    NOT NULL COLLATE NOCASE,
                added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, ticker)
            )
        """)
        con.execute("""
            CREATE TABLE IF NOT EXISTS ticker_sentiment (
                ticker   TEXT NOT NULL COLLATE NOCASE,
                date     TEXT NOT NULL,
                sentiment_score REAL DEFAULT 0.0,
                bullish_count   INTEGER DEFAULT 0,
                bearish_count   INTEGER DEFAULT 0,
                neutral_count   INTEGER DEFAULT 0,
                source   TEXT DEFAULT 'news',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (ticker, date, source)
            )
        """)
        con.execute("""
            CREATE TABLE IF NOT EXISTS user_tiers (
                user_id    INTEGER PRIMARY KEY,
                tier       TEXT NOT NULL DEFAULT 'free',
                source     TEXT DEFAULT 'donation',
                expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        con.execute("""
            CREATE TABLE IF NOT EXISTS user_alerts (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id     INTEGER NOT NULL,
                ticker      TEXT NOT NULL COLLATE NOCASE,
                signal_type TEXT NOT NULL,
                chat_id     INTEGER,
                enabled     INTEGER DEFAULT 1,
                last_fired  TIMESTAMP,
                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, ticker, signal_type)
            )
        """)
    logger.info("DB ready at %s", DB_PATH)


# ---------------------------------------------------------------------------
# Watchlist
# ---------------------------------------------------------------------------

def get_watchlist(user_id: int) -> List[str]:
    with _conn() as con:
        rows = con.execute("SELECT ticker FROM watchlist WHERE user_id = ? ORDER BY added_at", (user_id,)).fetchall()
    return [r["ticker"].upper() for r in rows]


def add_ticker(user_id: int, ticker: str) -> bool:
    try:
        with _conn() as con:
            con.execute("INSERT INTO watchlist (user_id, ticker) VALUES (?, ?)", (user_id, ticker.upper()))
        return True
    except sqlite3.IntegrityError:
        return False


def remove_ticker(user_id: int, ticker: str) -> bool:
    with _conn() as con:
        cur = con.execute("DELETE FROM watchlist WHERE user_id = ? AND ticker = ?", (user_id, ticker.upper()))
    return cur.rowcount > 0


def clear_watchlist(user_id: int) -> int:
    with _conn() as con:
        cur = con.execute("DELETE FROM watchlist WHERE user_id = ?", (user_id,))
    return cur.rowcount


# ---------------------------------------------------------------------------
# User tiers
# ---------------------------------------------------------------------------

def get_user_tier(user_id: int) -> str:
    with _conn() as con:
        row = con.execute("SELECT tier FROM user_tiers WHERE user_id = ?", (user_id,)).fetchone()
    return row["tier"] if row else "free"


def set_user_tier(user_id: int, tier: str, source: str = "donation") -> None:
    with _conn() as con:
        con.execute("""
            INSERT INTO user_tiers (user_id, tier, source)
            VALUES (?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET tier = excluded.tier, source = excluded.source
        """, (user_id, tier, source))


def is_premium(user_id: int) -> bool:
    return get_user_tier(user_id) in ("premium", "patron")


# ---------------------------------------------------------------------------
# Ticker sentiment
# ---------------------------------------------------------------------------

def save_sentiment(ticker: str, date: str, score: float, bullish: int = 0, bearish: int = 0, neutral: int = 0, source: str = "news") -> None:
    with _conn() as con:
        con.execute("""
            INSERT INTO ticker_sentiment (ticker, date, sentiment_score, bullish_count, bearish_count, neutral_count, source)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(ticker, date, source) DO UPDATE SET
                sentiment_score = excluded.sentiment_score, bullish_count = excluded.bullish_count,
                bearish_count = excluded.bearish_count, neutral_count = excluded.neutral_count
        """, (ticker.upper(), date, score, bullish, bearish, neutral, source))


def get_sentiment_history(ticker: str, days: int = 7, source: str | None = None) -> list:
    with _conn() as con:
        if source:
            rows = con.execute("SELECT date, sentiment_score, bullish_count, bearish_count, neutral_count, source FROM ticker_sentiment WHERE ticker = ? AND source = ? ORDER BY date DESC LIMIT ?", (ticker.upper(), source, days)).fetchall()
        else:
            rows = con.execute("SELECT date, sentiment_score, bullish_count, bearish_count, neutral_count, source FROM ticker_sentiment WHERE ticker = ? ORDER BY date DESC LIMIT ?", (ticker.upper(), days)).fetchall()
    return [dict(r) for r in rows]


# ---------------------------------------------------------------------------
# User alerts
# ---------------------------------------------------------------------------

def add_alert(user_id: int, ticker: str, signal_type: str, chat_id: int | None = None) -> bool:
    try:
        with _conn() as con:
            con.execute("INSERT INTO user_alerts (user_id, ticker, signal_type, chat_id) VALUES (?, ?, ?, ?)", (user_id, ticker.upper(), signal_type, chat_id))
        return True
    except sqlite3.IntegrityError:
        return False


def remove_alert(user_id: int, ticker: str, signal_type: str) -> bool:
    with _conn() as con:
        cur = con.execute("DELETE FROM user_alerts WHERE user_id = ? AND ticker = ? AND signal_type = ?", (user_id, ticker.upper(), signal_type))
    return cur.rowcount > 0


def get_alerts(user_id: int | None = None) -> list:
    with _conn() as con:
        if user_id:
            rows = con.execute("SELECT id, user_id, ticker, signal_type, enabled, last_fired, created_at FROM user_alerts WHERE user_id = ? AND enabled = 1 ORDER BY created_at DESC", (user_id,)).fetchall()
        else:
            rows = con.execute("SELECT id, user_id, ticker, signal_type, enabled, last_fired, created_at FROM user_alerts WHERE enabled = 1 ORDER BY created_at DESC").fetchall()
    return [dict(r) for r in rows]


def mark_alert_fired(alert_id: int) -> None:
    with _conn() as con:
        con.execute("UPDATE user_alerts SET last_fired = CURRENT_TIMESTAMP WHERE id = ?", (alert_id,))
