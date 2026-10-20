#!/usr/bin/env bash
# One command for "is everything green": contract, types, lint, tests, build.
# The contract check compares src/api/schema.d.ts with the API's openapi.json -
# OPENAPI_JSON if set, else ../api/openapi.json; a missing contract is an error.
set -euo pipefail
cd "$(dirname "$0")/.."

SPEC=${OPENAPI_JSON:-../api/openapi.json}
if [ -f "$SPEC" ]; then
    echo "==> API types match $SPEC"
    tmpdir=$(mktemp -d)
    trap 'rm -rf "$tmpdir"' EXIT
    tmp="$tmpdir/schema.d.ts"
    npx openapi-typescript "$SPEC" -o "$tmp" --silent >/dev/null
    if ! diff -q "$tmp" src/api/schema.d.ts >/dev/null; then
        echo "src/api/schema.d.ts is out of date with the API contract - run: npm run gen:api"
        exit 1
    fi
else
    echo "Missing API contract at $SPEC - set OPENAPI_JSON to the paired API checkout." >&2
    exit 1
fi

echo "==> tsc"
npx tsc --noEmit

echo "==> tsc e2e"
npx tsc --noEmit -p tsconfig.e2e.json

echo "==> lint"
npm run lint --silent

echo "==> vitest"
npx vitest run

echo "==> build"
VITE_API_URL=${VITE_API_URL:-http://localhost:8000} npx vite build --logLevel warn
