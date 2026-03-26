# Copilot Instructions — Aetheris Vision Website

## Project Overview
This is the **Aetheris Vision** corporate website — a Next.js 16 (Turbopack) application deployed on Vercel. The company provides AI/ML weather prediction, operational meteorology consulting, and federal contracting services. It is a Veteran-Owned Small Business (VOSB).

## Tech Stack
- **Framework**: Next.js 16.x (App Router, Turbopack)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4 (PostCSS plugin)
- **UI**: React 19, Framer Motion, Heroicons v2, clsx + tailwind-merge
- **Deployment**: Vercel (with Vercel Analytics)
- **Testing**: Vitest + React Testing Library + Cucumber-style BDD
- **Linting**: ESLint 9 (flat config) with next/core-web-vitals + next/typescript

## Architecture Principles

### DRY (Don't Repeat Yourself)
- **Brand constants**: All company name, URL, email, tagline strings come from `src/lib/constants.ts` (`SITE` object). Never hardcode "Aetheris Vision" or "aetherisvision.com" anywhere.
- **JSON-LD**: Shared structured data objects live in `src/lib/jsonld.ts`. Import `organizationJsonLd`, `publisherRef`, or `websiteJsonLd` instead of recreating inline.
- **Reusable components**: Use `src/components/CtaButton.tsx` for CTA buttons.

### SRP (Single Responsibility Principle)
- **Data vs. rendering**: Page data (tiers, FAQ, process steps, etc.) lives in `src/lib/portfolio-data.ts`, not in page components.
- **Route handlers**: API logic stays in `src/app/api/` route files. No business logic in components.
- **Middleware**: CSP nonce generation and auth logic in `src/middleware.ts`.

## File Organization
```
src/
  app/           # Next.js App Router pages and API routes
  components/    # Reusable React components (client + server)
  lib/           # Shared utilities, constants, data
    constants.ts # SITE brand constants (single source of truth)
    jsonld.ts    # JSON-LD structured data helpers
    portfolio-data.ts # Portfolio page data arrays + interfaces
    posts.ts     # Blog post data and query helpers
tests/
  setup.ts       # Vitest setup (jest-dom matchers)
  unit/          # Unit tests (pure functions, data, components)
  integration/   # Integration tests (API routes, cross-module)
  regression/    # Regression tests (data integrity, brand consistency)
  features/      # BDD feature files (.feature) + step definitions
    steps/       # Vitest test files implementing Gherkin scenarios
```

## Coding Conventions
- Use `import { SITE } from "@/lib/constants"` for any brand string.
- Use path aliases (`@/lib/...`, `@/components/...`) — never relative `../../`.
- Prefer `"use client"` only when truly needed (interactivity, hooks).
- All images should use `next/image` (not raw `<img>` tags).
- Keep components under 200 lines. Extract data to `lib/` when a page exceeds 300 lines.
- Tailwind classes go directly on elements; avoid CSS modules.
- Error boundaries and loading states use Next.js conventions (`error.tsx`, `loading.tsx`).

## Testing Standards
- **Unit tests** (`tests/unit/`): Test pure functions, data modules, and isolated components.
- **Integration tests** (`tests/integration/`): Test API route handlers, cross-module interactions.
- **Regression tests** (`tests/regression/`): Lock in critical business rules and data integrity.
- **BDD tests** (`tests/features/`): Gherkin `.feature` files with step definitions in `tests/features/steps/`.
- Run all tests: `npm test`
- Run specific suite: `npm run test:unit`, `npm run test:integration`, `npm run test:bdd`
- Full CI check: `npm run ci` (lint + test + build)

## Security
- CSP with per-request nonce generated in middleware.
- Security headers set in `next.config.ts` (HSTS, X-Content-Type-Options, etc.).
- Rate limiting on contact API route (5 requests/10 min per IP).
- Honeypot field on contact form for bot detection.
- Never commit secrets — use `.env.local` for `PREVIEW_PASSWORD`, `NEXT_PUBLIC_FORMSPREE_ID`.

## Build & Deploy
- Local dev: `npm run dev`
- Production build: `npm run build` (includes env check)
- Full CI pipeline: `npm run ci`
- Deployed automatically via Vercel on push to `main`.
- Git remotes: `origin` (GitHub), `backup` (GitLab).

## Session Start Protocol
**At the start of every chat session in this project**, immediately call `mcp_git-vercel_check_deployment` with `project_name="aetheris-vision-website"` and display the result (status, URL, timestamp) before doing anything else. This gives Marston instant visibility into whether the live site is healthy.

## Agile Workflow — GitHub Issues + Branches

All changes to this project use a branch-per-issue workflow:

### Milestones
| # | Milestone | Due |
|---|-----------|-----|
| M3 (GH#4) | Security Phase 1 — Critical Fixes | Apr 5 |
| M4 (GH#5) | Security Phase 2 — High + Medium | Apr 20 |
| M1 (GH#1) | SAM.gov Launch Prep | May 1 |
| M2 (GH#2) | Client Portal v1 | May 15 |
| M5 (GH#6) | Public Launch | Jun 1 |

### Issue Labels
- `security:critical` — fix before any other work
- `security:high` — fix before public launch
- `security:medium` — fix before public launch
- `feature` — new pages or capabilities
- `content` — copy, images, text
- `admin` — internal tooling only
- `client-portal` — client portal features
- `performance` — Core Web Vitals, build

### Branch Convention
```
fix/issue-{N}-{short-description}
feat/issue-{N}-{short-description}
content/issue-{N}-{short-description}
```

### GitHub MCP Tools (use these — no Python scripts needed)
The GitHub MCP is active. Use these tools directly for all GitHub operations:
- `mcp_github_create_issue` — create new issues
- `mcp_github_update_issue` — update title, body, state, labels, milestone
- `mcp_github_add_issue_comment` — add comments to issues
- `mcp_github_create_branch` — create branches
- `mcp_github_create_pull_request` — open PRs
- `mcp_github_get_issue`, `mcp_github_list_issues` — read issues
- `mcp_github_list_pull_requests`, `mcp_github_get_pull_request_status` — check PRs
- `mcp_github_merge_pull_request` — merge PRs

**Never write /tmp/*.py scripts for GitHub API calls.** Use MCP tools directly.

### Workflow for Every Change
1. Reference the GitHub issue number in branch name and commit message
2. Create branch from `main`: `git checkout -b fix/issue-5-hardcoded-password`
3. Make changes, commit: `git commit -m "fix(#5): remove hardcoded password fallback"`
4. Push branch, open PR targeting `main`
5. Merge → Vercel auto-deploys → confirm READY via `mcp_git-vercel_check_deployment`
6. Close the issue

### Security Priority Order (do these first)
Issues #1–#8 are security issues in milestones M3/M4. Address in order: C-1 through C-5 (CRITICAL), then H-1 through H-3 (HIGH), then M-1 through M-5 (MEDIUM).

## Common Patterns
When adding a new page:
1. Create `src/app/<route>/page.tsx`
2. Import `SITE` from `@/lib/constants` for metadata
3. Include `<Navbar />` and `<Footer />` (or they come from layout)
4. Add the route to `src/app/sitemap.ts`
5. Write tests in `tests/` covering the new functionality

When adding data-heavy sections:
1. Define TypeScript interfaces and data arrays in `src/lib/`
2. Import into the page component — don't inline large data
3. Add unit tests for the data module
4. Add regression tests for key business rules
