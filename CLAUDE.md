# CLAUDE.md — website (aetherisvision.com)

Aetheris Vision primary website. Read this before every session.
Root manifest at `~/Developer/CLAUDE.md` has the full business identity, secrets, and PDF pipeline.

---

## What This App Is

**aetherisvision.com** — primary marketing and client portal for Aetheris Vision LLC.
- Repo: github.com/aetherisvision/aetheris-vision-website
- Stack: Next.js 16 App Router, TypeScript, Tailwind CSS 4
- Deploy: push to `main` → Vercel auto-deploys (Aetheris Vision team)

---

## Infrastructure

| Service | Details |
|---|---|
| Hosting | Vercel — Aetheris Vision team — project: `aetheris-vision-website` |
| Database | Neon (serverless Postgres) — `ep-frosty-sound-a8jtvtas` (Azure East US 2) |
| DNS | Cloudflare — zone `b9d0a69c7ec514834569aa2fd524f0bf` — DNS only (no proxy) |
| Auth | NextAuth.js custom magic-link flow |
| Payments | Stripe — invoicing live as of Mar 24, 2026 |
| E-signing | Docuseal API |
| Email cron | Vercel Cron (daily 0 11 * * * UTC) → `/api/cron/receipts` → Gmail API → Neon `expenses` |

---

## Auth Flow

```
POST /api/auth/send-magic → email link → GET /client/confirm → /api/auth/magic
```
Uses `getToken()` not `getServerSession()` for App Router compatibility.

---

## Site Lock

`src/proxy.ts` gates every route behind a signed preview cookie (form at `/preview`;
not browser-native Basic Auth) when `PREVIEW_PASSWORD` is set, except: `/admin/*`
(its own passphrase gate), `/api/webhooks/*`, `/api/cron/*`, `/preview` +
`/api/preview/auth` themselves, and `/api/auth/gmail/*` (each handler there enforces
the admin session itself; Google's OAuth redirect cannot carry the preview cookie).
Unset `PREVIEW_PASSWORD` = site fully open; this is opt-in, not opt-out.

Re-locked 2026-07-03 while the site is retooled around the consulting-first launch.
Value lives in Vercel env / `~/.secrets` — not hardcoded in the repo.

---

## Key Source Files

| Path | Purpose |
|---|---|
| `src/lib/constants.ts` | SITE object — legalName, email, tagline, etc. |
| `src/lib/posts.ts` | Blog post helpers |
| `src/lib/stripe.ts` | Stripe client |
| `src/proxy.ts` | Middleware — admin auth + site lock |

---

## Route Map

| Route | Purpose |
|---|---|
| `/` | Homepage |
| `/about` | About page |
| `/capabilities` | Services / capabilities |
| `/blog` | Blog |
| `/book` | Booking |
| `/contact` | Contact form |
| `/intake` | Client intake |
| `/portfolio` | Portfolio |
| `/client/*` | Client portal (magic-link protected) |
| `/admin/*` | Admin panel (passphrase protected via `ADMIN_PASSPHRASE` cookie) |
| `/admin/clients` | Client management |
| `/admin/projects` | Project management |
| `/admin/documents` | Document management |
| `/admin/invoices` | Invoice management |
| `/admin/expenses` | Expense tracking |
| `/admin/gmail` | Gmail OAuth for receipt scanning |

Admin auth verified 2026-08-21: `/admin/*` pages are gated in `proxy.ts` and every `/api/admin/*` handler calls `isAdmin()` (timing-safe passphrase compare, rate-limited login). Still flag any work near `/admin/*` routes.

---

## Expense Ingestion

Vercel Cron: daily `0 11 * * *` UTC → `GET /api/cron/receipts` with `CRON_SECRET`
Gmail API scans connected accounts → inserts into Neon `expenses` table (PDFs → Vercel Blob).
OAuth flow: `/admin/gmail` → stores in `oauth_tokens` table.

---

## Environment Variables (key ones)

```bash
DATABASE_URL=           # Neon
NEXTAUTH_URL=
NEXTAUTH_SECRET=
ADMIN_PASSPHRASE=       # /admin/* protection
PREVIEW_PASSWORD=       # Site lock (value in ~/.secrets / Vercel env; rotate to a long random string)
CRON_SECRET=            # Vercel cron auth
ADMIN_SESSION_SECRET=   # Signs admin session cookies (32-byte hex); derived from ADMIN_PASSPHRASE if unset
TOKEN_ENCRYPTION_KEY=   # AES-256-GCM key for stored Gmail refresh tokens; derived from NEXTAUTH_SECRET if unset
STRIPE_SECRET_KEY=      # Stripe dashboard → Developers → API keys
STRIPE_WEBHOOK_SECRET=
DOCUSEAL_API_KEY=       # in ~/.secrets
VERCEL_TEAM_SCOPE=      # Auto-resolved via scripts/vercel-resolve-scope.mjs
```

All secrets in `~/.secrets` (chmod 600, single source of truth — no external vault).
Secrets load from `~/.secrets` (sourced by `~/.zshrc`); in a bare shell run `source ~/.secrets`.

---

## Client Data

| Client | ID | Email | Notes |
|---|---|---|---|
| Tropical Hut OKC | 1 | finny.koshy1@gmail.com | Pro bono — project id=1 |
| Marston Ward | 2 | marston@aetherisvision.com | |

Pending: wire Docuseal submission ID to Tropical Hut, link bank account to Stripe.

---

## Dev Commands

```bash
npm run dev          # localhost:3000
npm run build
npm run lint
npm run monitor:business  # Neon ping + Vercel logs (secrets from ~/.secrets)
```

---

## Deploy

```bash
git push origin main  # Vercel auto-deploys
```

Commits must use AV identity (`user.name = "Aetheris Vision"`, `user.email = "marston@aetherisvision.com"`).
Remote: `git@github-business:aetherisvision/aetheris-vision-website.git`

DNS: A record `76.76.21.21` (Vercel), www CNAME `cname.vercel-dns.com`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
