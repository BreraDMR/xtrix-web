import { create } from 'zustand'

// The visitor (a salon's customer) has a login of its own, unrelated to the CRM session in
// authStore. Its X-Visitor-Token stays in this tab until it closes or the token expires.
const KEY = 'visitor_session'

export interface VisitorSession {
  token: string
  expiresAt: string
}

function valid(value: unknown): value is VisitorSession {
  if (!value || typeof value !== 'object') return false
  const session = value as Record<string, unknown>
  return typeof session.token === 'string' && session.token.length > 0
    && typeof session.expiresAt === 'string' && Date.parse(session.expiresAt) > Date.now()
}

function readStored(): VisitorSession | null {
  // Older builds shared this credential across tabs. Require a fresh visitor sign-in.
  try { localStorage.removeItem(KEY) } catch { /* storage can be blocked */ }
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(KEY) ?? 'null')
    if (valid(parsed)) return { token: parsed.token, expiresAt: parsed.expiresAt }
  } catch {
    // storage blocked or corrupted: no stored session
  }
  try { sessionStorage.removeItem(KEY) } catch { /* nothing accessible */ }
  return null
}

interface VisitorSessionState {
  session: VisitorSession | null
  start: (token: string, expiresAt: string) => void
  end: () => void
}

export const useVisitorSession = create<VisitorSessionState>(set => ({
  session: typeof window !== 'undefined' ? readStored() : null,
  start: (token, expiresAt) => {
    const session = { token, expiresAt }
    try { sessionStorage.setItem(KEY, JSON.stringify(session)) } catch { /* keep it in memory */ }
    set({ session })
  },
  end: () => {
    try { sessionStorage.removeItem(KEY) } catch { /* nothing stored */ }
    set({ session: null })
  },
}))

// The current token, or null once it has expired.
export function visitorToken(): string | null {
  const { session, end } = useVisitorSession.getState()
  if (!session) return null
  if (Date.parse(session.expiresAt) <= Date.now()) {
    end()
    return null
  }
  return session.token
}

