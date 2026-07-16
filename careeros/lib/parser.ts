import { z } from "zod"

// Types
export interface ParsedCV {
  name: string
  email?: string
  phone: string
  summary: string
  experience: Experience[]
  education: Education[]
  skills: string[]
  certifications: string[]
  languages: string[]
}

export interface Experience {
  title: string
  company: string
  location: string
  startDate: string
  endDate: string
  current: boolean
  description: string[]
}

export interface Education {
  degree: string
  institution: string
  location: string
  startDate: string
  endDate: string
  gpa?: string
}

export interface ParsedCVResult {
  original_text: string
  parsed_json: ParsedCV
  validation_errors: string[]
}

// Zod schema for validation
const ExperienceSchema = z.object({
  title: z.string(),
  company: z.string(),
  location: z.string().optional().default(""),
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default(""),
  current: z.boolean().optional().default(false),
  description: z.array(z.string()).optional().default([]),
})

const EducationSchema = z.object({
  degree: z.string(),
  institution: z.string(),
  location: z.string().optional().default(""),
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default(""),
  gpa: z.string().optional(),
})

export const ParsedCVSchema = z.object({
  name: z.string(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().default(""),
  summary: z.string().optional().default(""),
  experience: z.array(ExperienceSchema).optional().default([]),
  education: z.array(EducationSchema).optional().default([]),
  skills: z.array(z.string()).optional().default([]),
  certifications: z.array(z.string()).optional().default([]),
  languages: z.array(z.string()).optional().default([]),
})

// File size limit (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/msword",
]

// Server-side overload: accepts (buffer, filename)
// Client-side overload: accepts (file)
export async function parseCV(file: File): Promise<ParsedCVResult>
export async function parseCV(buffer: Buffer, filename: string): Promise<ParsedCVResult>
export async function parseCV(fileOrBuffer: File | Buffer, filename?: string): Promise<ParsedCVResult> {
  const errors: string[] = []
  let fileSize = 0
  let fileName = ""
  let fileType = ""

  const isBuffer = typeof Buffer !== "undefined" && fileOrBuffer instanceof Buffer
  if (isBuffer) {
    // Server-side: Buffer + filename
    const buf = fileOrBuffer as Buffer
    fileSize = buf.length
    fileName = filename || ""
    fileType = fileName.endsWith(".pdf") ? "application/pdf"
      : fileName.endsWith(".docx") ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : fileName.endsWith(".doc") ? "application/msword"
      : fileName.endsWith(".txt") ? "text/plain"
      : ""
  } else {
    // Client-side: File object
    const file = fileOrBuffer as File
    fileSize = file.size
    fileName = file.name
    fileType = file.type
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(fileType)) {
    const ext = fileName.split(".").pop()?.toLowerCase()
    if (!["pdf", "doc", "docx", "txt"].includes(ext || "")) {
      return {
        original_text: "",
        parsed_json: createEmptyCV(),
        validation_errors: ["Unsupported file type. Please upload a PDF, DOC, DOCX, or TXT file."],
      }
    }
  }

  // Validate file size
  if (fileSize > MAX_FILE_SIZE) {
    return {
      original_text: "",
      parsed_json: createEmptyCV(),
      validation_errors: ["File is too large. Maximum size is 10MB."],
    }
  }

  if (fileSize === 0) {
    return {
      original_text: "",
      parsed_json: createEmptyCV(),
      validation_errors: ["File is empty. Please upload a valid CV."],
    }
  }

  let text: string

  try {
    if (typeof Buffer !== "undefined" && fileOrBuffer instanceof Buffer) {
      text = await extractTextFromBuffer(fileOrBuffer as Buffer, fileName)
    } else {
      text = await extractText(fileOrBuffer as File)
    }
  } catch (err) {
    return {
      original_text: "",
      parsed_json: createEmptyCV(),
      validation_errors: [`Failed to read file: ${err instanceof Error ? err.message : "Unknown error"}`],
    }
  }

  if (!text || text.trim().length < 50) {
    return {
      original_text: text || "",
      parsed_json: createEmptyCV(),
      validation_errors: ["Could not extract enough text from the file. The file may be empty or corrupted."],
    }
  }

  // Extract structured data with regex patterns
  const parsed = extractStructuredData(text)

  // Validate parsed data
  const validationResult = ParsedCVSchema.safeParse(parsed)
  if (!validationResult.success) {
    errors.push("Some fields could not be parsed correctly. Consider reviewing manually.")
  }

  if (!parsed.email) {
    errors.push("No email address found in the CV.")
  }
  if (parsed.skills.length === 0) {
    errors.push("No skills detected. Consider adding a skills section.")
  }
  if (parsed.experience.length === 0) {
    errors.push("No work experience found. Make sure your experience section is clearly formatted.")
  }

  return {
    original_text: text,
    parsed_json: validationResult.success ? validationResult.data : parsed,
    validation_errors: errors,
  }
}

