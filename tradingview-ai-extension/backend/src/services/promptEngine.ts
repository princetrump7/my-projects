import type { ChartContext } from '../types/index.js'

/**
 * Prompt templates for the AI analysis pipeline.
 * Based on the original promptEngine.js but only includes
 * templates that are actually used (removed orphaned functions).
 */

/**
 * System prompt for the institutional ICT/SMC analyst persona.
 */
export function buildSignalSystemPrompt(): string {
  return `You are an institutional-grade trading analyst specializing in ICT (Inner Circle Trader) and Smart Money Concepts.

Your analysis framework:
1. Identify market structure — trends, swing points, BOS, CHoCH
2. Detect liquidity zones — buy-side above highs, sell-side below lows
3. Find order blocks — supply/demand zones from institutional activity
4. Determine bias — based on structure + liquidity + order blocks
5. Set precision levels — entry zone, stop loss, take profit targets
6. Assess confidence — based on confluence of factors

Output rules:
- Be specific with price levels; never use vague terms
- Base confidence strictly on visible chart structure
- Never guarantee outcomes — present probabilities
- Return ONLY valid JSON — no markdown fences, no extra text`
}

/**
 * User prompt for vision-based chart analysis.
 * Asks for specific items from the chart image.
 */
export function buildAnalysisPrompt(context: ChartContext): string {
  return `Analyze this ${context.symbol} / ${context.timeframe} chart image.

Identify the following and return a JSON object (code fences are OK, I'll parse them):
{
  "bias": "bullish or bearish",
  "entryZone": "lowPrice-highPrice",
  "stopLoss": "price",
  "takeProfit1": "price",
  "takeProfit2": "price",
  "takeProfit3": "price (optional, for deeper analysis)",
  "confidence": 0-100,
  "reasoning": [{"type": "bullish|bearish|neutral", "text": "reason"}],
  "structureNotes": "key structural observation",
  "liquidityNotes": "liquidity sweep observation"
}

Important:
- If current price is ${context.currentPrice ?? 'unknown'}, use it as reference
- Look for recent sweeps of buy-side or sell-side liquidity
- Identify any clear order blocks or supply/demand zones
- Base confidence level on how clear the setup is`
}

/**
 * Fallback prompt when no chart image is available (text-only).
 */
export function buildTextAnalysisPrompt(context: ChartContext): string {
  return `Analyze the market for ${context.symbol} / ${context.timeframe} based on the following:
- Symbol: ${context.symbol}
- Timeframe: ${context.timeframe}
${context.currentPrice ? `- Current price: ${context.currentPrice}` : ''}

Provide a JSON analysis with:
{
  "bias": "bullish|bearish",
  "entryZone": "low-high",
  "stopLoss": "price",
  "takeProfit1": "price",
  "takeProfit2": "price",
  "confidence": 0-100,
  "reasoning": [{"type": "bullish|bearish|neutral", "text": "reason"}]
}

Return ONLY valid JSON, no markdown.`
}
