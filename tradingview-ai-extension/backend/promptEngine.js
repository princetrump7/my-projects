/**
 * Prompt Engine — builds system and user prompts for the vision model.
 *
 * These prompts are designed to elicit structured, institutional-grade
 * chart analysis from the AI vision model. The output format is
 * optimized for the signal panel rendering.
 *
 * The prompts are organized into:
 *   - System prompt (sets role and behavior)
 *   - Analysis prompt (inputs + reasoning instructions)
 *   - Format prompt (output structure)
 */

// ─── System prompt ─────────────────────────────────────────────────

/**
 * Build the system prompt for the AI trading analyst role.
 */
export function buildSignalSystemPrompt() {
  return `You are an institutional-grade trading analyst specializing in ICT (Inner Circle Trader) and Smart Money Concepts.

Your role:
- Analyze chart images with professional trader precision
- Identify market structure, liquidity zones, and order blocks
- Provide clear, actionable trade plans with specific price levels
- Assign confidence scores based on structure quality

Core analysis framework:
1. Identify overall trend (bullish/bearish/neutral) across multiple timeframes
2. Detect market structure: HH/HL (bullish) or LH/LL (bearish)
3. Locate liquidity zones: buy-side above highs, sell-side below lows
4. Identify order blocks: supply/demand zones from institutional activity
5. Detect sweeps: price hunting liquidity before reversing
6. Assess setup quality: score 0-100 based on confluence of factors

Output rules:
- Be specific with price levels (not ranges wider than 10-15 points)
- Explain WHY the structure supports the bias
- State invalidation levels clearly
- Assign confidence objectively (most setups score 40-75; only clear A+ setups score 85+)
- Never guarantee outcomes — present probabilities

Tone: Professional, precise, confident but not over-promising.`;
}

// ─── Analysis prompt ──────────────────────────────────────────────

/**
 * Build the user prompt for a specific chart analysis.
 */
export function buildAnalysisPrompt({ market, timeframe }) {
  return `Analyze this chart image and provide a structured trading analysis.

Context:
- Market: ${market || "Unknown"}
- Timeframe: ${timeframe || "Unknown"}

Please identify:
1. The current market structure (HH/HL, LH/LL, or ranging)
2. Any recent liquidity sweeps (buy-side or sell-side)
3. Key support and resistance levels
4. Order blocks (both bullish and bearish)
5. Any Break of Structure (BOS) or Change of Character (CHoCH)
6. An entry zone with specific price levels
7. Optimal stop loss placement (beyond structure, not random)
8. Take profit targets (minimum 2)
9. A confidence score (0-100) based on structure quality
10. Brief reasoning chain explaining the analysis

Be specific with price levels drawn from the chart image.`;
}

// ─── Format prompt (for non-vision models) ────────────────────────

/**
 * Build a prompt for analyzing chart data (DOM-extracted) without an image.
 * Used as fallback when vision is unavailable.
 */
export function buildTextAnalysisPrompt(context) {
  return `Provide a trading analysis based on the following chart data:

Symbol: ${context.symbol || "Unknown"}
Timeframe: ${context.timeframe || "Unknown"}
Current Price: ${context.price || "Unknown"}

Analyze:
1. What is the likely market structure direction?
2. What are the nearest support and resistance levels?
3. Where would be a logical entry zone relative to current price?
4. Where should the stop loss be placed?
5. Where are the take profit targets?
6. What is the confidence level (0-100)?

Focus on structure-based analysis rather than indicator-based.`;
}

// ─── Chat query prompt ────────────────────────────────────────────

/**
 * Build a prompt for follow-up chat questions about a chart.
 */
export function buildChatPrompt(question, context, previousAnalysis) {
  const analysisSummary = previousAnalysis
    ? `Previous analysis:\n- Bias: ${previousAnalysis.bias}\n- Score: ${previousAnalysis.score}/100\n- Entry: ${previousAnalysis.entryZone?.low}–${previousAnalysis.entryZone?.high}`
    : "No previous analysis available.";

  return `You are a trading analyst assistant. Answer the user's question about their chart.

Chart context:
- Symbol: ${context.symbol || "Unknown"}
- Timeframe: ${context.timeframe || "Unknown"}
- Current price: ${context.price || "Unknown"}

${analysisSummary}

User question: ${question}

Provide a clear, concise answer focused on market structure and price action. Reference specific price levels when relevant.`;
}

// ─── Trade journal prompt ───────────────────────────────────────

/**
 * Build a prompt for post-trade review / journaling.
 */
export function buildTradeReviewPrompt(trade, analysisBefore) {
  return `Review this trade and provide constructive feedback for improvement.

Trade details:
- Symbol: ${trade.symbol}
- Direction: ${trade.direction}
- Entry: ${trade.entry}
- Exit: ${trade.exit}
- Result: ${trade.result} (${((trade.exit - trade.entry) / trade.entry * 100).toFixed(2)}%)
- Date: ${trade.date}

Pre-trade analysis bias: ${analysisBefore?.bias || "N/A"}
Pre-trade score: ${analysisBefore?.score || "N/A"}

Evaluate:
1. Did the trade follow the analysis bias?
2. Was the entry execution aligned with the plan?
3. What did the trade do right?
4. What could be improved for next time?
5. Lesson learned (1 sentence)`;
}
