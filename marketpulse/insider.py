"""
SEC EDGAR insider trade tracker.
Uses the EDGAR EFTS JSON search API (same as edgar.sec.gov/search) — no key needed.

Flow: EFTS search → accession IDs → Form 4 XML → structured trade data.
"""

from __future__ import annotations

import json
import logging
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# EDGAR requires a descriptive User-Agent
_HEADERS = {"User-Agent": "MarketPulse-Research admin@example.com"}

# EFTS full-text search endpoint (returns JSON)
_EFTS_URL = "https://efts.sec.gov/LATEST/search-index"

# Base URL for fetching actual filing XML
_ARCHIVE_BASE = "https://www.sec.gov/Archives/edgar/data"

# Minimum dollar value to include a trade
MIN_VALUE = 50_000

_BUY_CODES  = {"P"}   # open-market purchase
_SELL_CODES = {"S"}   # open-market sale


# ---------------------------------------------------------------------------
# HTTP helper
# ---------------------------------------------------------------------------

def _get(url: str) -> Optional[str]:
    """GET with EDGAR-required User-Agent."""
    try:
        req = urllib.request.Request(url, headers=_HEADERS)
        with urllib.request.urlopen(req, timeout=12) as r:
            return r.read().decode("utf-8", errors="replace")
    except Exception as exc:
        logger.debug("GET %s failed: %s", url, exc)
        return None


# ---------------------------------------------------------------------------
# EFTS search
# ---------------------------------------------------------------------------

def _recent_form4_ids(days_back: int = 3, limit: int = 40) -> List[Dict]:
    """
    Query EFTS for recent Form 4 filings.
    Returns list of dicts with keys: id (accession:filename), ciks, entity_names.
    """
    today = datetime.now(timezone.utc).date()
    start = today - timedelta(days=days_back)

    params = urllib.parse.urlencode({
        "q":       "",
        "forms":   "4",
        "dateRange": "custom",
        "startdt": start.isoformat(),
        "enddt":   today.isoformat(),
        "hits.hits.total.value": "true",
    })
    url = f"{_EFTS_URL}?{params}"

    body = _get(url)
    if not body:
        return []

    try:
        data = json.loads(body)
        hits = data.get("hits", {}).get("hits", [])
        return hits[:limit]
    except json.JSONDecodeError as exc:
        logger.error("EFTS JSON parse failed: %s", exc)
        return []


# ---------------------------------------------------------------------------
# Form 4 XML parser
# ---------------------------------------------------------------------------

def _xml_url_from_hit(hit: Dict) -> Optional[str]:
    """
    Construct the direct XML URL from an EFTS hit.
    Hit _id format: "0002060473-26-000002:wk-form4_1778847448.xml"
    We need: https://www.sec.gov/Archives/edgar/data/{cik}/{accession-no-dashes}/{filename}
    """
    hit_id = hit.get("_id", "")
    ciks   = hit.get("_source", {}).get("ciks", [])

    if ":" not in hit_id or not ciks:
        return None

    accession_raw, filename = hit_id.split(":", 1)
    # Accession format on disk: 0002060473-26-000002 → 002060473/0002060473-26-000002/
    # CIK: pick first, strip leading zeros
    cik = ciks[0].lstrip("0") or ciks[0]
    # Accession as path (keep dashes for the folder name, strip dashes for file path component)
    acc_folder = accession_raw.replace("-", "")  # e.g., 000206047326000002

    url = f"{_ARCHIVE_BASE}/{cik}/{acc_folder}/{filename}"
    return url


def _parse_form4(xml_text: str) -> Optional[Dict[str, Any]]:
    """Extract the largest open-market buy or sell from a Form 4 XML."""
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError:
        return None

    def txt(path: str) -> str:
        el = root.find(path)
        return (el.text or "").strip() if el is not None else ""

    ticker  = txt("issuer/issuerTradingSymbol").upper()
    company = txt("issuer/issuerName")
    owner   = txt("reportingOwner/reportingOwnerId/rptOwnerName")
    t_title = txt("reportingOwner/reportingOwnerRelationship/officerTitle")
    is_dir  = txt("reportingOwner/reportingOwnerRelationship/isDirector") == "1"
    is_10pct = txt("reportingOwner/reportingOwnerRelationship/isTenPercentOwner") == "1"
    role    = t_title or ("Director" if is_dir else ("10% Owner" if is_10pct else "Insider"))

    if not ticker:
        return None

    best: Optional[Dict] = None
    for txn in root.findall(".//nonDerivativeTransaction"):
        def v(p: str) -> str:
            el = txn.find(p)
            return (el.text or "").strip() if el is not None else ""

        code = v("transactionCoding/transactionCode")
        if code not in (_BUY_CODES | _SELL_CODES):
            continue
        try:
            shares = float(v("transactionAmounts/transactionShares/value") or "0")
            price  = float(v("transactionAmounts/transactionPricePerShare/value") or "0")
        except ValueError:
            continue

        if price == 0:
            continue
        total = shares * price
        if total < MIN_VALUE:
            continue

        if best is None or total > best["value"]:
            best = {
                "ticker":  ticker,
                "company": company,
                "owner":   owner,
                "role":    role,
                "type":    "BUY" if code in _BUY_CODES else "SELL",
                "shares":  int(shares),
                "price":   round(price, 2),
                "value":   round(total),
                "date":    v("transactionDate/value"),
            }
    return best


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_insider_trades(limit: int = 6) -> List[Dict[str, Any]]:
    """
    Fetch recent Form 4 insider trades from SEC EDGAR.

    Returns
    -------
    list of dicts: ticker, company, owner, role, type (BUY/SELL),
                   shares, price, value, date.
    """
    hits = _recent_form4_ids(days_back=3, limit=limit * 5)
    results: List[Dict] = []

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
            logger.info(
                "Insider: %s %s $%,.0f (%s)",
                trade["ticker"], trade["type"], trade["value"], trade["role"]
            )

    logger.info("Returning %d insider trades", len(results))
    return results


if __name__ == "__main__":
    import json as _json
    logging.basicConfig(level=logging.INFO)
    trades = get_insider_trades(limit=5)
    print(_json.dumps(trades, indent=2))
