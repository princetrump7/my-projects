import OpenAI from "openai"
import { z } from "zod"

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("The OPENAI_API_KEY environment variable is missing or empty")
  }
  return new OpenAI({ apiKey })
}

// Response schemas
export const AnalysisResultSchema = z.object({
  interview_probability_score: z.number().min(0).max(100),
  weaknesses: z.array(z.string()),
  missing_keywords: z.array(z.string()),
  skill_gaps: z.record(z.string(), z.number()),
  optimized_text: z.string(),
})

export const JobMatchResultSchema = z.object({
  match_score: z.number().min(0).max(100),
  missing_skills: z.array(z.string()),
  competition_estimate: z.enum(["low", "medium", "high"]),
  optimized_cv_suggestion: z.string(),
})

export const CareerDiagnosisSchema = z.object({
  rejection_reasons: z.array(z.string()),
  top_skill_gaps: z.record(z.string(), z.number()),
  market_keyword_frequency: z.record(z.string(), z.number()),
  overall_assessment: z.string(),
})

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>
export type JobMatchResult = z.infer<typeof JobMatchResultSchema>
export type CareerDiagnosis = z.infer<typeof CareerDiagnosisSchema>

// CV Analysis Prompt
const CV_ANALYSIS_PROMPT = `You are CareerOS, an AI career intelligence engine. Analyze this CV for hiring probability.

Return a JSON object with:
- interview_probability_score (0-100): How likely is this person to get an interview with this CV?
- weaknesses (string[]): Specific weaknesses in formatting, keywords, bullet points, or content
- missing_keywords (string[]): Keywords missing from the CV that are common in the target job market
- skill_gaps (object): Key skills the candidate is missing, with importance weight (0-100)
- optimized_text (string): A completely rewritten, optimized version of the CV

Be brutally honest with the score. Most CVs should score between 30-70. A score of 80+ means the CV is nearly perfect. Focus on actionable, specific feedback.`;

// Job Match Prompt
const JOB_MATCH_PROMPT = `You are CareerOS, an AI job matching engine. Compare this CV to the job description.

Return a JSON object with:
- match_score (0-100): How well does the CV match this specific job?
- missing_skills (string[]): Skills required by the job that are missing from the CV
- competition_estimate ("low" | "medium" | "high"): How competitive is this candidate for this role?
- optimized_cv_suggestion (string): Rewritten version of the candidate's experience section optimized for this specific job

Be specific. List real, technical/domain skills that are missing — not generic advice.`;

// Career Truth Prompt
const CAREER_TRUTH_PROMPT = `You are CareerOS, an AI career intelligence engine. Analyze this CV against real job market data.

Return a JSON object with:
- rejection_reasons (string[]): Data-driven reasons why this candidate might be getting rejected (based on CV patterns)
- top_skill_gaps (object): Skills the candidate needs to develop, with market demand weight (0-100)
- market_keyword_frequency (object): Keywords and their frequency in the job market (count as number)
- overall_assessment (string): A candid, one-paragraph assessment of the candidate's current position

Focus on market realities. Don't be polite. Tell the candidate what's actually wrong and what to fix.`;

// Retry helper
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
      }
    }
  }
  throw lastError
}

// Timeout helper
async function withTimeout<T>(fn: () => Promise<T>, ms = 10000): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Request timed out")), ms)),
  ])
}

export async function analyzeCV(cvText: string, cvJSON: object): Promise<AnalysisResult> {
  const response = await withTimeout(
    () =>
      withRetry(() =>
        getOpenAI().chat.completions.create({
          model: "gpt-4-turbo",
          messages: [
            { role: "system", content: CV_ANALYSIS_PROMPT },
            {
              role: "user",
              content: `CV Text:\n${cvText.slice(0, 8000)}\n\nCV JSON:\n${JSON.stringify(cvJSON, null, 2)}`,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
          max_tokens: 3000,
        })
      ),
    15000
  )

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error("No response from OpenAI")

  const parsed = JSON.parse(content)
  const result = AnalysisResultSchema.parse(parsed)
  return result
}

export function analyzeCVStream(cvText: string, cvJSON: object) {
  return getOpenAI().chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      { role: "system", content: CV_ANALYSIS_PROMPT },
      {
        role: "user",
        content: `CV Text:\n${cvText.slice(0, 8000)}\n\nCV JSON:\n${JSON.stringify(cvJSON, null, 2)}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 3000,
    stream: true,
  })
}

export async function matchJob(
  cvJSON: object,
  jobTitle: string,
  jobCompany: string,
  jobDescription: string
): Promise<JobMatchResult> {
  const response = await withTimeout(
    () =>
      withRetry(() =>
        getOpenAI().chat.completions.create({
          model: "gpt-4-turbo",
          messages: [
            { role: "system", content: JOB_MATCH_PROMPT },
            {
              role: "user",
              content: `CV JSON:\n${JSON.stringify(cvJSON, null, 2)}\n\nJob Title: ${jobTitle}\nCompany: ${jobCompany}\nJob Description:\n${jobDescription.slice(0, 6000)}`,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
          max_tokens: 3000,
        })
      ),
    15000
  )

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error("No response from OpenAI")

  const parsed = JSON.parse(content)
  const result = JobMatchResultSchema.parse(parsed)
  return result
}

export function matchJobStream(
  cvJSON: object,
  jobTitle: string,
  jobCompany: string,
  jobDescription: string
) {
  return getOpenAI().chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      { role: "system", content: JOB_MATCH_PROMPT },
      {
        role: "user",
        content: `CV JSON:\n${JSON.stringify(cvJSON, null, 2)}\n\nJob Title: ${jobTitle}\nCompany: ${jobCompany}\nJob Description:\n${jobDescription.slice(0, 6000)}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 3000,
    stream: true,
  })
}

export async function diagnoseCareer(
  cvJSON: object,
  jobMarketData?: object
): Promise<CareerDiagnosis> {
  const marketContext = jobMarketData
    ? `\nJob Market Data:\n${JSON.stringify(jobMarketData, null, 2)}`
    : ""

  const response = await withTimeout(
    () =>
      withRetry(() =>
        getOpenAI().chat.completions.create({
          model: "gpt-4-turbo",
          messages: [
            { role: "system", content: CAREER_TRUTH_PROMPT },
            {
              role: "user",
              content: `CV JSON:\n${JSON.stringify(cvJSON, null, 2)}${marketContext}`,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
          max_tokens: 3000,
        })
      ),
    15000
  )

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error("No response from OpenAI")

  const parsed = JSON.parse(content)
  const result = CareerDiagnosisSchema.parse(parsed)
  return result
}

export function diagnoseCareerStream(cvJSON: object, jobMarketData?: object) {
  const marketContext = jobMarketData
    ? `\nJob Market Data:\n${JSON.stringify(jobMarketData, null, 2)}`
    : ""

  return getOpenAI().chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      { role: "system", content: CAREER_TRUTH_PROMPT },
      {
        role: "user",
        content: `CV JSON:\n${JSON.stringify(cvJSON, null, 2)}${marketContext}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 3000,
    stream: true,
  })
}
