# GCP deployment

The application runs on Cloud Run behind a global external HTTPS load balancer
with Cloud CDN; `aetherisvision.com` resolves to that load balancer. The code
still supports the Neon driver and the legacy Vercel environment variables
until the data cutover below is fully verified.

## Runtime

- Build `Dockerfile` with Node 24.15. Supply public browser settings as build
  arguments; never provide production secrets to the image build.
- Inject secrets at runtime from Secret Manager using a dedicated service account.
- Set `DATABASE_DRIVER=postgres` and `DATABASE_URL` to the scoped application login.
- On Cloud Run, attach the Cloud SQL instance and set
  `CLOUD_SQL_CONNECTION_NAME=project:region:instance`. The driver uses the managed
  Unix socket; it does not open an unauthenticated database listener.
- Without the socket setting, PostgreSQL uses the supplied URL. For local work,
  use a localhost-only Cloud SQL Auth Proxy. Direct remote PostgreSQL URLs must
  use certificate-verified TLS.
- Set `GCS_RECEIPT_BUCKET` only after existing receipt objects and references have
  been copied and checked. The bucket must use uniform access and public access
  prevention. Grant the runtime only bucket-scoped object access.
- When `FIRESTORE_PROJECT_ID` (and optional `FIRESTORE_DATABASE_ID`, defaulting
  to `(default)`) is set, structured bill, expense, tax, and receipt object
  metadata is stored in Firestore (`expenses` and `receipts` collections) while
  receipt PDFs and images remain in `GCS_RECEIPT_BUCKET`. Before setting
  `FIRESTORE_PROJECT_ID=lucid-loader-493512-g1` on `av-crm-web`, provision
  Firestore in `lucid-loader-493512-g1` with these three steps:
  1. Enable the Firestore API:
     `gcloud services enable firestore.googleapis.com --project=lucid-loader-493512-g1`
  2. Create the Firestore Native database in `us-central1`:
     `gcloud firestore databases create --project=lucid-loader-493512-g1 --database='(default)' --location=us-central1 --type=firestore-native`
  3. Grant the Cloud Run runtime service account Firestore access:
     `gcloud projects add-iam-policy-binding lucid-loader-493512-g1 --member=serviceAccount:av-crm-runtime@lucid-loader-493512-g1.iam.gserviceaccount.com --role=roles/datastore.user`
  Then run `npm run db:migrate:expenses-firestore` to idempotently backfill
  existing PostgreSQL `expenses` rows and any legacy Vercel Blob URLs into
  Firestore and GCS. Set `EXPENSE_DUAL_WRITE_POSTGRES=true` or
  `EXPENSE_FALLBACK_READ_POSTGRES=true` during cutover if needed.
- Cloud Run uses its attached identity for Omni-Gridder calls. Grant invocation
  permission on the exact backend service/job; do not grant project-wide admin.
- Existing Upstash rate-limiting remains required. Do not remove distributed
  protection while migrating the hosting or database.
- Preserve the preview gate, admin session key, client authentication keys,
  OAuth encryption secrets, webhook secrets, and integration settings.
- Port defaults to 8080. The standalone runtime runs as an unprivileged user.
- Use a global external Application Load Balancer with a serverless NEG. Set
  its custom request header to `x-av-client-ip:{client_ip_address}` (overwrites
  caller input). Restrict Cloud Run ingress to `internal-and-cloud-load-balancing`
  before setting `GCP_LOAD_BALANCER=true`; public-form rate limits then use the
  verified visitor address. Never enable this flag on an unrestricted service.
