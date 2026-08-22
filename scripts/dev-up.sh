#!/usr/bin/env bash
# Starts MongoDB, the FastAPI backend, and the React frontend for local development.
# Safe to re-run: skips anything already running, never overwrites an existing .env.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEVDATA="$ROOT/.devdata"
MONGO_BIN="$DEVDATA/mongodb/bin"
MONGO_DATA="$DEVDATA/mongodb/data"
LOGS="$DEVDATA/logs"
PIDS="$DEVDATA/pids"
MONGO_PORT=27017
BACKEND_PORT=8000
FRONTEND_PORT=3000
MONGO_VERSION=7.0.14

mkdir -p "$MONGO_DATA" "$LOGS" "$PIDS"

port_open() { curl -s -o /dev/null -m 2 "http://127.0.0.1:$1" 2>/dev/null; }
port_in_use() { lsof -i ":$1" -sTCP:LISTEN >/dev/null 2>&1; }

echo "== MongoDB =="
if port_in_use "$MONGO_PORT"; then
  echo "  already running on :$MONGO_PORT"
else
  if [ ! -x "$MONGO_BIN/mongod" ]; then
    echo "  mongod not found locally — downloading MongoDB $MONGO_VERSION (no brew/docker needed)"
    ARCH="$(uname -m)"
    case "$ARCH" in
      arm64)  MONGO_URL="https://fastdl.mongodb.org/osx/mongodb-macos-arm64-${MONGO_VERSION}.tgz" ;;
      x86_64) MONGO_URL="https://fastdl.mongodb.org/osx/mongodb-macos-x86_64-${MONGO_VERSION}.tgz" ;;
      *) echo "  Unsupported architecture: $ARCH. Install MongoDB manually and put mongod on \$PATH."; exit 1 ;;
    esac
    TMP="$(mktemp -d)"
    curl -sL -o "$TMP/mongodb.tgz" "$MONGO_URL"
    tar xzf "$TMP/mongodb.tgz" -C "$TMP"
    mkdir -p "$DEVDATA/mongodb"
    cp -R "$TMP"/mongodb-macos-*/bin "$MONGO_BIN"
    rm -rf "$TMP"
  fi
  "$MONGO_BIN/mongod" --dbpath "$MONGO_DATA" --logpath "$LOGS/mongod.log" --port "$MONGO_PORT" --bind_ip 127.0.0.1 --fork
  # mongod --fork writes its own pid file behavior varies; capture the process we just started.
  pgrep -f "mongod --dbpath $MONGO_DATA" | head -1 > "$PIDS/mongod.pid" || true
  echo "  started on :$MONGO_PORT (data: $MONGO_DATA)"
fi

echo "== Backend env =="
if [ ! -f "$ROOT/backend/.env" ]; then
  echo "  generating backend/.env with fresh secrets"
  cp "$ROOT/backend/.env.example" "$ROOT/backend/.env"
  JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(48))")
  ADMIN_PW=$(python3 -c "import secrets; print(secrets.token_urlsafe(12))")
  python3 - "$ROOT/backend/.env" "$JWT_SECRET" "$ADMIN_PW" <<'PYEOF'
import sys
path, jwt_secret, admin_pw = sys.argv[1:4]
with open(path) as f:
    content = f.read()
content = content.replace("replace-with-a-long-random-secret", jwt_secret)
content = content.replace("replace-with-a-strong-password", admin_pw)
with open(path, "w") as f:
    f.write(content)
PYEOF
  FERNET_KEY=$("$ROOT/.venv/bin/python" -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())" 2>/dev/null || python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")
  python3 - "$ROOT/backend/.env" "$FERNET_KEY" <<'PYEOF'
import sys
path, fernet_key = sys.argv[1:3]
with open(path) as f:
    content = f.read()
content = content.replace("replace-with-a-fernet-key", fernet_key)
with open(path, "w") as f:
    f.write(content)
PYEOF
else
  echo "  backend/.env already exists — leaving it alone"
fi

echo "== Frontend env =="
if [ ! -f "$ROOT/frontend/.env" ]; then
  cp "$ROOT/frontend/.env.example" "$ROOT/frontend/.env"
  echo "  created frontend/.env"
else
  echo "  frontend/.env already exists — leaving it alone"
fi

echo "== Python venv =="
if [ ! -d "$ROOT/.venv" ]; then
  echo "  creating venv and installing backend dependencies"
  PYBIN="$(command -v python3.11 || command -v python3)"
  "$PYBIN" -m venv "$ROOT/.venv"
  "$ROOT/.venv/bin/pip" install -q -r "$ROOT/backend/requirements.txt"
else
  echo "  .venv already present"
fi

echo "== Frontend dependencies =="
if [ ! -d "$ROOT/frontend/node_modules" ]; then
  echo "  running yarn install"
  (cd "$ROOT/frontend" && yarn install)
else
  echo "  node_modules already present"
fi

echo "== Backend =="
if port_in_use "$BACKEND_PORT"; then
  echo "  already running on :$BACKEND_PORT"
else
  (cd "$ROOT" && nohup .venv/bin/uvicorn backend.server:app --port "$BACKEND_PORT" > "$LOGS/backend.log" 2>&1 &)
  sleep 1
  pgrep -f "uvicorn backend.server:app" | head -1 > "$PIDS/backend.pid" || true
  echo "  starting on :$BACKEND_PORT (log: $LOGS/backend.log)"
fi

echo "== Frontend =="
if port_in_use "$FRONTEND_PORT"; then
  echo "  already running on :$FRONTEND_PORT"
else
  (cd "$ROOT/frontend" && nohup yarn start > "$LOGS/frontend.log" 2>&1 &)
  sleep 1
  pgrep -f "craco/dist/scripts/start.js|react-scripts/scripts/start.js" | head -1 > "$PIDS/frontend.pid" || true
  echo "  starting on :$FRONTEND_PORT (log: $LOGS/frontend.log)"
fi

echo ""
echo "== Waiting for services =="
for i in $(seq 1 30); do
  if port_open "$BACKEND_PORT/api/" && port_open "$FRONTEND_PORT"; then
    break
  fi
  sleep 1
done

echo ""
if port_open "$BACKEND_PORT/api/"; then echo "Backend:  http://localhost:$BACKEND_PORT/api/  (OK)"; else echo "Backend:  not responding yet — check $LOGS/backend.log"; fi
if port_open "$FRONTEND_PORT"; then echo "Frontend: http://localhost:$FRONTEND_PORT  (OK)"; else echo "Frontend: not responding yet — check $LOGS/frontend.log"; fi

if [ -f "$ROOT/backend/.env" ]; then
  ADMIN_EMAIL=$(grep -E '^BOOTSTRAP_ADMIN_EMAIL=' "$ROOT/backend/.env" | cut -d= -f2-)
  ADMIN_PASS=$(grep -E '^BOOTSTRAP_ADMIN_PASSWORD=' "$ROOT/backend/.env" | cut -d= -f2-)
  echo ""
  echo "Admin login: $ADMIN_EMAIL / $ADMIN_PASS"
fi
echo ""
echo "Run scripts/dev-down.sh to stop everything."
