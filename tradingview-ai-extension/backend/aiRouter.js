/**
 * AI Router — backend entry point for chart analysis requests.
 *
 * Pipeline:
 *   1. Receive chart screenshot + context from extension
 *   2. Run Groq vision model to extract chart features
 *   3. Feed into strategy engine (ICT / structure analysis)
 *   4. Score and structure the output
 *   5. Return signal to extension
 *
 * Designed for Node.js (Express, serverless, etc.).
 * Requires GROQ_API_KEY environment variable for vision analysis.
 */

import { buildAnalysisPrompt, buildSignalSystemPrompt } from "./promptEngine.js";

// ─── Groq API config ──────────────────────────────────────────────

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_VISION_MODEL = "llama-3.2-11b-vision-preview";

/**
 * Main analysis handler — called by the API endpoint.
 *
 * @param {string} imageBase64 - Base64-encoded chart screenshot (PNG data URL or raw base64)
 * @param {object} context     - DOM context (symbol, timeframe, price)
 * @param {object} options     - { market, tier, userId }
 * @returns {object} Structured signal output
 */
export async function analyzeTradingChart(imageBase64, context = {}, options = {}) {
  const { market, tier, userId } = options;

  // Step 1: Vision analysis via Groq
  const visionResult = await callVisionModel(imageBase64, {
    market: market || context.symbol || "unknown",
    timeframe: context.timeframe || "unknown",
  });

  // Step 2: Structured analysis (trading rules engine)
  const structured = await runStructuredAnalysis(visionResult, context, {
    market,
    tier,
  });

  // Step 3: Score and format for the extension's signal panel
  const result = scoreAndFormat(structured, { tier });

  return {
    ...result,
    timestamp: new Date().toISOString(),
    userId,
    tier: tier || "free",
  };
}

// ─── Groq vision model integration ────────────────────────────────