async function extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())

  if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
    return extractPDFText(buffer)
  }

  if (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.endsWith(".docx")
  ) {
    return extractDOCXText(buffer)
  }

  if (file.type === "text/plain" || file.name.endsWith(".txt")) {
    return buffer.toString("utf-8")
  }

  if (file.type === "application/msword" || file.name.endsWith(".doc")) {
    // DOC format - try to read as text (may get partial data)
    return buffer.toString("utf-8").replace(/\0/g, "").trim() || "Unsupported format. Please convert to PDF or DOCX."
  }

  throw new Error("Unsupported file format")
}

async function extractTextFromBuffer(buffer: Buffer, fileName: string): Promise<string> {
  if (fileName.endsWith(".pdf")) {
    return extractPDFText(buffer)
  }

  if (fileName.endsWith(".docx")) {
    return extractDOCXText(buffer)
  }

  if (fileName.endsWith(".txt")) {
    return buffer.toString("utf-8")
  }

  if (fileName.endsWith(".doc")) {
    return buffer.toString("utf-8").replace(/\0/g, "").trim() || "Unsupported format. Please convert to PDF or DOCX."
  }

  throw new Error("Unsupported file format")
}

async function extractPDFText(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import for pdf-parse
    const pdfParse = (await import("pdf-parse")).default
    const data = await pdfParse(buffer)
    return data.text
  } catch (err) {
    console.error("PDF parsing error:", err)
    throw new Error("Could not parse PDF file. The file may be scanned or password-protected.")
  }
}

async function extractDOCXText(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import("mammoth")
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  } catch (err) {
    console.error("DOCX parsing error:", err)
    throw new Error("Could not parse DOCX file. The file may be corrupted.")
  }
}

function extractStructuredData(text: string): ParsedCV {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean)

  return {
    name: extractName(text, lines),
    email: extractEmail(text),
    phone: extractPhone(text),
    summary: extractSummary(lines),
    experience: extractExperience(lines),
    education: extractEducation(lines),
    skills: extractSkills(lines),
    certifications: extractCertifications(lines),
    languages: extractLanguages(lines),
  }
}

function extractName(_text: string, lines: string[]): string {
  // First non-empty line is usually the name
  const nameLine = lines.find(
    (l) => l.length > 0 && l.length < 100 && !l.includes("@") && !l.includes("http") && !l.match(/^[\d\s\-()]+$/)
  )
  return nameLine || ""
}

function extractEmail(text: string): string {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
  return match ? match[0] : ""
}

