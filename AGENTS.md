# AGENTS.md — Aetheris Vision Website

These instructions apply to the entire `business/website/` repository. They
supplement the workspace-level `/Users/marston.ward/Developer/AGENTS.md`; when
the two conflict, follow the more specific instruction unless the user says
otherwise.

## Project

- Public site: `https://aetherisvision.com`
- Repository: `github.com/aetherisvision/aetheris-vision-website`
- Stack: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4
- Hosting: Vercel project `aetheris-vision-website` in the Aetheris Vision team
- Database: Neon Postgres
- Integrations: Resend, Cloudflare Turnstile, Upstash Redis/Vercel KV,
  Docuseal, Stripe, Gmail OAuth, Cal.com, and Vercel Blob

## Source of Truth

- Company and site-wide strings belong in `src/lib/constants.ts`.
- Shared structured data belongs in `src/lib/jsonld.ts`.
- Public routes and API handlers live under `src/app/`.
- Reusable presentation belongs in `src/components/`.
- Shared server utilities belong in `src/lib/`.
- Request gating, admin protection, CSP, and coarse API rate limiting live in
  `src/proxy.ts` (the Next.js 16 proxy convention).
- Environment requirements are documented in `.env.example` and enforced by
  `scripts/check-env.js`.

Do not duplicate brand facts or credentials in page files. Do not treat the
README as authoritative when it disagrees with the implementation or this
file; verify behavior in the current code.

## Local Development

The required runtime is Node.js 24.15.x (see `.nvmrc` and `package.json`).

```bash
fnm use
npm install
npm run dev
```

Use the narrowest relevant verification during development, then run checks
proportionate to the change before committing:

```bash
npm run lint
npm test
npm run build
npm run ci
```

- Copy-only or isolated UI changes: lint the changed files and run a production
  build.
- Logic changes: run the relevant unit/integration/regression tests plus lint
  and build.
- Authentication, payments, intake, webhooks, database, or proxy changes: run
  the relevant focused tests and the full `npm run ci` when feasible.
- Do not update snapshots or weaken assertions merely to make a failure pass.

## Git and Deployment

- Work on and push to `main` unless the user explicitly requests a branch or
  pull request. A push to `main` triggers the Vercel production deployment.
- Use the business SSH remote:
  `git@github-business:aetherisvision/aetheris-vision-website.git`.
- Repository-local commit identity must remain:
  - `user.name = Aetheris Vision`
  - `user.email = marston@aetherisvision.com`
- Sign commits with the configured SSH signing key.
- Preserve unrelated user changes in a dirty worktree.
- After pushing, verify that the deployment for the pushed commit reaches
  `Ready`; do not infer success from a successful `git push` alone.
- If using a pull request, read and triage every Copilot review and inline
  comment before merging, as required by the workspace manifest.

## Secrets and Environment Variables

- `~/.secrets` is the single source of truth. Never commit secrets or place
  real credentials in this repository.
- `.envrc` maps values from `~/.secrets` into project-specific names and is
  intentionally local/ignored.
- `.env.example` may contain placeholders only.
- Never print secret values in terminal output, logs, commits, or responses.
- Use `npm run check:env:production` to validate production requirements
  without exposing values.
- Vercel Marketplace Redis credentials may use `KV_REST_API_*`; direct Upstash
  credentials may use `UPSTASH_REDIS_REST_*`. The application supports both.

## Security Boundaries

- The public site lock is controlled by `PREVIEW_PASSWORD` and is intentionally
  implemented in `src/proxy.ts`. Do not remove or bypass it without an explicit
  user request.
- `/admin/*` has a separate HMAC-signed session based on
  `ADMIN_PASSPHRASE`. Admin routes must fail closed when configuration or
  authentication is absent.
- `/api/webhooks/*` bypasses the site lock so external services can reach it;
  every webhook handler must perform its own signature verification.
- `/api/cron/*` bypasses the site lock; every cron handler must verify
  `CRON_SECRET` or an explicitly documented authenticated admin session.
- Routes under `/api/auth/gmail/*` bypass the site lock and therefore must keep
  their own admin authorization checks.
- Keep CSP nonces and existing security headers intact. Add third-party origins
  only to the narrowest required CSP directive.
- Public forms use layered abuse controls: input validation, honeypots,
  explicit human confirmation, Cloudflare Turnstile, and distributed rate
  limiting. Do not silently remove a layer.
- Never expose private client, invoice, expense, OAuth, submission, or signed
  document data through a public route.

## Database and External Services

- Treat schema migrations as production-impacting changes. Review migration
  direction and data preservation before running `npm run db:migrate`.
- Do not run migrations, send real email, create invoices, charge payments,
  submit Docuseal documents, or mutate production data merely to diagnose a
  problem.
- Mock external services in automated tests unless the test is explicitly an
  authorized live end-to-end check.
- Maintain idempotency and signature verification in webhook handlers.

## Public-Site Content and SEO

- Keep visible headings concise and scannable; retain detailed search language
  in supporting copy, metadata, structured data, and dedicated service pages.
- Avoid keyword stuffing. Write for prospective clients first while preserving
  accurate terms such as applied meteorology, weather AI, GIS, geospatial
  regridding, Earth data, and scientific software.
- Preserve page metadata, canonical URLs, sitemap coverage, robots behavior,
  and JSON-LD when changing routes or page titles.
- Label generated or illustrative media honestly and include its source when
  known. Do not present synthetic imagery as documentary evidence or completed
  client work.
- Maintain accessible heading order, alt text, labels, keyboard behavior,
  visible focus states, and sufficient contrast.

## Completion Checklist

Before handing off a change:

1. Review the diff for accidental secrets, generated files, and unrelated
   edits.
2. Run the appropriate lint, test, and build checks.
3. Confirm the repository-local business Git identity.
4. Commit with a signed, descriptive commit.
5. Push to `main` when the requested change is ready for production.
6. Verify the matching Vercel deployment reaches `Ready`.
7. Confirm `git status --short --branch` is clean and synchronized.