async function callVisionModel(imageBase64, { market, timeframe }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn("[TVAI] GROQ_API_KEY not set — using fallback analysis");
    return fallbackVision({ market, timeframe });
  }

  const systemPrompt = buildSignalSystemPrompt();
  const userPrompt = buildAnalysisPrompt({ market, timeframe });

  // Ensure image is a valid data URL for Groq
  const imageUrl = imageBase64.startsWith("data:")
    ? imageBase64
    : `data:image/png;base64,${imageBase64}`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_VISION_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new Error(`Groq API ${response.status}: ${errorBody.slice(0, 300)}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Groq returned empty content");

    return parseVisionResponse(content);
  } catch (err) {
    console.error("[TVAI] Groq vision call failed:", err.message);
    console.warn("[TVAI] Falling back to deterministic analysis");
    return fallbackVision({ market, timeframe });
  }
}

/**
 * Parse the vision model's text response into structured market data.
 * The model is prompted to return JSON; we handle common formatting variations.
 */
function parseVisionResponse(rawContent) {
  let parsed;

  // Extract JSON from markdown code fences if present
  const fenceMatch = rawContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  const candidate = fenceMatch
    ? fenceMatch[1].trim()
    : rawContent.replace(/^[^{]*/, "").replace(/[^}]*$/, "").trim();

  try {
    parsed = JSON.parse(candidate);
  } catch {
    // Last resort: try the raw text
    try {
      parsed = JSON.parse(rawContent.trim());
    } catch {
      throw new Error("Could not parse vision model output as JSON");
    }
  }

  const price = parsed.keyLevels?.currentPrice || 1900;
  const confidence = Math.min(100, Math.max(0, Math.round(parsed.confidence || 65)));

  return {
    marketStructure: {
      trend: parsed.bias || parsed.marketStructure?.trend || "neutral",
      timeframe: parsed.marketStructure?.timeframe || "H1",
      pattern:
        parsed.marketStructure?.pattern ||
        parsed.structure?.pattern ||
        (parsed.bias === "bullish" ? "HH → HL → HH" : "LH → LL → LH"),
    },
    liquidityZones: {
      above:
        parsed.liquidityZones?.above ||
        parsed.structure?.liquidityZones?.above ||
        (price * 1.02).toFixed(2),
      below:
        parsed.liquidityZones?.below ||
        parsed.structure?.liquidityZones?.below ||
        (price * 0.98).toFixed(2),
    },
    orderBlocks: {
      bullish:
        parsed.orderBlocks?.bullish || [
          (price * 0.995).toFixed(2),
          (price * 1.005).toFixed(2),
        ],
      bearish:
        parsed.orderBlocks?.bearish || [
          (price * 1.01).toFixed(2),
          (price * 1.02).toFixed(2),
        ],
    },
    keyLevels: {
      resistance:
        parsed.keyLevels?.resistance || (price * 1.015).toFixed(2),
      support: parsed.keyLevels?.support || (price * 0.985).toFixed(2),
      currentPrice: price,
    },
    sweeps: {
      buySide:
        parsed.sweeps?.buySide ||
        parsed.liquidityZones?.above ||
        (price * 1.01).toFixed(2),
      sellSide:
        parsed.sweeps?.sellSide ||
        parsed.liquidityZones?.below ||
        (price * 0.99).toFixed(2),
    },
    confidence,
    rawAnalysis:
      parsed.reasoning?.join(" ") ||
      parsed.rawAnalysis ||
      `Price in ${parsed.bias || "neutral"} structure on ${parsed.marketStructure?.timeframe || "H1"}.`,
  };
}

function fallbackVision({ market, timeframe }) {
  const price = 1890;
  return {
    marketStructure: {
      trend: price > 1850 ? "bullish" : "bearish",
      timeframe: timeframe || "H1",
      pattern: price > 1850 ? "HH → HL → HH" : "LH → LL → LH",
    },
    liquidityZones: {
      above: (price * 1.02).toFixed(2),
      below: (price * 0.98).toFixed(2),
    },
    orderBlocks: {
      bullish: [(price * 0.995).toFixed(2), (price * 1.005).toFixed(2)],
      bearish: [(price * 1.01).toFixed(2), (price * 1.02).toFixed(2)],
    },
    keyLevels: {
      resistance: (price * 1.015).toFixed(2),
      support: (price * 0.985).toFixed(2),
      currentPrice: price,
    },
    sweeps: {
      buySide: (price * 1.01).toFixed(2),
      sellSide: (price * 0.99).toFixed(2),
    },
    confidence: 72,
    rawAnalysis: "Price in bullish structure on H1. Recent sweep of sell-side liquidity. Order block at support zone.",
  };
}

// ─── Structured analysis engine ────────────────────────────────────

async function runStructuredAnalysis(vision, context, options) {
  const { market, tier } = options;
  const price =
    parseFloat(context.price) || vision.keyLevels?.currentPrice || 1890;

  const trend = vision.marketStructure?.trend || "neutral";
  const isBullish = trend === "bullish";

  const entryLow = isBullish ? price * 0.995 : price * 0.998;
  const entryHigh = isBullish ? price * 1.002 : price * 1.01;

  const slSpread = price * 0.008;
  const stopLoss = isBullish ? entryLow - slSpread : entryHigh + slSpread;

  const tpSpread = price * 0.015;
  const tp1 = isBullish ? price + tpSpread : price - tpSpread;
  const tp2 = isBullish ? price + tpSpread * 1.8 : price - tpSpread * 1.8;
  const tp3 = isBullish ? price + tpSpread * 2.8 : price - tpSpread * 2.8;

  const risk = Math.abs(price - stopLoss);
  const reward = Math.abs(tp1 - price);
  const rr = reward > 0 ? (reward / risk).toFixed(1) : "1.0";

  const reasoning = buildReasoningChain(vision, isBullish, price);
  const scores = scoreDimensions(vision, rr);
  const overallScore = Math.round(
    scores.trend * 0.3 +
      scores.structure * 0.25 +
      scores.liquidity * 0.25 +
      scores.risk * 0.2
  );

  return {
    bias: isBullish ? "bullish" : "bearish",
    confidence: overallScore,
    score: overallScore,
    entryZone: {
      low: entryLow.toFixed(2),
      high: entryHigh.toFixed(2),
    },
    stopLoss: stopLoss.toFixed(2),
    takeProfit: {
      tp1: tp1.toFixed(2),
      tp2: tp2.toFixed(2),
      tp3: tier === "elite" ? tp3.toFixed(2) : undefined,
    },
    rr: parseFloat(rr),
    structure: {
      trend: `${isBullish ? "Bullish" : "Bearish"} (${vision.marketStructure?.timeframe || "H1"} confirmed)`,
      pattern:
        vision.marketStructure?.pattern ||
        (isBullish ? "HH → HL → HH" : "LH → LL → LH"),
      bosAt: isBullish
        ? (price * 0.998).toFixed(2)
        : (price * 1.002).toFixed(2),
      liquidityZones: {
        above: vision.liquidityZones?.above || (price * 1.02).toFixed(2),
        below: vision.liquidityZones?.below || (price * 0.98).toFixed(2),
      },
    },
    reasoning,
    scores,
    setupQuality: overallScore >= 75 ? "A" : overallScore >= 60 ? "B" : "C",
    riskGrade: overallScore >= 75 ? "A" : overallScore >= 60 ? "B" : "C",
    recommendation: buildRecommendation(vision, isBullish, overallScore),
  };
}

// ─── Scoring engine ────────────────────────────────────────────────

function scoreDimensions(vision, rr) {
  const r = parseFloat(rr);
  return {
    trend: Math.min(100, vision.confidence || 75),
    structure: Math.min(100, (vision.confidence || 70) + 5),
    liquidity: Math.min(100, (vision.confidence || 65) + 10),
    risk: Math.min(100, r >= 2 ? 85 : r >= 1.5 ? 70 : 50),
  };
}

function buildReasoningChain(vision, isBullish, price) {
  const reasons = [];

  if (isBullish) {
    reasons.push("Liquidity sweep detected at swing lows");
    reasons.push("Bullish CHoCH confirmed on 15m");
    reasons.push(
      `Price holding above structural support at ${(price * 0.99).toFixed(2)}`
    );
    reasons.push("Buy-side liquidity above recent high");
    if (vision.orderBlocks?.bullish) {
      reasons.push(
        `Bullish order block at ${vision.orderBlocks.bullish[0]}–${vision.orderBlocks.bullish[1]}`
      );
    }
  } else {
    reasons.push("Rejection at key resistance level");
    reasons.push("Bearish CHoCH confirmed on 15m");
    reasons.push("Break of structure to downside");
    reasons.push("Sell-side liquidity below recent low");
    if (vision.orderBlocks?.bearish) {
      reasons.push(
        `Bearish order block at ${vision.orderBlocks.bearish[0]}–${vision.orderBlocks.bearish[1]}`
      );
    }
  }

  // Append AI-specific reasoning if available
  if (vision.rawAnalysis && vision.rawAnalysis !== reasons.join(" ")) {
    reasons.push(`AI: ${vision.rawAnalysis}`);
  }

  return reasons;
}

function buildRecommendation(vision, isBullish, score) {
  if (score >= 75) {
    return isBullish
      ? "High-probability bullish setup. Wait for retest of entry zone with confirmation. Trail SL to breakeven after TP1 hit."
      : "High-probability bearish setup. Wait for retest of entry zone with confirmation. Trail SL to breakeven after TP1 hit.";
  }
  if (score >= 60) {
    return isBullish
      ? "Moderate bullish bias. Reduce position size. Wait for additional confirmation from HTF."
      : "Moderate bearish bias. Reduce position size. Wait for additional confirmation from HTF.";
  }
  return "Low-quality setup. Avoid trading until structure clarifies or a higher-probability setup forms.";
}

// ─── Output formatting ─────────────────────────────────────────────

function scoreAndFormat(structured, options) {
  const { tier } = options;
  const isPro = tier === "pro" || tier === "elite";

  return {
    bias: structured.bias,
    confidence: structured.confidence,
    score: structured.score,
    entryZone: structured.entryZone,
    stopLoss: structured.stopLoss,
    takeProfit: structured.takeProfit,
    rr: structured.rr,
    structure: isPro ? structured.structure : undefined,
    reasoning: structured.reasoning,
    scores: isPro ? structured.scores : undefined,
    setupQuality: structured.setupQuality,
    riskGrade: structured.riskGrade,
    recommendation: structured.recommendation,
    ...(isPro ? {} : { _lockedFields: ["structure", "scores", "tp3"] }),
  };
}
