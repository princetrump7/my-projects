import { useState, useRef, useCallback, useEffect } from "react";

/* ═══════════════════════════════════════════════════════════
   NEXUS — AGENTIC COMPANY OS
   5 real AI agents powered by Claude API
   CEO → CTO, CMO, Lead Dev, Head of Intel
═══════════════════════════════════════════════════════════ */

const AGENTS = [
  {
    id: "APEX",
    role: "Chief Executive Officer",
    color: "#FFB800",
    dim: "rgba(255,184,0,0.07)",
    icon: "◈",
    system: `You are APEX, CEO of NEXUS — an elite AI-powered company. You are decisive, visionary, and strategic.
Analyze the given mission brief and create a comprehensive execution plan, delegating specific tasks to your team.
Team: FORGE (CTO), PULSE (CMO), CIPHER (Lead Dev), LENS (Head of Intelligence).
Respond ONLY with valid JSON — no markdown, no backticks, no explanation:
{"assessment":"2-3 sentence strategic assessment of the opportunity","vision":"1 sentence north-star vision","delegations":[{"agent":"FORGE","brief":"specific technical task for CTO"},{"agent":"PULSE","brief":"specific marketing/GTM task for CMO"},{"agent":"CIPHER","brief":"specific development task for Lead Dev"},{"agent":"LENS","brief":"specific market research task for Intel"}],"success_metrics":["metric 1","metric 2","metric 3"]}`
  },
  {
    id: "FORGE",
    role: "Chief Technology Officer",
    color: "#00E8BE",
    dim: "rgba(0,232,190,0.07)",
    icon: "⬡",
    system: `You are FORGE, CTO of NEXUS. Brilliant technical architect with deep expertise in AI, scalable systems, and modern stacks.
Respond ONLY with valid JSON — no backticks, no explanation:
{"tech_stack":["technology 1","technology 2","technology 3","technology 4","technology 5"],"architecture":"2-sentence architecture overview covering core components and data flow","key_components":["component 1","component 2","component 3","component 4"],"technical_risks":["risk 1","risk 2"],"recommended_timeline":"X–Y weeks"}`
  },
  {
    id: "PULSE",
    role: "Chief Marketing Officer",
    color: "#FF5E7A",
    dim: "rgba(255,94,122,0.07)",
    icon: "◉",
    system: `You are PULSE, CMO of NEXUS. Growth-obsessed marketer, expert in positioning, GTM strategy, and viral growth mechanics.
Respond ONLY with valid JSON — no backticks, no explanation:
{"positioning":"sharp one-liner value proposition","icp":"specific ideal customer profile with pain point","channels":["channel 1","channel 2","channel 3"],"growth_hooks":["hook 1","hook 2"],"launch_sequence":["step 1","step 2","step 3","step 4"],"north_star_metric":"the single metric that matters most"}`
  },
  {
    id: "CIPHER",
    role: "Lead Developer",
    color: "#A78BFA",
    dim: "rgba(167,139,250,0.07)",
    icon: "◐",
    system: `You are CIPHER, Lead Developer at NEXUS. Full-stack engineer who ships fast, thinks in systems, and builds MVPs that scale.
Respond ONLY with valid JSON — no backticks, no explanation:
{"mvp_features":["feature 1","feature 2","feature 3","feature 4"],"core_data_models":["Model1","Model2","Model3"],"critical_apis":["POST /api/endpoint","GET /api/endpoint","PUT /api/endpoint","DELETE /api/endpoint"],"build_order":["Phase 1: description","Phase 2: description","Phase 3: description"],"ship_date":"X weeks to MVP"}`
  },
  {
    id: "LENS",
    role: "Head of Intelligence",
    color: "#38BDF8",
    dim: "rgba(56,189,248,0.07)",
    icon: "◑",
    system: `You are LENS, Head of Intelligence at NEXUS. Elite market researcher who finds signal in noise and identifies asymmetric opportunities.
Respond ONLY with valid JSON — no backticks, no explanation:
{"market_size":"TAM: $X, SAM: $Y, SOM: $Z (with reasoning)","top_competitors":["Competitor 1 — key weakness","Competitor 2 — key weakness","Competitor 3 — key weakness"],"opportunities":["opportunity 1","opportunity 2"],"threats":["threat 1","threat 2"],"winning_insight":"1 contrarian insight that fundamentally changes the strategy"}`
  }
];

