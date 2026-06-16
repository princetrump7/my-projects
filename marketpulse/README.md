# MarketPulse

AI market-intelligence Telegram bot for traders who need a fast answer to:
> "What changed in the market, why does it matter, and should I pay attention?"

Aggregates financial sentiment, insider trades, technical signals, and AI-powered analysis — all delivered via Telegram.

**Educational decision support, not financial advice.**

---

## Features

### 📊 Market Briefs
| Command | Description | Tier |
|---------|-------------|------|
| `/brief` | Morning alpha brief — mood, top mover, key risk, opportunity | Free |
| `/why TICKER` | Why did this stock move today? Price change + news analysis | Free |
| `/trending` | Hot tickers on Reddit right now + AI take on hype vs real momentum | Free |

### 🕵️ Insider Intelligence
| Command | Description | Tier |
|---------|-------------|------|
| `/insiders` | Recent SEC Form 4 insider buys/sells with AI analysis | Free (30d) |
| `/smartmoney` | Latest 13F filings from Buffett, Cathie Wood, Ackman, Dalio, etc. | Free |

### 📈 Technical Signals
| Command | Description | Tier |
|---------|-------------|------|
| `/signals` | Swing trade setups — volume spikes, EMA crosses, breakouts, RSI extremes, gap ups | Free |
| `/screener <query>` | AI natural language stock screener ("profitable tech over 200B market cap") | Free |

### 👤 Account Management
| Command | Description | Tier |
|---------|-------------|------|
| `/watchlist` | Manage your ticker watchlist (add/remove/show/clear) | Free (10 tickers) |
| `/start` | Welcome message + feature list | Free |

### 🤖 Scheduled Briefs
- **Morning Brief** — 9:15 AM ET (Mon-Fri)
- **Evening Recap** — 4:30 PM ET (Mon-Fri)

---

## Setup

```bash
cd marketpulse
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -e .
copy .env.example .env       # Windows
# cp .env.example .env       # macOS/Linux
```

Fill in `.env`:
```env
GOOGLE_API_KEY=your_gemini_api_key_here
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here
```

### Run

```bash
# One-shot dry run (for testing)
set CI_ONE_SHOT=true
python main.py

# Interactive bot (continuous polling)
set CI_ONE_SHOT=false
python main.py
```

### Docker

```bash
docker build -t marketpulse .
docker run --env-file .env marketpulse
```

### GitHub Actions (scheduled daily briefs)

Add these **secrets** to your repo:
- `GOOGLE_API_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

The workflow runs twice daily (Mon-Fri) at 9:15 AM ET and 4:30 PM ET.

---

## Architecture

```
marketpulse/
├── main.py              # Entry point — CI one-shot or bot polling
├── bot.py               # Telegram command handlers + JobQueue schedules
├── brain.py             # All Gemini prompt templates (single file, easy tuning)
├── db.py                # SQLite persistence (watchlists, user settings)
│
├── market.py            # Yahoo Finance price fetcher (3 fallback methods)
├── news.py              # RSS financial news scraper
├── reddit.py            # Reddit trend scraper (5 subreddits)
├── sentiment.py         # Gemini-powered sentiment analysis engine
├── intelligence.py      # Decision brief builder + Telegram HTML formatter
├── notifier.py          # Single-chat Telegram alert sender
│
├── insider.py           # SEC EDGAR Form 4 insider trade fetching
├── smartmoney.py        # SEC EDGAR 13F-HR filing tracker (6 investors)
├── signals.py           # Technical signal engine (6 signal types)
├── screener.py          # AI natural language stock screener
├── universe.py          # LIQUID_100 ticker list for screener
│
├── run_scheduled.py     # GitHub Actions scheduled brief runner
├── test_cycle.py        # One-shot end-to-end smoke test
│
├── pyproject.toml       # Project config (hatchling build, uv-compatible)
├── requirements.txt     # Fallback pip deps (auto-generated from pyproject.toml)
├── Dockerfile           # Container build
└── .github/workflows/   # GitHub Actions CI/CD
```

### Data Flow

```
External Sources                    MarketPulse                     Telegram
─────────────────                   ───────────                     ────────
Yahoo Finance ──→ market.py ──┐
RSS Feeds     ──→ news.py   ──┤
Reddit        ──→ reddit.py ──┤→ brain.py/sentiment.py ──→ bot.py ──→ User
SEC EDGAR     ──→ insider.py ─┤        (Gemini AI)        (formatting)
SEC EDGAR     ──→ smartmoney.py    ↑
Yahoo Finance ──→ signals.py  ────┘
                        SQLite (watchlists, settings)
```

---

## Dependencies

| Category | Packages |
|----------|----------|
| Market data | `yfinance`, `pandas` |
| News | `feedparser`, `requests` |
| AI | `google-genai` (Gemini 2.5 Flash) |
| Telegram | `python-telegram-bot[job-queue]` |
| Config | `python-dotenv`, `pytz` |

Optional: `fastapi`, `uvicorn`, `jinja2` (web companion), `stripe` (payments)

---

## Monetization

- **Free**: All core features, daily scheduled briefs
- **Premium** (planned): Real-time alerts, 90-day insider lookback, unlimited watchlist, Bull/Bear AI arguments
- **Donations**: Support development via Buy Me a Coffee / GitHub Sponsors

---

## Troubleshooting

- **`GOOGLE_API_KEY not set`**: Ensure `.env` exists with a valid API key
- **No Telegram messages**: Start a chat with your bot first, verify `TELEGRAM_CHAT_ID`
- **Empty price data**: Confirm the ticker is supported by Yahoo Finance
- **SEC 429 errors**: The SEC rate-limits aggressive scraping. Tune `days_back` in `insider.py`

---

## Development

```bash
# Install with optional web deps
pip install -e ".[web]"

# Install everything (web + payments)
pip install -e ".[all]"

# Run tests
pytest
```