- Public origin (`src/lib/request-origin.ts`): Next.js standalone builds
  `request.url` from `HOSTNAME`/`PORT` (`https://0.0.0.0:8080` in the
  container), so same-origin checks, absolute redirects (magic link, preview,
  admin), the Gmail OAuth `redirect_uri`, and the Turnstile hostname check all
  read `getPublicOrigin()` instead. On Cloud Run (`K_SERVICE` set) with
  `GCP_LOAD_BALANCER=true` it uses the client `Host` header, which the global
  external HTTPS load balancer preserves, plus `X-Forwarded-Proto` (must be
  `https`). `X-Forwarded-Host` is ignored on that path: the GCP load balancer
  neither sets nor strips it, so a client could inject it. Only
  `TRUSTED_PROXY=true` (a non-GCP proxy that rewrites the header) opts into
  reading `X-Forwarded-Host`.
- The forwarded host must also be allowlisted: the `SITE.url` apex and `www`,
  `gcp-origin.aetherisvision.com`, the host of `NEXT_PUBLIC_SITE_URL`, and any
  comma-separated `ALLOWED_PUBLIC_HOSTS` entries (add a preview service's
  hostname there; `localhost`/`127.0.0.1` are accepted only outside
  production). Any other host, a non-`https` scheme, or an untrusted ingress
  falls back to `NEXT_PUBLIC_SITE_URL` (when it parses) and then `SITE.url`.
  Production never derives the origin or scheme from `request.url`; only local
  `next dev`/`next start` does.

## CDN cache policy

Cloud CDN is enabled on backend service `av-crm-web` with
`cacheMode: USE_ORIGIN_HEADERS`, so the application alone decides what is
shareable. The policy lives in `src/lib/cache-headers.ts` and is applied by
`next.config.ts` `headers()` (tested in `tests/unit/cache-headers.test.ts`).
Route handlers that need something different set `Cache-Control` themselves
(for example `/api/satellite` and `/api/omni-gridder/datasets` are short public
caches; every admin/auth/client handler already sends `no-store`).

| Path | Cache-Control | Why |
|---|---|---|
| `/_next/static/*` | `public, max-age=31536000, immutable` | Content-hashed build output |
| `/earth-textures/*`, `/logo/*`, `/images/*`, `/favicon.ico` | `public, max-age=604800, stale-while-revalidate=31536000` | Un-hashed files under `public/`; a week fresh, then served stale while refetched |
| `/manifest.json`, `/robots.txt`, `/sitemap.xml` | `public, max-age=3600, stale-while-revalidate=86400` | Small metadata that must pick up edits within the hour |
| `/admin/*`, `/client/*`, `/preview`, `/api/{admin,auth,client,expenses,receipts,preview,cron,webhooks,integrations}/*` | `private, no-store` | Session, bearer, or signature dependent; fail-closed default for new routes under these prefixes |
| HTML pages (`/`, `/about`, ...) | `private, no-cache, no-store, max-age=0, must-revalidate` (set by Next.js) | See below |
| Other `/api/*` | handler-defined, `no-store` unless stated | Public forms and showcase APIs |

**Why HTML stays `no-store`.** `src/app/layout.tsx` reads `headers()` to pick
up the per-request CSP nonce that `src/proxy.ts` generates, which makes every
page dynamic. Next.js therefore ignores route-level `revalidate` for the HTML
(the `revalidate = 3600` on the home page only affects `fetch()` calls made
while rendering) and emits `private, no-store`. Caching HTML at the CDN would
also serve one visitor's nonce to another and break the policy. Shareable HTML
would need the nonce moved out of the root layout and the `Vary` story worked
out first; not worth it while pages render in well under 100 ms at the origin.

**ISR and multiple instances.** No route uses `unstable_cache`,
`revalidateTag`, or `revalidatePath`, and (per the above) no HTML is
statically regenerated, so Cloud Run instances never need to share a Next.js
data cache. A custom `cacheHandler` (for example a GCS-backed one) is
therefore not configured. Revisit only if a route starts relying on ISR; the
permissive options are noted in the parity plan (MIT-licensed
`@neshca/cache-handler` / `@fortedigital/nextjs-cache-handler`, or a small
handler over `@google-cloud/storage`).

