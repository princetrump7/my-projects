// CareerOS Extension Sidebar Script
const API_BASE = "https://careeros-roan.vercel.app";

// --------------- State ---------------
let authToken = null;
let currentTab = "analyze";

// --------------- DOM refs ---------------
const container = document.getElementById("container");
const loading = document.getElementById("loading");
const analyzeContent = document.getElementById("analyze-content");
const optimizeContent = document.getElementById("optimize-content");
const signinBtn = document.getElementById("signin-btn");
const signoutBtn = document.getElementById("signout-btn");

// --------------- Init ---------------
async function init() {
  try {
    // Load auth token
    const result = await chrome.storage.local.get(["supabase_auth_token"]);
    authToken = result.supabase_auth_token || null;

    // Setup tabs
    document.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", () => switchTab(tab.dataset.tab));
    });

    // Setup buttons
    document.getElementById("analyze-profile-btn").addEventListener("click", analyzeProfile);
    document.getElementById("optimize-job-btn").addEventListener("click", optimizeForJob);
    signinBtn.addEventListener("click", signIn);
    signoutBtn.addEventListener("click", signOut);

    updateAuthUI();

    // Check current LinkedIn page context
    await checkPageContext();

    container.style.display = "block";
    loading.style.display = "none";
  } catch (err) {
    console.error("CareerOS sidebar init error:", err);
    loading.innerHTML = `<p style="color:#ef4444;">Failed to load CareerOS. ${err.message}</p>`;
  }
}

// --------------- Tabs ---------------
function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll(".tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.tab === tab);
  });
  document.getElementById("analyze-tab").style.display = tab === "analyze" ? "block" : "none";
  document.getElementById("optimize-tab").style.display = tab === "optimize" ? "block" : "none";
  document.getElementById("settings-tab").style.display = tab === "settings" ? "block" : "none";
  checkPageContext();
}

// --------------- Page Context Detection ---------------
async function checkPageContext() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return;

    const url = new URL(tab.url);

    if (currentTab === "analyze" && url.pathname.startsWith("/in/") && url.pathname !== "/in/") {
      document.getElementById("analyze-content").innerHTML = `
        <p style="color:#8a8a92;text-align:center;padding:12px 0;font-size:13px;">
          Profile detected. Click "Analyze This Profile" to get an AI analysis.
        </p>
      `;
      document.getElementById("analyze-profile-btn").style.display = "block";
    } else if (currentTab === "optimize" && url.pathname.includes("/jobs/")) {
      document.getElementById("optimize-content").innerHTML = `
        <p style="color:#8a8a92;text-align:center;padding:12px 0;font-size:13px;">
          Job posting detected. Click "Optimize for This Job" to match your CV.
        </p>
      `;
      document.getElementById("optimize-job-btn").style.display = "block";
    } else if (currentTab === "analyze") {
      document.getElementById("analyze-content").innerHTML = `
        <p style="color:#8a8a92;text-align:center;padding:20px 0;font-size:13px;">
          Navigate to a LinkedIn profile to analyze it with CareerOS.
        </p>
      `;
      document.getElementById("analyze-profile-btn").style.display = "none";
    } else if (currentTab === "optimize") {
      document.getElementById("optimize-content").innerHTML = `
        <p style="color:#8a8a92;text-align:center;padding:20px 0;font-size:13px;">
          Navigate to a LinkedIn job posting to optimize your CV.
        </p>
      `;
      document.getElementById("optimize-job-btn").style.display = "none";
    }
  } catch (err) {
    console.error("CareerOS checkPageContext error:", err);
  }
}

// --------------- Auth ---------------
function updateAuthUI() {
  if (authToken) {
    signinBtn.style.display = "none";
    signoutBtn.style.display = "block";
  } else {
    signinBtn.style.display = "block";
    signoutBtn.style.display = "none";
  }
}

