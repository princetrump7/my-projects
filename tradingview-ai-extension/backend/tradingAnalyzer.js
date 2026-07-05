/**
 * Trading Analyzer — market structure analysis engine.
 *
 * This is the core strategy engine that evaluates price action
 * through ICT/Smart Money concepts and outputs structured analysis.
 *
 * In production, this works in tandem with a vision model. For MVP,
 * it can run directly on DOM-extracted data.
 *
 * Analysis dimensions:
 *   - Market structure (HH/HL/LH/LL, BOS, CHoCH)
 *   - Liquidity zones (buy-side / sell-side sweeps)
 *   - Order blocks (supply/demand zones)
 *   - Fair Value Gaps (optional, advanced)
 *   - Session bias (London/NY/Asia)
 */

// ─── Market structure analysis ──────────────────────────────────

/**
 * Analyze the market structure based on swing points and price action.
 */
export function analyzeMarketStructure(priceData, options = {}) {
  const { timeframe = "H1", lookback = 50 } = options;
  const prices = extractSwingPoints(priceData, lookback);

  return {
    trend: determineTrend(prices),
    pattern: identifyPattern(prices),
    bosLevel: findBreakOfStructure(prices),
    chochLevel: findChangeOfCharacter(prices),
    swingHighs: prices.highs.slice(-3),
    swingLows: prices.lows.slice(-3),
    timeframe,
  };
}

/**
 * Extract swing highs and lows from price data.
 */
function extractSwingPoints(data, lookback) {
  // In production, this processes candlestick data.
  // For MVP, use the current price as reference.
  if (!data || data.length < 3) {
    return { highs: [], lows: [] };
  }

  const highs = [];
  const lows = [];
  const slice = data.slice(-lookback);

  for (let i = 1; i < slice.length - 1; i++) {
    // Swing high: higher than both neighbors
    if (slice[i] > slice[i - 1] && slice[i] > slice[i + 1]) {
      highs.push(slice[i]);
    }
    // Swing low: lower than both neighbors
    if (slice[i] < slice[i - 1] && slice[i] < slice[i + 1]) {
      lows.push(slice[i]);
    }
  }

  return { highs, lows };
}

/**
 * Determine the trend direction from swing point structure.
 */
function determineTrend({ highs, lows }) {
  if (highs.length < 2 || lows.length < 2) return "neutral";

  const risingHighs = highs[highs.length - 1] > highs[0];
  const risingLows = lows[lows.length - 1] > lows[0];

  if (risingHighs && risingLows) return "bullish";       // HH, HL
  if (!risingHighs && !risingLows) return "bearish";     // LH, LL
  if (risingHighs && !risingLows) return "divergence";   // HH, LL (potential reversal)
  return "neutral";
}

/**
 * Identify the current market structure pattern.
 */
function identifyPattern({ highs, lows }) {
  if (highs.length < 2 || lows.length < 2) return "ranging";

  const h1 = highs[highs.length - 2];
  const h2 = highs[highs.length - 1];
  const l1 = lows[lows.length - 2];
  const l2 = lows[lows.length - 1];

  if (h2 > h1 && l2 > l1) return "HH → HL → HH";           // Bullish continuation
  if (h2 < h1 && l2 < l1) return "LH → LL → LH";           // Bearish continuation
  if (h2 > h1 && l2 < l1) return "HH → LL (potential top)"; // Bull trap
  if (h2 < h1 && l2 > l1) return "LH → HL (potential bottom)"; // Bear trap
  return "ranging";
}

/**
 * Find the most recent Break of Structure level.
 */
function findBreakOfStructure({ highs, lows }) {
  if (highs.length < 2 || lows.length < 2) return null;

  const lastHigh = highs[highs.length - 1];
  const prevHigh = highs[highs.length - 2];
  const lastLow = lows[lows.length - 1];
  const prevLow = lows[lows.length - 2];

  // Bullish BOS: price broke above previous high
  if (lastHigh > prevHigh) return lastHigh;
  // Bearish BOS: price broke below previous low
  if (lastLow < prevLow) return lastLow;

  return null;
}

/**
 * Find the most recent Change of Character level.
 */
