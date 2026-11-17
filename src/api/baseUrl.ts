// The API address comes from VITE_API_URL only. In dev it may be left out, then /api goes
// through the Vite proxy to localhost:8000 (vite.config.ts); a production build requires it.
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'
