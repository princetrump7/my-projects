# MarketPulse MVP v1 🤖📊

Real-time trading intelligence bot that tracks **Gold (XAU/USD)**, **stocks** (SPY, NASDAQ), and **breaking financial news**. It runs AI-powered sentiment analysis to detect early trend shifts and sends instant Telegram alerts.

---

## 🧱 Features

- **Live Market Data**: Pulls 5-minute interval prices for Gold, SPY, and NASDAQ via Yahoo Finance.
- **News Scraper**: Aggregates headlines from Investing.com, Yahoo Finance, and CNBC RSS feeds.
- **AI Sentiment Engine**: Uses OpenAI GPT-4o-mini to analyze sentiment, affected assets, and early trend signals.
- **Telegram Alerts**: Sends formatted, emoji-rich alerts to your Telegram chat every 10 minutes.
- **Graceful Shutdown**: Handles Ctrl+C and SIGTERM cleanly without losing state.
- **Robust Error Handling**: Individual component failures don't crash the bot.

---

## 📁 Project Structure

```
marketpulse/
├── main.py           # Orchestration loop
├── market.py         # Price fetcher (yfinance)
├── news.py           # RSS news scraper
├── sentiment.py      # OpenAI sentiment analysis
├── notifier.py       # Telegram alert sender
├── .env              # Environment variables (not committed)
├── .env.example      # Template for env vars
├── requirements.txt  # Python dependencies
├── .gitignore        # Python gitignore
└── README.md         # This file
```

---

## ⚙️ Installation

### 1. Clone / Navigate to Project

```bash
cd marketpulse
```

### 2. Create Virtual Environment (Recommended)

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

---

## 🔑 Environment Variables

Copy the example file and fill in your real credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrSTUvwxyz
TELEGRAM_CHAT_ID=123456789
```

### How to Get Credentials

| Variable | How to Obtain |
|----------|--------------|
| `OPENAI_API_KEY` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| `TELEGRAM_BOT_TOKEN` | Message [@BotFather](https://t.me/botfather) on Telegram, create a new bot, and copy the token. |
| `TELEGRAM_CHAT_ID` | Message [@userinfobot](https://t.me/userinfobot) on Telegram to get your numeric user ID. |

---

## 🚀 Usage

### Run the Bot

```bash
python main.py
```

You should see output like:

```
2024-05-20 14:30:00 | INFO     | marketpulse | ==================================================
2024-05-20 14:30:00 | INFO     | marketpulse | MarketPulse Bot started
2024-05-20 14:30:00 | INFO     | marketpulse | Scan interval: 600 seconds
2024-05-20 14:30:00 | INFO     | marketpulse | ==================================================
2024-05-20 14:30:05 | INFO     | marketpulse | --- Cycle 1 ---
...
```

### Stop the Bot

Press `Ctrl+C` for graceful shutdown.

---

## 📲 Example Telegram Alert

```
📊 MarketPulse Update

💰 Prices
🟢 GOLD: $2,350.00 (+0.25%)
🔴 SPY: $520.00 (-0.15%)
🟢 NASDAQ: $16,500.00 (+0.40%)

🧠 Sentiment Analysis
Overall sentiment: bullish
Affected assets: gold, stocks
Early trend signal: yes
Confidence: 78
```

---

## ⚡ How It Detects Early Trends

1. **News Before Price Reacts**  
   RSS feeds update faster than chart indicators.

2. **Sentiment Clustering**  
   Multiple headlines pointing the same direction → stronger signal.

3. **Price + News Mismatch**  
   Example: Gold is rising, but bearish news floods in → possible reversal.

---

## 🔥 V2 Upgrade Ideas

- [ ] Twitter / X scraping for real-time crowd sentiment
- [ ] Correlation engine (USD ↔ Gold)
- [ ] Volatility spike detector
- [ ] BREAKING NEWS priority mode
- [ ] Backtesting system
- [ ] Web dashboard (SaaS-ready)

---

## 🛠 Troubleshooting

| Problem | Solution |
|---------|----------|
| `Import "dotenv" could not be resolved` | Run `pip install -r requirements.txt` inside your virtual environment. |
| `OPENAI_API_KEY not set` | Ensure `.env` exists and is populated; `python-dotenv` loads it automatically. |
| No Telegram messages | Double-check `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`. Start a chat with your bot first. |
| `yfinance` returns empty data | Some tickers (especially `XAUUSD=X`) can be intermittent. The bot logs warnings and skips them. |
| RSS feed fails | Individual feed failures are logged but don't stop the bot; others continue working. |

---

## 📜 License

MIT — build, trade, and iterate freely.
