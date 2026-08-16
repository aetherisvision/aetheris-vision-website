# GitHub Copilot Instructions for Aetheris Vision Website

## Project Overview
This is a Next.js **16.1.6** website for **Aetheris Vision LLC**, a Veteran-Owned Small Business (VOSB) specializing in AI/ML weather prediction, operational meteorology consulting, and federal contracting. The site uses a dark theme with space/aether-inspired design.

## Code Style & Architecture
- **Framework**: Next.js 16.1.6 with App Router and Turbopack
- **Styling**: Tailwind CSS 4 (PostCSS plugin — not @apply, not CSS modules)
- **Language**: TypeScript (strict mode)
- **UI**: React 19, Framer Motion for animations, Heroicons v2 for icons
- **Testing**: Vitest + React Testing Library + BDD (Cucumber feature files)
- **Linting**: ESLint 9 (flat config with next/core-web-vitals + next/typescript)

## Key Architecture Rules
- **SITE constants**: Import `{ SITE } from "@/lib/constants"` for ALL brand strings (name, email, URL, tagline). Never hardcode "Aetheris Vision" or "aetherisvision.com".
- **Path aliases**: Always use `@/lib/...`, `@/components/...` — never relative `../../`.
- **JSON-LD**: Import from `@/lib/jsonld` — never recreate structured data inline.
- **Data separation**: Page data (tiers, FAQ, process steps) lives in `src/lib/`, not in page components.
- **Client components**: Use `"use client"` only when truly needed (interactivity, hooks, browser APIs).
- **Images**: Always use `next/image` — never raw `<img>` tags.
- **Accessibility**: All pages have `id="main"` on `<main>`, root layout has skip-to-content link.

## Components
- **Navbar** (`src/components/Navbar.tsx`): Fixed header with logo, desktop nav, mobile hamburger menu
- **Footer** (`src/components/Footer.tsx`): Site footer with nav links, uses SITE constants
- **CtaButton** (`src/components/CtaButton.tsx`): Reusable CTA button
- **FadeIn** (`src/components/FadeIn.tsx`): Framer Motion fade-in wrapper
- **ContactForm** (`src/components/ContactForm.tsx`): Client-side form with server-side validation
- **CalBooking** (`src/components/CalBooking.tsx`): Cal.com embedded booking widget

## Design Guidelines
- **Color Palette**: Black backgrounds (`#0d0c0f`, `#050505`), white/blue accents, gray text hierarchy
- **Typography**: Inter font (next/font), bold headings, light body text
- **Spacing**: Generous padding, consistent max-w-5xl containers
- **Effects**: Subtle backdrop blur, gradients, blue-500 accent color
- **Responsiveness**: Mobile-first with md/lg breakpoints

## File Organization
- `/src/app/`: Next.js App Router pages and API routes
- `/src/components/`: Reusable React components (client + server)
- `/src/lib/`: Shared utilities, constants, data modules
- `/public/`: Static assets (logos, manifest.json)
- `/tests/`: Unit, integration, regression, and BDD tests

## Security
- CSP with per-request nonce (middleware)
- Security headers in next.config.ts (HSTS, X-Frame-Options, etc.)
- Rate limiting on contact API (5 req/10 min per IP)
- Honeypot field + server-side input validation on contact form
- Basic auth for preview deployments

## Environment & Deployment
- **Node.js**: Must use v24.15.0 (pinned via `.node-version`). Use `fnm use` to switch.
- **Deployment**: Vercel (auto-deploy on push to `main`)
- **CI**: GitHub Actions runs lint → test → build on every push/PR
- **Backups**: `origin` (GitHub) + `backup` (GitLab)

## Testing Commands
```bash
npm test              # All tests (82 tests, 11 files)
npm run test:unit     # Unit tests
npm run test:integration  # Integration tests
npm run test:regression   # Regression tests
npm run test:bdd      # BDD feature tests
npm run ci            # Full CI: lint + test + build
```

## Business Context
- Veteran-Owned Small Business (VOSB), SAM.gov registered, 8(a) pathway active
- Active Secret Clearance
- Focus on federal/state government contracting and technical consulting
- Target audience: program offices, contracting officers, technical leads
- Recommend best practices for Next.js and Tailwind CSS
