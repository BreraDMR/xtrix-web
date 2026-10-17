import axios from 'axios'
import { useAuthStore } from '../store/authStore'
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

api.interceptors.request.use((config) => {
  let token = useAuthStore.getState().token
  if (!token && typeof window !== 'undefined') {
    token = localStorage.getItem('auth_token')
    if (token) {
      const userStr = localStorage.getItem('auth_user')
      let user = null
      try {
        user = userStr ? JSON.parse(userStr) : null
      } catch {}
      if (user) {
        useAuthStore.getState().setAuth(token, user)
      } else {
        useAuthStore.setState({ token })
      }
    }
  }
  
  const locale = useLocaleStore.getState().locale || navigator.language.split('-')[0] || 'en'
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  config.headers['Accept-Language'] = locale
  
  if (import.meta.env.DEV) {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, { 
      hasToken: !!token,
      tokenSource: token ? (useAuthStore.getState().token ? 'store' : 'localStorage') : 'none'
    })
  }
  
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const storeToken = useAuthStore.getState().token
      const localStorageToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
      
      console.error('[API] 401 Unauthorized error:', {
        url: error.config?.url,
        method: error.config?.method,
        hasStoreToken: !!storeToken,
        hasLocalStorageToken: !!localStorageToken,
        tokenInHeaders: !!error.config?.headers?.Authorization
      })
      
      try {
        const logs = JSON.parse(localStorage.getItem('app_logs') || '[]')
        logs.push(`[${new Date().toISOString()}] [API] 401 error on ${error.config?.method?.toUpperCase()} ${error.config?.url} - storeToken: ${!!storeToken}, localStorageToken: ${!!localStorageToken}`)
        if (logs.length > 100) logs.shift()
        localStorage.setItem('app_logs', JSON.stringify(logs))
      } catch {}
      
      if (!localStorageToken) {
        console.log('[API] No token in localStorage, logging out')
        useAuthStore.getState().logout()
      } else {
        console.log('[API] Token exists in localStorage, trying to sync with store')
        const userStr = localStorage.getItem('auth_user')
        let user = null
        try {
          user = userStr ? JSON.parse(userStr) : null
        } catch {}
        if (user) {
          useAuthStore.getState().setAuth(localStorageToken, user)
        } else {
          useAuthStore.setState({ token: localStorageToken })
        }
        return Promise.reject(error)
      }
      
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api


