"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/cn"
import {
  LayoutDashboard,
  Upload,
  BarChart3,
  FileEdit,
  Briefcase,
  Stethoscope,
  CreditCard,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import { useState, useEffect } from "react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Upload CV", icon: Upload },
  { href: "/analyze", label: "Analysis", icon: BarChart3 },
  { href: "/optimize", label: "Optimize", icon: FileEdit },
  { href: "/jobs", label: "Job Match", icon: Briefcase },
  { href: "/diagnose", label: "Career Truth", icon: Stethoscope },
  { href: "/payments", label: "Subscription", icon: CreditCard },
]

export function Nav() {
  const pathname = usePathname()
  const { signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-all duration-500",
        scrolled
          ? "bg-careeros-bg/80 backdrop-blur-xl border-b border-careeros-border"
          : "bg-careeros-bg border-b border-careeros-border"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-gradient-to-br from-careeros-accent to-[#F5A1C0] flex items-center justify-center">
              <span className="text-black font-bold text-xs">C</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-careeros-text">
              CareerOS
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-careeros-accent/10 text-careeros-accent"
                      : "text-careeros-text-muted hover:text-careeros-text hover:bg-white/5"
                  )}
                >
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              )
            })}
            <Button
              variant="ghost"
              onClick={() => signOut()}
              className="ml-2 min-h-[44px] text-careeros-text-muted hover:text-careeros-text hover:bg-white/5"
            >
              <LogOut className="h-4 w-4 mr-1" aria-hidden="true" />
              Sign Out
            </Button>
          </nav>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-white/5"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5 text-careeros-text" aria-hidden="true" /> : <Menu className="h-5 w-5 text-careeros-text" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-careeros-border bg-careeros-bg/95 backdrop-blur-xl">
          <nav className="container mx-auto px-4 py-3 flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-careeros-accent/10 text-careeros-accent"
                      : "text-careeros-text-muted hover:text-careeros-text hover:bg-white/5"
                  )}
                >
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                  {item.label}
                </Link>
              )
            })}
            <button
              onClick={() => {
                setMobileOpen(false)
                signOut()
              }}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-careeros-text-muted hover:text-careeros-text hover:bg-white/5"
            >
              <LogOut className="h-5 w-5" aria-hidden="true" />
              Sign Out
            </button>
          </nav>
        </div>
      )}
    </header>
  )
}
