"""
Smart Money / Copy Trading tracker — SEC EDGAR 13F-HR filings.
"""

from __future__ import annotations

import json
import logging
import os
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List

logger = logging.getLogger(__name__)

_HEADERS = {"User-Agent": f"MarketPulse-Research {os.getenv('SEC_CONTACT_EMAIL', 'admin@example.com')}"}
_EFTS_URL = "https://efts.sec.gov/LATEST/search-index"

SMART_MONEY_CIKS = {
    "0001067983": "Berkshire Hathaway (Warren Buffett)",
    "0001602495": "ARK Investment Management (Cathie Wood)",
    "0001166559": "Bill & Melinda Gates Foundation Trust",
    "0001569205": "Pershing Square (Bill Ackman)",
    "0001364742": "Renaissance Technologies",
    "0001166126": "Bridgewater Associates (Ray Dalio)",
}


def _get(url: str) -> str | None:
    try:
        req = urllib.request.Request(url, headers=_HEADERS)
        with urllib.request.urlopen(req, timeout=12) as r:
            return r.read().decode("utf-8", errors="replace")
    except Exception:
        return None


def get_recent_13f(days_back: int = 90) -> List[Dict[str, Any]]:
    today = datetime.now(timezone.utc).date()
    start = today - timedelta(days=days_back)
    ciks_str = ",".join(f'"{c}"' for c in SMART_MONEY_CIKS)
    params = urllib.parse.urlencode({"q": f"ciks:({ciks_str})", "forms": "13F-HR", "dateRange": "custom", "startdt": start.isoformat(), "enddt": today.isoformat()})
    body = _get(f"{_EFTS_URL}?{params}")
    if not body:
        return []
    try:
        hits = json.loads(body).get("hits", {}).get("hits", [])
    except json.JSONDecodeError:
        return []
    results = []
    for hit in hits:
        hit_id = hit.get("_id", "")
        source = hit.get("_source", {})
        ciks = source.get("ciks", [])
        if not ciks or ":" not in hit_id:
            continue
        cik = ciks[0].zfill(10)
        name = SMART_MONEY_CIKS.get(cik, "Unknown Investor")
        acc_raw, filename = hit_id.split(":", 1)
        url = f"https://www.sec.gov/Archives/edgar/data/{cik.lstrip('0')}/{acc_raw.replace('-', '')}/{filename}"
        results.append({"investor": name, "form": "13F-HR", "date": source.get("file_date", "Unknown"), "url": url})
    return results
