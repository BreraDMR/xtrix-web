# Xtrix Web

Web client for Xtrix, a business management platform: clients, visits, services, staff, salaries,
inventory, expenses, loyalty and analytics.

The API lives in a separate repo: [BreraDMR/xtrix-api](https://github.com/BreraDMR/xtrix-api).

## Stack

React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, Zustand.

## Local setup

Use Node.js 22.12 or later.

1. `npm ci`
2. Start the API (see the xtrix-api README, `docker compose up` is the quickest).
3. `npm run dev` - the app runs on http://localhost:3000

The API address comes from `VITE_API_URL` only. In dev you can leave it unset: requests to `/api`
go through the Vite proxy to `http://localhost:8000`. Or put it in `.env.local`, see `.env.example`
(the API's `CORS_ORIGINS` must then include `http://localhost:3000`).

A production build needs it: `VITE_API_URL=https://api.example.com npm run build` - the build
fails without it. On the API side set `CORS_ORIGINS` to the web client's origin and `FRONTEND_URL`
to its URL (QR links to the client history point there).

## API types

The API publishes its contract as `openapi.json` in the xtrix-api repo. The client's types are
generated from it:

```
npm run gen:api                                   # reads ../api/openapi.json
OPENAPI_JSON=/path/to/openapi.json npm run gen:api
```

This rewrites `src/api/schema.d.ts`; use the shortcuts in `src/api/types.ts` rather than
hand-written interfaces. After an API change regenerate, then let `tsc` show what broke.

The API sends codes (`salon`, `planned`, `business_owner`), never display labels - translate them
with `useLabels()` from `src/i18n/labels.ts`. Error messages come already translated in
`error.message` (the client sends `Accept-Language`), read them with `apiErrorMessage()` from
`src/api/errors.ts`.

## Checks

`./scripts/check.sh` - API types vs the contract (`../api/openapi.json` or `OPENAPI_JSON`), tsc, lint,
vitest and a build. CI runs the same against `openapi.json` from the matching xtrix-api branch, so a
contract change in the API turns this repo red until `npm run gen:api` is run here.

## E2E

`npm run e2e` (= `./scripts/e2e.sh`) runs the Playwright suite in `e2e/` against a throwaway stack:
a `postgres:15` container `xtrix-e2e-pg` on 55470, `alembic upgrade head` and `scripts/seed_demo.py`
from the API, uvicorn on 8170 and vite on 3170. It stops all of it when done. Needs Docker and a
Python with the API's requirements:

    API_DIR=../api API_PYTHON=../api/.venv/bin/python npm run e2e

Extra arguments go to `playwright test` (`npm run e2e -- e2e/clients.spec.ts`, `--headed`...).
The API checkout is only read - migrations, the seed and the server run from a temp dir.
Tests that change data sign up their own owner through the API, so they don't depend on each other's order.
Not in CI yet; it would be one more job with Docker and the API checked out next to this repo,
running the same command after `npx playwright install chromium`.

## License

Proprietary. All rights reserved.
