# shellcheck shell=bash
# Aetheris Vision LLC — secrets used by aetherisvision.com (Neon, Stripe, Vercel team, APIs).
# Sourced from website/.envrc when BW_SESSION is set.

_bw_dir=$(mktemp -d "${TMPDIR:-/tmp}/website-bw-av.XXXXXX")
trap 'rm -rf "${_bw_dir}"' EXIT

_bw() {
  local key="$1"
  local item="$2"
  bw get password "$item" --session "$BW_SESSION" 2>/dev/null > "${_bw_dir}/${key}" &
}

_bw ANTHROPIC_API_KEY "Anthropic API Key"
_bw RESEND_API_KEY "Resend API Key"
_bw DOCUSEAL_API_KEY "Docuseal API Key"
_bw DATABASE_URL "AV Database URL"
_bw NEXTAUTH_SECRET "NextAuth Secret"
_bw ADMIN_PASSPHRASE "AV Admin Passphrase"
_bw VERCEL_TOKEN "Vercel AV Token"
_bw NASA_API_KEY "NASA API Key"
_bw STRIPE_SECRET_KEY "Stripe Secret Key"
_bw STRIPE_WEBHOOK_SECRET "Stripe Webhook Secret"

# Do not fail the whole script if one bw get fails (caller may use set -e).
wait || true

export ANTHROPIC_API_KEY=$(cat "${_bw_dir}/ANTHROPIC_API_KEY")
export RESEND_API_KEY=$(cat "${_bw_dir}/RESEND_API_KEY")
export DOCUSEAL_API_KEY=$(cat "${_bw_dir}/DOCUSEAL_API_KEY")
export DATABASE_URL=$(cat "${_bw_dir}/DATABASE_URL")
export NEXTAUTH_SECRET=$(cat "${_bw_dir}/NEXTAUTH_SECRET")
export ADMIN_PASSPHRASE=$(cat "${_bw_dir}/ADMIN_PASSPHRASE")
export VERCEL_TOKEN=$(cat "${_bw_dir}/VERCEL_TOKEN")
export NASA_API_KEY=$(cat "${_bw_dir}/NASA_API_KEY")
export STRIPE_SECRET_KEY=$(cat "${_bw_dir}/STRIPE_SECRET_KEY")
export STRIPE_WEBHOOK_SECRET=$(cat "${_bw_dir}/STRIPE_WEBHOOK_SECRET")

trap - EXIT
rm -rf "${_bw_dir}"
