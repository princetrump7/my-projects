# MarketPulse

MarketPulse is an AI market-intelligence bot for busy traders, founders, and finance creators who need a fast answer to one painful question:

> "What changed in the market, why does it matter, and should I pay attention now?"

It monitors a configurable asset watchlist, pulls current financial headlines, runs AI sentiment analysis, and sends a concise Telegram decision brief with risk level, suggested posture, top price moves, news drivers, and what to watch next.

This is educational decision support, not financial advice.

## Why People Would Pay

Most retail traders and market-aware operators lose time jumping between charts, news tabs, social feeds, and Telegram groups. MarketPulse reduces that noise into a simple recurring brief:

- Saves time by compressing market data and headlines into one alert.
- Reduces missed moves by flagging large cross-market shifts.
- Lowers decision stress by separating routine scans from high-attention setups.
- Creates a monetizable signal layer for private communities, newsletters, paid Telegram channels, and creator products.

## Current Features

- Configurable watchlist through `MARKETPULSE_ASSETS`.
- Yahoo Finance market data via `yfinance`.
- RSS headline collection from financial news sources.
- Gemini-powered sentiment analysis.
- Telegram HTML alerts.
- Risk-level classification: `Low`, `Medium`, or `High`.
- Largest-move summary and news-driver digest.
- Safe one-shot mode for testing and scheduled deployments.
- Graceful shutdown for long-running bot mode.

## Example Alert

```text
MarketPulse: bearish news pressure building

Risk level: Medium
Suggested posture: Market conditions are active. Wait for confirmation before acting.

Prices
+ GOLD: $382.10 (+0.42%)
- SPY: $640.20 (-0.81%)
+ BTC: $72,450.00 (+1.34%)

Largest moves
- BTC +1.34%
- SPY -0.81%
- GOLD +0.42%

News drivers
- Fed officials signal patience on rates
- Gold holds gains as dollar softens

AI read
Overall sentiment: bearish
Affected assets: stocks, usd, gold
Early trend signal: yes
Confidence: 74
Why it matters: Risk assets may remain sensitive to rate expectations.
Watch next: US inflation data and Treasury yields.
```

## Setup

```bash
cd marketpulse
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Fill in `.env`:

```env
GOOGLE_API_KEY=your_gemini_api_key_here
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here
SCAN_INTERVAL_SECONDS=600
MARKETPULSE_ASSETS=GOLD=GLD,SPY=SPY,NASDAQ=^IXIC,BTC=BTC-USD
```

## Run

By default, `main.py` runs a one-shot cycle for safer testing.

```bash
python main.py
```

To run continuously:

```bash
set CI_ONE_SHOT=false
python main.py
```

## Run Daily With GitHub Actions

This repo includes `.github/workflows/daily-marketpulse.yml` at the repository root, which runs MarketPulse once per day at `13:00 UTC` and can also be triggered manually from the GitHub Actions tab.

Add these repository secrets in GitHub:

- `GOOGLE_API_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

Optional repository variable:

- `MARKETPULSE_ASSETS`: overrides the default watchlist, for example `GOLD=GLD,SPY=SPY,NASDAQ=^IXIC,BTC=BTC-USD`.

To change the run time, edit the cron line in `.github/workflows/daily-marketpulse.yml`.

## Configuration

`SCAN_INTERVAL_SECONDS` controls how often the bot scans in continuous mode.

`MARKETPULSE_ASSETS` controls the watchlist. Use `NAME=TICKER` pairs separated by commas:

```env
MARKETPULSE_ASSETS=GOLD=GLD,SPY=SPY,NASDAQ=^IXIC,BTC=BTC-USD,ETH=ETH-USD
```

## Commercialization Path

Fastest marketable version:

- Launch a free Telegram channel with delayed or daily briefs.
- Offer a paid private channel with faster interval alerts and custom watchlists.
- Sell niche versions: crypto macro, gold/FX, stock-index risk, founder treasury watch.
- Add Stripe and a hosted dashboard after validating demand through Telegram.
- Add user-specific watchlists only after people are willing to pay for the default briefs.

Good starter pricing:

- Free: one daily public digest.
- Pro: $9-$19/month for 10-minute Telegram alerts.
- Community/Creator: $49-$199/month for branded private-channel briefs.

## Project Structure

```text
marketpulse/
├── main.py           # Orchestration loop
├── market.py         # Configurable price fetcher
├── news.py           # RSS news collector
├── sentiment.py      # Gemini sentiment engine
├── intelligence.py   # Decision brief and alert formatting
├── notifier.py       # Telegram sender
├── test_cycle.py     # One-shot end-to-end cycle
├── .env.example      # Configuration template
└── requirements.txt
```

## Troubleshooting

- `GOOGLE_API_KEY not set`: ensure `.env` exists and contains a valid key.
- No Telegram messages: start a chat with your bot first, then verify `TELEGRAM_CHAT_ID`.
- Empty price data: confirm the ticker is supported by Yahoo Finance.
- Dependency errors: run `pip install -r requirements.txt` inside the virtual environment.
- Telegram formatting errors: the app escapes user/news/AI content before sending HTML.

## Next High-ROI Upgrades

- Add a landing page with waitlist capture.
- Add Stripe subscriptions and per-user watchlists.
- Add alert thresholds per asset.
- Add a daily performance report showing which alerts preceded major moves.
- Add a simple web dashboard for non-Telegram users.