The proxy skips the nonce, CSP, and rate-limit path entirely for the static
prefixes in `STATIC_ASSET_PREFIXES` (`/_next/`, `/favicon`, `/logo/`,
`/images/`, `/earth-textures/`), so those responses are byte-identical for
every visitor and the CDN can coalesce them.

## Pull request previews

`.github/workflows/preview.yml` deploys an opt-in preview of a pull request to
the dedicated Cloud Run service `av-crm-web-preview` (`us-central1`,
`minScale: 0`, `maxScale: 1`, ingress `internal-and-cloud-load-balancing`).
It is inert until the repository variable `GCP_PREVIEW_ENABLED` is `true`.

- **Trigger.** Only same-repository PRs carrying the `preview` label (on
  label, push, or reopen), or `workflow_dispatch` with a PR number. Routine
  pushes never build a container. Create the `preview` label once in the
  repository settings.
- **Build and deploy.** Same `cloudbuild.yaml` and WIF identities as
  production (`av-crm-build` builds `…/av-crm/website:pr-<N>-<sha>`,
  `av-crm-deploy` runs `gcloud run deploy av-crm-web-preview --no-traffic
  --tag=pr-<N>`). Only per-PR variables are merged over the service's
  baseline env: `NEXT_PUBLIC_SITE_URL=https://pr-<N>.<suffix>`,
  `ALLOWED_PUBLIC_HOSTS=pr-<N>.<suffix>,<suffix>`, `SITE_NOINDEX=true`. The
  suffix defaults to `preview.aetherisvision.com` and can be overridden with the
  repository variable `GCP_PREVIEW_HOST_SUFFIX`.
- **Access.** The load balancer's host rules `preview.aetherisvision.com` and
  `*.preview.aetherisvision.com` route to backend service `av-crm-web-preview`,
  which has Google Cloud IAP enabled (`roles/iap.httpsResourceAccessor` for
  `domain:aetherisvision.com`). Anonymous requests get a 302 to Google sign-in;
  the workflow's smoke step accepts 200 or 302. Because ingress is LB-only,
  the `pr-<N>---av-crm-web-preview-….run.app` tag URL is not reachable
  directly; the PR comment lists it for reference only.
- **Per-PR hostnames.** `https://pr-<N>.preview.aetherisvision.com` requires
  the serverless NEG `av-crm-web-preview` to use the URL mask
  `<tag>.preview.aetherisvision.com` so the host selects the revision tag.
  _Confirm on the NEG_: `gcloud compute network-endpoint-groups describe
  av-crm-web-preview --region=us-central1 --format='value(cloudRun.urlMask)'`.
  Without a mask the hostnames all serve the service's traffic-bearing
  revision, not the tagged one.
- **Baseline env on the service** (set once by the infra owner, not by the
  workflow): `GCP_LOAD_BALANCER=true`, the preview `DATABASE_URL` secret
  (`avcrm-preview-database-url`, never `avcrm_prod`),
  `GCS_RECEIPT_BUCKET=lucid-loader-493512-g1-crm-preview`,
  `FIRESTORE_EXPENSES_COLLECTION=preview_expenses`,
  `FIRESTORE_RECEIPTS_COLLECTION=preview_receipts`, and optionally
  `PREVIEW_PASSWORD` for a second gate behind IAP. `SITE_NOINDEX=true` makes
  the proxy add `X-Robots-Tag: noindex, nofollow` to every response at
  runtime, since the preview runs the production image whose `robots.ts` and
  metadata were built permissive.
- **Comment.** One PR comment (marker `<!-- av-cloud-run-preview -->`) is
  created and then updated in place with the URL, commit, revision tag, and
  image digest.
- **Cleanup.** On every PR close the `remove-preview` job removes the
  `pr-<N>` revision tag and deletes the `pr-<N>-*` image tags, then rewrites
  the comment. Deleting image tags needs `roles/artifactregistry.writer` on
  the `av-crm` repository for `av-crm-deploy` (currently reader only); until
  granted, that step warns instead of failing.

## Cutover requirements

1. Back up Neon and restore into a new Cloud SQL database. Preserve all tables,
   constraints, indexes, sequences, and the migration ledger.
