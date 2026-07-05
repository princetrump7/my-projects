/**
 * Local dev / production server for the TradingView AI backend.
 *
 * Run with:
 *   GROQ_API_KEY=gsk_... node server.js
 *   GROQ_API_KEY=gsk_... node --watch server.js   (dev mode)
 *
 * Environment variables:
 *   PORT         — server port (default: 3001)
 *   GROQ_API_KEY — required for AI vision analysis
 *   CORS_ORIGIN  — allowed origin for CORS (default: https://www.tradingview.com)
 */

import express from "express";
import cors from "cors";
import { analyzeTradingChart } from "./aiRouter.js";

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "https://www.tradingview.com";

// ─── Middleware ─────────────────────────────────────────────────────

app.use(
  cors({
    origin: CORS_ORIGIN,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "X-User-Id"],
  })
);
app.use(express.json({ limit: "10mb" }));

// ─── Routes ─────────────────────────────────────────────────────────

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    version: "1.0.0",
    groqConfigured: !!process.env.GROQ_API_KEY,
  });
});

// Chart analysis endpoint
app.post("/api/analyze", async (req, res) => {
  try {
    const { image, context, market, tier, userId } = req.body;

    if (!image) {
      return res.status(400).json({
        error: "missing_image",
        message: "Chart image is required. Capture a screenshot and try again.",
      });
    }

    const result = await analyzeTradingChart(image, context || {}, {
      market,
      tier,
      userId,
    });

    res.json(result);
  } catch (err) {
    console.error("[TVAI] Analysis error:", err);
    res.status(500).json({
      error: "analysis_failed",
      message: err.message,
    });
  }
});

// ─── Startup ────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[TVAI] Backend running on http://localhost:${PORT}`);
  console.log(`[TVAI] CORS origin: ${CORS_ORIGIN}`);
  console.log(`[TVAI] Groq API: ${process.env.GROQ_API_KEY ? "configured" : "NOT configured (using fallback)"}`);
  console.log(`[TVAI] Health:      GET http://localhost:${PORT}/health`);
  console.log(`[TVAI] Analyze:    POST http://localhost:${PORT}/api/analyze`);
});
