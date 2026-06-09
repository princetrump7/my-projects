"""
Alerts engine — per-user alert scanning and notification delivery.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from db import get_alerts, mark_alert_fired
from insider import get_insider_trades
from signals import scan_signals

logger = logging.getLogger(__name__)

ALERT_TYPES = {
    "insider": "Insider trade detected",
    "volume_spike": "Unusual volume spike",
    "breakout": "20-day breakout signal",
    "rsi_oversold": "RSI oversold bounce opportunity",
}

SIGNAL_MAP = {"volume_spike": "VOLUME_SPIKE", "breakout": "BREAKOUT", "rsi_oversold": "RSI_OVERSOLD"}


def scan_and_notify(context: Any = None) -> List[str]:
    sent = []
    alerts = get_alerts()
    if not alerts:
        return sent

    ticker_alerts: Dict[str, List[Dict]] = {}
    for a in alerts:
        ticker_alerts.setdefault(a["ticker"], []).append(a)

    insider_tickers = {t for t, ta in ticker_alerts.items() if any(a["signal_type"] == "insider" for a in ta)}
    signal_tickers = {t for t, ta in ticker_alerts.items() if any(a["signal_type"] in SIGNAL_MAP for a in ta)}

    insider_trades = get_insider_trades(limit=20) if insider_tickers else []
    signals = scan_signals(list(signal_tickers)) if signal_tickers else []

    for ticker, alerts_list in ticker_alerts.items():
        for alert in alerts_list:
            msg = _check(alert, insider_trades, signals)
            if msg and context and alert.get("chat_id"):
                try:
                    context.bot.send_message(chat_id=alert["chat_id"], text=msg, parse_mode="HTML", disable_web_page_preview=True)
                    mark_alert_fired(alert["id"])
                    sent.append(f"{ticker}/{alert['signal_type']}")
                except Exception as e:
                    logger.debug("Alert send failed: %s", e)
    return sent


def _check(alert: Dict, insider_trades: List[Dict], signals: List[Dict]) -> Optional[str]:
    t = alert["ticker"].upper()
    st = alert["signal_type"]
    if st == "insider":
        for tr in insider_trades:
            if tr.get("ticker", "").upper() == t:
                d = "bought" if tr["type"] == "BUY" else "sold"
                return f"🚨 <b>{t}</b>: {tr['role']} {d} ${tr['value']:,.0f} at ${tr['price']:.2f}"
    elif st in SIGNAL_MAP:
        for s in signals:
            if s.get("ticker", "").upper() == t and s.get("signal") == SIGNAL_MAP[st]:
                return f"📈 <b>{t}</b> — {s['label']}: {s['detail']}"
    return None
