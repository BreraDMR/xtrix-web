import { create } from 'zustand'

export type SessionUser = { id: number; full_name: string; role: string; employer_id?: number | null; business_id?: number | null }

interface AuthState {
  sessionRevision: number
  token: string | null
  user: SessionUser | null
  // true after the logout button, so login doesn't offer a way back to the last page
  signedOut: boolean
  setAuth: (token: string, user: SessionUser) => void
  // fresh tokens from login/signup; the user is loaded right after from /users/me
  startSession: (accessToken: string, refreshToken?: string | null) => void
  setToken: (token: string) => void
  logout: (byUser?: boolean) => void
}

function savedUser(): SessionUser | null {
  try {
    const userStr = localStorage.getItem('auth_user')
    const user = userStr ? JSON.parse(userStr) : null
    // saved before /users/me had business_id/employer_id - forget it, PrivateRoute loads a fresh one
    if (!user || !('business_id' in user) || !('employer_id' in user)) return null
    return user
  } catch {
    return null
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  sessionRevision: 0,
  token: typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null,
  user: typeof window !== 'undefined' ? savedUser() : null,
  signedOut: false,
  setAuth: (token, user) => {
    localStorage.setItem('auth_token', token)
    localStorage.setItem('auth_user', JSON.stringify(user))
    set(previous => ({ token, user, signedOut: false, sessionRevision: previous.sessionRevision + (
      previous.user && [previous.user.id, previous.user.role, previous.user.business_id, previous.user.employer_id].join(':') !==
        [user.id, user.role, user.business_id, user.employer_id].join(':') ? 1 : 0
    ) }))
  },
  startSession: (accessToken, refreshToken) => {
    localStorage.removeItem('auth_user')
    localStorage.setItem('auth_token', accessToken)
    if (refreshToken) localStorage.setItem('auth_refresh_token', refreshToken)
    else localStorage.removeItem('auth_refresh_token')
    set(previous => ({ token: accessToken, user: null, signedOut: false, sessionRevision: previous.sessionRevision + 1 }))
  },
  setToken: (token) => {
    localStorage.setItem('auth_token', token)
    set({ token })
  },
  logout: (byUser = false) => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_refresh_token')
    localStorage.removeItem('auth_user')
    set(previous => ({ token: null, user: null, signedOut: byUser, sessionRevision: previous.sessionRevision + 1 }))
  },
}))

// HTTP can finish before the other tab's storage event reaches us.
export function synchronizeStoredSession() {
  if (typeof window === 'undefined') return
  const token = localStorage.getItem('auth_token')
  const user = token ? savedUser() : null
  const current = useAuthStore.getState()
  if (current.token === token && JSON.stringify(current.user) === JSON.stringify(user)) return
  useAuthStore.setState(previous => ({ token, user, sessionRevision: previous.sessionRevision + (
    previous.user?.id !== user?.id || previous.user?.business_id !== user?.business_id ||
    previous.user?.employer_id !== user?.employer_id || previous.user?.role !== user?.role ||
    (token !== previous.token && (!user || !previous.user)) ? 1 : 0
  ) }))
}

// Other tabs share localStorage: follow their logout, login or token refresh.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== null && event.key !== 'auth_token' && event.key !== 'auth_user') return
    synchronizeStoredSession()
  })
}
