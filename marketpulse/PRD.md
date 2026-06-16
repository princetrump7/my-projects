# MarketPulse 2.0 — Product Requirements Document

**Tagline:** MarketPulse — Find the trade before everyone else does.

AI-powered market intelligence that tracks sentiment, news, institutional flows, technical setups, and hidden catalysts in real time.

---

## 1. Vision

From **Market Data Bot** → **AI Market Intelligence Agent**.

Users don't need more data. They need conviction, context, and opportunities. Every output must end with an AI interpretation and a clear takeaway — never raw data without a conclusion.

Instead of this:
```
/news TSLA
/sentiment TSLA
/insiders
```

Users get this:
```
⚡ Opportunity Alert

Ticker: TSLA
Confidence: 84%

Why it matters:
• Unusual volume +62%
• Positive news sentiment
• Retail mentions up 340%
• Insider buying detected

AI Take:
"Momentum is strengthening. Watch $342 breakout level."

Risk:
High volatility around earnings.
```

One message. One conclusion. One action.

---

## 2. Target User

Retail traders and semi-professional investors who:
- Want conviction, not just data
- Need to find trades before the crowd
- Follow smart money (13F, insider moves)
- Want AI-powered interpretation of raw market signals
- Use Telegram as their primary tool

---

## 3. Core Features — "The Seven"

### 3.1 `/pulse` — Market Pulse (Flagship)

The most important command. Replaces `sentiment` + `news` + `signals` with one AI-conclusive output.

```
🧠 Market Pulse: NVDA

Overall Score: 87/100
Sentiment: Bullish
Momentum: Strong
Institutional Activity: Positive
News Impact: High

AI Conclusion:
"NVIDIA remains one of the strongest AI infrastructure plays. Recent demand trends and institutional accumulation support continuation."

Key Risks:
• Valuation stretched
• AI spending slowdown

Action Zones:
Buy Zone: $142-$148
Resistance: $165
```

### 3.2 `/radar` — Opportunity Radar

Scans 5,000+ stocks. Returns the highest-conviction opportunities.

```
🛰️ Opportunity Radar

Ticker: CRDO

Why Flagged:
• Volume +250%
• Insider Buy
• Reddit Mentions Rising
• Positive Earnings Revisions

AI Probability:
78% chance of outperforming market over next 30 days.
```

The feature users screenshot and share.

### 3.3 `/setups` — AI Trade Setups

Replaces `/signals`. Gives traders what they actually want — entry, target, stop, and risk/reward.

```
🎯 Top AI Setups Today

1. NVDA
Score: 92

Setup:
Volume Expansion Breakout

Entry: $152
Target: $165
Stop: $146
Risk/Reward: 3.2:1
Confidence: High
```

### 3.4 `/catalyst` — Catalyst Detection

Most traders lose because they find news late. This detects emerging catalysts before they hit the mainstream.

```
🚨 Emerging Catalysts

1. WOLF
Confidence: 91%

Reason:
NVIDIA accelerated HVDC deployment.
SiC demand expected to rise.

Potential Impact: Bullish

2. PLTR
Confidence: 85%

Reason:
New government contracts detected.
```

### 3.5 `/whales` — Whale Activity

Replaces `/insiders` + `/smartmoney`. Tracks Berkshire, ARK, Soros, Druckenmiller, Pershing Square, Renaissance.

```
🐋 Whale Activity

Fund: Berkshire Hathaway

New Position: XYZ
Estimated Value: $820M

AI Interpretation:
Buffett is increasing exposure to industrial automation.
```

### 3.6 `/battle` — Stock Battle (Viral)

Very shareable. Users post these on social media.

```
⚔️ Stock Battle

NVDA vs AMD

Growth:          Winner → NVDA
Valuation:       Winner → AMD
Institutional:   Winner → NVDA
Retail Sentiment:Winner → AMD

Overall Winner: NVDA
Confidence: 83%
```

### 3.7 `/story` — Market Narrative Engine

The killer feature. People remember stories more than numbers.

```
📖 Today's Market Story

Narrative:
AI infrastructure spending continues to dominate market flows.

Winners:   NVDA, AVGO, ANET
Losers:    Utilities, Consumer Staples

Why:
Capital rotation into growth sectors.
```

---

## 4. Secondary Features

### 4.1 `/hype` — Retail Hype Monitor

Replaces `/trending`. Turns Reddit noise into intelligence.

```
🔥 Retail Hype Monitor

1. SOFI
Mentions: +480%
Sentiment: 87% Bullish

Narrative:
Retail believes rate cuts will boost lending growth.

Risk: Extremely crowded.
```

