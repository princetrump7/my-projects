/**
 * API client — communicates with the AI pipeline.
 *
 * Resolution order (first available wins):
 *   1. Backend proxy (BASE_URL)
 *   2. Direct Groq vision API (GROQ_API_KEY)
 *   3. Mock fallback (USE_MOCK or no credentials)
 *
 * GROQ_API_KEY is loaded from chrome.storage.local (key: tv_ai_groq_api_key).
 * BASE_URL is loaded from chrome.storage.local (key: tv_ai_backend_url).
 */

import { StateManager } from "./stateManager.js";
import { TIER } from "../shared/constants.js";

// ─── Config ───────────────────────────────────────────────────────

const CONFIG = {
  BASE_URL: "",
  USE_MOCK: false,
  GROQ_API_KEY: "",
};

let _configLoaded = false;

async function ensureConfig() {
  if (_configLoaded) return;
  try {
    const { tv_ai_groq_api_key, tv_ai_backend_url } = await chrome.storage.local.get([
      "tv_ai_groq_api_key",
      "tv_ai_backend_url",
    ]);
    if (tv_ai_groq_api_key) CONFIG.GROQ_API_KEY = tv_ai_groq_api_key;
    if (tv_ai_backend_url) CONFIG.BASE_URL = tv_ai_backend_url;
  } catch (err) {
    console.warn("[TVAI] Failed to load config from storage:", err.message);
  }
  _configLoaded = true;
}

export function setConfig(overrides) {
  Object.assign(CONFIG, overrides);
  _configLoaded = true;
}

export function getConfig() {
  return { ...CONFIG };
}

// ─── Main analysis function ───────────────────────────────────────

export async function analyzeChart({ context, image }) {
  await ensureConfig();

  const canAnalyze = await StateManager.canAnalyze();
  if (!canAnalyze) {
    return {
      error: "limit_reached",
      bias: null,
      score: 0,
      remaining: await StateManager.getRemainingAnalyses(),
      message:
        "Daily analysis limit reached. Upgrade to Pro for unlimited analysis.",
    };
  }

  await StateManager.incrementUsage();
  const tier = await StateManager.getTier();
  if (tier === TIER.STARTER) {
    await StateManager.incrementMonthlyUsage();
  }

  const userId = await StateManager.getUserId();
  const market = await StateManager.getSelectedMarket();

  if (CONFIG.USE_MOCK) {
    return mockAnalyzeChart({ context, image, market });
  }

  // Priority: backend proxy > direct Groq > mock fallback
  if (CONFIG.BASE_URL) {
    try {
      return await callBackend({ context, image, market, tier, userId });
    } catch (err) {
      const hasGroq = !!CONFIG.GROQ_API_KEY;
      console.warn(
        "[TVAI] Backend unreachable,",
        hasGroq ? "trying direct Groq:" : "no Groq key;",
        err.message
      );
      if (!hasGroq) {
        console.warn("[TVAI] Falling back to mock data");
        return mockAnalyzeChart({ context, image, market });
      }
    }
  }

  if (CONFIG.GROQ_API_KEY) {
    try {
      return await callGroqVision(image, context, market);
    } catch (err) {
      console.error("[TVAI] Groq API call failed:", err.message);
      console.warn("[TVAI] Falling back to mock data");
      return mockAnalyzeChart({ context, image, market });
    }
  }

  console.warn("[TVAI] No API source configured — using mock data");
  return mockAnalyzeChart({ context, image, market });
}

// ─── Backend proxy ────────────────────────────────────────────────

async function callBackend({ context, image, market, tier, userId }) {
  const response = await fetch(`${CONFIG.BASE_URL}/api/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": userId,
    },
    body: JSON.stringify({
      context,
      image,
      market,
      tier,
      timestamp: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Backend returned ${response.status}`);
  }

  return await response.json();
}

// ─── Direct Groq vision API ──────────────────────────────────────

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_VISION_MODEL = "llama-3.2-11b-vision-preview";

async function callGroqVision(imageBase64, context, market) {
  const symbol = market || context?.symbol || "Chart";
  const timeframe = context?.timeframe || "Unknown";

  const prompt = buildDirectPrompt(symbol, timeframe);

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CONFIG.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_VISION_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageBase64 } },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      `Groq API ${response.status}: ${errorBody.slice(0, 200)}`
    );
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content;
  if (!rawContent) throw new Error("Empty response from Groq API");

  return parseDirectResponse(rawContent, { context, market });
}

function buildDirectPrompt(symbol, timeframe) {
  return `You are an ICT / Smart Money trading analyst. Analyze this chart image and return ONLY a valid JSON object with the fields below. No markdown, no code fences, no extra text.

{
  "bias": "bullish" | "bearish" | "neutral",
  "confidence": <0-100>,
  "entryZone": { "low": <price>, "high": <price> },
  "stopLoss": <price>,
  "takeProfit": { "tp1": <price>, "tp2": <price> },
  "structure": {
    "trend": "<description>",
    "pattern": "<HH/HL or LH/LL>",
    "bosAt": <price>,
    "liquidityZones": { "above": <price>, "below": <price> }
  },
  "reasoning": ["<reason1>", "<reason2>", ...],
  "setupQuality": "A" | "B" | "C",
  "recommendation": "<trade advice>",
  "riskGrade": "A" | "B" | "C"
}

Market: ${symbol}
Timeframe: ${timeframe}

Identify: market structure (HH/HL, LH/LL, ranging), liquidity sweeps, order blocks, BOS/CHoCH. Be specific with price levels visible on the chart.`;
}

