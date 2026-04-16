#!/usr/bin/env bash
# Aetheris Vision LLC — one-shot health pass across the **business** stack:
#   Neon (DB) → Vercel (hosting + cron logs)
#
# Prerequisites: Bitwarden session (BW_SESSION) + direnv allow on website/.envrc
# Note: `npm run` starts a new process **before** zsh's direnv hook re-exports vars,
# so we call `direnv export bash` here to load .envrc into this script.
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if command -v direnv >/dev/null 2>&1 && [[ -f .envrc ]]; then
  eval "$(direnv export bash)" || true
fi

# `direnv export` may not see BW_SESSION; background `bw get` + `wait` can abort .envrc under set -e
# before exports. If BW_SESSION is set but either secret is still missing, source Bitwarden directly.
set +u
if [[ -n "${BW_SESSION:-}" ]] && { [[ -z "${DATABASE_URL:-}" ]] || [[ -z "${VERCEL_TOKEN:-}" ]]; }; then
  export NEXTAUTH_URL="${NEXTAUTH_URL:-https://aetherisvision.com}"
  set +e
  # shellcheck source=/dev/null
  source "${ROOT}/scripts/bw-envrc-av.sh"
  set -e
fi

MISSING_DB=0
MISSING_VERCEL=0
[[ -z "${DATABASE_URL:-}" ]] && MISSING_DB=1
[[ -z "${VERCEL_TOKEN:-}" ]] && MISSING_VERCEL=1

if [[ "$MISSING_DB" -eq 1 || "$MISSING_VERCEL" -eq 1 ]]; then
  echo "═══════════════════════════════════════════════════════════════"
  echo "  Aetheris Vision — business stack monitor"
  echo "  $(date -u +%Y-%m-%dT%H:%M:%SZ) UTC"
  echo "═══════════════════════════════════════════════════════════════"
  echo ""
  echo "┌─ Some secrets not loaded ────────────────────────────────────────────────"
  if [[ -z "${BW_SESSION:-}" ]]; then
    echo "│ BW_SESSION is empty in this process."
    echo "│ That's OK if you're using local overrides (website/.envrc.local)."
    echo "│ If you want Bitwarden-loaded secrets, run:"
    echo "│   export BW_SESSION=\$(bw unlock --raw)"
  else
    echo "│ BW_SESSION is set but one or more secrets are still empty."
    echo "│ • Session may be expired — run:  export BW_SESSION=\$(bw unlock --raw)"
  fi
  echo "│ Also: direnv allow   (if .envrc changed)"
  echo "└──────────────────────────────────────────────────────────────────────────"
  echo ""
fi

set -eu

echo "═══════════════════════════════════════════════════════════════"
echo "  Aetheris Vision — business stack monitor"
echo "  $(date -u +%Y-%m-%dT%H:%M:%SZ) UTC"
echo "═══════════════════════════════════════════════════════════════"
echo ""

FAIL=0

echo "── Neon (Postgres) ──"
if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "[Neon] SKIP — DATABASE_URL not in environment"
else
  if node scripts/neon-ping.mjs; then
    :
  else
    FAIL=1
  fi
fi

echo ""
echo "── Vercel (project + receipt cron logs) ──"
if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "[Vercel] SKIP — VERCEL_TOKEN not in environment"
else
  if bash scripts/vercel-monitor.sh; then
    :
  else
    FAIL=1
  fi
fi

echo ""
if [[ "$FAIL" -eq 0 ]]; then
  echo "Done — all checked sections passed."
else
  echo "Done — one or more sections failed (see above)."
  exit 1
fi
