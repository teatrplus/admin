#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
if [[ -f "$ROOT/deploy/env.deploy" ]]; then
  set -a
  source "$ROOT/deploy/env.deploy"
  set +a
fi
exec python3 "$ROOT/deploy/database-sync.py" pull "$ROOT" "$@"
