#!/usr/bin/env bash
# Stops MongoDB, the backend, and the frontend started by dev-up.sh.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEVDATA="$ROOT/.devdata"
PIDS="$DEVDATA/pids"
MONGO_BIN="$DEVDATA/mongodb/bin"
MONGO_DATA="$DEVDATA/mongodb/data"

stop_by_pattern() {
  local pattern="$1" label="$2"
  local pids
  pids=$(pgrep -f "$pattern" 2>/dev/null || true)
  if [ -z "$pids" ]; then
    echo "  $label not running"
    return
  fi
  echo "$pids" | xargs kill 2>/dev/null
  for i in 1 2 3 4 5; do
    sleep 1
    pids=$(pgrep -f "$pattern" 2>/dev/null || true)
    [ -z "$pids" ] && break
  done
  if [ -n "$pids" ]; then
    echo "$pids" | xargs kill -9 2>/dev/null
    echo "  stopped $label (force)"
  else
    echo "  stopped $label"
  fi
}

echo "== Frontend =="
stop_by_pattern "craco/dist/scripts/start.js|react-scripts/scripts/start.js" "frontend"

echo "== Backend =="
stop_by_pattern "uvicorn backend.server:app" "backend"

echo "== MongoDB =="
if [ -x "$MONGO_BIN/mongosh" ]; then
  "$MONGO_BIN/mongosh" --quiet --eval "db.getSiblingDB('admin').shutdownServer()" >/dev/null 2>&1 && echo "  stopped mongod" || stop_by_pattern "mongod --dbpath $MONGO_DATA" "mongod"
else
  stop_by_pattern "mongod --dbpath $MONGO_DATA" "mongod"
fi

rm -f "$PIDS"/*.pid 2>/dev/null
echo ""
echo "All stopped. Data is preserved in .devdata/mongodb/data — run scripts/dev-up.sh to start again."