async function signIn() {
  const width = 500;
  const height = 600;
  const left = Math.round(screen.width / 2 - width / 2);
  const top = Math.round(screen.height / 2 - height / 2);

  chrome.windows.create({
    url: `${API_BASE}/login?redirect=extension`,
    type: "popup",
    width,
    height,
    left,
    top,
  });
}

async function signOut() {
  await chrome.storage.local.remove(["supabase_auth_token"]);
  authToken = null;
  updateAuthUI();
  analyzeContent.innerHTML = `
    <p style="color:#8a8a92;text-align:center;padding:20px 0;font-size:13px;">
      Signed out. Sign in to analyze LinkedIn profiles.
    </p>
  `;
}

// --------------- API Call ---------------
async function apiCall(endpoint, body) {
  const headers = { "Content-Type": "application/json" };
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE}/api/${endpoint}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

// --------------- Analyze Profile ---------------
async function analyzeProfile() {
  if (!authToken) {
    analyzeContent.innerHTML = `
      <div class="card" style="text-align:center;">
        <p style="color:#8a8a92;margin-bottom:12px;font-size:13px;">Sign in to analyze profiles</p>
        <button class="btn btn-primary" onclick="signIn()">Sign In</button>
      </div>
    `;
    return;
  }

  analyzeContent.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Analyzing profile...</p>
    </div>
  `;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Inject content script to extract profile data
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractProfileData,
    });

    const profileData = results[0]?.result;
    if (!profileData || !profileData.name) {
      throw new Error("Could not extract profile data. Make sure you're on a LinkedIn profile page.");
    }

    // Get user's resumes
    const { resumes } = await apiCall("resumes/list", {});
    if (!resumes || resumes.length === 0) {
      analyzeContent.innerHTML = `
        <div class="card" style="text-align:center;">
          <p style="color:#8a8a92;margin-bottom:12px;font-size:13px;">
            No CV found. Upload one first.
          </p>
          <button class="btn btn-primary" onclick="window.open('${API_BASE}/upload','_blank')">
            Upload CV
          </button>
        </div>
      `;
      return;
    }

    // Analyze with latest resume
    const result = await apiCall("analyze", { resume_id: resumes[0].id });
    const analysis = result.analysis || result;

    renderAnalysis(analysis);
  } catch (err) {
    analyzeContent.innerHTML = `
      <div class="card" style="text-align:center;border:1px solid rgba(239,68,68,0.2);">
        <p style="color:#ef4444;font-weight:600;margin-bottom:4px;">Analysis Failed</p>
        <p style="color:#8a8a92;font-size:13px;">${err.message}</p>
        <button class="btn btn-primary" style="margin-top:12px;" onclick="analyzeProfile()">Retry</button>
      </div>
    `;
  }
}

// --------------- Optimize for Job ---------------
async function optimizeForJob() {
  if (!authToken) {
    optimizeContent.innerHTML = `
      <div class="card" style="text-align:center;">
        <p style="color:#8a8a92;margin-bottom:12px;font-size:13px;">Sign in to optimize for jobs</p>
        <button class="btn btn-primary" onclick="signIn()">Sign In</button>
      </div>
    `;
    return;
  }

  optimizeContent.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Matching your CV with this job...</p>
    </div>
  `;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractJobData,
    });

    const jobData = results[0]?.result;
    if (!jobData || (!jobData.title && !jobData.description)) {
      throw new Error("Could not extract job details. Make sure you're on a LinkedIn job page.");
    }

    const { resumes } = await apiCall("resumes/list", {});
    if (!resumes || resumes.length === 0) {
      optimizeContent.innerHTML = `
        <div class="card" style="text-align:center;">
          <p style="color:#8a8a92;margin-bottom:12px;font-size:13px;">
            No CV found. Upload one first.
          </p>
          <button class="btn btn-primary" onclick="window.open('${API_BASE}/upload','_blank')">
            Upload CV
          </button>
        </div>
      `;
      return;
    }

    const result = await apiCall("match", {
      resume_id: resumes[0].id,
      job_title: jobData.title,
      job_company: jobData.company,
      job_description: jobData.description,
    });

    const match = result.match || result;
    renderMatch(match);
  } catch (err) {
    optimizeContent.innerHTML = `
      <div class="card" style="text-align:center;border:1px solid rgba(239,68,68,0.2);">
        <p style="color:#ef4444;font-weight:600;margin-bottom:4px;">Optimization Failed</p>
        <p style="color:#8a8a92;font-size:13px;">${err.message}</p>
        <button class="btn btn-primary" style="margin-top:12px;" onclick="optimizeForJob()">Retry</button>
      </div>
    `;
  }
}

