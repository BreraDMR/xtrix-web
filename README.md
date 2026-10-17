# Xtrix Web

Web client for Xtrix, a business management platform: clients, visits, services, staff, salaries,
inventory, expenses, loyalty and analytics.

The API lives in a separate repo: [BreraDMR/xtrix-api](https://github.com/BreraDMR/xtrix-api).

## Stack

React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, Zustand.

## Local setup

1. `npm install`
2. `npm run dev`

By default the client calls `/api`. Point it at a running API with `VITE_API_BASE_URL`
(e.g. `VITE_API_BASE_URL=http://localhost:8000` in `.env.local`). On Vercel, `/api/*` is
rewritten to the production API, see `vercel.json`.

## License

Proprietary. All rights reserved.
