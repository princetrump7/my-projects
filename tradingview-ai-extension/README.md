# TradingView AI Copilot

AI-powered TradingView chart analysis assistant — rebuilt with React + TypeScript.

## Features

- **Smart Money Concepts Analysis**: ICT-based market structure detection (BOS, CHoCH, order blocks, liquidity sweeps)
- **AI-Powered**: Vision model analyzes your chart directly (Groq `llama-3.2-11b-vision-preview`)
- **Institutional Bias Scoring**: Weighted scoring across trend, structure, liquidity, and risk
- **Onboarding Flow**: 8-step guided onboarding that demonstrates value before asking to upgrade
- **Tiered Pricing**: Free (5/day) → Starter (100/mo) → Pro (unlimited) → Elite (enterprise)
- **Zero-Dependency Mock Mode**: Works entirely without API keys using deterministic mock data

## Architecture

```
src/
├── background/        # Chrome SW (message router, state mgmt, API client)
├── content/           # React app injected into TradingView
│   ├── components/    # 20+ React components
│   ├── hooks/         # useAnalysis, useTradingView, useOnboarding
│   ├── store/         # Zustand store with Chrome storage persistence
│   └── styles/        # Tailwind + custom CSS (TV dark theme)
└── shared/            # types.ts, constants.ts, messages.ts

backend/
└── src/
    ├── routes/        # health, analyze, stripe
    ├── services/      # aiRouter, tradingAnalyzer, promptEngine, stripeService
    ├── middleware/     # rateLimiter, errorHandler, validateRequest
    └── types/         # Shared backend types
```

## Development

### Prerequisites
- Node.js >= 18
- Chrome browser

### Quick Start
```bash
# Install deps
npm install

# Build extension
npm run build

# Load unpacked extension in Chrome
# 1. Go to chrome://extensions
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the `dist/` folder
```

### Backend (optional — mock mode works without it)
```bash
cd backend
npm install
cp .env.example .env
# Add GROQ_API_KEY to .env
npm run dev
```

### Build modes
| Command | Description |
|---|---|
| `npm run build` | Development build with sourcemaps |
| `npm run build:extension` | Same as above |
| `npm run dev` | Watch mode for development |
| `npm run lint` | TypeScript type checking |
| `npm run test` | Run Vitest unit tests |

## Configuration

### API Key Resolution Order
1. Backend proxy (if `BASE_URL` is configured)
2. Direct Groq API (if `GROQ_API_KEY` is set in chrome.storage)
3. Mock fallback (no keys needed, deterministic by symbol + date)

### Environment Variables
| Variable | Description |
|---|---|
| `GROQ_API_KEY` | Groq API key for vision analysis |
| `STRIPE_SECRET_KEY` | Stripe secret key (test mode) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `CORS_ORIGIN` | CORS origin (default: tradingview.com) |
| `PORT` | Server port (default: 3001) |

## Tech Stack

| Layer | Technology |
|---|---|
| **Extension** | Chrome Manifest V3, React 18, TypeScript |
| **Build** | Vite 5 |
| **State** | Zustand |
| **Styling** | Tailwind CSS + custom TV theme |
| **Backend** | Node.js, Express, TypeScript |
| **AI** | Groq API (llama-3.2-11b-vision-preview) |
| **Payments** | Stripe Checkout + Webhooks |
| **Testing** | Vitest |

## v2 Changes from Original

- Complete rewrite: React + TypeScript (was vanilla JS IIFE)
- Bug fixes: CSS overlay positioning, duplicate constants, orphaned tradingAnalyzer, upfront usage counting
- Stripe: Checkout sessions, webhook handling, subscription management
- Architecture: Zustand store, typed message contracts, shadow DOM style isolation
- Edge cases: Proper cleanup, SPA navigation, error boundaries, a11y (keyboard nav, reduced motion)
