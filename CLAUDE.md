# CLAUDE.md — website (aetherisvision.com)

Aetheris Vision primary website. Read this before every session.
Root manifest at `~/Developer/CLAUDE.md` has the full business identity, secrets, and PDF pipeline.

---

## What This App Is

**aetherisvision.com** — primary marketing and client portal for Aetheris Vision LLC.
- Repo: github.com/aetherisvision/aetheris-vision-website
- Stack: Next.js 16 App Router, TypeScript, Tailwind CSS 4
- Deploy: push to `main` → GitHub Actions `deploy-gcp` → Cloud Run `av-crm-web` (`docs/gcp-deployment.md`)

---

## Infrastructure

| Service | Details |
|---|---|
| Hosting | Google Cloud Run `av-crm-web` (`us-central1`, project `lucid-loader-493512-g1`) behind a global external HTTPS LB with Cloud CDN; PR previews on `av-crm-web-preview` behind IAP (label `preview`) |
| Database | Neon (serverless Postgres) — `ep-frosty-sound-a8jtvtas` (Azure East US 2) |
| DNS | Cloudflare — zone `b9d0a69c7ec514834569aa2fd524f0bf` — DNS only (no proxy) |
| Auth | NextAuth.js custom magic-link flow |
| Payments | Stripe — invoicing live as of Mar 24, 2026 |
| E-signing | Docuseal API |
| Email cron | Scheduled `GET /api/cron/receipts` → Gmail API → Firestore `expenses` + private GCS (`GCS_RECEIPT_BUCKET`, PostgreSQL fallback) |

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

Marston declared the site OPEN on 2026-08-30 — `PREVIEW_PASSWORD` should be
removed from the Cloud Run production env (removal + redeploy required; the value in
`~/.secrets` is then only for re-locking). The `/preview` page remains in the
code, inert while the variable is unset.

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

Daily `0 11 * * *` UTC → `GET /api/cron/receipts` with `CRON_SECRET`
Gmail API scans connected accounts → records expense and receipt metadata in Firestore (`FIRESTORE_PROJECT_ID`, with PostgreSQL `expenses` fallback) and stores PDFs in private GCS (`GCS_RECEIPT_BUCKET`).
OAuth flow: `/admin/gmail` → stores in `oauth_tokens` table.

---

## Environment Variables (key ones)

```bash
DATABASE_URL=           # Neon
NEXTAUTH_URL=
NEXTAUTH_SECRET=
ADMIN_PASSPHRASE=       # /admin/* protection
PREVIEW_PASSWORD=       # Site lock (value in ~/.secrets / Cloud Run env; rotate to a long random string)
CRON_SECRET=            # Cloud Scheduler / Cloud Run Job bearer for /api/cron/*
ADMIN_SESSION_SECRET=   # Signs admin session cookies (32-byte hex); derived from ADMIN_PASSPHRASE if unset
TOKEN_ENCRYPTION_KEY=   # AES-256-GCM key for stored Gmail refresh tokens; derived from NEXTAUTH_SECRET if unset
STRIPE_SECRET_KEY=      # Stripe dashboard → Developers → API keys
STRIPE_WEBHOOK_SECRET=
DOCUSEAL_API_KEY=       # in ~/.secrets
VERCEL_TEAM_SCOPE=      # Legacy (Vercel retired Oct 2026); only for scripts not yet migrated
```

All secrets in `~/.secrets` (chmod 600, single source of truth — no external vault).
Secrets load from `~/.secrets` (sourced by `~/.zshrc`); in a bare shell run `source ~/.secrets`.

---

## Client Data

| Client | ID | Email | Notes |
|---|---|---|---|
| Tropical Hut OKC | 1 | finny.koshy1@gmail.com | Pro bono — project id=1 |
| Marston Ward | 2 | marston@aetherisvision.com | |

Pending: link bank account to Stripe (#16). DocuSeal submission ID wiring is available in `/admin/projects` (#15).

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
git push origin main  # GitHub Actions deploy-gcp → Cloud Run (smoke test + auto rollback)
```

Commits must use AV identity (`user.name = "Aetheris Vision"`, `user.email = "marston@aetherisvision.com"`).
Remote: `git@github-business:aetherisvision/aetheris-vision-website.git`

DNS: apex A record points at the GCP global load balancer (`34.149.81.66` as of 2026-10-28); the Vercel records (`76.76.21.21`, `cname.vercel-dns.com`) are retired.

**A new migration under `src/lib/db/migrations/` does NOT run automatically on
deploy or on request** -- `runMigrations()` is only ever invoked manually via
`npm run db:migrate` (`scripts/migrate.ts`), which needs `DATABASE_URL` in the
environment (`vercel env pull .env.production.local --environment production`,
then `set -a; source .env.production.local; set +a; npm run db:migrate`).
Deploying a PR that adds a migration without running this leaves the new
column/index missing in production -- any INSERT/UPDATE that touches it fails
closed with a generic 500 (confirmed the hard way 2026-08-29: migration 006
`leads.govcon` shipped in PR #102 but wasn't applied until caught by the
first live `av-radar pursue` end-to-end check). Always run `db:migrate`
against production as part of merging any PR that adds a migration file.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
