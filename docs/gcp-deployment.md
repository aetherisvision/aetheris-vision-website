# GCP deployment

The application supports Cloud Run and Cloud SQL while retaining the existing
Neon/Vercel configuration until cutover is verified.

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

The local Claude subscription worker uses `scripts/run-claude-worker-gcp.mjs`
and a persistent Cloud SQL Auth Proxy on `127.0.0.1:55440`. It retrieves the
database connection from Secret Manager at startup; Claude subscription
authentication remains on the Mac. Radar continues using the authenticated
website API and does not receive direct database credentials.

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