// --------------- Render Functions ---------------
function renderAnalysis(analysis) {
  const score = analysis.interview_probability_score ?? 0;
  const scoreColor = score >= 70 ? "#34D399" : score >= 40 ? "#F59E0B" : "#ef4444";

  let weaknessesHtml = "";
  if (analysis.weaknesses?.length) {
    weaknessesHtml = analysis.weaknesses.map((w) => `<li style="margin-bottom:4px;font-size:13px;color:#8a8a92;">${w}</li>`).join("");
  } else {
    weaknessesHtml = "<li style='color:#8a8a92;font-size:13px;'>No weaknesses identified</li>";
  }

  let keywordsHtml = "";
  if (analysis.missing_keywords?.length) {
    keywordsHtml = analysis.missing_keywords
      .map((k) => `<span class="badge badge-missing">${k}</span>`)
      .join("");
  } else {
    keywordsHtml = "<span style='color:#8a8a92;font-size:13px;'>No missing keywords</span>";
  }

  let skillGapsHtml = "";
  if (analysis.skill_gaps && Object.keys(analysis.skill_gaps).length) {
    skillGapsHtml = Object.entries(analysis.skill_gaps)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(
        ([skill, gap]) => `
        <div style="margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px;">
            <span style="color:#F5F1EB;">${skill}</span>
            <span style="color:#8a8a92;">${gap}% gap</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width:${100 - gap}%;background:${gap > 50 ? "#ef4444" : "#F59E0B"};"></div>
          </div>
        </div>
      `
      )
      .join("");
  } else {
    skillGapsHtml = "<p style='color:#8a8a92;font-size:13px;'>No skill gaps identified</p>";
  }

  analyzeContent.innerHTML = `
    <div class="card" style="text-align:center;border-color:${scoreColor};">
      <div class="card-title">Interview Probability</div>
      <div class="score" style="color:${scoreColor};">${score}%</div>
      <div class="progress-bar" style="margin-top:8px;">
        <div class="progress-fill" style="width:${score}%;background:${scoreColor};"></div>
      </div>
      <p style="font-size:12px;color:#8a8a92;margin-top:4px;">
        ${score >= 70 ? "Strong profile — you're in good shape!" : score >= 40 ? "Room for improvement — see below." : "Needs significant improvement."}
      </p>
    </div>

    <div class="card">
      <div class="card-title">Weaknesses</div>
      <ul style="padding-left:16px;">${weaknessesHtml}</ul>
    </div>

    <div class="card">
      <div class="card-title">Missing Keywords</div>
      <div>${keywordsHtml}</div>
    </div>

    <div class="card">
      <div class="card-title">Top Skill Gaps</div>
      ${skillGapsHtml}
    </div>

    <button class="btn btn-secondary" onclick="window.open('${API_BASE}/analyze?resume_id=latest','_blank')">
      Full Analysis on Dashboard
    </button>
  `;
}

