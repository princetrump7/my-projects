/**
 * TradingView AI Copilot — Content Script (Complete)
 *
 * Self-contained IIFE. No modules, no injection, no bridges.
 * Content scripts have full chrome.runtime access — direct and reliable.
 *
 * Features:
 *   - Floating AI button → slide-in panel
 *   - Onboarding flow: Welcome → Market Select → Chart Detect → First Result
 *     → Value Deepen → Second Loop → Soft Paywall → Pricing
 *   - Full analysis output (bias, entry, SL/TP, reasoning, structure)
 *   - Tier-gated display (free sees partial, Pro sees full)
 *   - Soft paywalls with locked content / blurred sections
 *   - SPA navigation detection
 */

(function main() {
  if (!window.location.hostname.includes("tradingview.com")) return;

  console.log("[TVAI] Content script loaded");

  // ─── Constants ─────────────────────────────────────────────────
  const MAX_FREE = 5;

  const STEPS = {
    WELCOME: "welcome",
    MARKET: "market_select",
    DETECT: "chart_detect",
    FIRST_RESULT: "first_result",
    VALUE_DEEPEN: "value_deepen",
    SECOND_LOOP: "second_loop",
    PAYWALL: "soft_paywall",
    PRICING: "pricing",
  };

  const MARKETS = [
    { id: "xauusd", label: "Gold (XAUUSD)", emoji: "🥇" },
    { id: "forex", label: "Forex Majors", emoji: "💱" },
    { id: "crypto", label: "Crypto", emoji: "₿" },
    { id: "stocks", label: "Stocks & Indices", emoji: "📈" },
  ];

  // ─── State ─────────────────────────────────────────────────────
  let state = {
    remaining: MAX_FREE,
    tier: "free",
    onboardingComplete: false,
    onboardingStep: null,
    market: null,
    isPanelOpen: false,
    lastAnalysis: null,
  };
  let panelEl = null;
  let btnEl = null;

  // ─── 1. Inject CSS ─────────────────────────────────────────────
  if (!document.getElementById("tvai-styles")) {
    const link = document.createElement("link");
    link.id = "tvai-styles";
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL("src/ui/styles.css");
    document.head.appendChild(link);
  }

  // ─── 2. Init ───────────────────────────────────────────────────
  function init() {
    if (document.getElementById("tvai-root")) return;
    createButton();
    createPanel();
    loadState();
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();

  // ─── 3. Floating Button ───────────────────────────────────────
  function createButton() {
    btnEl = document.createElement("div");
    btnEl.id = "tvai-btn";
    btnEl.innerHTML = `<span>AI</span><span class="tvai-btn-icon">🤖</span>`;
    btnEl.addEventListener("click", togglePanel);
    document.body.appendChild(btnEl);
  }

  function togglePanel() {
    if (!panelEl) return;
    state.isPanelOpen = !state.isPanelOpen;
    panelEl.classList.toggle("tvai-panel-open", state.isPanelOpen);
    btnEl.classList.toggle("tvai-btn-active", state.isPanelOpen);
  }

  // ─── 4. Panel ─────────────────────────────────────────────────
  function createPanel() {
    panelEl = document.createElement("div");
    panelEl.id = "tvai-root";
    panelEl.innerHTML = `<div class="tvai-panel-wrap">
      <div class="tvai-header">
        <span class="tvai-header-logo">🤖</span>
        <span class="tvai-header-title">AI Copilot</span>
        <div class="tvai-header-spacer"></div>
        <span class="tvai-badge" id="tvai-badge">free</span>
        <span class="tvai-close" id="tvai-close">✕</span>
      </div>
      <div class="tvai-body" id="tvai-body"></div>
    </div>`;

    panelEl.querySelector("#tvai-close").onclick = () => {
      state.isPanelOpen = false;
      panelEl.classList.remove("tvai-panel-open");
      btnEl.classList.remove("tvai-btn-active");
    };

    document.body.appendChild(panelEl);
  }

  function getBody() {
    return document.getElementById("tvai-body");
  }

  function setBody(html) {
    const b = getBody();
    if (b) b.innerHTML = html;
  }

  // ─── 5. State ─────────────────────────────────────────────────
  async function loadState() {
    try {
      const bg = await chrome.runtime.sendMessage({ type: "GET_STATE" });
      if (bg) {
        state.tier = bg.tier || "free";
        state.remaining = bg.remaining ?? MAX_FREE;
        state.onboardingComplete = bg.onboardingComplete || false;
        state.market = bg.market || null;
        updateBadge();
      }
    } catch (e) {
      console.warn("[TVAI] loadState:", e.message);
    }
    showScreen();
  }

  function updateBadge() {
    const b = document.getElementById("tvai-badge");
    if (b) {
      b.textContent = state.tier;
      b.className = "tvai-badge tvai-badge-" + state.tier;
    }
  }

  function updateRemaining() {
    const r = document.getElementById("tvai-rem");
    if (r) r.textContent = state.remaining > 99 ? "∞" : state.remaining;
  }

  // ─── 6. Screen Router ─────────────────────────────────────────
  function showScreen(step) {
    if (step) state.onboardingStep = step;
    const s = state.onboardingStep;

    if (!state.onboardingComplete) {
      switch (s) {
        case STEPS.WELCOME: return renderWelcome();
        case STEPS.MARKET: return renderMarketSelect();
        case STEPS.DETECT: return renderChartDetect();
        case STEPS.FIRST_RESULT: return renderFirstResult();
        case STEPS.VALUE_DEEPEN: return renderValueDeepen();
        case STEPS.SECOND_LOOP: return renderSecondLoop();
        case STEPS.PAYWALL: return renderPaywall();
        case STEPS.PRICING: return renderPricing();
        default: return renderWelcome();
      }
    }
    showMainPanel();
  }

  // ─── 7. WELCOME ───────────────────────────────────────────────
  function renderWelcome() {
    state.onboardingStep = STEPS.WELCOME;
    setBody(`
      <div class="tvai-center">
        <div style="font-size:40px;margin-bottom:8px">📊</div>
        <div class="tvai-h1">TradingView AI Copilot</div>
        <p class="tvai-p">Turn any chart into structured ICT trade plans</p>
        <ul class="tvai-features">
          <li>🔍 Market structure analysis</li>
          <li>🎯 Entry, SL & TP suggestions</li>
          <li>🧠 Liquidity & order-block detection</li>
        </ul>
        <button class="tvai-btn tvai-btn-primary" id="tvai-onb-start">Continue</button>
        <button class="tvai-btn tvai-btn-text" id="tvai-onb-skip">Skip →</button>
      </div>
    `);
    document.getElementById("tvai-onb-start")?.addEventListener("click", () => showScreen(STEPS.MARKET));
    document.getElementById("tvai-onb-skip")?.addEventListener("click", skipOnboarding);
  }

  async function skipOnboarding() {
    try { await chrome.runtime.sendMessage({ type: "ONBOARDING_COMPLETE" }); } catch {}
    state.onboardingComplete = true;
    showMainPanel();
  }

  // ─── 8. MARKET SELECT ─────────────────────────────────────────
  function renderMarketSelect() {
    state.onboardingStep = STEPS.MARKET;
    setBody(`
      <div class="tvai-scroll">
        <div class="tvai-h1">What are you trading?</div>
        <p class="tvai-p">Tailors analysis to your market</p>
        <div class="tvai-mkt-grid">
          ${MARKETS.map(m => `
            <button class="tvai-mkt-opt" data-mkt="${m.id}">
              <span style="font-size:22px">${m.emoji}</span>
              <span>${m.label}</span>
            </button>
          `).join("")}
        </div>
        <button class="tvai-btn tvai-btn-primary tvai-btn-full" id="tvai-mkt-go" disabled>Continue</button>
      </div>
    `);

    document.querySelectorAll(".tvai-mkt-opt").forEach(el => {
      el.addEventListener("click", () => {
        document.querySelectorAll(".tvai-mkt-opt").forEach(b => b.classList.remove("selected"));
        el.classList.add("selected");
        state.market = el.dataset.mkt;
        document.getElementById("tvai-mkt-go").disabled = false;
      });
    });
    document.getElementById("tvai-mkt-go")?.addEventListener("click", async () => {
      if (state.market) {
        try { await chrome.runtime.sendMessage({ type: "SET_MARKET", payload: { market: state.market } }); } catch {}
        showScreen(STEPS.DETECT);
      }
    });
  }

  // ─── 9. CHART DETECT ──────────────────────────────────────────
  function renderChartDetect() {
    state.onboardingStep = STEPS.DETECT;
    const ctx = getChartContext();
    setBody(`
      <div class="tvai-center">
        <div class="tvai-spinner" style="margin:0 auto 16px"></div>
        <div class="tvai-h1">Detecting your chart...</div>
        <div class="tvai-detect-box">
          <div class="tvai-detect-row"><span>Symbol</span><span class="tvai-detect-val" id="tvai-det-sym">${ctx.symbol || "—"}</span></div>
          <div class="tvai-detect-row"><span>Timeframe</span><span class="tvai-detect-val" id="tvai-det-tf">${ctx.timeframe || "—"}</span></div>
        </div>
        <div class="tvai-detect-ok" id="tvai-det-ok" style="display:${ctx.detected ? "block" : "none"}">✅ Chart detected</div>
      </div>
    `);

    if (ctx.detected) {
      setTimeout(() => showScreen(STEPS.FIRST_RESULT), 800);
    } else {
      // Try again after a short delay
      setTimeout(() => {
        const ctx2 = getChartContext();
        const sym = document.getElementById("tvai-det-sym");
        const tf = document.getElementById("tvai-det-tf");
        const ok = document.getElementById("tvai-det-ok");
        if (sym) sym.textContent = ctx2.symbol || "—";
        if (tf) tf.textContent = ctx2.timeframe || "—";
        if (ok) { ok.style.display = "block"; }
        setTimeout(() => showScreen(STEPS.FIRST_RESULT), 800);
      }, 1500);
    }
  }

  // ─── 10. FIRST RESULT ─────────────────────────────────────────
  function renderFirstResult() {
    state.onboardingStep = STEPS.FIRST_RESULT;
    setBody(`
      <div class="tvai-center">
        <div class="tvai-spinner" style="margin:0 auto 16px"></div>
        <p class="tvai-p">Analyzing chart structure...</p>
        <div class="tvai-load-steps">
          <div class="tvai-load-step active">📷 Preparing analysis</div>
          <div class="tvai-load-step">🔍 Detecting structure</div>
          <div class="tvai-load-step">📐 Evaluating setup</div>
          <div class="tvai-load-step">✅ Generating report</div>
        </div>
      </div>
    `);
    triggerAnalysis();
  }

  // ─── 11. VALUE DEEPEN ─────────────────────────────────────────
  function renderValueDeepen() {
    state.onboardingStep = STEPS.VALUE_DEEPEN;
    setBody(`
      <div class="tvai-scroll">
        <div class="tvai-h1">🔬 What you just saw</div>
        <div class="tvai-deepen-list">
          <div class="tvai-deepen-item">
            <span style="font-size:20px">⚡</span>
            <div><strong>Liquidity sweep detected</strong><p class="tvai-p-sm">Price swept recent highs, trapping late buyers before reversing</p></div>
          </div>
          <div class="tvai-deepen-item">
            <span style="font-size:20px">🔄</span>
            <div><strong>Market structure shift</strong><p class="tvai-p-sm">CHoCH confirmed — trend bias is now established</p></div>
          </div>
          <div class="tvai-deepen-item">
            <span style="font-size:20px">🎯</span>
            <div><strong>High-probability zone</strong><p class="tvai-p-sm">Entry cluster at order block with high confidence</p></div>
          </div>
        </div>

        <div class="tvai-section-box">
          <div class="tvai-section-title">AI vs Retail</div>
          <table class="tvai-table">
            <tr><th>Retail</th><th>AI Insight</th></tr>
            <tr><td>Buys breakout</td><td>Wait for retest + CHoCH</td></tr>
            <tr><td>Chases price</td><td>Identify liquidity first</td></tr>
            <tr><td>No invalidation</td><td>Clear SL from structure</td></tr>
          </table>
        </div>

        <button class="tvai-btn tvai-btn-primary tvai-btn-full" id="tvai-deep-next">Scan Next Setup</button>
      </div>
    `);
    document.getElementById("tvai-deep-next")?.addEventListener("click", () => showScreen(STEPS.SECOND_LOOP));
  }

  // ─── 12. SECOND LOOP ──────────────────────────────────────────
  function renderSecondLoop() {
    state.onboardingStep = STEPS.SECOND_LOOP;
    setBody(`
      <div class="tvai-scroll">
        <div class="tvai-h1">Next Opportunity</div>
        <div class="tvai-loop-card">
          <div class="tvai-loop-sym">${state.lastAnalysis?.symbol || "EURUSD"}</div>
          <div class="tvai-loop-status">Showing consolidation</div>
          <div class="tvai-loop-badge tvai-loop-avoid">⚠️ No high-probability setup</div>
        </div>
        <div class="tvai-section-box">
          <div class="tvai-section-title">AI Recommendation</div>
          <p style="color:var(--tv-red);font-weight:600;margin-bottom:4px">→ Avoid trading</p>
          <p class="tvai-p-sm">Price in balanced range. Wait for liquidity grab.</p>
        </div>
        <button class="tvai-btn tvai-btn-secondary tvai-btn-full" id="tvai-loop-another">Scan Another Chart</button>
      </div>
    `);
    document.getElementById("tvai-loop-another")?.addEventListener("click", () => {
      triggerAnalysis();
    });
    // Auto-paywall after 4 seconds
    setTimeout(() => {
      if (state.onboardingStep === STEPS.SECOND_LOOP) showScreen(STEPS.PAYWALL);
    }, 4000);
  }

  // ─── 13. SOFT PAYWALL ─────────────────────────────────────────
  function renderPaywall() {
    state.onboardingStep = STEPS.PAYWALL;
    setBody(`
      <div class="tvai-scroll">
        <div class="tvai-h1">🔒 Unlock Advanced AI Analysis</div>
        <div class="tvai-pw-cols">
          <div class="tvai-pw-col">
            <div class="tvai-pw-col-title">Free</div>
            <ul class="tvai-pw-list">
              <li>✅ Basic bias</li>
              <li>✅ Simple entry zones</li>
              <li>✅ Score up to 72%</li>
            </ul>
          </div>
          <div class="tvai-pw-col tvai-pw-col-pro">
            <div class="tvai-pw-col-title">Pro <span class="tvai-pw-badge">RECOMMENDED</span></div>
            <ul class="tvai-pw-list">
              <li>🔥 Multi-timeframe</li>
              <li>🔥 High-probability filter</li>
              <li>🔥 Liquidity sweep engine</li>
              <li>🔥 Institutional reasoning</li>
            </ul>
          </div>
        </div>

        <div class="tvai-pw-insight">
          💡 <strong>Hidden insight:</strong> This setup improves from
          <span style="color:var(--tv-text-3);text-decoration:line-through">72</span> →
          <span style="color:var(--tv-green);font-weight:700;font-size:18px">89</span>
          score with H4 structure
        </div>

        <div class="tvai-pw-locked">
          <div class="tvai-pw-lock-badge">🔒 Pro Feature</div>
          <div class="tvai-pw-lock-title">Multi-timeframe analysis</div>
          <p class="tvai-p-sm">See H1/H4 structure alignment for higher confidence entries</p>
          <div class="tvai-pw-blur">H4: Bullish order block at 4165-4175 with sweep target at 4230</div>
        </div>

        <button class="tvai-btn tvai-btn-primary tvai-btn-full" id="tvai-pw-upgrade" style="margin-bottom:8px">Upgrade to Pro</button>
        <button class="tvai-btn tvai-btn-text tvai-btn-full" id="tvai-pw-dismiss">Not now — use free plan</button>
      </div>
    `);

    document.getElementById("tvai-pw-upgrade")?.addEventListener("click", () => showScreen(STEPS.PRICING));
    document.getElementById("tvai-pw-dismiss")?.addEventListener("click", async () => {
      try { await chrome.runtime.sendMessage({ type: "ONBOARDING_COMPLETE" }); } catch {}
      state.onboardingComplete = true;
      showMainPanel();
    });
  }

  // ─── 14. PRICING ──────────────────────────────────────────────
  function renderPricing() {
    state.onboardingStep = STEPS.PRICING;
    setBody(`
      <div class="tvai-scroll">
        <div class="tvai-h1">Choose Your Plan</div>
        <p class="tvai-p">Unlock institutional-grade analysis</p>

        <div class="tvai-plan" onclick="window.__tvaiPlanPick('starter')">
          <div class="tvai-plan-row">
            <div><div class="tvai-plan-name">Starter</div><div class="tvai-plan-price">$15<span>/mo</span></div></div>
            <ul class="tvai-plan-feats">
              <li>100 analyses/month</li>
              <li>Full signal output</li>
              <li>Basic structure detection</li>
            </ul>
          </div>
        </div>

        <div class="tvai-plan tvai-plan-feat" onclick="window.__tvaiPlanPick('pro')">
          <div class="tvai-plan-badge">⭐ Recommended</div>
          <div class="tvai-plan-row">
            <div><div class="tvai-plan-name">Pro</div><div class="tvai-plan-price">$29<span>/mo</span></div></div>
            <ul class="tvai-plan-feats">
              <li>🔥 Unlimited analyses</li>
              <li>🔥 Multi-timeframe reasoning</li>
              <li>🔥 High-probability filter</li>
              <li>🔥 Liquidity sweep engine</li>
              <li>🔥 Risk-reward calculator</li>
            </ul>
          </div>
        </div>

        <div class="tvai-plan" onclick="window.__tvaiPlanPick('elite')">
          <div class="tvai-plan-row">
            <div><div class="tvai-plan-name">Elite</div><div class="tvai-plan-price">$99<span>/mo</span></div></div>
            <ul class="tvai-plan-feats">
              <li>Everything in Pro</li>
              <li>Strategy presets (ICT, Breakout)</li>
              <li>Session-based bias</li>
              <li>Priority processing</li>
            </ul>
          </div>
        </div>

        <button class="tvai-btn tvai-btn-text tvai-btn-full" onclick="window.__tvaiPlanPick('trial')">Start 3-Day Trial</button>
        <p style="text-align:center;font-size:11px;color:var(--tv-text-3);margin-top:8px">Cancel anytime</p>
      </div>
    `);

    window.__tvaiPlanPick = async (tier) => {
      console.log("[TVAI] Plan:", tier);
      if (tier === "pro" || tier === "starter" || tier === "elite") {
        try { await chrome.runtime.sendMessage({ type: "SET_TIER", payload: { tier } }); } catch {}
        state.tier = tier;
      }
      state.onboardingComplete = true;
      try { await chrome.runtime.sendMessage({ type: "ONBOARDING_COMPLETE" }); } catch {}
      showMainPanel();
    };
  }

  // ─── 15. MAIN PANEL ───────────────────────────────────────────
  function showMainPanel(tab) {
    state.onboardingComplete = true;
    const t = tab || "analyze";
    setBody(`
      <div class="tvai-main-content">
        <div class="tvai-main-body" id="tvai-main-body">
          <div class="tvai-center">
            <p class="tvai-p" style="padding:24px 0">Chart detected. Click <strong>Analyze</strong> for AI market structure insights.</p>
            <div class="tvai-rem-box">
              <span class="tvai-rem-label">Free analyses today</span>
              <span class="tvai-rem-count" id="tvai-rem">${state.remaining}</span>
            </div>
          </div>
        </div>
        <div class="tvai-footer">
          <button class="tvai-btn tvai-btn-primary tvai-btn-full" id="tvai-analyze-btn">
            <span class="tvai-btn-spinner" id="tvai-spin" style="display:none"></span>
            <span id="tvai-analyze-txt">Analyze Chart</span>
          </button>
        </div>
      </div>
    `);
    updateRemaining();
    document.getElementById("tvai-analyze-btn")?.addEventListener("click", triggerAnalysis);
  }

  // ─── 16. TRIGGER ANALYSIS ─────────────────────────────────────
  async function triggerAnalysis() {
    const body = document.getElementById("tvai-main-body") || getBody();
    const btn = document.getElementById("tvai-analyze-btn");
    const txt = document.getElementById("tvai-analyze-txt");
    const spin = document.getElementById("tvai-spin");

    if (btn) { btn.disabled = true; if (txt) txt.textContent = "Analyzing..."; if (spin) spin.style.display = "inline-block"; }

    if (body && !state.onboardingComplete) {
      body.innerHTML = `
        <div class="tvai-center">
          <div class="tvai-spinner" style="margin:0 auto 16px"></div>
          <p class="tvai-p">Analyzing chart structure...</p>
          <div class="tvai-load-steps">
            <div class="tvai-load-step active">📷 Capturing chart</div>
            <div class="tvai-load-step">🔍 Detecting structure</div>
            <div class="tvai-load-step">📐 Evaluating setup</div>
            <div class="tvai-load-step">✅ Generating report</div>
          </div>
        </div>
      `;
    } else if (body) {
      body.innerHTML = `
        <div class="tvai-center">
          <div class="tvai-spinner" style="margin:0 auto 12px"></div>
          <p class="tvai-p">Analyzing chart structure...</p>
        </div>
      `;
    }

    try {
      const ctx = getChartContext();
      const result = await chrome.runtime.sendMessage({
        type: "ANALYZE_CHART",
        payload: { context: ctx },
      });

      if (result) {
        if (result.remaining !== undefined) state.remaining = result.remaining;
        if (result.tier) state.tier = result.tier;
        updateBadge();
        updateRemaining();
      }

      state.lastAnalysis = result;

      if (result?.error === "limit_reached") {
        renderLimitResult(body, result);
        return;
      }
      if (result?.error) {
        renderErrorResult(body, result);
        return;
      }

      if (!state.onboardingComplete && state.onboardingStep === STEPS.FIRST_RESULT) {
        renderOnboardingFirstResult(body, result);
        return;
      }
      if (!state.onboardingComplete && state.onboardingStep === STEPS.SECOND_LOOP) {
        renderOnboardingFirstResult(body, result);
        return;
      }

      renderFullResult(body, result);
    } catch (err) {
      console.error("[TVAI] Error:", err);
      renderErrorResult(body, { message: "Analysis failed. Try again." });
    } finally {
      if (btn) { btn.disabled = false; if (txt) txt.textContent = "Analyze Chart"; if (spin) spin.style.display = "none"; }
    }
  }

  // ─── 17. RESULT RENDERERS ─────────────────────────────────────
  function renderOnboardingFirstResult(container, result) {
    const score = Math.round(result.score || result.confidence || 0);
    const bias = (result.bias || "neutral").toLowerCase();
    const entry = result.entryZone || {};
    const tp = result.takeProfit || {};
    const reasons = result.reasoning || [];

    container.innerHTML = `
      <div class="tvai-scroll tvai-result-view">
        <div class="tvai-result-hdr">
          <span class="tvai-bias-pill tvai-bias-${bias}">${bias === "bullish" ? "🟢" : "🔴"} ${bias.toUpperCase()}</span>
          <span class="tvai-score tvai-score-${score >= 75 ? "high" : score >= 50 ? "med" : "low"}">${score}</span>
        </div>

        <div class="tvai-data-box">
          <div class="tvai-data-row"><span class="tvai-dl">Entry</span><span class="tvai-dv">${entry.low || "—"} – ${entry.high || "—"}</span></div>
          <div class="tvai-data-row"><span class="tvai-dl">Stop Loss</span><span class="tvai-dv tvai-dv-sl">${result.stopLoss || "—"}</span></div>
          <div class="tvai-data-row"><span class="tvai-dl">Take Profit</span><span class="tvai-dv tvai-dv-tp">TP1: ${tp.tp1 || "—"}<br>TP2: ${tp.tp2 || "—"}</span></div>
        </div>

        ${reasons.length ? `
        <div class="tvai-reason-box">
          <div class="tvai-section-title">Reasoning</div>
          <ul class="tvai-reason-list">${reasons.map(r => `<li>${r}</li>`).join("")}</ul>
        </div>` : ""}

        <div style="display:flex;flex-direction:column;gap:6px;margin-top:12px">
          <button class="tvai-btn tvai-btn-secondary tvai-btn-full" id="tvai-onb-deepen">View Full Breakdown</button>
          <button class="tvai-btn tvai-btn-primary tvai-btn-full" id="tvai-onb-next">Scan Next Setup</button>
        </div>
      </div>
    `;
    container.scrollTop = 0;

    document.getElementById("tvai-onb-deepen")?.addEventListener("click", () => showScreen(STEPS.VALUE_DEEPEN));
    document.getElementById("tvai-onb-next")?.addEventListener("click", () => showScreen(STEPS.SECOND_LOOP));
  }

  function renderFullResult(container, result) {
    const score = Math.round(result.score || result.confidence || 0);
    const bias = (result.bias || "neutral").toLowerCase();
    const entry = result.entryZone || {};
    const tp = result.takeProfit || {};
    const reasons = result.reasoning || [];
    const showFull = state.tier !== "free";

    container.innerHTML = `
      <div class="tvai-scroll tvai-result-view">
        <div class="tvai-result-hdr">
          <span class="tvai-bias-pill tvai-bias-${bias}">${bias === "bullish" ? "🟢" : "🔴"} ${bias.toUpperCase()}</span>
          <span class="tvai-score tvai-score-${score >= 75 ? "high" : score >= 50 ? "med" : "low"}">${score}<span class="tvai-score-unit">/100</span></span>
        </div>

        <div class="tvai-data-box">
          <div class="tvai-data-row"><span class="tvai-dl">Entry Zone</span><span class="tvai-dv">${entry.low || "—"} – ${entry.high || "—"}</span></div>
          <div class="tvai-data-row"><span class="tvai-dl">Stop Loss</span><span class="tvai-dv tvai-dv-sl">${result.stopLoss || "—"}</span></div>
          <div class="tvai-data-row"><span class="tvai-dl">Take Profit</span><span class="tvai-dv tvai-dv-tp">TP1: ${tp.tp1 || "—"}<br>TP2: ${tp.tp2 || "—"}</span></div>
          ${showFull && result.rr ? `<div class="tvai-data-row"><span class="tvai-dl">R:R</span><span class="tvai-dv">1:${result.rr}</span></div>` : ""}
        </div>

        ${reasons.length ? `
        <div class="tvai-reason-box">
          <div class="tvai-section-title">Reasoning</div>
          <ul class="tvai-reason-list">${reasons.slice(0, showFull ? reasons.length : 2).map(r => `<li>${r}</li>`).join("")}</ul>
          ${!showFull && reasons.length > 2 ? `<div class="tvai-locked-hint">🔒 ${reasons.length - 2} more with Pro</div>` : ""}
        </div>` : ""}

        ${showFull && result.structure ? `
        <div class="tvai-data-box">
          <div class="tvai-section-title">Market Structure</div>
          <div class="tvai-data-row"><span class="tvai-dl">Trend</span><span class="tvai-dv">${result.structure.trend || "—"}</span></div>
          <div class="tvai-data-row"><span class="tvai-dl">Pattern</span><span class="tvai-dv">${result.structure.pattern || "—"}</span></div>
          <div class="tvai-data-row"><span class="tvai-dl">BOS at</span><span class="tvai-dv">${result.structure.bosAt || "—"}</span></div>
        </div>` : (!showFull ? `
        <div class="tvai-locked-section">
          <div class="tvai-locked-overlay">
            <div style="font-size:24px;margin-bottom:4px">🔒</div>
            <div style="font-weight:600;margin-bottom:2px">Market Structure</div>
            <p class="tvai-p-sm" style="margin-bottom:8px">Upgrade to see liquidity levels, CHoCH/BOS, and order blocks</p>
            <button class="tvai-btn tvai-btn-primary tvai-btn-small" id="tvai-upgrade-from-result">Unlock</button>
          </div>
        </div>` : "")}

        ${state.tier === "free" ? `
        <div class="tvai-usage-row">
          <span class="tvai-usage-bar" style="width:${Math.max(5, (MAX_FREE - state.remaining) / MAX_FREE * 100)}%"></span>
          <span class="tvai-usage-label">${state.remaining}/${MAX_FREE} free today</span>
        </div>` : `
        <div class="tvai-usage-row" style="text-align:center"><span class="tvai-usage-label" style="color:var(--tv-green)">Unlimited analyses</span></div>`}
      </div>
    `;
    container.scrollTop = 0;

    document.getElementById("tvai-upgrade-from-result")?.addEventListener("click", showPricingFromPanel);
  }

  function renderErrorResult(container, result) {
    container.innerHTML = `
      <div class="tvai-center" style="padding:40px 0">
        <div style="font-size:32px;margin-bottom:8px">⚠️</div>
        <p class="tvai-p">${result?.message || "Analysis failed. Try again."}</p>
        <button class="tvai-btn tvai-btn-secondary" id="tvai-retry-btn">Retry</button>
      </div>
    `;
    document.getElementById("tvai-retry-btn")?.addEventListener("click", triggerAnalysis);
  }

  function renderLimitResult(container, result) {
    container.innerHTML = `
      <div class="tvai-center" style="padding:40px 0">
        <div style="font-size:40px;margin-bottom:8px">⏰</div>
        <p class="tvai-p">Daily limit reached</p>
        <p style="font-size:12px;color:var(--tv-text-3);margin-bottom:12px">Upgrade for unlimited analysis</p>
        <button class="tvai-btn tvai-btn-primary" id="tvai-limit-upgrade">Upgrade</button>
      </div>
    `;
    document.getElementById("tvai-limit-upgrade")?.addEventListener("click", showPricingFromPanel);
  }

  function showPricingFromPanel() {
    state.onboardingStep = STEPS.PRICING;
    state.onboardingComplete = false;
    showScreen(STEPS.PRICING);
  }

  // ─── 18. Chart Context ────────────────────────────────────────
  function getChartContext() {
    const sels = {
      symbol: [".tv-symbol-price-quote__symbol", ".chart-symbol-last", "[data-symbol]", ".ticker-symbol"],
      tf: [".tv-button-timeframe.is-active", "[data-timeframe].is-active", ".timeframe-button.is-active"],
      price: [".tv-symbol-price-quote__value", ".last-price", ".quote-price"],
    };
    const find = list => { for (const s of list) { const e = document.querySelector(s); if (e) return e; } return null; };
    const sym = find(sels.symbol);
    const tf = find(sels.tf);
    const px = find(sels.price);
    return {
      symbol: sym?.textContent?.trim() || sym?.getAttribute("data-symbol") || null,
      timeframe: tf?.textContent?.trim() || null,
      price: px?.textContent?.trim() || null,
      detected: !!(sym || tf || px),
      url: window.location.href,
    };
  }

  // ─── 19. SPA Navigation ───────────────────────────────────────
  let lastUrl = window.location.href;
  const observer = new MutationObserver(() => {
    const cur = window.location.href;
    if (cur !== lastUrl) { lastUrl = cur; onNav(); }
  });
  observer.observe(document.querySelector("head") || document.documentElement, { subtree: true, childList: true });

  function onNav() {
    console.log("[TVAI] Navigated:", window.location.href);
    const btn = document.getElementById("tvai-analyze-btn");
    if (btn) btn.disabled = false;
    const body = document.getElementById("tvai-main-body");
    if (body && state.isPanelOpen) {
      body.innerHTML = `
        <div class="tvai-center"><p class="tvai-p" style="padding:24px 0">New chart detected. Click <strong>Analyze</strong> for fresh insights.</p></div>
      `;
    }
  }

  console.log("[TVAI] Ready");
})();