function parseDirectResponse(rawContent, { context, market }) {
  let parsed;

  // Try to extract JSON from markdown code fences first
  const jsonMatch = rawContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  const jsonStr = jsonMatch
    ? jsonMatch[1].trim()
    : rawContent.replace(/^[^{]*/, "").replace(/[^}]*$/, "").trim();

  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error("AI response could not be parsed as JSON");
  }

  const price = parseFloat(context?.price) || 1900;
  const isBullish = parsed.bias === "bullish";
  const confidence =
    typeof parsed.confidence === "number"
      ? Math.round(Math.max(0, Math.min(100, parsed.confidence)))
      : 50;

  const fmt = (val, fallback) => {
    if (val == null) return Number(fallback).toFixed(2);
    const n = typeof val === "string" ? parseFloat(val) : val;
    return Number.isFinite(n) ? n.toFixed(2) : Number(fallback).toFixed(2);
  };

  return {
    bias: parsed.bias || "neutral",
    confidence,
    score: confidence,
    entryZone: {
      low: fmt(parsed.entryZone?.low, price * 0.995),
      high: fmt(parsed.entryZone?.high, price * 1.005),
    },
    stopLoss: fmt(parsed.stopLoss, price * 0.99),
    takeProfit: {
      tp1: fmt(parsed.takeProfit?.tp1, price * 1.02),
      tp2: fmt(parsed.takeProfit?.tp2, price * 1.03),
    },
    structure: {
      trend:
        parsed.structure?.trend ||
        (isBullish ? "Bullish (AI)" : isBullish === false ? "Bearish (AI)" : "Neutral"),
      pattern:
        parsed.structure?.pattern ||
        (isBullish ? "HH → HL → HH" : "LH → LL → LH"),
      bosAt: fmt(parsed.structure?.bosAt, price * (isBullish ? 0.998 : 1.002)),
      liquidityZones: {
        above: fmt(parsed.structure?.liquidityZones?.above, price * 1.02),
        below: fmt(parsed.structure?.liquidityZones?.below, price * 0.98),
      },
    },
    reasoning:
      Array.isArray(parsed.reasoning) && parsed.reasoning.length > 0
        ? parsed.reasoning
        : [
            isBullish
              ? "Bullish structure identified by AI analysis"
              : "Bearish structure identified by AI analysis",
          ],
    setupQuality:
      parsed.setupQuality || (confidence >= 75 ? "A" : confidence >= 60 ? "B" : "C"),
    recommendation:
      parsed.recommendation ||
      "Trade with the identified trend. Manage risk accordingly.",
    riskGrade:
      parsed.riskGrade || (confidence >= 75 ? "A" : confidence >= 60 ? "B" : "C"),
    timestamp: new Date().toISOString(),
    _source: "groq_direct",
  };
}

// ─── Mock analysis (for development without API credentials) ──────

function mockAnalyzeChart({ context, market }) {
  const symbol = context?.symbol || market || "XAUUSD";
  const price = parseFloat(context?.price || "1890.50");

  const seed = symbol.length + new Date().getDate();
  const isBullish = seed % 3 !== 0;
  const score = 55 + (seed % 40);

  const entrySpread = 5 + (seed % 10);
  const entryLow = price - entrySpread;
  const entryHigh = price + entrySpread * 0.5;
  const sl = isBullish
    ? entryLow - entrySpread * 2
    : entryHigh + entrySpread * 2;
  const tp1 = isBullish
    ? price + entrySpread * 3
    : price - entrySpread * 3;
  const tp2 = isBullish
    ? price + entrySpread * 5
    : price - entrySpread * 5;

  return {
    bias: isBullish ? "bullish" : "bearish",
    confidence: score,
    score,
    entryZone: { low: entryLow.toFixed(2), high: entryHigh.toFixed(2) },
    stopLoss: sl.toFixed(2),
    takeProfit: {
      tp1: tp1.toFixed(2),
      tp2: tp2.toFixed(2),
    },
    structure: {
      trend: isBullish ? "Bullish (H1 confirmed)" : "Bearish (H1 confirmed)",
      pattern: isBullish ? "HH → HL → HH" : "LH → LL → LH",
      bosAt: (isBullish ? price - 2 : price + 2).toFixed(2),
      liquidityZones: isBullish
        ? { above: (price + 15).toFixed(2), below: (price - 10).toFixed(2) }
        : { above: (price + 10).toFixed(2), below: (price - 15).toFixed(2) },
    },
    reasoning: isBullish
      ? [
          "Liquidity sweep detected at swing lows",
          "Bullish CHoCH confirmed on 15m",
          "Price holding above structural support",
          "Buy-side liquidity above recent high",
        ]
      : [
          "Rejection at key resistance level",
          "Bearish CHoCH confirmed on 15m",
          "Break of structure to downside",
          "Sell-side liquidity below recent low",
        ],
    setupQuality: score >= 75 ? "A" : score >= 60 ? "B" : "C",
    recommendation:
      "Trade with trend. Wait for retest before entry.",
    riskGrade: score >= 75 ? "A" : score >= 60 ? "B" : "C",
    timestamp: new Date().toISOString(),
  };
}
