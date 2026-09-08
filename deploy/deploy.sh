#!/usr/bin/env bash
set -euo pipefail

DEPLOY_USER="${DEPLOY_USER:-deployer}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

[[ -f "$ROOT/deploy/env.deploy" ]] && set -a && source "$ROOT/deploy/env.deploy" && set +a

: "${DEPLOY_HOST:?}"
: "${DEPLOY_USER:?}"
: "${VITE_POCKETBASE_URL:?}"
: "${REMOTE_ADMIN_DIR:?}"

REMOTE_BACKUP_DIR="${REMOTE_BACKUP_DIR:-/var/backups/theaterplus}"

ssh() { command ssh -o BatchMode=yes -o ConnectTimeout=15 -o ServerAliveInterval=15 -o ServerAliveCountMax=4 "$DEPLOY_USER@$DEPLOY_HOST" "$@"; }
rsync() { command rsync -avz -e 'ssh -o BatchMode=yes -o ConnectTimeout=15 -o ServerAliveInterval=15 -o ServerAliveCountMax=4' "$@"; }

echo "==> build admin UI"
(
  cd "$ROOT/app"
  pnpm install --frozen-lockfile
  VITE_POCKETBASE_URL="$VITE_POCKETBASE_URL" pnpm build
)

if [[ "${DEPLOY_BACKUP_PB_DATA:-1}" == "1" ]]; then
  echo "==> backup pb_data"
  printf -v backup_command 'python3 - %q %q' "$REMOTE_ADMIN_DIR/pb_data" "$REMOTE_BACKUP_DIR"
  ssh "$backup_command" < "$ROOT/deploy/backup.py"
fi

echo "==> sync"
rsync "$ROOT/pb_hooks/" "$DEPLOY_USER@$DEPLOY_HOST:$REMOTE_ADMIN_DIR/pb_hooks/"
rsync "$ROOT/pb_migrations/" "$DEPLOY_USER@$DEPLOY_HOST:$REMOTE_ADMIN_DIR/pb_migrations/"
rsync --delete "$ROOT/app/dist/" "$DEPLOY_USER@$DEPLOY_HOST:$REMOTE_ADMIN_DIR/pb_public/"

echo "==> restart"
ssh "sudo systemctl restart pocketbase.service"

echo "==> wait for PocketBase health"
ssh bash -s <<'EOF'
set -euo pipefail
for attempt in {1..60}; do
  if curl --fail --silent --show-error --max-time 3 http://127.0.0.1:8090/api/health; then
    exit 0
  fi
  sleep 2
done
journalctl -u pocketbase.service -n 40 --no-pager
exit 1
EOF

echo "==> done"