const SAMPLE_BRIEFS = [
  "Build a SaaS tool that helps African SMEs manage payroll and compliance in Ghana, Nigeria, and Kenya",
  "Create an AI-powered contract review tool for solo lawyers and small law firms",
  "Build a restaurant inventory management system with waste prediction using AI",
  "Launch a B2B SaaS that tracks software license waste for IT teams at 50–500 person companies"
];

const sleep = ms => new Promise(r => setTimeout(r, ms));
let uid = 0;

/* ─── DEMO MODE RESPONSES ────────────────────────────────────────────── */
function generateDemoResponse(agent, task) {
  const brief = task.slice(0, 40);
  if (agent.id === "APEX") {
    return {
      assessment: `The ${brief}... market shows strong demand with limited incumbent solutions. Regulatory complexity creates a moat for first movers.`,
      vision: `Become the definitive operating system for ${brief}... across emerging markets.`,
      delegations: [
        { agent: "FORGE", brief: "Design scalable multi-tenant architecture with regional compliance modules" },
        { agent: "PULSE", brief: "Develop GTM strategy targeting SME clusters via trade associations" },
        { agent: "CIPHER", brief: "Build MVP with core payroll engine and compliance dashboard" },
        { agent: "LENS", brief: "Map competitor landscape and identify partnership opportunities" }
      ],
      success_metrics: ["100 paying customers in 6 months", "$50K MRR by month 12", "NPS > 40"]
    };
  }
  if (agent.id === "FORGE") {
    return {
      tech_stack: ["Next.js 14", "PostgreSQL", "Redis", "AWS ECS", "Stripe Connect"],
      architecture: "Event-driven microservices with regional data residency. API Gateway routes traffic to compliance-specific service shards.",
      key_components: ["Auth Service", "Payroll Engine", "Compliance Module", "Notification Queue"],
      technical_risks: ["Multi-currency rounding errors", "Regulatory API downtime"],
      recommended_timeline: "8–10 weeks"
    };
  }
  if (agent.id === "PULSE") {
    return {
      positioning: `The only ${brief}... platform built for how African businesses actually work`,
      icp: "Finance managers at 20–200 employee SMEs frustrated with spreadsheet payroll",
      channels: ["LinkedIn ABM", "WhatsApp Business API", "Industry newsletter sponsorships"],
      growth_hooks: ["Free compliance audit tool", "Referral fee for accountants"],
      launch_sequence: ["Beta with 5 design partners", "ProductHunt launch", "Trade show tour", "Paid acquisition scale"],
      north_star_metric: "Weekly active payroll runs"
    };
  }
  if (agent.id === "CIPHER") {
    return {
      mvp_features: ["Employee onboarding", "Automated payroll calculation", "Payslip generation", "Basic compliance reporting"],
      core_data_models: ["Employee", "PayrollRun", "ComplianceRule"],
      critical_apis: ["POST /api/employees", "GET /api/payroll", "PUT /api/compliance", "DELETE /api/employees/:id"],
      build_order: ["Phase 1: Auth + Employee CRUD", "Phase 2: Payroll engine + calculations", "Phase 3: Compliance + reporting"],
      ship_date: "6 weeks to MVP"
    };
  }
  if (agent.id === "LENS") {
    return {
      market_size: "TAM: $2.1B, SAM: $340M, SOM: $12M (focused on Ghana/Nigeria/Kenya SME segment)",
      top_competitors: ["Workday — too expensive for SMEs", "Sage — poor localization", "Excel — error-prone at scale"],
      opportunities: ["Central Bank open banking APIs", "Mobile money integration gap"],
      threats: ["Regulatory changes increasing compliance burden", "Well-funded local competitors"],
      winning_insight: "SMEs don't want HR software—they want compliance peace of mind. Lead with audit readiness, not features."
    };
  }
  return { _raw: "Demo response generated." };
}