function extractPhone(text: string): string {
  const match = text.match(
    /(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/
  )
  return match ? match[0] : ""
}

function extractSummary(lines: string[]): string {
  const summaryIdx = lines.findIndex(
    (l) => l.toLowerCase().includes("summary") || l.toLowerCase().includes("profile") || l.toLowerCase().includes("about me")
  )
  if (summaryIdx === -1 || summaryIdx + 1 >= lines.length) return ""

  const summaryLines: string[] = []
  for (let i = summaryIdx + 1; i < Math.min(summaryIdx + 6, lines.length); i++) {
    if (lines[i].toLowerCase().includes("experience") || lines[i].toLowerCase().includes("education")) break
    summaryLines.push(lines[i])
  }
  return summaryLines.join(" ")
}

function extractExperience(lines: string[]): Experience[] {
  const experience: Experience[] = []
  const expIdx = lines.findIndex((l) =>
    l.toLowerCase().includes("experience") || l.toLowerCase().includes("employment") || l.toLowerCase().includes("work history")
  )
  if (expIdx === -1) return experience

  const eduIdx = lines.findIndex((l, i) => i > expIdx && l.toLowerCase().includes("education"))
  const endIdx = eduIdx === -1 ? lines.length : eduIdx

  let currentExp: Partial<Experience> | null = null
  for (let i = expIdx + 1; i < endIdx; i++) {
    const line = lines[i]
    if (line.match(/^[A-Z][A-Za-z\s]+$/)) {
      if (currentExp && currentExp.title) {
        experience.push(currentExp as Experience)
      }
      currentExp = {
        title: line,
        company: "",
        description: [],
        current: false,
      }
    } else if (currentExp && (line.includes("–") || line.includes("-") || line.includes("—"))) {
      const parts = line.split(/[–\-—]/)
      currentExp.startDate = parts[0].trim()
      currentExp.endDate = parts[1]?.trim() || ""
      if (currentExp.endDate.toLowerCase().includes("present")) {
        currentExp.current = true
      }
    } else if (currentExp && (line.startsWith("•") || line.startsWith("-") || line.startsWith("*"))) {
      currentExp.description = [...(currentExp.description || []), line.replace(/^[•\-*\s]+/, "").trim()]
    } else if (currentExp && !currentExp.company && line.length > 2) {
      currentExp.company = line
    }
  }
  if (currentExp && currentExp.title) {
    experience.push(currentExp as Experience)
  }

  return experience
}

function extractEducation(lines: string[]): Education[] {
  const education: Education[] = []
  const eduIdx = lines.findIndex((l) =>
    l.toLowerCase().includes("education") || l.toLowerCase().includes("academic")
  )
  if (eduIdx === -1) return education

  let currentEd: Partial<Education> | null = null
  for (let i = eduIdx + 1; i < Math.min(eduIdx + 15, lines.length); i++) {
    const line = lines[i]
    if (!currentEd) {
      currentEd = { degree: line }
    } else if (!currentEd.institution && line.length > 3) {
      currentEd.institution = line
    } else if (line.includes("–") || line.includes("-") || line.includes("—")) {
      const parts = line.split(/[–\-—]/)
      currentEd.startDate = parts[0].trim()
      currentEd.endDate = parts[1]?.trim() || ""
    } else if (line.toLowerCase().includes("gpa")) {
      currentEd.gpa = line
      education.push(currentEd as Education)
      currentEd = null
    } else if (line.toLowerCase().includes("skill") || line.toLowerCase().includes("certification")) {
      if (currentEd.degree && currentEd.institution) {
        education.push(currentEd as Education)
      }
      break
    }
  }
  if (currentEd && currentEd.degree && currentEd.institution) {
    education.push(currentEd as Education)
  }

  return education
}

function extractSkills(lines: string[]): string[] {
  const skills: string[] = []
  const skillIdx = lines.findIndex((l) =>
    l.toLowerCase().includes("skill") || l.toLowerCase().includes("technical") || l.toLowerCase().includes("competenc")
  )
  if (skillIdx === -1) return skills

  // Collect lines after "Skills" until next section
  for (let i = skillIdx + 1; i < Math.min(skillIdx + 15, lines.length); i++) {
    const line = lines[i]
    if (
      line.toLowerCase().includes("experience") ||
      line.toLowerCase().includes("education") ||
      line.toLowerCase().includes("certification") ||
      line.toLowerCase().includes("language")
    ) break
    // Split by bullet points, commas, pipes
    const parts = line.split(/[,•\|\/\t\n]+/).map((s) => s.trim()).filter(Boolean)
    parts.forEach((part) => {
      if (part.length > 1 && !part.match(/^[0-9\s\-–—]+$/)) {
        skills.push(part)
      }
    })
  }

  return Array.from(new Set(skills))
}

function extractCertifications(lines: string[]): string[] {
  const certs: string[] = []
  const certIdx = lines.findIndex((l) =>
    l.toLowerCase().includes("certification") || l.toLowerCase().includes("certificate")
  )
  if (certIdx === -1) return certs

  for (let i = certIdx + 1; i < Math.min(certIdx + 10, lines.length); i++) {
    const line = lines[i]
    if (line.toLowerCase().includes("skill") || line.toLowerCase().includes("language") || line.toLowerCase().includes("education")) break
    certs.push(line.replace(/^[•\-*\s]+/, "").trim())
  }

  return certs.filter(Boolean)
}

function extractLanguages(lines: string[]): string[] {
  const langIdx = lines.findIndex((l) => l.toLowerCase().includes("language"))
  if (langIdx === -1) return []

  const languages: string[] = []
  for (let i = langIdx + 1; i < Math.min(langIdx + 6, lines.length); i++) {
    const line = lines[i]
    if (line.toLowerCase().includes("skill") || line.toLowerCase().includes("certification")) break
    const cleaned = line.replace(/^[•\-*\s]+/, "").trim()
    if (cleaned) languages.push(cleaned)
  }
  return languages
}

function createEmptyCV(): ParsedCV {
  return {
    name: "",
    email: "",
    phone: "",
    summary: "",
    experience: [],
    education: [],
    skills: [],
    certifications: [],
    languages: [],
  }
}

export function validateParsedCV(parsed: ParsedCV): string[] {
  const errors: string[] = []
  if (!parsed.name) errors.push("Name is required")
  if (!parsed.email) errors.push("Email is required")
  if (parsed.experience.length === 0) errors.push("At least one work experience entry is recommended")
  if (parsed.skills.length === 0) errors.push("At least one skill is recommended")
  return errors
}