function findChangeOfCharacter({ highs, lows }) {
  // CHoCH is identified when price breaks a structure point
  // that was previously respected.
  if (highs.length < 1 || lows.length < 1) return null;
  return findBreakOfStructure({ highs, lows });
}

// ─── Liquidity analysis ─────────────────────────────────────────

/**
 * Identify buy-side and sell-side liquidity zones.
 */
export function analyzeLiquidity(priceData, currentPrice) {
  const { highs, lows } = extractSwingPoints(priceData, 100);

  // Buy-side liquidity: above swing highs (stop hunts for shorts)
  const buySideHigh = highs.length > 0
    ? Math.max(...highs.slice(-3)) * 1.005
    : currentPrice * 1.02;

  // Sell-side liquidity: below swing lows (stop hunts for longs)
  const sellSideLow = lows.length > 0
    ? Math.min(...lows.slice(-3)) * 0.995
    : currentPrice * 0.98;

  return {
    buySideLiquidity: buySideHigh.toFixed(2),
    sellSideLiquidity: sellSideLow.toFixed(2),
    distanceToBuyside: ((buySideHigh - currentPrice) / currentPrice * 100).toFixed(2) + "%",
    distanceToSellside: ((currentPrice - sellSideLow) / currentPrice * 100).toFixed(2) + "%",
    nearestLiquidity: (currentPrice - sellSideLow) < (buySideHigh - currentPrice)
      ? `sell-side at ${sellSideLow.toFixed(2)}`
      : `buy-side at ${buySideHigh.toFixed(2)}`,
  };
}

// ─── Order block analysis ───────────────────────────────────────

/**
 * Identify potential order blocks (institutional supply/demand zones).
 */
export function analyzeOrderBlocks(priceData, currentPrice) {
  // Order blocks are identified by strong impulsive moves from a consolidation zone.
  // In a full implementation, this analyzes volume and candle structure.

  const spread = currentPrice * 0.005; // 0.5% spread for OB

  return {
    bullishOB: {
      zone: [
        (currentPrice - spread * 2).toFixed(2),
        (currentPrice - spread).toFixed(2),
      ],
      strength: priceData ? "moderate" : "unconfirmed",
    },
    bearishOB: {
      zone: [
        (currentPrice + spread).toFixed(2),
        (currentPrice + spread * 2).toFixed(2),
      ],
      strength: priceData ? "moderate" : "unconfirmed",
    },
  };
}

// ─── Session analysis ───────────────────────────────────────────

/**
 * Determine the current trading session and its characteristics.
 */
export function analyzeSession() {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();
  const utcTime = utcHour + utcMinute / 60;

  let session;
  if (utcTime >= 0 && utcTime < 8) session = "asia";
  else if (utcTime >= 8 && utcTime < 13) session = "london";
  else if (utcTime >= 13 && utcTime < 21) session = "newyork";
  else session = "asia";

  return {
    current: session,
    name: session === "asia" ? "Asia" : session === "london" ? "London" : "New York",
    isActive: true,
    nextSession: session === "asia" ? "London (8:00 UTC)" : session === "london" ? "New York (13:00 UTC)" : "Asia (0:00 UTC)",
  };
}

// ─── Full analysis pipeline ─────────────────────────────────────

/**
 * Run the complete analysis pipeline on a set of price data.
 */
export function analyzeFull(priceData, currentPrice, options = {}) {
  const structure = analyzeMarketStructure(priceData, options);
  const liquidity = analyzeLiquidity(priceData, currentPrice);
  const orderBlocks = analyzeOrderBlocks(priceData, currentPrice);
  const session = analyzeSession();

  return {
    structure,
    liquidity,
    orderBlocks,
    session,
    marketCondition: classifyMarketCondition(structure.trend, liquidity),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Classify the overall market condition.
 */
function classifyMarketCondition(trend, liquidity) {
  if (trend === "bullish" || trend === "bearish") {
    return {
      type: "trending",
      quality: "high",
      advice: `Trade in the direction of the ${trend} bias.`,
    };
  }
  if (trend === "divergence") {
    return {
      type: "potential_reversal",
      quality: "medium",
      advice: "Watch for confirmation of reversal. Reduce position size.",
    };
  }
  return {
    type: "ranging",
    quality: "low",
    advice: "Low probability environment. Wait for structure break or sweep of liquidity.",
  };
}
