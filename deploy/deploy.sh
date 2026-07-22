#!/usr/bin/env bash
set -euo pipefail

DEPLOY_USER='deployer'
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

[[ -f "$ROOT/deploy/env.deploy" ]] && set -a && source "$ROOT/deploy/env.deploy" && set +a

: "${DEPLOY_HOST:?}"
: "${DEPLOY_USER:?}"
: "${VITE_POCKETBASE_URL:?}"

REMOTE_BACKUP_DIR="${REMOTE_BACKUP_DIR:-/var/backups/teatrplus}"
PB="$REMOTE_ADMIN_DIR/pocketbase"

ssh() { command ssh -o BatchMode=yes "$DEPLOY_USER@$DEPLOY_HOST" "$@"; }
rsync() { command rsync -avz -e ssh "$@"; }

echo "==> build admin UI"
(
  cd "$ROOT/app"
  pnpm install --frozen-lockfile
  VITE_POCKETBASE_URL="$VITE_POCKETBASE_URL" pnpm build
)

if [[ "${DEPLOY_BACKUP_PB_DATA:-1}" == "1" ]]; then
  echo "==> backup pb_data"
  ssh bash -s <<EOF
set -euo pipefail
[[ -d "$REMOTE_ADMIN_DIR/pb_data" ]] || exit 0
stamp=\$(date -u +%Y%m%dT%H%M%SZ)
tar -czf "$REMOTE_BACKUP_DIR/pb_data-\${stamp}.tar.gz" -C "$REMOTE_ADMIN_DIR" pb_data
find "$REMOTE_BACKUP_DIR" -name 'pb_data-*.tar.gz' -mtime +14 -delete
EOF
fi

echo "==> sync"
rsync "$ROOT/pb_hooks/" "$DEPLOY_USER@$DEPLOY_HOST:$REMOTE_ADMIN_DIR/pb_hooks/"
rsync "$ROOT/pb_migrations/" "$DEPLOY_USER@$DEPLOY_HOST:$REMOTE_ADMIN_DIR/pb_migrations/"
rsync --delete "$ROOT/app/dist/" "$DEPLOY_USER@$DEPLOY_HOST:$REMOTE_ADMIN_DIR/pb_public/"

echo "==> restart"
ssh "touch '$PB'"

echo "==> done"
