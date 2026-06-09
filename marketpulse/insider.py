"""
SEC EDGAR insider trade tracker — EFTS + Form 4 XML parsing.
"""

from __future__ import annotations

import json
import logging
import os
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

_HEADERS = {"User-Agent": f"MarketPulse-Research {os.getenv('SEC_CONTACT_EMAIL', 'admin@example.com')}"}
_EFTS_URL = "https://efts.sec.gov/LATEST/search-index"
_ARCHIVE_BASE = "https://www.sec.gov/Archives/edgar/data"
MIN_VALUE = 50_000
_BUY_CODES = {"P"}
_SELL_CODES = {"S"}


def _get(url: str) -> Optional[str]:
    try:
        req = urllib.request.Request(url, headers=_HEADERS)
        with urllib.request.urlopen(req, timeout=12) as r:
            return r.read().decode("utf-8", errors="replace")
    except Exception as exc:
        logger.debug("GET %s failed: %s", url, exc)
        return None


def _recent_form4_ids(days_back: int = 3, limit: int = 40) -> List[Dict]:
    today = datetime.now(timezone.utc).date()
    start = today - timedelta(days=days_back)
    params = urllib.parse.urlencode({"q": "", "forms": "4", "dateRange": "custom", "startdt": start.isoformat(), "enddt": today.isoformat()})
    body = _get(f"{_EFTS_URL}?{params}")
    if not body:
        return []
    try:
        return json.loads(body).get("hits", {}).get("hits", [])[:limit]
    except json.JSONDecodeError:
        return []


def _xml_url_from_hit(hit: Dict) -> Optional[str]:
    hit_id = hit.get("_id", "")
    ciks = hit.get("_source", {}).get("ciks", [])
    if ":" not in hit_id or not ciks:
        return None
    acc_raw, filename = hit_id.split(":", 1)
    cik = ciks[0].lstrip("0") or ciks[0]
    return f"{_ARCHIVE_BASE}/{cik}/{acc_raw.replace('-', '')}/{filename}"


def _parse_form4(xml_text: str) -> Optional[Dict[str, Any]]:
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError:
        return None
    def txt(p: str) -> str:
        el = root.find(p)
        return (el.text or "").strip() if el is not None else ""
    ticker = txt("issuer/issuerTradingSymbol").upper()
    if not ticker:
        return None
    company = txt("issuer/issuerName")
    owner = txt("reportingOwner/reportingOwnerId/rptOwnerName")
    t_title = txt("reportingOwner/reportingOwnerRelationship/officerTitle")
    is_dir = txt("reportingOwner/reportingOwnerRelationship/isDirector") == "1"
    is_10pct = txt("reportingOwner/reportingOwnerRelationship/isTenPercentOwner") == "1"
    role = t_title or ("Director" if is_dir else ("10% Owner" if is_10pct else "Insider"))
    best = None
    for txn in root.findall(".//nonDerivativeTransaction"):
        code = txt("transactionCoding/transactionCode")
        if code not in (_BUY_CODES | _SELL_CODES):
            continue
        try:
            shares = float(txn.find("transactionAmounts/transactionShares/value").text or "0")
            price = float(txn.find("transactionAmounts/transactionPricePerShare/value").text or "0")
        except (AttributeError, ValueError):
            continue
        if price == 0:
            continue
        total = shares * price
        if total < MIN_VALUE:
            continue
        if best is None or total > best["value"]:
            best = {"ticker": ticker, "company": company, "owner": owner, "role": role, "type": "BUY" if code in _BUY_CODES else "SELL", "shares": int(shares), "price": round(price, 2), "value": round(total), "date": txt("transactionDate/value")}
    return best


def get_insider_trades(limit: int = 6) -> List[Dict[str, Any]]:
    hits = _recent_form4_ids(days_back=3, limit=limit * 5)
    results = []
    for hit in hits:
        if len(results) >= limit:
            break
        xml_url = _xml_url_from_hit(hit)
        if not xml_url:
            continue
        xml = _get(xml_url)
        if not xml:
            continue
        trade = _parse_form4(xml)
        if trade:
            results.append(trade)
    return results
