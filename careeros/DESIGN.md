# CareerOS Design System

> Dark theme with glass morphism, scroll-triggered animations, and Framer-ready motion architecture.
> Built on Geist Sans/Mono typography with a pink (#E879A3) accent palette.

---

## Table of Contents

1. [Design Tokens](#1-design-tokens)
2. [Layout Architecture](#2-layout-architecture)
3. [Animation System](#3-animation-system)
4. [Framer Motion Migration Path](#4-framer-motion-migration-path)
5. [Component Animation Specs](#5-component-animation-specs)
6. [CSS Utilities](#6-css-utilities)
7. [Page States](#7-page-states)

---

## 1. Design Tokens

### Color Palette

| Token | HSL / Hex | Usage |
|---|---|---|
| `--background` | `222.2 84% 4.9%` / `#0A0A0E` | Page background |
| `--foreground` | `36 14% 94%` / `#F5F1EB` | Body text |
| `--card` | `240 6% 7%` / `#0C0C14` | Card surface |
| `--primary` | `340 68% 63%` / `#E879A3` | Accent / CTAs |
| `--secondary` | `240 4% 13%` / `#14141A` | Muted surfaces |
| `--muted-foreground` | `240 2% 55%` / `#8A8A92` | De-emphasized text |
| `--border` | `240 2% 15%` / `rgba(245,241,235,0.06)` | Card/border strokes |

### Typography

| Role | Font | Weight | Size Scale |
|---|---|---|---|
| **Display (h1)** | Geist Sans | 700 | `text-4xl` → `text-7xl` |
| **Headings (h2-h3)** | Geist Sans | 600-700 | `text-3xl` → `text-5xl` |
| **Body** | Geist Sans | 400 | `text-sm` → `text-base` |
| **Code / data** | Geist Mono | 400 | `text-sm` |
| **Gradient text** | Geist Sans (any) | 700 | `bg-gradient-to-r from-[#E879A3] to-[#F5A1C0]` |

Decorative word cycling in the hero uses a custom `animate-career-cycle` keyframe (8s, 4 words).

### Spacing

Container: `max-w-7xl` on landing, `container mx-auto` on dashboard surfaces.
Section padding: `py-24 md:py-32` for feature/pricing sections.
Card padding: `p-6 md:p-8`.

### Border Radius

`--radius: 0.75rem` → applied as `rounded-2xl` on cards, `rounded-xl` on icons, `rounded-lg` on interactive elements.

---

## 2. Layout Architecture

```
RootLayout (app/layout.tsx)
├── AuthProvider
├── ErrorBoundary
├── noise-overlay (fixed z-9999)
└── Page Content
    ├── Landing (unauthenticated)
    │   ├── Scroll-aware Nav → Hero → Stats → Features → Score Panel → Why → Pricing → CTA → Footer
    └── App (authenticated)
        ├── Nav (sticky) → Dashboard → /analyze → /optimize → /jobs → /diagnose
        └── Auth pages: /login, /signup
```

The nav has two implementations:
- **Landing nav**: `fixed top-0`, translucent on scroll (`bg-careeros-bg/80 backdrop-blur-xl`)
- **Dashboard nav** (`components/nav.tsx`): `sticky top-0` with same scroll-aware glass effect, includes 7 route links + sign out

Both use a shared scroll-sensing pattern:
```tsx
const [scrolled, setScrolled] = useState(false)
useEffect(() => {
  const handleScroll = () => setScrolled(window.scrollY > 50)
  window.addEventListener("scroll", handleScroll, { passive: true })
  return () => window.removeEventListener("scroll", handleScroll)
}, [])
```

---

## 3. Animation System

### 3.1 Architecture Overview

Current implementation uses **CSS transitions triggered by IntersectionObserver** via three reusable components in `components/animations.tsx`:

| Component | Purpose | Implementation |
|---|---|---|
| `AnimatedSection` | Single element that fades up on scroll | IntersectionObserver → CSS opacity + translateY transition (700ms ease-out) |
| `AnimatedStagger` | Staggered entrance for children | Same observer pattern with per-child delay via `transitionDelay` |
| `useCountUp` | Animated number counter | IntersectionObserver → requestAnimationFrame → 0-to-N count (2000ms) |

### 3.2 AnimatedSection Spec

```tsx
<AnimatedSection delay={number}>  // delay in ms before animation starts
  {children}
</AnimatedSection>
```

- **Enter**: `opacity: 0 → 1`, `translateY(24px) → translateY(0)` over 700ms
- **Trigger**: First intersection at `threshold: 0.1`
- **One-shot**: Observer disconnects after first fire (no exit animation on scroll-away)
- **State**: `className`-based — `opacity-0 translate-y-8` → `opacity-100 translate-y-0`

### 3.3 AnimatedStagger Spec

```tsx
<AnimatedStagger baseDelay={100} staggerDelay={150}>
  {items.map((item) => <div key={i}>{item}</div>)}
</AnimatedStagger>
```

- **Per-child delay**: `baseDelay + i * staggerDelay` (ms)
- **Same one-shot IntersectionObserver trigger**
- Use for: feature cards, pricing cards, stat items — any list where sequential entrance adds polish

### 3.4 useCountUp Spec

```tsx
function StatCard({ value, suffix, label }) {
  const { count, ref } = useCountUp(value, 2000)
  return <div ref={ref}>{count}{suffix}</div>
}
```

- **Trigger**: 50% intersection threshold
- **Duration**: 2000ms default (configurable)
- **Output**: Integer `count` that animates from 0 → `end`
- Use for: Stats bar (10s, 89%, 3x)

### 3.5 Tailwind Keyframe Animations

| Keyframe | CSS | Duration | Use Case |
|---|---|---|---|
| `fade-in-up` | opacity 0→1, translateY 24→0 | 700ms | Section entrances |
| `fade-in` | opacity 0→1 | 700ms | Subtle reveals |
| `slide-in-left` | opacity 0→1, translateX -24→0 | 700ms | Side panels |
| `slide-in-right` | opacity 0→1, translateX 24→0 | 700ms | Score panel |
| `scale-in` | opacity 0→1, scale 0.95→1 | 500ms | Modal / dialog enter |
| `float` | translateY 0→-8→0 | 3s infinite | Floating badges, decorative |
| `pulse-glow` | box-shadow expand/contract | 2s infinite | CTA button glow |
| `shimmer` | background-position 200%→-200% | 2s infinite | Loading skeleton |
| `career-cycle` | translateY 0→-1.25em→-2.5em→-3.75em | 8s infinite | Hero word rotation |

### 3.6 Animation Design Principles

1. **One-shot entrances** — animations fire once on first view, then sit still. No repeat triggers.
2. **Staggered by group** — lists within a visible section enter in sequence, not all at once.
3. **Delay cascade** — hero elements: badge (delay 0), heading (100), subtitle (200), CTAs (300), trust bar (400).
4. **Decorative ambient** — glow orbs (`blur-[120px]` radial gradients), grid pattern (`opacity-[0.03]`), noise overlay (`opacity-0.015`) — background only, never interactive.
5. **Hover micro-interactions** — feature cards: `hover:border-careeros-accent/20 hover:shadow-[0_0_30px_rgba(232,121,163,0.08)]` with 500ms transition.
6. **No exit animations** — elements reveal but don't hide. Keeping it simple — the complexity of exit animations (cleanup, reverse, memory) isn't justified for a web app.

---

## 4. Framer Motion Migration Path

### 4.1 Why Migrate

The current IntersectionObserver + CSS transition approach has these limits:
- **No spring physics** — easing curves are linear/exponential, not physically natural
- **No layout animations** — `AnimatePresence` for mount/unmount transitions
- **No gesture bindings** — drag, hover variants, tap scale
- **No orchestration** — `<motion.div>` variants with staggerChildren at the parent level replace manual stagger math

### 4.2 Installation

```bash
npm install framer-motion
```

### 4.3 Recommended Migration Order

**Phase 1 (low risk, high visual impact) — Replace the three animation primitives:**
1. `AnimatedSection` → `motion.div` with `useInView` + spring variants
2. `AnimatedStagger` → parent `motion.div` with `staggerChildren` variants
3. `useCountUp` → `useMotionValue` + `useSpring` for frame-accurate counters

**Phase 2 (page polish) — Animate existing elements:**
4. Nav mobile menu → `AnimatePresence` with slide-down
5. Pricing cards → hover scale with spring
6. Feature cards → hover lift + border glow with spring

**Phase 3 (advanced) — Screen transitions:**
7. Page transitions with `AnimatePresence` in layout (fade + slight scale)
8. Loading states → skeleton shimmer with motion divs
9. Dashboard stat cards → layout animations on data change

### 4.4 Framer-Ready Code Patterns

**AnimatedSection replacement:**
```tsx
import { motion } from "framer-motion"

export function AnimatedSection({ children, className, delay = 0 }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1], delay: delay / 1000 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
```

**AnimatedStagger replacement:**
```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
}
```

**useCountUp replacement (smooth spring-based):**
```tsx
import { useMotionValue, useSpring, useTransform, useInView } from "framer-motion"

export function useCountUp(end: number, duration = 2) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const motionValue = useMotionValue(0)
  const spring = useSpring(motionValue, { stiffness: 60, damping: 15 })
  const rounded = useTransform(spring, (v) => Math.round(v))

  useEffect(() => {
    if (!isInView) return
    const controls = animate(motionValue, end, { duration, ease: "easeOut" })
    return controls.stop
  }, [isInView])

  return { count: rounded, ref }
}
```

### 4.5 Spring Configuration Reference

| Motion | Stiffness | Damping | Mass | Style |
|---|---|---|---|---|
| Section entrances | 80 | 15 | 1 | Confident, not bouncy |
| Hover lift | 300 | 20 | 1 | Snappy, precise |
| Modal appear | 200 | 25 | 0.8 | Light, slightly elastic |
| Counter number | 60 | 15 | 1 | Slow settle, premium feel |
| Nav backdrop | 100 | 20 | 1 | Smooth but not floaty |

---

## 5. Component Animation Specs

### Hero Section (Landing Page)

| Element | Delay | Animation | Duration |
|---|---|---|---|
| Badge pill | 0ms | fade-in-up | 700ms |
| Heading "Your Career, Unlocked." | 100ms | fade-in-up | 700ms |
| Word cycle "Analyze. Optimize. Succeed. Get Hired." | 100ms | fade-in (CSS `animate-career-cycle` runs independently) | infinite 8s loop |
| Subtitle | 200ms | fade-in-up | 700ms |
| CTA buttons | 300ms | fade-in-up | 700ms |
| Trust indicator | 400ms | fade-in-up | 700ms |

### Stats Section

Three numbers (10s, 89%, 3x) count up via `useCountUp` when 50% visible.
Each number: scale-in on completion text, staggered by card.

### Feature Cards

Grid of 4 cards, staggered entrance (staggerDelay: 150ms).
Hover: translateY(-2px) + border glow + arrow icon color shift (500ms).

### Pricing Cards

3-tier grid, staggered (delay cascade: 200ms each).
Pro card highlighted with `border-2 border-careeros-accent/40` and Most Popular badge.
Hover: subtle lift + glow on highlighted card.

### Nav (Authenticated)

Scroll-aware glass effect: `bg-careeros-bg/80 backdrop-blur-xl` on scroll >20px.
Transition: 500ms.

### Score Panel Mockup (Landing)

SVG radial gauge with circular progress arc (`stroke-dasharray`).
Progress bars animate width after mount (CSS transition, 1000ms).
Floating "Potential Increase" badge — `animate-float` (3s infinite).

---

## 6. CSS Utilities

These are defined in `globals.css` and available globally:

| Class | CSS |
|---|---|
| `.gradient-text` | `bg-clip-text text-transparent bg-gradient-to-r from-[#E879A3] to-[#F5A1C0]` |
| `.glass-card` | `background: rgba(18, 18, 26, 0.6)` + `backdrop-filter: blur(12px)` + `border: 1px solid rgba(245,241,235,0.06)` |
| `.glow-pink` | `box-shadow: 0 0 20px rgba(232, 121, 163, 0.15), 0 0 40px rgba(232, 121, 163, 0.05)` |
| `.noise-overlay` | Fixed SVG noise texture via `::before` pseudo-element, `opacity: 0.015`, `z-index: 9999` |

---

## 7. Page States

Every page must handle these states with the animation system.

### Loading State
```tsx
// Spinner — fullscreen centered, used during auth checks
<div className="min-h-screen flex items-center justify-center bg-careeros-bg">
  <Loader2 className="h-8 w-8 animate-spin text-careeros-accent" />
</div>
```

### Empty State
Dashboard sections show empty states with icon + message + CTA:
- No CVs → Upload prompt
- No job matches → Match prompt
- No analysis → Diagnosis prompt

Each uses a centered icon (`h-8 w-8 mx-auto text-muted-foreground`) + description + action button.

### Error State
Handled at the layout level via `ErrorBoundary` (`components/error-boundary.tsx`).
Page-level error via `app/error.tsx`.

### Auth Gate
```tsx
// Redirect to /dashboard if already logged in (landing page)
// Redirect to /login if not logged in (app pages)
```
Loading spinner during auth check prevents flash-of-wrong-content.

---

## File References

| File | Purpose |
|---|---|
| `app/layout.tsx` | Root layout, fonts, auth provider, noise overlay |
| `app/globals.css` | Design tokens, utilities, custom scrollbar |
| `tailwind.config.ts` | Color palette, font families, animation keyframes |
| `components/animations.tsx` | AnimatedSection, AnimatedStagger, useCountUp |
| `components/nav.tsx` | Authenticated dashboard nav |
| `app/page.tsx` | Landing page (hero, features, pricing, CTA) |
| `app/dashboard/page.tsx` | Post-auth dashboard with data cards |

---

> **Design System v1** — Last updated 2026-07-03.
> Build file: `tailwind.config.ts` | Tokens: `app/globals.css` | Animations: `components/animations.tsx`
