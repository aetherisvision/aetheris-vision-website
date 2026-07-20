#!/usr/bin/env bash
# Aetheris Vision LLC — one-shot health pass across the **business** stack:
#   Neon (DB) → Vercel (hosting + cron logs)
#
# Prerequisites: secrets in the environment — from ~/.secrets (sourced by ~/.zshrc)
# Note: `npm run` starts a new process **before** zsh's direnv hook re-exports vars,
# so we call `direnv export bash` here to load .envrc into this script.
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if command -v direnv >/dev/null 2>&1 && [[ -f .envrc ]]; then
  eval "$(direnv export bash)" || true
fi

# Secrets come from ~/.secrets (sourced by ~/.zshrc). If this script runs in a
# process that didn't inherit them, source ~/.secrets directly.
set +u
if { [[ -z "${DATABASE_URL:-}" ]] || [[ -z "${VERCEL_TOKEN:-}" ]]; } && [[ -f "$HOME/.secrets" ]]; then
  export NEXTAUTH_URL="${NEXTAUTH_URL:-https://aetherisvision.com}"
  set +e
  # shellcheck source=/dev/null
  source "$HOME/.secrets"
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
  echo "│ DATABASE_URL / VERCEL_TOKEN are not set in this process."
  echo "│ They live in ~/.secrets (sourced by ~/.zshrc). In a bare shell, run:"
  echo "│   source ~/.secrets"
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
