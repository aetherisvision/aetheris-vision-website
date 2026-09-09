#!/bin/bash
# Default: print the reviewable plist. --install explicitly installs this user's worker.
set -euo pipefail

case "${1:---print}" in
  --print|--install) ;;
  *) echo 'Usage: install-claude-subscription-worker.sh [--print|--install]' >&2; exit 2 ;;
esac

WORKER_REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKER_LABEL='com.aetherisvision.claude-subscription'
WORKER_PLIST="$HOME/Library/LaunchAgents/$WORKER_LABEL.plist"
WORKER_LOG_DIR="$HOME/Library/Logs/AetherisVision"
WORKER_FNM="$(command -v fnm)"

generate_plist() {
  python3 - "$WORKER_REPO" "$WORKER_LABEL" "$WORKER_LOG_DIR" "$WORKER_FNM" <<'PY'
import plistlib
import sys
repo, label, log_dir, fnm = sys.argv[1:]
plist = {
    'Label': label,
    'ProgramArguments': [fnm, 'exec', '--using=24.15.0', 'node',
        f'--env-file={repo}/.env.local', '--import', 'tsx',
        f'{repo}/scripts/claude-subscription-worker.ts'],
    'WorkingDirectory': repo,
    'EnvironmentVariables': {'PATH': '/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin'},
    'RunAtLoad': True,
    'KeepAlive': {'SuccessfulExit': False},
    'ThrottleInterval': 30,
    'ProcessType': 'Background',
    'StandardOutPath': f'{log_dir}/claude-subscription.log',
    'StandardErrorPath': f'{log_dir}/claude-subscription.log',
}
sys.stdout.buffer.write(plistlib.dumps(plist))
PY
}

if [[ "${1:---print}" == '--print' ]]; then
  generate_plist
  exit
fi

[[ -f "$WORKER_REPO/.env.local" ]] || { echo 'Missing local .env.local; provide DATABASE_URL before installation.' >&2; exit 1; }
[[ -x "$WORKER_REPO/node_modules/.bin/tsx" ]] || { echo 'Install project dependencies before installation.' >&2; exit 1; }
umask 077
mkdir -p "$HOME/Library/LaunchAgents" "$WORKER_LOG_DIR"
generate_plist > "$WORKER_PLIST"
chmod 600 "$WORKER_PLIST"
launchctl bootout "gui/$(id -u)/$WORKER_LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$WORKER_PLIST"
echo 'Installed the local Claude subscription worker. It starts at login and resumes when the Mac wakes.'