/* ─── API CALL WITH TIMEOUT, ABORT, AND ERROR HANDLING ───────────────── */
async function callAgent(agent, msg, apiKey, signal) {
  if (!apiKey || apiKey.trim().length < 10) {
    await sleep(1200);
    return generateDemoResponse(agent, msg);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  if (signal) {
    signal.addEventListener("abort", () => controller.abort());
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: agent.system,
        messages: [{ role: "user", content: msg }]
      })
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      let errMsg = `HTTP ${res.status}`;
      try {
        const errJson = JSON.parse(errText);
        errMsg = errJson.error?.message || errText;
      } catch {
        errMsg = errText || `HTTP ${res.status} ${res.statusText}`;
      }
      throw new Error(errMsg);
    }

    const data = await res.json();
    const text = data.content?.find(b => b.type === "text")?.text || "{}";

    try {
      return JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
    } catch {
      return { _raw: text };
    }
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("Request cancelled or timed out after 25 seconds.");
    }
    throw err;
  }
}

function agentSummary(id, r) {
  if (!r) return "Processing...";
  if (r._raw) return r._raw.slice(0, 180);
  if (id === "FORGE") return `Stack: ${(r.tech_stack || []).slice(0, 3).join(" · ")}  |  Timeline: ${r.recommended_timeline || "TBD"}`;
  if (id === "PULSE") return `"${r.positioning || ""}"  →  North Star: ${r.north_star_metric || ""}`;
  if (id === "CIPHER") return `MVP: ${(r.mvp_features || []).slice(0, 2).join(", ")}  |  ETA: ${r.ship_date || ""}`;
  if (id === "LENS") return `${r.market_size || ""}  |  Insight: ${(r.winning_insight || "").slice(0, 90)}`;
  if (id === "APEX") return r.vision || r.assessment || "";
  return "";
}

const ts = () => new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

