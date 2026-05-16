"""
Smart Money / Copy Trading tracker.
Uses SEC EDGAR EFTS API to monitor 13F-HR filings for famous investors.
"""

from __future__ import annotations

import json
import logging
import urllib.request
import urllib.parse
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List

logger = logging.getLogger(__name__)

_HEADERS = {"User-Agent": "MarketPulse-Research admin@example.com"}
_EFTS_URL = "https://efts.sec.gov/LATEST/search-index"

# Famous hedge funds / investors CIKs
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
    except Exception as exc:
        logger.debug("GET %s failed: %s", url, exc)
        return None

def get_recent_13f(days_back: int = 90) -> List[Dict[str, Any]]:
    """
    Fetch recent 13F-HR filings for tracked smart money.
    """
    today = datetime.now(timezone.utc).date()
    start = today - timedelta(days=days_back)
    
    ciks_str = ",".join(f'"{c}"' for c in SMART_MONEY_CIKS.keys())

    params = urllib.parse.urlencode({
        "q": f"ciks:({ciks_str})",
        "forms": "13F-HR",
        "dateRange": "custom",
        "startdt": start.isoformat(),
        "enddt": today.isoformat(),
        "hits.hits.total.value": "true",
    })
    url = f"{_EFTS_URL}?{params}"

    body = _get(url)
    if not body:
        return []

    try:
        data = json.loads(body)
        hits = data.get("hits", {}).get("hits", [])
    except json.JSONDecodeError as exc:
        logger.error("EFTS JSON parse failed: %s", exc)
        return []

    results = []
    for hit in hits:
        hit_id = hit.get("_id", "")
        source = hit.get("_source", {})
        ciks = source.get("ciks", [])
        if not ciks or ":" not in hit_id:
            continue
            
        cik = ciks[0].zfill(10)
        investor_name = SMART_MONEY_CIKS.get(cik, "Unknown Investor")
        
        acc_raw, filename = hit_id.split(":", 1)
        url2 = f"https://www.sec.gov/Archives/edgar/data/{cik.lstrip('0')}/{acc_raw.replace('-', '')}/{filename}"
        
        results.append({
            "investor": investor_name,
            "form": "13F-HR",
            "date": source.get("file_date", "Unknown"),
            "url": url2
        })

    return results

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    res = get_recent_13f()
    for r in res:
        print(r)
