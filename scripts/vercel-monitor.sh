#!/usr/bin/env bash
# Smoke-check Vercel CLI auth and print recent production log lines.
# Requires: VERCEL_TOKEN in env (see aetherisvision/infrastructure/vercel_monitoring_setup.md)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "ERROR: VERCEL_TOKEN is not set."
  echo "Add it to website/.envrc (gitignored) from Bitwarden \"Vercel AV Token\", then: cd website && direnv allow"
  exit 1
fi

export VERCEL_TOKEN

echo "=== vercel whoami ==="
vercel whoami
echo ""
echo "Note: whoami is your Vercel **user** (e.g. marstonsward). The **team** below is the org scope for logs — not a second login."

# Resolve team id from `vercel teams list` — hardcoded IDs in docs often drift or are wrong.
# Optional: export VERCEL_TEAM_SCOPE=team_... from .envrc.local if auto-pick fails.
SCOPE="${VERCEL_TEAM_SCOPE:-}"
if [[ -z "$SCOPE" ]]; then
  SCOPE="$(VERCEL_TOKEN="$VERCEL_TOKEN" node "${ROOT}/scripts/vercel-resolve-scope.mjs")" || {
    echo "Could not resolve team — set VERCEL_TEAM_SCOPE to a team id from: vercel teams list -F json"
    exit 1
  }
fi
PROJECT="${VERCEL_PROJECT:-aetheris-vision-website}"

echo ""
echo "=== Recent production logs (last 40 lines, no follow) ==="
echo "    scope: ${SCOPE}  project: ${PROJECT}"
echo "    (override: VERCEL_TEAM_SCOPE / VERCEL_PROJECT)"
vercel logs \
  --scope "${SCOPE}" \
  -p "${PROJECT}" \
  --environment production \
  --no-follow \
  -n 40 \
  2>&1 || {
    echo ""
    echo "TIP: VERCEL_TOKEN must be from an account that is a member of the Aetheris Vision team."
    echo "     vercel teams list -F json"
    echo "     node scripts/vercel-resolve-scope.mjs"
    exit 1
  }

echo ""
echo "=== Optional: filter for receipt cron (last 80 matching lines) ==="
vercel logs \
  --scope "${SCOPE}" \
  -p "${PROJECT}" \
  --environment production \
  --no-follow \
  -n 80 \
  --query "cron/receipts" \
  2>&1 || true
