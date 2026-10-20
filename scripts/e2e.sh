#!/usr/bin/env bash
# Playwright E2E against a throwaway stack: own Postgres in docker (migrated + seeded),
# the API on uvicorn and vite dev. Everything started here is stopped on exit.
#
#   API_DIR     path to the API checkout (default ../api)
#   API_PYTHON  python with the API's requirements (default $API_DIR/.venv/bin/python, else python3)
#   extra args go to `playwright test`, e.g. ./scripts/e2e.sh --update-snapshots
#
# The API dir is only read: alembic, uvicorn and the seed all run from a temp dir, so its
# .env and logs/ are never touched.
set -euo pipefail
cd "$(dirname "$0")/.."

API_DIR=$(cd "${API_DIR:-../api}" && pwd)
if [ -z "${API_PYTHON:-}" ]; then
    if [ -x "$API_DIR/.venv/bin/python" ]; then API_PYTHON="$API_DIR/.venv/bin/python"; else API_PYTHON=python3; fi
fi
# everything on the API side runs from a temp dir, so a relative path would break there
case "$API_PYTHON" in /*) ;; */*) API_PYTHON="$(pwd)/$API_PYTHON" ;; esac
PG_CONTAINER=${E2E_PG_CONTAINER:-xtrix-e2e-pg}
PG_PORT=${E2E_PG_PORT:-55470}
API_PORT=${E2E_API_PORT:-8170}
WEB_PORT=${E2E_WEB_PORT:-3170}
pg_id=""

for port in $PG_PORT $API_PORT $WEB_PORT; do
    if nc -z localhost "$port" 2>/dev/null; then
        echo "port $port is already taken - stop whatever runs there first" >&2
        exit 1
    fi
done

tmp=$(mktemp -d)
api_pid=""
web_pid=""
cleanup() {
    status=$?
    [ -n "$web_pid" ] && kill "$web_pid" 2>/dev/null || true
    [ -n "$api_pid" ] && kill "$api_pid" 2>/dev/null || true
    wait 2>/dev/null || true
    if [ -n "$pg_id" ]; then docker rm -f "$pg_id" >/dev/null 2>&1 || true; fi
    rm -rf "$tmp"
    exit $status
}
trap cleanup EXIT
trap 'exit 130' INT TERM

wait_for() {
    local what=$1 url=$2
    for _ in $(seq 1 60); do
        if curl -fsS -o /dev/null "$url" 2>/dev/null; then return 0; fi
        sleep 1
    done
    echo "$what did not come up at $url" >&2
    return 1
}

echo "==> postgres ($PG_CONTAINER on $PG_PORT)"
pg_id=$(docker run -d --name "$PG_CONTAINER" -p "$PG_PORT:5432" \
    -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=xtrix_e2e_test postgres:15)
for _ in $(seq 1 60); do
    docker exec "$PG_CONTAINER" pg_isready -U postgres -d xtrix_e2e_test >/dev/null 2>&1 && break
    sleep 1
done
# pg_isready says yes a moment before the init scripts finish and the server restarts
sleep 2
docker exec "$PG_CONTAINER" pg_isready -U postgres -d xtrix_e2e_test >/dev/null

export DATABASE_URL="postgresql://postgres:postgres@localhost:$PG_PORT/xtrix_e2e_test"
export JWT_SECRET
JWT_SECRET=$(openssl rand -hex 32)
# nothing listens on port 1 - the API falls back to no cache / in-memory limits
export REDIS_URL=redis://localhost:1/0
export ENVIRONMENT=development
# the suite logs in a lot from one IP
export RATE_LIMIT_ENABLED=false
export CORS_ORIGINS="http://localhost:$WEB_PORT,http://127.0.0.1:$WEB_PORT"
export FRONTEND_URL="http://localhost:$WEB_PORT"
# the assistant answers from a fixture file and "hears" a fixed phrase - no model or speech
# service is ever called, whatever the shell has in LLM_* / STT_*
export LLM_PROVIDER=fake
export LLM_FAKE_PLAN_FILE="$(pwd)/e2e/fixtures/assistant-plan.json"
export STT_PROVIDER=fake
export STT_FAKE_TEXT="Book Alice Assistant for the earliest free time"
export PYTHONPATH="$API_DIR"
export PYTHONDONTWRITEBYTECODE=1

echo "==> migrations"
sed "s#^script_location = .*#script_location = $API_DIR/alembic#" "$API_DIR/alembic.ini" > "$tmp/alembic.ini"
(cd "$tmp" && "$API_PYTHON" -m alembic -c "$tmp/alembic.ini" upgrade head >"$tmp/alembic.log" 2>&1) \
    || { tail -30 "$tmp/alembic.log" >&2; exit 1; }

echo "==> seed"
(cd "$tmp" && "$API_PYTHON" "$API_DIR/scripts/seed_demo.py" >"$tmp/seed.json" 2>"$tmp/seed.log") \
    || { tail -30 "$tmp/seed.log" >&2; exit 1; }
export E2E_SEED_FILE="$tmp/seed.json"

echo "==> api on $API_PORT"
(cd "$tmp" && exec "$API_PYTHON" -m uvicorn app.main:app --host 127.0.0.1 --port "$API_PORT" >"$tmp/api.log" 2>&1) &
api_pid=$!
wait_for API "http://127.0.0.1:$API_PORT/metrics/health" || { tail -30 "$tmp/api.log" >&2; exit 1; }

echo "==> web on $WEB_PORT"
export E2E_API_URL="http://localhost:$API_PORT"
export E2E_WEB_URL="http://localhost:$WEB_PORT"
VITE_API_URL="$E2E_API_URL" node node_modules/vite/bin/vite.js --host localhost --port "$WEB_PORT" --strictPort \
    >"$tmp/web.log" 2>&1 &
web_pid=$!
wait_for web "$E2E_WEB_URL/" || { tail -30 "$tmp/web.log" >&2; exit 1; }

echo "==> playwright"
set +e
npx playwright test "$@"
result=$?
set -e
if [ $result -ne 0 ]; then
    echo "--- last API log lines ---" >&2
    tail -20 "$tmp/api.log" >&2
fi
exit $result
