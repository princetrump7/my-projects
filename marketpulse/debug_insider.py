"""Debug: inspect actual EFTS hit structure and try fetching one XML."""
import sys, io, json, urllib.request, urllib.parse
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

HEADERS = {"User-Agent": "MarketPulse-Research admin@example.com"}

def get(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=12) as r:
        return r.read().decode("utf-8", errors="replace")

from datetime import datetime, timedelta, timezone
today = datetime.now(timezone.utc).date()
start = today - timedelta(days=3)

params = urllib.parse.urlencode({
    "q": "", "forms": "4",
    "dateRange": "custom",
    "startdt": start.isoformat(),
    "enddt": today.isoformat(),
})
url = f"https://efts.sec.gov/LATEST/search-index?{params}"
body = get(url)
data = json.loads(body)
hits = data["hits"]["hits"]

print(f"Total hits available: {data['hits']['total']['value']}")
print(f"Hits in this batch: {len(hits)}")
print(f"\nFirst hit _id: {hits[0]['_id']}")
print(f"First hit _source keys: {list(hits[0]['_source'].keys())}")
print(f"First hit _source: {json.dumps(hits[0]['_source'], indent=2)[:600]}")

# Build URL the same way insider.py does
hit = hits[0]
hit_id = hit["_id"]
ciks = hit["_source"].get("ciks", [])
print(f"\nhit_id: {hit_id}")
print(f"ciks: {ciks}")

if ":" in hit_id and ciks:
    acc_raw, filename = hit_id.split(":", 1)
    cik = ciks[0].lstrip("0") or ciks[0]
    url2 = f"https://www.sec.gov/Archives/edgar/data/{cik}/{acc_raw}/{filename}"
    print(f"\nConstructed URL: {url2}")
    try:
        xml = get(url2)
        print(f"XML length: {len(xml)}")
        print(f"XML start: {xml[:300]}")
    except Exception as exc:
        print(f"Fetch failed: {exc}")
        # Try with integer CIK (no leading zero stripping)
        cik2 = str(int(ciks[0]))
        url3 = f"https://www.sec.gov/Archives/edgar/data/{cik2}/{acc_raw}/{filename}"
        print(f"\nTrying alternate URL: {url3}")
        try:
            xml = get(url3)
            print(f"XML length: {len(xml)}")
        except Exception as exc2:
            print(f"Also failed: {exc2}")
