import axios, { type InternalAxiosRequestConfig } from 'axios'
import type { QueryClient } from '@tanstack/react-query'
import { API_BASE_URL } from './baseUrl'
import { useLocaleStore } from '../store/localeStore'
import { useVisitorSession, visitorToken } from '../store/visitorSession'

// Visitor cabinet API. Never sends the CRM's Authorization header: the visitor's own session
// goes into X-Visitor-Token, and a CRM login in the same browser stays untouched.
const visitorApi = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

const TOKEN_HEADER = 'X-Visitor-Token'
const PUBLIC_AUTH = /^\/?visitor\/auth\/(login|register\/|password\/|google\/(login|nonce|config))/

visitorApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.headers.delete('Authorization')
  // Sign-in endpoints take no session: a wrong password while re-authenticating must not
  // be read as "this session is dead" and sign the visitor out.
  const token = PUBLIC_AUTH.test(config.url || '') ? null : visitorToken()
  // an explicit token (signing out an old session) wins over the current one
  if (token && !config.headers.has(TOKEN_HEADER)) config.headers.set(TOKEN_HEADER, token)
  config.headers.set('Accept-Language', useLocaleStore.getState().locale || 'en')
  return config
})

visitorApi.interceptors.response.use(undefined, error => {
  // 401 with the token we still hold = the session is over (expired, logged out elsewhere).
  // A wrong password on the login form sends no token and is left to the form.
  const sent = error?.config?.headers?.[TOKEN_HEADER] ?? error?.config?.headers?.get?.(TOKEN_HEADER)
  const current = useVisitorSession.getState().session?.token
  if (error?.response?.status === 401 && sent && sent === current) useVisitorSession.getState().end()
  throw error
})

// Visitor data lives under ['visitor', ...]. It is private (the API sends no-store), so it
// is dropped as soon as the visitor session changes - and only it, the CRM cache stays.
export const visitorKey = (...parts: unknown[]) => ['visitor', ...parts] as const

export function bindVisitorCache(client: QueryClient) {
  return useVisitorSession.subscribe((next, previous) => {
    if (next.session?.token !== previous.session?.token) client.removeQueries({ queryKey: ['visitor'] })
  })
}

export default visitorApi