/* ─── STYLES ─────────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=IBM+Plex+Mono:ital,wght@0,300;0,400;0,500;1,300&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.nx {
  font-family: 'IBM Plex Mono', monospace;
  background: #06060a;
  color: #c8c8d0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.nx::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,184,0,0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,184,0,0.025) 1px, transparent 1px);
  background-size: 48px 48px;
  pointer-events: none;
  z-index: 0;
}

/* ── HEADER ──────────────────────────────────────────────── */
.nx-hdr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 22px;
  border-bottom: 1px solid #131318;
  background: rgba(6,6,10,0.97);
  z-index: 20;
  flex-shrink: 0;
  gap: 12px;
}
.nx-logo {
  font-family: 'Orbitron', monospace;
  font-size: 18px;
  font-weight: 900;
  color: #FFB800;
  letter-spacing: 5px;
  line-height: 1;
}
.nx-tagline {
  font-size: 8px;
  letter-spacing: 3px;
  color: #383840;
  margin-top: 3px;
}
.nx-badge {
  font-size: 9px;
  letter-spacing: 2px;
  padding: 4px 10px;
  border-radius: 3px;
  border: 1px solid #222;
  color: #444;
  background: #0c0c10;
  transition: all 0.3s;
}
.nx-badge.running { color: #FFB800; border-color: #FFB80044; background: rgba(255,184,0,0.06); }
.nx-badge.complete { color: #00E8BE; border-color: #00E8BE44; background: rgba(0,232,190,0.06); }
.nx-hdr-right { display: flex; align-items: center; gap: 10px; }
.nx-new-btn {
  background: none;
  border: 1px solid #222;
  border-radius: 4px;
  color: #444;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9px;
  letter-spacing: 1px;
  padding: 4px 10px;
  cursor: pointer;
  transition: all 0.2s;
}
.nx-new-btn:hover { border-color: #444; color: #888; }

/* API Key Input */
.nx-key-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}
.nx-key-input {
  background: #0d0d14;
  border: 1px solid #1a1a22;
  border-radius: 4px;
  padding: 5px 10px;
  color: #888;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9px;
  width: 140px;
  outline: none;
  transition: border-color 0.2s;
}
.nx-key-input:focus { border-color: #FFB80066; }
.nx-key-input::placeholder { color: #333; }
.nx-demo-toggle {
  font-size: 8px;
  color: #444;
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 4px;
  letter-spacing: 0.5px;
}
.nx-demo-toggle input { accent-color: #FFB800; cursor: pointer; }

/* ── BODY ────────────────────────────────────────────────── */
.nx-body {
  display: flex;
  flex: 1;
  overflow: hidden;
  z-index: 1;
  position: relative;
}

/* ── SIDEBAR ─────────────────────────────────────────────── */
.nx-side {
  width: 210px;
  flex-shrink: 0;
  border-right: 1px solid #111116;
  padding: 16px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
  background: rgba(6,6,10,0.5);
}
.nx-side-lbl {
  font-size: 8px;
  letter-spacing: 3px;
  color: #2a2a35;
  padding: 0 6px;
  margin-bottom: 6px;
}
.ag-card {
  border: 1px solid #111116;
  border-radius: 6px;
  padding: 10px 12px;
  background: #09090e;
  transition: all 0.35s ease;
  position: relative;
  overflow: hidden;
}
.ag-card::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 2px;
  background: var(--ac);
  opacity: 0;
  transition: opacity 0.3s;
}
.ag-card.active::before, .ag-card.complete::before { opacity: 1; }
.ag-card.active {
  border-color: var(--ac-dim);
  background: var(--ac-bg);
  box-shadow: 0 0 20px var(--ac-glow);
}
.ag-card.complete { border-color: #1a1a22; opacity: 0.9; }
.ag-card.standby { opacity: 0.35; }
.ag-top { display: flex; align-items: center; gap: 8px; }
.ag-icon { font-size: 14px; color: var(--ac); }
.ag-name {
  font-family: 'Orbitron', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: var(--ac);
}
.ag-role { font-size: 8px; color: #2e2e3a; margin-top: 5px; letter-spacing: 0.3px; }
.ag-st-row { display: flex; align-items: center; gap: 6px; margin-top: 8px; }
.ag-dot {
  width: 5px; height: 5px; border-radius: 50%; background: #1e1e28;
  flex-shrink: 0;
  transition: background 0.3s;
}
.ag-dot.active { background: var(--ac); animation: dot-pulse 1.1s ease infinite; }
.ag-dot.complete { background: var(--ac); }
.ag-st-txt { font-size: 7px; letter-spacing: 2px; color: #2a2a35; text-transform: uppercase; }
.ag-st-txt.active { color: var(--ac); }
.ag-st-txt.complete { color: #333342; }

/* ── FEED ────────────────────────────────────────────────── */
.nx-feed-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}
.nx-feed {
  flex: 1;
  overflow-y: auto;
  padding: 18px 22px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  scrollbar-width: thin;
  scrollbar-color: #1a1a22 transparent;
}
.nx-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 12px;
  padding: 60px 24px;
}
.nx-empty-title {
  font-family: 'Orbitron', monospace;
  font-size: 11px;
  letter-spacing: 4px;
  color: #222228;
}
.nx-empty-sub { font-size: 9px; color: #1a1a22; letter-spacing: 2px; }
.nx-samples {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
  width: 100%;
  max-width: 480px;
}
.nx-sample {
  background: #0c0c12;
  border: 1px solid #141420;
  border-radius: 5px;
  padding: 8px 14px;
  font-size: 10px;
  color: #333340;
  cursor: pointer;
  text-align: left;
  font-family: 'IBM Plex Mono', monospace;
  transition: all 0.2s;
}
.nx-sample:hover { border-color: #FFB80033; color: #666; }

.fi { animation: fi-in 0.28s ease forwards; opacity: 0; }
.fi-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 7px 12px;
  border-radius: 4px;
  border-left: 2px solid transparent;
}
.fi-who {
  font-family: 'Orbitron', monospace;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 1px;
  min-width: 46px;
  margin-top: 2px;
  flex-shrink: 0;
}
.fi-msg { font-size: 11px; line-height: 1.65; color: #9090a0; flex: 1; min-width: 0; }
.fi-msg.output { color: #b8b8c8; }
.fi-msg.delegate { color: #FFB800; font-style: italic; }
.fi-msg.synthesis { color: #FFB80099; font-style: italic; }
.fi-msg.complete { color: #00E8BE; font-weight: 500; }
.fi-msg.error { color: #FF5E7A; }
.fi-msg.boot { color: #FFB800; font-weight: 500; letter-spacing: 1px; }
.fi-ts { font-size: 8px; color: #1e1e28; margin-top: 3px; min-width: 52px; text-align: right; flex-shrink: 0; }

/* ── INPUT ───────────────────────────────────────────────── */
.nx-input-bar {
  border-top: 1px solid #111116;
  padding: 14px 22px;
  display: flex;
  gap: 10px;
  align-items: flex-end;
  background: rgba(6,6,10,0.97);
  flex-shrink: 0;
}
.nx-textarea {
  flex: 1;
  background: #0d0d14;
  border: 1px solid #1a1a22;
  border-radius: 6px;
  padding: 11px 15px;
  color: #d0d0e0;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  line-height: 1.6;
  resize: none;
  outline: none;
  min-height: 56px;
  max-height: 110px;
  transition: border-color 0.2s;
}
.nx-textarea:focus { border-color: #FFB80066; }
.nx-textarea::placeholder { color: #242430; }
.nx-textarea:disabled { opacity: 0.4; }
.nx-exec-btn {
  background: #FFB800;
  color: #000;
  border: none;
  border-radius: 6px;
  padding: 11px 20px;
  font-family: 'Orbitron', monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  align-self: stretch;
  min-width: 100px;
}
.nx-exec-btn:hover:not(:disabled) { background: #ffc933; box-shadow: 0 0 20px rgba(255,184,0,0.3); }
.nx-exec-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.nx-exec-btn.running { background: #1a1a22; color: #444; }
.nx-report-btn {
  background: none;
  color: #00E8BE;
  border: 1px solid #00E8BE55;
  border-radius: 6px;
  padding: 11px 16px;
  font-family: 'Orbitron', monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  align-self: stretch;
}
.nx-report-btn:hover { background: rgba(0,232,190,0.08); border-color: #00E8BE99; }

/* ── REPORT ──────────────────────────────────────────────── */
.rp-overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.75);
  z-index: 100;
  display: flex;
  justify-content: flex-end;
  backdrop-filter: blur(6px);
}
.rp-panel {
  width: min(500px, 90vw);
  height: 100%;
  background: #08080e;
  border-left: 1px solid #181820;
  overflow-y: auto;
  padding: 22px 20px;
  scrollbar-width: thin;
  scrollbar-color: #1a1a22 transparent;
  animation: rp-slide 0.3s cubic-bezier(0.16,1,0.3,1);
}
.rp-hdr { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; }
.rp-logo {
  font-family: 'Orbitron', monospace;
  font-size: 14px;
  font-weight: 900;
  color: #FFB800;
  letter-spacing: 4px;
}
.rp-sub { font-size: 8px; color: #333340; letter-spacing: 2px; margin-top: 4px; }
.rp-close {
  background: none; border: 1px solid #1e1e28; color: #444;
  width: 28px; height: 28px; border-radius: 4px; cursor: pointer;
  font-size: 13px; display: flex; align-items: center; justify-content: center;
  transition: all 0.15s; flex-shrink: 0;
}
.rp-close:hover { border-color: #444; color: #999; }

.rp-section { border: 1px solid #131318; border-radius: 8px; overflow: hidden; margin-bottom: 12px; }
.rp-sec-hdr {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 14px; background: #0c0c12;
  border-bottom: 1px solid #131318;
}
.rp-sec-icon { font-size: 12px; }
.rp-sec-name {
  font-family: 'Orbitron', monospace;
  font-size: 9px; font-weight: 700; letter-spacing: 2px;
}
.rp-sec-role { font-size: 8px; color: #2a2a35; margin-left: 4px; }
.rp-sec-body { padding: 14px; display: flex; flex-direction: column; gap: 12px; }
.rp-field { display: flex; flex-direction: column; gap: 5px; }
.rp-fkey { font-size: 7px; letter-spacing: 2.5px; color: #2e2e3a; text-transform: uppercase; }
.rp-fval { font-size: 11px; color: #aaaabc; line-height: 1.6; }
.rp-tags { display: flex; flex-wrap: wrap; gap: 5px; }
.rp-tag {
  background: #0f0f18; border: 1px solid #1a1a24;
  border-radius: 3px; padding: 3px 9px; font-size: 9px; color: #666678;
}

/* ── ANIMATIONS ──────────────────────────────────────────── */
@keyframes dot-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(0.6); }
}
@keyframes fi-in {
  from { opacity: 0; transform: translateX(-6px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes rp-slide {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.spin { display: inline-block; animation: spin 1s linear infinite; }
`;

/* ─── REPORT SECTION ─────────────────────────────────────────────────── */
function ReportSection({ agentId, result }) {
  const a = AGENTS.find(x => x.id === agentId);
  if (!a || !result) return null;

  const entries = Object.entries(result).filter(([k]) => !k.startsWith("_"));

  return (
    <div className="rp-section">
      <div className="rp-sec-hdr">
        <span className="rp-sec-icon" style={{ color: a.color }}>{a.icon}</span>
        <span className="rp-sec-name" style={{ color: a.color }}>{a.id}</span>
        <span className="rp-sec-role">{a.role}</span>
      </div>
      <div className="rp-sec-body">
        {result._raw ? (
          <div className="rp-field">
            <div className="rp-fval">{result._raw}</div>
          </div>
        ) : entries.map(([key, val]) => (
          <div key={key} className="rp-field">
            <div className="rp-fkey">{key.replace(/_/g, " ")}</div>
            {Array.isArray(val) ? (
              <div className="rp-tags">
                {val.map((v, i) => <span key={i} className="rp-tag">{v}</span>)}
              </div>
            ) : (
              <div className="rp-fval">{String(val)}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── MAIN COMPONENT ─────────────────────────────────────────────────── */
export default function NexusAI() {
  const [task, setTask] = useState("");
  const [phase, setPhase] = useState("idle");
  const [statuses, setStatuses] = useState(() =>
    Object.fromEntries(AGENTS.map(a => [a.id, "standby"]))
  );
  const [feed, setFeed] = useState([]);
  const [results, setResults] = useState({});
  const [reportOpen, setReportOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [demoMode, setDemoMode] = useState(true);
  const feedRef = useRef(null);
  const abortCtrlRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (abortCtrlRef.current) {
        abortCtrlRef.current.abort();
      }
    };
  }, []);

  const scrollFeed = () => {
    setTimeout(() => {
      if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }, 80);
  };

  const addFeed = useCallback((agentId, type, content) => {
    setFeed(f => [...f, { id: uid++, agentId, type, content, time: ts() }]);
    scrollFeed();
  }, []);

  const reset = () => {
    if (abortCtrlRef.current) {
      abortCtrlRef.current.abort();
      abortCtrlRef.current = null;
    }
    setTask("");
    setPhase("idle");
    setFeed([]);
    setResults({});
    setReportOpen(false);
    setStatuses(Object.fromEntries(AGENTS.map(a => [a.id, "standby"])));
  };

  const runCompany = async () => {
    if (!task.trim() || phase === "running") return;

    abortCtrlRef.current = new AbortController();

    setPhase("running");
    setFeed([]);
    setResults({});
    setReportOpen(false);
    setStatuses(Object.fromEntries(AGENTS.map(a => [a.id, a.id === "APEX" ? "active" : "standby"])));

    addFeed("SYS", "boot", "NEXUS AGENTIC COMPANY OS  ·  MISSION INITIATED");
    await sleep(400);
    addFeed("APEX", "input", `Mission Brief: "${task}"`);
    await sleep(600);

    let apex;
    try {
      apex = await callAgent(AGENTS[0], `Mission brief: ${task}\n\nAnalyze this mission deeply and delegate to your team.`, demoMode ? "" : apiKey, abortCtrlRef.current.signal);
    } catch (e) {
      if (e.message.includes("cancelled") || e.name === "AbortError") {
        addFeed("SYS", "error", "Mission aborted.");
      } else {
        addFeed("SYS", "error", `Error: ${e.message}`);
      }
      if (mountedRef.current) setPhase("idle");
      return;
    }

    if (!mountedRef.current) return;

    setResults(r => ({ ...r, APEX: apex }));
    setStatuses(s => ({ ...s, APEX: "complete" }));

    if (apex.assessment) { addFeed("APEX", "output", `Assessment · ${apex.assessment}`); await sleep(250); }
    if (apex.vision) { addFeed("APEX", "output", `Vision · ${apex.vision}`); await sleep(250); }
    if (apex.success_metrics) { addFeed("APEX", "output", `KPIs · ${(apex.success_metrics || []).join("  ·  ")}`); await sleep(250); }

    const delegations = Array.isArray(apex.delegations) && apex.delegations.length
      ? apex.delegations
      : AGENTS.slice(1).map(a => ({ agent: a.id, brief: task }));

    addFeed("APEX", "delegate", `Dispatching briefs → ${delegations.map(d => d.agent).join("  →  ")}`);
    await sleep(400);

    for (const del of delegations) {
      const cfg = AGENTS.find(a => a.id === del.agent);
      if (!cfg) continue;

      await sleep(350);
      setStatuses(s => ({ ...s, [del.agent]: "active" }));
      addFeed(del.agent, "input", `Brief received: "${del.brief}"`);
      await sleep(500);

      let res;
      try {
        res = await callAgent(cfg, `Context: ${apex.assessment || task}\n\nYour brief: ${del.brief}`, demoMode ? "" : apiKey, abortCtrlRef.current.signal);
      } catch (e) {
        res = { _raw: `Error: ${e.message}` };
      }

      if (!mountedRef.current) return;

      setResults(r => ({ ...r, [del.agent]: res }));
      setStatuses(s => ({ ...s, [del.agent]: "complete" }));
      addFeed(del.agent, "output", agentSummary(del.agent, res));
      await sleep(200);
    }

    await sleep(500);
    addFeed("APEX", "synthesis", "All departments reporting complete. Compiling intelligence brief...");
    await sleep(700);
    addFeed("SYS", "complete", "MISSION COMPLETE  ·  Full company report is ready.");
    setPhase("complete");
    setReportOpen(true);
  };

  const getFeedRowStyle = (item) => {
    const a = AGENTS.find(x => x.id === item.agentId);
    const color = item.agentId === "SYS"
      ? (item.type === "complete" ? "#00E8BE" : item.type === "error" ? "#FF5E7A" : "#FFB800")
      : (a?.color || "#444");
    return {
      borderLeftColor: color,
      background: item.type === "complete" ? "rgba(0,232,190,0.04)"
        : item.type === "boot" ? "rgba(255,184,0,0.03)"
        : "transparent"
    };
  };

  const getWhoColor = (item) => {
    const a = AGENTS.find(x => x.id === item.agentId);
    return item.agentId === "SYS" ? "#FFB800" : (a?.color || "#666");
  };

  return (
    <div className="nx">
      <style>{CSS}</style>

      {/* HEADER */}
      <div className="nx-hdr">
        <div>
          <div className="nx-logo">NEXUS</div>
          <div className="nx-tagline">AGENTIC COMPANY OPERATING SYSTEM</div>
        </div>
        <div className="nx-hdr-right">
          <div className="nx-key-wrap">
            <input
              className="nx-key-input"
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="Anthropic API key"
              disabled={phase === "running"}
            />
            <label className="nx-demo-toggle">
              <input
                type="checkbox"
                checked={demoMode}
                onChange={e => setDemoMode(e.target.checked)}
                disabled={phase === "running"}
              />
              DEMO
            </label>
          </div>
          <div className={`nx-badge ${phase}`}>
            {phase === "idle" && "● STANDBY"}
            {phase === "running" && <><span className="spin">◌</span>{" EXECUTING"}</>}
            {phase === "complete" && "◈ MISSION COMPLETE"}
          </div>
          {phase !== "idle" && (
            <button className="nx-new-btn" onClick={reset}>NEW MISSION</button>
          )}
        </div>
      </div>

      {/* BODY */}
      <div className="nx-body">

        {/* SIDEBAR — AGENT ROSTER */}
        <div className="nx-side">
          <div className="nx-side-lbl">AGENT ROSTER</div>
          {AGENTS.map(agent => {
            const st = statuses[agent.id] || "standby";
            return (
              <div
                key={agent.id}
                className={`ag-card ${st}`}
                style={{
                  "--ac": agent.color,
                  "--ac-dim": agent.color + "44",
                  "--ac-bg": agent.dim,
                  "--ac-glow": agent.color + "22",
                }}
              >
                <div className="ag-top">
                  <span className="ag-icon">{agent.icon}</span>
                  <div className="ag-name">{agent.id}</div>
                </div>
                <div className="ag-role">{agent.role}</div>
                <div className="ag-st-row">
                  <div className={`ag-dot ${st}`} style={{ "--ac": agent.color }} />
                  <div className={`ag-st-txt ${st}`} style={st === "active" ? { color: agent.color } : {}}>
                    {st}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* FEED + INPUT */}
        <div className="nx-feed-wrap">
          <div className="nx-feed" ref={feedRef}>
            {feed.length === 0 ? (
              <div className="nx-empty">
                <div className="nx-empty-title">AWAITING MISSION BRIEF</div>
                <div className="nx-empty-sub">ENTER A PRODUCT IDEA OR BUSINESS GOAL TO DEPLOY YOUR TEAM</div>
                <div className="nx-samples">
                  {SAMPLE_BRIEFS.map((s, i) => (
                    <button key={i} className="nx-sample" onClick={() => setTask(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              feed.map(item => (
                <div key={item.id} className="fi">
                  <div className="fi-row" style={getFeedRowStyle(item)}>
                    <div className="fi-who" style={{ color: getWhoColor(item) }}>
                      {item.agentId === "SYS" ? "SYS" : item.agentId}
                    </div>
                    <div className={`fi-msg ${item.type}`}>{item.content}</div>
                    <div className="fi-ts">{item.time}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* INPUT BAR */}
          <div className="nx-input-bar">
            <textarea
              className="nx-textarea"
              value={task}
              onChange={e => setTask(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) runCompany(); }}
              placeholder="Enter mission brief: a product idea, business goal, or company challenge...  (Ctrl+Enter to execute)"
              disabled={phase === "running"}
              rows={2}
            />
            {phase === "complete" && (
              <button className="nx-report-btn" onClick={() => setReportOpen(true)}>
                REPORT
              </button>
            )}
            <button
              className={`nx-exec-btn ${phase === "running" ? "running" : ""}`}
              onClick={runCompany}
              disabled={phase === "running" || !task.trim()}
            >
              {phase === "running" ? <><span className="spin">◌</span>{" RUNNING"}</> : "EXECUTE"}
            </button>
          </div>
        </div>
      </div>

      {/* REPORT PANEL */}
      {reportOpen && (
        <div className="rp-overlay" onClick={() => setReportOpen(false)}>
          <div className="rp-panel" onClick={e => e.stopPropagation()}>
            <div className="rp-hdr">
              <div>
                <div className="rp-logo">NEXUS REPORT</div>
                <div className="rp-sub">FULL COMPANY INTELLIGENCE BRIEF</div>
              </div>
              <button className="rp-close" onClick={() => setReportOpen(false)}>✕</button>
            </div>
            {AGENTS.map(a => results[a.id] ? (
              <ReportSection key={a.id} agentId={a.id} result={results[a.id]} />
            ) : null)}
          </div>
        </div>
      )}
    </div>
  );
}
