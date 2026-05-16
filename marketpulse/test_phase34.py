"""Quick Phase 3 & 4 test — run with: python test_phase34.py"""
import os
os.environ.setdefault("PYTHONUTF8", "1")

import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

from dotenv import load_dotenv
load_dotenv()

print("--- Import check ---")
from screener import screen_stocks
from smartmoney import get_recent_13f
from bot import build_app
print("All imports OK\n")

print("--- Testing Smart Money ---")
filings = get_recent_13f(days_back=90)
print(f"13F Filings found: {len(filings)}")
for f in filings[:3]:
    print(f"  {f['investor']} | {f['date']}")

if filings:
    from brain import format_smartmoney_brief
    print("\n--- Gemini: format_smartmoney_brief ---")
    print(format_smartmoney_brief(filings[:3]))

print("\n--- Testing Screener ---")
# Keep query simple to run fast
query = "big tech over 2000B market cap"
print(f"Screening query: {query}")
res = screen_stocks(query)
print(f"Found: {len(res)}")
for r in res:
    print(f"  {r['ticker']}: {r['marketCap']:.1f}B")

print("\nALL PHASE 3/4 TESTS DONE")