function renderMatch(match) {
  const score = match.match_score ?? 0;
  const scoreColor = score >= 70 ? "#34D399" : score >= 40 ? "#F59E0B" : "#ef4444";

  const competitionBadgeClass =
    match.competition_estimate === "low"
      ? "badge-success"
      : match.competition_estimate === "medium"
        ? "badge-warning"
        : "badge-missing";

  let missingSkillsHtml = "";
  if (match.missing_skills?.length) {
    missingSkillsHtml = match.missing_skills
      .slice(0, 10)
      .map((s) => `<span class="badge badge-missing">${s}</span>`)
      .join("");
  } else {
    missingSkillsHtml = "<span style='color:#8a8a92;font-size:13px;'>No missing skills</span>";
  }

  optimizeContent.innerHTML = `
    <div class="card" style="text-align:center;border-color:${scoreColor};">
      <div class="card-title">Match Score</div>
      <div class="score" style="color:${scoreColor};">${score}%</div>
      <div class="progress-bar" style="margin-top:8px;">
        <div class="progress-fill" style="width:${score}%;background:${scoreColor};"></div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Competition</div>
      <div style="text-align:center;">
        <span class="badge ${competitionBadgeClass}" style="font-size:14px;padding:6px 12px;">
          ${match.competition_estimate?.toUpperCase() || "UNKNOWN"}
        </span>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Missing Skills</div>
      <div>${missingSkillsHtml}</div>
    </div>

    ${match.optimized_cv_suggestion ? `
      <div class="card">
        <div class="card-title">Optimized CV Suggestion</div>
        <pre style="font-size:12px;white-space:pre-wrap;color:#8a8a92;max-height:200px;overflow-y:auto;">${match.optimized_cv_suggestion}</pre>
      </div>
    ` : ""}

    <button class="btn btn-secondary" onclick="window.open('${API_BASE}/jobs','_blank')">
      Full Job Match on Dashboard
    </button>
  `;
}

// --------------- LinkedIn Data Extractors (run in page context) ---------------
function extractProfileData() {
  const nameEl =
    document.querySelector(".text-heading-xlarge") ||
    document.querySelector("h1") ||
    document.querySelector('[data-anonymize="person-name"]');

  const headlineEl =
    document.querySelector(".text-body-medium") ||
    document.querySelector('[data-anonymize="headline"]');

  const aboutEl = document.querySelector(
    ".display-flex.ph5.pv3 .inline-show-more-text, #about ~ .inline-show-more-text"
  );

  const experienceEls = document.querySelectorAll(
    ".experience-section .profile-section-card, #experience ~ ul li article"
  );

  // Get all visible text from the profile
  const bodyText = document.body.innerText || "";

  const experiences = [];
  experienceEls.forEach((el) => {
    const title = el.querySelector("span[aria-hidden]")?.textContent?.trim() || "";
    if (title) experiences.push(title);
  });

  return {
    name: nameEl?.textContent?.trim() || "",
    headline: headlineEl?.textContent?.trim() || "",
    about: aboutEl?.textContent?.trim() || "",
    experiences: experiences.slice(0, 5),
    rawText: bodyText.substring(0, 5000),
  };
}

function extractJobData() {
  const titleEl =
    document.querySelector(".job-details-jobs-unified-top-card__job-title") ||
    document.querySelector("h1") ||
    document.querySelector(".jobs-unified-top-card__job-title");

  const companyEl =
    document.querySelector(".job-details-jobs-unified-top-card__company-name") ||
    document.querySelector(".jobs-company__name") ||
    document.querySelector(".jobs-unified-top-card__company-name");

  const descEl = document.querySelector(
    ".jobs-description-content__text, .jobs-box__body, .job-details-jobs-unified-top-card__description"
  );

  return {
    title: titleEl?.textContent?.trim() || "",
    company: companyEl?.textContent?.trim() || "",
    description: descEl?.textContent?.trim() || descEl?.innerText?.trim() || "",
  };
}

// --------------- Listen for auth token updates ---------------
chrome.storage.onChanged.addListener((changes) => {
  if (changes.supabase_auth_token) {
    authToken = changes.supabase_auth_token.newValue;
    updateAuthUI();

    if (authToken) {
      if (currentTab === "analyze") {
        const btn = document.getElementById("analyze-profile-btn");
        if (btn.style.display !== "none") {
          checkPageContext();
        }
      }
    }
  }
});

// Listen for messages from background/content script
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "tabChanged") {
    checkPageContext();
  }
});

// --------------- Start ---------------
document.addEventListener("DOMContentLoaded", init);
