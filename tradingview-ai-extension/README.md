# TradingView AI Copilot

**AI-powered TradingView chart analysis assistant** — market structure intelligence inside your charts.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Chrome](https://img.shields.io/badge/chrome-mv3-green)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    TradingView AI Copilot                    │
├──────────────┬──────────────┬──────────────┬────────────────┤
│   UI Layer   │  Content     │  Background  │   AI Layer     │
│  (overlay)   │  Layer (DOM) │  (Service    │  (Backend)     │
│              │              │   Worker)    │                │
│  Chat panel  │  Chart       │  API router  │  Vision model  │
│  Signal      │  context     │  State mgmt  │  Strategy eng  │
│  display     │  extractor   │  Usage       │  Scoring       │
│  Onboarding  │  Screenshot  │  tracking    │  Library       │
│  flow        │  capture     │  Tier gates  │                │
└──────────────┴──────────────┴──────────────┴────────────────┘
```

## Project Structure

```
tradingview-ai-extension/
├── manifest.json                    # Chrome Manifest V3
├── assets/                          # Icon SVGs (convert to PNG for prod)
├── src/
│   ├── background/
│   │   ├── serviceWorker.js         # Message router & lifecycle
│   │   ├── apiClient.js             # Backend API calls + mock mode
│   │   └── stateManager.js          # Storage, usage, tiers
│   ├── content/
│   │   ├── contentScript.js         # TradingView injection entry
│   │   ├── tradingviewHooks.js      # DOM selectors for context
│   │   ├── domExtractor.js          # Extended DOM extraction
│   │   └── screenshot.js            # Chart screenshot capture
│   ├── ui/
│   │   ├── overlayApp.js            # Main overlay + 8-step onboarding
│   │   ├── signalPanel.js           # Analysis result rendering
│   │   ├── chatPanel.js             # Interactive chart chat
│   │   └── styles.css               # Dark-theme design system
│   └── shared/
│       ├── constants.js             # Message types, tiers, config
│       ├── messageBus.js            # Typed messaging layer
│       └── utils.js                 # Shared utilities
└── backend/
    ├── aiRouter.js                  # AI pipeline orchestrator
    ├── tradingAnalyzer.js           # Market structure engine
    ├── promptEngine.js              # Vision model prompt library
    ├── server.js                    # Local dev server
    └── package.json                 # Backend dependencies
```

## Quick Start

### 1. Load the extension in Chrome

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `tradingview-ai-extension/` directory

### 2. Generate PNG icons

The extension needs PNG icons. Run the build script:

```bash
cd tradingview-ai-extension
node tools/generate-icons.js
```

(You'll need Node.js with the `sharp` package installed, or manually convert the SVGs in `assets/` to 16×16, 48×48, 128×128 PNGs.)

### 3. Start the backend (optional — mock mode works without it)

```bash
cd tradingview-ai-extension/backend
npm install
npm run dev
```

The backend runs on `http://localhost:3001`.

### 4. Configure API keys

Edit `src/background/apiClient.js`:

```js
const CONFIG = {
  BASE_URL: "http://localhost:3001",     // Your backend URL
  USE_MOCK: false,                       // Set to false to use real backend
  API_KEY: "your-api-key",
};
```

### 5. Visit TradingView

Go to [TradingView](https://www.tradingview.com/chart/) — the AI panel auto-opens with the onboarding flow.

## Onboarding Flow

The extension implements an 8-screen conversion funnel:

```
INSTALL → WELCOME → MARKET_SELECT → CHART_DETECT →
FIRST_ANALYSIS → VALUE_DEEPEN → SECOND_LOOP →
SOFT_PAYWALL → PRICING → MAIN_PANEL
```

| Step | Screen | Purpose |
|------|--------|---------|
| 1 | Welcome | Value prop, "Continue" |
| 2 | Market Select | Choose market (Gold, Forex, Crypto, Stocks) |
| 3 | Chart Detect | Auto-detect symbol/timeframe (magic moment) |
| 4 | First Analysis | INSTANT result: bias, entry, SL, TP, confidence |
| 5 | Value Deepen | "What you just saw" + AI vs Retail comparison |
| 6 | Second Loop | "Avoid trading" credibility play |
| 7 | Soft Paywall | Locked insights with blurred preview |
| 8 | Pricing | Stripe conversion (Starter $15 / Pro $29 / Elite $99) |

## Monetization Tiers

| Feature | Free | Starter $15/mo | Pro $29/mo | Elite $99/mo |
|---------|------|----------------|------------|--------------|
| Analyses/day | 5 | 100/mo | Unlimited | Unlimited |
| Bias + Entry/SL/TP | ✅ | ✅ | ✅ | ✅ |
| Confidence score | ✅ | ✅ | ✅ | ✅ |
| Reasoning chain | Partial | ✅ | ✅ | ✅ |
| Multi-timeframe | ❌ | ❌ | ✅ | ✅ |
| Liquidity sweep engine | ❌ | ❌ | ✅ | ✅ |
| CHoCH/BOS confirmation | ❌ | ❌ | ✅ | ✅ |
| Strategy presets | ❌ | ❌ | ❌ | ✅ |
| Session bias | ❌ | ❌ | ❌ | ✅ |
| Priority processing | ❌ | ❌ | ✅ | ✅ |

## Key Design Decisions

### Why Option B (Vision + Rules Engine)?

- **Vision alone** is fast but inconsistent — it sees patterns differently each time
- **Rules engine** normalizes the output into consistent, structured signals
- Together they produce **institutional-grade** output that builds user trust

### MV3 Service Worker

- Stateless — all state in `chrome.storage.local`
- Survives browser idle/sleep cycles
- In-memory cache for fast reads

### Screenshot Architecture

- `chrome.tabs.captureVisibleTab()` captures viewport
- Crop to chart container for cleaner AI input
- Falls back to full viewport if chart covers >85% of screen

### Soft Paywall Strategy

- **Never** blocks the user completely
- Shows blurred premium insights underneath
- Projects the score improvement ("72 → 89 with H4 data")
- Paywall triggers after *value is already proven*

## Development

### Mock Mode (no backend needed)

By default, `apiClient.js` runs in mock mode (`USE_MOCK: true`). The mock generates deterministic results based on the current date and symbol, so you get realistic-looking analysis without any API calls.

### Adding a real vision model

Edit `backend/aiRouter.js` — search for `callVisionModel()` and uncomment the Claude or OpenAI integration block. Add your API key to environment variables.

### Modifying the onboarding flow

The onboarding state machine is in `src/ui/overlayApp.js`. Each step is a self-contained render function (`renderWelcome`, `renderMarketSelect`, etc.). Add new steps by:

1. Adding a step name to `ONBOARDING_STEPS` in `src/shared/constants.js`
2. Creating a render function in `overlayApp.js`
3. Adding the case to the `switch` in `showOnboardingStep()`

## Cost Economics (per analysis)

| Resource | Cost |
|----------|------|
| Vision model (GPT-4o / Claude) | $0.01–0.03 |
| LLM reasoning | $0.005–0.02 |
| Backend compute | $0.001–0.005 |
| **Total per analysis** | **~$0.02–0.05** |

With Pro at $29/mo and ~300 analyses/month, the gross margin is ~$20/user/mo.

## License

MIT — build your trading intelligence product.
