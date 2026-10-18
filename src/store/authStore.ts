import { create } from 'zustand'

export type SessionUser = { id: number; full_name: string; role: string; employer_id?: number | null; business_id?: number | null }

interface AuthState {
  token: string | null
  user: SessionUser | null
  setAuth: (token: string, user: SessionUser) => void
  // fresh tokens from login/signup; the user is loaded right after from /users/me
  startSession: (accessToken: string, refreshToken?: string | null) => void
  setToken: (token: string) => void
  logout: () => void
}

function savedUser(): SessionUser | null {
  try {
    const userStr = localStorage.getItem('auth_user')
    return userStr ? JSON.parse(userStr) : null
  } catch {
    return null
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null,
  user: typeof window !== 'undefined' ? savedUser() : null,
  setAuth: (token, user) => {
    localStorage.setItem('auth_token', token)
    localStorage.setItem('auth_user', JSON.stringify(user))
    set({ token, user })
  },
  startSession: (accessToken, refreshToken) => {
    localStorage.removeItem('auth_user')
    localStorage.setItem('auth_token', accessToken)
    if (refreshToken) localStorage.setItem('auth_refresh_token', refreshToken)
    else localStorage.removeItem('auth_refresh_token')
    set({ token: accessToken, user: null })
  },
  setToken: (token) => {
    localStorage.setItem('auth_token', token)
    set({ token })
  },
  logout: () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_refresh_token')
    localStorage.removeItem('auth_user')
    set({ token: null, user: null })
  },
}))

// Other tabs share localStorage: follow their logout, login or token refresh,
// otherwise this tab keeps working on a session that is already gone.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== null && event.key !== 'auth_token' && event.key !== 'auth_user') return
    const token = localStorage.getItem('auth_token')
    useAuthStore.setState({ token, user: token ? savedUser() : null })
  })
}