### 4.2 `/conviction TICKER` — Conviction Engine

Replaces `/sentiment`. Users love scores.

```
🔥 Conviction Score: 78%

Bull Case:
+ Institutional accumulation
+ Revenue acceleration
+ Positive analyst revisions

Bear Case:
- Expensive valuation
- Weak macro environment

AI Verdict: Moderately Bullish
```

### 4.3 `/insideralpha` — Insider Alpha

Instead of raw SEC filings.

```
🟢 Insider Alpha

CEO bought: $3.2M shares
Historical Accuracy: 8/10
Past Returns: +22% average after purchases

AI Verdict: Strong signal
```

### 4.4 `/brief` — Morning Brief

Keep existing, enhance with AI narrative.

### 4.5 `/why TICKER` — Why Did It Move

Keep existing.

---

## 5. Premium Strategy

Free users get data. Premium users get edge.

| Tier | Price | Features |
|------|-------|----------|
| **Free** | — | Pulse score, basic setups, news, /why, /story |
| **Pro** | $15/mo | Real-time alerts, Insider Alpha, Catalyst scanner, Radar, Conviction engine, /battle |
| **Elite** | $39/mo | Unlimited alerts, portfolio analysis, AI trade journal, early catalyst detection, priority AI |

---

## 6. Architecture

### 6.1 Data Flow
```
Telegram User → python-telegram-bot → Command Handlers → AI Layer → External APIs
                                                                 ↓
                                                            Response
```

### 6.2 Modules
| Module | Responsibility |
|--------|---------------|
| `bot.py` | Command handlers + scheduled jobs |
| `ai.py` | Unified AI provider (Gemini / OpenRouter / OpenCode) |
| `brain.py` | All AI prompt templates |
| `pulse.py` | Pulse scoring engine (combines signals + sentiment + news) |
| `radar.py` | Multi-factor opportunity scanner |
| `setups.py` | Trade setup builder with entry/stop/target |
| `catalyst.py` | Emerging catalyst detection |
| `whales.py` | 13F + insider aggregation with AI interpretation |
| `battle.py` | Head-to-head stock comparison |
| `story.py` | Daily market narrative generation |
| `signals.py` | Technical signal engine (yfinance) |
| `sentiment.py` | AI sentiment scoring |
| `market.py` | Price fetcher (SPY, Gold, NASDAQ) |
| `news.py` | RSS feed aggregator |
| `insider.py` | SEC EDGAR Form 4 XML parser |
| `smartmoney.py` | SEC EDGAR 13F-HR tracker |
| `screener.py` | Natural language stock filter |
| `db.py` | SQLite persistence (watchlists, alerts, tiers) |
| `alerts.py` | Per-user alert scanning engine |
| `premium.py` | Tier gating |
| `payments.py` | Stripe integration |
| `web/app.py` | Optional FastAPI dashboard |

### 6.3 Tech Stack
- **Runtime**: Python 3.11+
- **Bot Framework**: python-telegram-bot 20+
- **Data**: yfinance, pandas, feedparser
- **AI**: google-genai SDK, OpenAI-compatible API
- **Persistence**: SQLite
- **Scheduling**: APScheduler (via job-queue)
- **Optional**: FastAPI + Stripe

---

## 7. Scheduled Jobs

| Job | Time | Description |
|-----|------|-------------|
| Morning Brief | 09:15 ET | AI narrative + pulse + setups of the day |
| Evening Recap | 16:30 ET | Market story + whale moves + radar picks |
| Alert Scan | Every 30 min | Check watchlist alerts + catalyst detection |

---

## 8. Design Principles

1. **Every output ends with a takeaway** — Never raw data without AI interpretation
2. **One message, one conclusion** — Aggregate signals, don't list them
3. **Scores drive engagement** — Users love and share scores (84%, 3.2:1, 8/10)
4. **Actionable first** — Entry, target, stop, risk/reward before anything else
5. **Viral mechanics** — /battle is designed to be screenshotted and shared

---

## 9. Security

- All secrets in `.env` (`.gitignore`d)
- No user data collection
- Stripe webhook signature verification
- SEC EDGAR respectful rate limiting

---

## 10. Build Order

1. `/pulse` — Core AI aggregation, highest impact
2. `/radar` — Multi-factor scanner, shareable
3. `/setups` — Actionable trade plans, premium hook
4. `/catalyst` — Differentiator, keeps users checking back
5. `/whales` — Smart money tracking with AI spin
6. `/battle` — Viral growth engine
7. `/story` — Daily habit loop
