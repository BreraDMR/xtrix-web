import axios, { isAxiosError, type InternalAxiosRequestConfig } from 'axios'
import { synchronizeStoredSession, useAuthStore } from '../store/authStore'
import { useLocaleStore } from '../store/localeStore'

// The API address comes from VITE_API_URL only. In dev it may be left out, then /api goes
// through the Vite proxy to localhost:8000 (vite.config.ts); a production build requires it.
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

type SessionRequest = InternalAxiosRequestConfig & { sessionRetried?: boolean; sessionRevision?: number }

api.interceptors.request.use((config: SessionRequest) => {
  const startedRevision = useAuthStore.getState().sessionRevision
  synchronizeStoredSession()
  const { token, sessionRevision } = useAuthStore.getState()
  if (startedRevision !== sessionRevision || (config.sessionRevision !== undefined && config.sessionRevision !== sessionRevision)) throw new Error('Session changed')
  config.sessionRevision = sessionRevision
  const locale = useLocaleStore.getState().locale || navigator.language.split('-')[0] || 'en'

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  config.headers['Accept-Language'] = locale

  return config
}, error => { throw error }, { synchronous: true })

// Access tokens are short-lived. On a 401 we swap the refresh token for a new pair and
// repeat the request once. Parallel 401s share one refresh call: the server revokes the
// old refresh token on use, so a second call with it would end the session.
let refreshing: { revision: number; promise: Promise<string> } | null = null

function refreshSession(): Promise<string> {
  const revision = useAuthStore.getState().sessionRevision
  if (!refreshing || refreshing.revision !== revision) {
    const pending = { revision, promise: rotateTokens().finally(() => {
      if (refreshing === pending) refreshing = null
    }) }
    refreshing = pending
  }
  return refreshing.promise
}

async function rotateTokens(): Promise<string> {
  const store = useAuthStore.getState()
  const refreshToken = localStorage.getItem('auth_refresh_token')
  if (!refreshToken) {
    store.logout()
    throw new Error('Session expired')
  }
  try {
    const { data } = await api.post('/users/refresh', { refresh_token: refreshToken })
    if (!data?.access_token || !data?.refresh_token) throw new Error('Invalid token response')
    // logged out (or in as someone else) while this was in flight - don't bring it back
    if (useAuthStore.getState().sessionRevision !== store.sessionRevision || localStorage.getItem('auth_refresh_token') !== refreshToken) throw new Error('Session changed')
    localStorage.setItem('auth_refresh_token', data.refresh_token)
    store.setToken(data.access_token)
    return data.access_token
  } catch (error) {
    synchronizeStoredSession()
    if (useAuthStore.getState().sessionRevision !== store.sessionRevision) throw error
    // another tab may have rotated the same refresh token a moment earlier
    const latestRefresh = localStorage.getItem('auth_refresh_token')
    const latestAccess = localStorage.getItem('auth_token')
    if (latestRefresh && latestRefresh !== refreshToken && latestAccess) {
      store.setToken(latestAccess)
      return latestAccess
    }
    // 429, 5xx or no network: the session may still be fine, try again on the next request
    const status = isAxiosError(error) ? error.response?.status : undefined
    if (status === 401 || status === 403 || !isAxiosError(error)) store.logout()
    throw error
  }
}

const AUTH_ENDPOINT = /^\/?users\/(login|refresh|logout)\/?$/

api.interceptors.response.use(
  response => {
    synchronizeStoredSession()
    const config = response.config as SessionRequest
    if (config.sessionRevision !== useAuthStore.getState().sessionRevision) throw new Error('Session changed')
    return response
  },
  async error => {
    synchronizeStoredSession()
    const config = error.config as SessionRequest | undefined
    const sentAuth = config?.headers?.Authorization
    if (error.response?.status !== 401 || !config || !sentAuth || AUTH_ENDPOINT.test(config.url || '')) throw error
    if (config.sessionRevision !== useAuthStore.getState().sessionRevision) throw error
    if (config.sessionRetried) {
      // a token we just got is refused too, so the session is over (deactivated, logout-all...)
      useAuthStore.getState().logout()
      throw error
    }
    config.sessionRetried = true
    const current = useAuthStore.getState().token
    // a slow request can come back with a token that has already been replaced
    if (!current || sentAuth === `Bearer ${current}`) await refreshSession()
    return api(config)
  }
)

// Logout button: tell the server to revoke our refresh token, but don't make the user wait
// for it (or get stuck if it fails) - the local session is cleared right away.
export function signOut() {
  const token = useAuthStore.getState().token
  const refreshToken = localStorage.getItem('auth_refresh_token')
  useAuthStore.getState().logout(true)
  if (!refreshToken) return
  api.post('/users/logout', { refresh_token: refreshToken }, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  }).catch(() => {})
}

export default api
