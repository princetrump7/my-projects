import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/lib/auth-context"
import { ErrorBoundary } from "@/components/error-boundary"

export const metadata: Metadata = {
  title: "CareerOS — AI Career Intelligence",
  description:
    "Transform your professional data into actionable hiring outcomes. AI-powered CV analysis, job matching, and career intelligence.",
  openGraph: {
    title: "CareerOS — AI Career Intelligence",
    description: "Analyze your CV, score job matches, diagnose blind spots, and generate optimized resumes — AI-powered career intelligence.",
    type: "website",
    locale: "en_US",
    siteName: "CareerOS",
  },
  twitter: {
    card: "summary_large_image",
    title: "CareerOS — AI Career Intelligence",
    description: "Analyze your CV, score job matches, diagnose blind spots, and generate optimized resumes — AI-powered career intelligence.",
  },
}

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "CareerOS",
      applicationCategory: "CareerDevelopment",
      operatingSystem: "Web",
      description: "AI-powered career intelligence platform that analyzes your CV, scores job matches, diagnoses blind spots, and generates optimized resumes.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Free tier with 1 full CV analysis, Pro at $9/month, Premium at $19/month",
      },
    },
    {
      "@type": "Organization",
      name: "CareerOS",
      url: process.env.NEXT_PUBLIC_APP_URL || "https://careeros.ai",
    },
    {
      "@type": "WebSite",
      name: "CareerOS",
      url: process.env.NEXT_PUBLIC_APP_URL || "https://careeros.ai",
    },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <meta name="theme-color" content="#0A0A0E" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${GeistSans.className} antialiased`}>
        <AuthProvider>
          <ErrorBoundary>
            <div className="noise-overlay" />
            {children}
          </ErrorBoundary>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
