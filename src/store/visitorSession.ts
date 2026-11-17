import { create } from 'zustand'

// The visitor (a salon's customer) has a login of its own, unrelated to the CRM session in
// authStore. The token goes into X-Visitor-Token, lives 30 days and is never refreshed.
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
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (valid(parsed)) return { token: parsed.token, expiresAt: parsed.expiresAt }
    localStorage.removeItem(KEY)
  } catch {
    // storage blocked or corrupted: no stored session
  }
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
    try { localStorage.setItem(KEY, JSON.stringify(session)) } catch { /* keep it in memory */ }
    set({ session })
  },
  end: () => {
    try { localStorage.removeItem(KEY) } catch { /* nothing stored */ }
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

// Another tab signed in or out.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', event => {
    if (event.key !== KEY && event.key !== null) return
    const next = readStored()
    if (next?.token !== useVisitorSession.getState().session?.token) useVisitorSession.setState({ session: next })
  })
}
