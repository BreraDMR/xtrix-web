// Credential links put their token in the URL fragment (never sent to a server or a referrer).
// Reading consumes it: the fragment is removed from the address bar and the token is kept in
// tab storage so a reload of the same page still works.
export function fragmentTokenReader(param: string, storageKey: string) {
  return (): string | null => {
    const hadFragment = window.location.hash.length > 1
    let token = ''
    try {
      token = (new URLSearchParams(window.location.hash.replace(/^#/, '')).get(param) ?? '').trim()
    } catch {
      token = ''
    }
    if (token) {
      try { sessionStorage.setItem(storageKey, token) } catch { /* private window: memory only */ }
      try { window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`) } catch { /* ignore */ }
      return token
    }
    if (hadFragment) {
      try { sessionStorage.removeItem(storageKey) } catch { /* ignore */ }
      return null
    }
    try { return sessionStorage.getItem(storageKey) } catch { return null }
  }
}

export function forgetFragmentToken(storageKey: string) {
  try { sessionStorage.removeItem(storageKey) } catch { /* ignore */ }
}

// A booking or invitation link opened before signing in. It has to survive signing up, which
// goes through an email link that usually opens in another tab, so it waits in localStorage
// for a day and is removed as soon as it is used.
export type PendingClaim = { kind: 'manage' | 'invite'; token: string }
const PENDING_KEY = 'visitor_pending_claim'
const PENDING_TTL = 24 * 60 * 60 * 1000

export function savePendingClaim(claim: PendingClaim) {
  try { localStorage.setItem(PENDING_KEY, JSON.stringify({ ...claim, savedAt: Date.now() })) } catch { /* ignore */ }
}

export function pendingClaim(): PendingClaim | null {
  try {
    const value = JSON.parse(localStorage.getItem(PENDING_KEY) ?? 'null') as (PendingClaim & { savedAt?: number }) | null
    if (value && (value.kind === 'manage' || value.kind === 'invite') && typeof value.token === 'string'
      && typeof value.savedAt === 'number' && Date.now() - value.savedAt < PENDING_TTL) return { kind: value.kind, token: value.token }
    localStorage.removeItem(PENDING_KEY)
  } catch { /* ignore */ }
  return null
}

export function clearPendingClaim() {
  try { localStorage.removeItem(PENDING_KEY) } catch { /* ignore */ }
}

// Where to go after signing in: only back into the cabinet, never an outside or CRM address.
export function safeNext(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/visitor/') || value.startsWith('//') || value.includes('\\')) return null
  return value
}

export function afterSignIn(next: string | null): string {
  if (pendingClaim()) return '/visitor/claim'
  return safeNext(next) ?? '/visitor/visits'
}

export function loginPath(next?: string, reauth = false): string {
  const params = new URLSearchParams()
  if (next) params.set('next', next)
  if (reauth) params.set('reauth', '1')
  const query = params.toString()
  return `/visitor/login${query ? `?${query}` : ''}`
}

// An action refused by the "signed in within 5 minutes" rule is repeated after signing in again.
export type Resume = { action: 'email-request'; email: string } | { action: 'email-confirm' } | { action: 'google-link' }
const RESUME_KEY = 'visitor_resume'

export function rememberResume(resume: Resume) {
  try { sessionStorage.setItem(RESUME_KEY, JSON.stringify(resume)) } catch { /* ignore */ }
}

export function takeResume<A extends Resume['action']>(action: A): Extract<Resume, { action: A }> | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(RESUME_KEY) ?? 'null') as Resume | null
    if (value?.action !== action) return null
    sessionStorage.removeItem(RESUME_KEY)
    return value as Extract<Resume, { action: A }>
  } catch {
    return null
  }
}
