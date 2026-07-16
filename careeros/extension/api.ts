// Extension API client for CareerOS backend
// Note: This file is bundled separately for the Chrome extension (not through Next.js).
// The API_BASE must be hardcoded since process.env is unavailable in the extension context.

const API_BASE = "https://careeros-roan.vercel.app";

interface AnalysisResult {
  interview_probability_score: number;
  weaknesses: string[];
  missing_keywords: string[];
  skill_gaps: Record<string, number>;
  optimized_text: string;
}

interface JobMatchResult {
  match_score: number;
  missing_skills: string[];
  competition_estimate: "low" | "medium" | "high";
  optimized_cv_suggestion: string;
}

// Get auth token from storage
async function getAuthToken(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(["supabase_auth_token"], (result) => {
      resolve(result.supabase_auth_token || null);
    });
  });
}

async function apiCall<T>(
  endpoint: string,
  body: Record<string, unknown>
): Promise<T> {
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/api/${endpoint}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `API call failed: ${response.status}`);
  }

  return response.json();
}

export async function analyzeProfile(
  resumeId: string
): Promise<{ analysis: AnalysisResult }> {
  return apiCall("analyze", { resume_id: resumeId });
}

export async function matchForJob(
  resumeId: string,
  jobTitle: string,
  jobDescription: string
): Promise<{ match: JobMatchResult }> {
  return apiCall("match", {
    resume_id: resumeId,
    job_title: jobTitle,
    job_description: jobDescription,
  });
}

export async function runDiagnosis(
  resumeId: string
): Promise<{ diagnosis: any }> {
  return apiCall("diagnose", { resume_id: resumeId });
}

// Detect if we're on a LinkedIn job page
export function isLinkedInJobPage(): boolean {
  return window.location.href.includes("/jobs/");
}

// Detect if we're on a LinkedIn profile page
export function isLinkedInProfilePage(): boolean {
  return (
    window.location.pathname.includes("/in/") &&
    window.location.pathname !== "/in/"
  );
}

// Extract job details from LinkedIn job page
export function extractJobDetails(): {
  title: string;
  company: string;
  description: string;
} | null {
  const titleEl = document.querySelector(
    ".job-details-jobs-unified-top-card__job-title, h1"
  );
  const companyEl = document.querySelector(
    ".job-details-jobs-unified-top-card__company-name, .jobs-company__name"
  );
  const descEl = document.querySelector(
    ".job-details-jobs-unified-top-card__description, .jobs-description__content"
  );

  return {
    title: titleEl?.textContent?.trim() || "",
    company: companyEl?.textContent?.trim() || "",
    description: descEl?.textContent?.trim() || "",
  };
}
