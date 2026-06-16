"""Quick Phase 2 test — run with: python test_phase2.py"""
import os

os.environ.setdefault("PYTHONUTF8", "1")

import io
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

from dotenv import load_dotenv

load_dotenv()

print("--- Import check ---")
from brain import explain_signals, format_insider_brief
from insider import get_insider_trades
from signals import scan_signals

print("All imports OK\n")

print("--- Signal scan (NVDA, TSLA, AAPL, AMD, PLTR) ---")
sigs = scan_signals(["NVDA", "TSLA", "AAPL", "AMD", "PLTR"])
print(f"Signals found: {len(sigs)}")
for s in sigs:
    print(f"  {s['ticker']} | {s['label']} | confidence {s['confidence']}%")

if sigs:
    print("\n--- Gemini: explain_signals ---")
    print(explain_signals(sigs[:3]))

print("\n--- Insider fetch (limit=3, may be slow) ---")
trades = get_insider_trades(limit=3)
print(f"Trades found: {len(trades)}")
for t in trades:
    print(f"  {t['ticker']} {t['type']} ${t['value']:,.0f} by {t['owner']} ({t['role']})")

if trades:
    print("\n--- Gemini: format_insider_brief ---")
    print(format_insider_brief(trades))

print("\nALL PHASE 2 TESTS DONE")
