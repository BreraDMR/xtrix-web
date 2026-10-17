# Xtrix Web

Web client for Xtrix, a business management platform: clients, visits, services, staff, salaries,
inventory, expenses, loyalty and analytics.

The API lives in a separate repo: [BreraDMR/xtrix-api](https://github.com/BreraDMR/xtrix-api).

## Stack

React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, Zustand.

## Local setup

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

```
npx tsc --noEmit
npm run lint
npx vitest run
VITE_API_URL=http://localhost:8000 npm run build
```

## License

Proprietary. All rights reserved.