2. Compare table counts and row fingerprints, excluding only actively changing
   worker heartbeats from an initial live comparison.
3. Verify the new private deployment's authentication, leads, clients, intake,
   expenses, receipts, and read/write transactions. Do not send test emails or
   execute payment operations against real customers.
4. Pause source writers and scheduled jobs, take a final consistent copy, and
   compare again. Update the local subscription worker and other direct database
   consumers, not just the website.
5. Move traffic and schedules once verification passes. Preserve a rollback copy
   and avoid simultaneous writers against different databases.
6. Verify the public domain, TLS, webhooks, OAuth callbacks, and automation health.
   Remove obsolete Neon resources only after successful migration and the required
   deletion confirmation. Tropical Hut's active Sanity and Cloudflare systems are
   separate and must be preserved.

## Verification

Production project: `lucid-loader-493512-g1` (Aetheris Vision CRM Production).
The service is `av-crm-web` in `us-central1`; the SQL instance is `av-crm-postgres`.
Cloud Run revisions bind numbered Secret Manager versions and immutable image
digests. Updating only the image preserves these runtime settings.

GitHub CI checks every push. The optional deployment job is gated by repository
variable `GCP_DEPLOY_ENABLED=true` and restricted to `main`. Its federated
identity must be explicitly provisioned before enabling it; no service-account
key or application secret belongs in GitHub. `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
is the only required public build variable. Cloud Build uses `cloudbuild.yaml`.
After the image is deployed, the job smoke-tests the public origin (`/` is
200, `/api/admin/leads` is 401, a same-origin `POST /api/contact` with an empty
body is exactly 400 (validation, not a 403 origin rejection), and
`POST /api/auth/magic` redirects within `https://aetherisvision.com`). If
the smoke test fails, traffic is moved back to the previously serving revision;
the next successful deploy runs `update-traffic --to-latest` so the pin does
not outlive the rollback.

The local Claude subscription worker uses `scripts/run-claude-worker-gcp.mjs`
and a persistent Cloud SQL Auth Proxy on `127.0.0.1:55440`. It retrieves the
database connection from Secret Manager at startup; Claude subscription
authentication remains on the Mac. Radar continues using the authenticated
website API and does not receive direct database credentials.

Scheduled work runs on Cloud Scheduler + Cloud Run Jobs, not on the host:
`av-crm-daily-receipts` (11:00 UTC) invokes the `av-crm-receipts` job, which
calls `GET /api/cron/receipts` with `Authorization: Bearer <CRON_SECRET>`.
The former `vercel.json` cron for the same path has been removed; before the
Vercel project is deleted, confirm the Scheduler job with
`gcloud scheduler jobs list --location=us-central1`.

The `av-crm-lead-correspondence` Cloud Run job calls
`/api/cron/lead-correspondence` hourly using `crm-cron-secret`; the
`av-crm-hourly-lead-correspondence` Scheduler job invokes it with the dedicated
scheduler identity. It reads business Gmail Sent metadata only. A lead moves
from Review or Active to Follow-ups only when the recipient and an opportunity
identifier, a tracked draft subject/thread, or a distinctive title match.
Shared agency contacts without a unique match are skipped. `/admin/leads` also
offers **Sync sent mail** for immediate checks. The `days=90&dry_run=1` query
previews matched lead IDs without changing the CRM; normal runs scan 30 days.

Run `npm run ci` using Node 24.15. If the shell injects production credentials,
remove `ADMIN_SESSION_SECRET` from the test process; auth fixtures intentionally
use their own signing keys. Never print or commit production secrets.

For real transaction verification, create a disposable PostgreSQL database named
`avcrm` on localhost and run:

```sh
MIGRATION_VERIFY_DATABASE_URL=postgresql://localhost:55439/avcrm \
  npx vitest run tests/integration/postgres-adapter.test.ts
```

The integration test refuses non-loopback databases and uses its own test table.
