# CareerOS — AI Career Intelligence

Transform your professional data into actionable hiring outcomes. CareerOS is an AI-powered platform that analyzes your resume, scores job matches, diagnoses blind spots, and generates optimized CVs — helping you get more interviews, faster.

Built with Next.js 14, Supabase, OpenAI, and Tailwind CSS. Includes a companion browser extension for one-click job scraping from LinkedIn.

## Features

- **Smart CV Parsing** — Upload PDF, DOCX, or TXT resumes. AI extracts your entire professional story in seconds.
- **Career Truth Engine** — Data-driven diagnosis of why you are not getting interviews, backed by real market signal analysis.
- **Job Match Scoring** — Paste any job URL and receive an instant match score with prioritized skill gap analysis.
- **AI Resume Optimization** — Rewrite your CV tailored to specific roles with targeted keyword insertion and phrasing improvements.
- **ATS Compliance Check** — Verify your resume passes automated screening systems before you apply.
- **Browser Extension** — Scrape job postings from LinkedIn and other platforms directly into your CareerOS dashboard.
- **Streaming Analysis** — Real-time SSE-powered analysis results as the AI processes your data.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js](https://nextjs.org/) 14 (App Router) |
| Language | [TypeScript](https://www.typescriptlang.org/) (strict) |
| Auth + Database | [Supabase](https://supabase.com/) |
| AI | [OpenAI](https://openai.com/) (GPT-4 / GPT-4o) |
| Payments | [Paystack](https://paystack.com/) |
| Email | [Resend](https://resend.com/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) 3 + Radix UI primitives |
| Components | [shadcn/ui](https://ui.shadcn.com/) |
| Fonts | [Geist](https://vercel.com/font) (Sans + Mono) |
| Validation | [Zod](https://zod.dev/) |
| Extension | Manifest V3 Chrome extension |

## Project Structure

```
careeros/
├── app/                         # Next.js App Router pages
│   ├── analyze/                 # CV analysis page (SSE streaming)
│   ├── api/                     # API routes
│   │   ├── analyze/             #   AI resume analysis
│   │   ├── diagnose/            #   Career diagnosis
│   │   ├── match/               #   Job match scoring
│   │   ├── payments/            #   Paystack webhooks
│   │   ├── resumes/             #   Resume CRUD
│   │   └── upload/              #   File upload handler
│   ├── auth/                    # Auth callbacks
│   ├── dashboard/               # Authenticated user dashboard
│   ├── diagnose/                # Career diagnostic tool
│   ├── jobs/                    # Job match interface
│   ├── login/                   # Login page
│   ├── optimize/                # CV optimization tool
│   ├── payments/                # Subscription / billing pages
│   ├── signup/                  # Registration page
│   └── upload/                  # Resume upload page
├── components/                  # Shared React components
│   ├── ui/                      # shadcn/ui primitives
│   ├── nav.tsx                  # Navigation bar
│   ├── animations.tsx           # Scroll + count-up animations
│   └── error-boundary.tsx       # React error boundary
├── lib/                         # Utilities and shared logic
│   ├── auth-context.tsx         # Supabase auth React context
│   ├── cn.ts                    # Tailwind class merge utility
│   ├── openai.ts                # OpenAI client wrapper
│   ├── parser.ts                # Resume parsing logic
│   ├── paystack.ts              # Paystack transaction helpers
│   ├── retry.ts                 # Async retry utility
│   ├── sse.ts                   # Server-Sent Events consumer
│   ├── supabase.ts              # Supabase browser client
│   └── supabase-server.ts       # Supabase server client
├── database/
│   └── schema.sql               # Full database schema
├── extension/                   # Chrome extension (Manifest V3)
│   ├── manifest.json
│   ├── content.ts               # Content script
│   ├── background.js            # Service worker
│   ├── sidebar.html             # Sidebar panel
│   └── api.ts                   # Extension API client
├── supabase/                    # Supabase config
├── public/                      # Static assets
├── middleware.ts                # Next.js middleware (route protection)
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

## Prerequisites

- **Node.js** 18.17 or later
- **npm**, **pnpm**, or **yarn**
- A **Supabase** project (free tier works)
- An **OpenAI** API key
- A **Paystack** account (for payment processing)
- A **Resend** API key (for transactional email)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/careeros.git
cd careeros
```

### 2. Install dependencies

```bash
npm install
# or
pnpm install
# or
yarn
```

### 3. Set up environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `OPENAI_API_KEY` | OpenAI API key |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack public key |
| `PAYSTACK_SECRET_KEY` | Paystack secret key |
| `RESEND_API_KEY` | Resend API key |
| `NEXT_PUBLIC_APP_URL` | App base URL (`http://localhost:3000` for development) |

### 4. Set up the database

Run the SQL in `database/schema.sql` against your Supabase project's SQL editor. This creates all required tables with Row Level Security policies.

### 5. Start the development server

```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Build the application for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint across the codebase |

## Deployment

### Vercel (recommended)

1. Push your repository to GitHub.
2. Import the project into [Vercel](https://vercel.com/new).
3. Set the **Framework Preset** to **Next.js**.
4. Add all environment variables from `.env.local` into Vercel's environment variable settings.
5. Deploy. Vercel automatically detects Next.js and applies optimal build settings.

### Environment Variables on Vercel

Make sure every variable from `.env.local` is added to your Vercel project settings under **Settings > Environment Variables**. Do not use `.env.local` in production — Vercel manages secrets via its dashboard.

### Post-Deployment

- Configure your Supabase project's **Authentication > URL Configuration** to include your production domain.
- Set `NEXT_PUBLIC_APP_URL` to your production URL.
- Update Paystack webhook endpoint to point to `https://yourdomain.com/api/payments/webhook`.

## Chrome Extension

CareerOS includes a Manifest V3 Chrome extension for scraping job postings. To load it:

1. Open Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked** and select the `careeros/extension/` directory.
4. The CareerOS extension icon appears in your toolbar.

Configure the extension by setting your CareerOS API base URL in `extension/api.ts`.

## License

MIT
