#!/usr/bin/env bash
# =============================================================================
# backup.sh — Aetheris Vision full backup script
#
# What it does:
#   1. Pushes the current branch to GitHub (origin) and GitLab (backup)
#   2. Creates a timestamped ZIP of the repo and syncs it to Google Drive
#
# Prerequisites:
#   - rclone configured with a remote named "gdrive"  (run: rclone config)
#   - A GitLab remote named "backup" added to this repo:
#       git remote add backup https://gitlab.com/YOUR_USERNAME/aetheris-vision-website.git
#
# Usage:
#   ./scripts/backup.sh                  # push current branch + archive
#   ./scripts/backup.sh --drive-only     # only sync to Google Drive
#   ./scripts/backup.sh --git-only       # only push to GitHub + GitLab
# =============================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BRANCH="$(git -C "$REPO_ROOT" rev-parse --abbrev-ref HEAD)"
TIMESTAMP="$(date +%Y-%m-%d_%H-%M-%S)"
ARCHIVE_NAME="aetheris-vision_${TIMESTAMP}.zip"
DRIVE_REMOTE="gdrive"
DRIVE_FOLDER="AethericsVision/Backups/website"
TMP_DIR="$(mktemp -d)"

# ── Colour helpers ────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${GREEN}[backup]${NC} $*"; }
warn() { echo -e "${YELLOW}[backup]${NC} $*"; }
err()  { echo -e "${RED}[backup]${NC} $*" >&2; }

# ── Argument parsing ──────────────────────────────────────────────────────────
DO_GIT=true
DO_DRIVE=true
for arg in "$@"; do
  case "$arg" in
    --drive-only) DO_GIT=false ;;
    --git-only)   DO_DRIVE=false ;;
  esac
done

# ── 1. Git: push to GitHub + GitLab ──────────────────────────────────────────
if $DO_GIT; then
  log "Pushing branch '${BRANCH}' to GitHub (origin)..."
  git -C "$REPO_ROOT" push origin "$BRANCH"

  if git -C "$REPO_ROOT" remote get-url backup &>/dev/null; then
    log "Pushing branch '${BRANCH}' to GitLab (backup)..."
    git -C "$REPO_ROOT" push backup "$BRANCH"
  else
    warn "GitLab remote 'backup' not configured — skipping."
    warn "Add it with: git remote add backup https://gitlab.com/YOUR_USERNAME/aetheris-vision-website.git"
  fi
fi

# ── 2. Drive: zip repo + upload via rclone ────────────────────────────────────
if $DO_DRIVE; then
  if ! command -v rclone &>/dev/null; then
    err "rclone not found. Install with: brew install rclone"
    exit 1
  fi

  if ! rclone listremotes | grep -q "^${DRIVE_REMOTE}:"; then
    err "rclone remote '${DRIVE_REMOTE}' not found. Run: rclone config"
    exit 1
  fi

  log "Creating archive: ${ARCHIVE_NAME}"
  # git archive only includes tracked files — .next, node_modules, .git excluded automatically
  git -C "$REPO_ROOT" archive --format=zip --output="${TMP_DIR}/${ARCHIVE_NAME}" HEAD

  log "Syncing to Google Drive: ${DRIVE_REMOTE}:${DRIVE_FOLDER}/"
  rclone copy "${TMP_DIR}/${ARCHIVE_NAME}" "${DRIVE_REMOTE}:${DRIVE_FOLDER}/"

  # Keep only the 10 most recent archives in Drive
  log "Pruning old archives (keeping latest 10)..."
  EXTRAS=$(rclone lsf "${DRIVE_REMOTE}:${DRIVE_FOLDER}/" \
    | sort -r \
    | tail -n +11)
  if [[ -n "$EXTRAS" ]]; then
    while IFS= read -r old_file; do
      warn "  Deleting old archive: ${old_file}"
      rclone delete "${DRIVE_REMOTE}:${DRIVE_FOLDER}/${old_file}"
    done <<< "$EXTRAS"
  fi

  rm -rf "$TMP_DIR"
  log "Archive uploaded successfully."
fi

log "Backup complete. ✓"
