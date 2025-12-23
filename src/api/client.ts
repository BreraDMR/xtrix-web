import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import { useLocaleStore } from '../store/localeStore'

// Use environment variable for API URL, fallback to /api for dev proxy
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  // Сначала проверяем store, затем localStorage для надежности
  let token = useAuthStore.getState().token
  if (!token && typeof window !== 'undefined') {
    token = localStorage.getItem('auth_token')
    // Если токен найден в localStorage, обновляем store
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
  
  // Get locale from store (falls back to browser language if store not initialized)
  const locale = useLocaleStore.getState().locale || navigator.language.split('-')[0] || 'en'
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  config.headers['Accept-Language'] = locale
  
  // Логируем запросы для отладки
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
      
      // Логируем перед logout
      try {
        const logs = JSON.parse(localStorage.getItem('app_logs') || '[]')
        logs.push(`[${new Date().toISOString()}] [API] 401 error on ${error.config?.method?.toUpperCase()} ${error.config?.url} - storeToken: ${!!storeToken}, localStorageToken: ${!!localStorageToken}`)
        if (logs.length > 100) logs.shift()
        localStorage.setItem('app_logs', JSON.stringify(logs))
      } catch {}
      
      // Не делаем logout, если токен есть в localStorage - возможно это временная проблема синхронизации
      // Вместо этого просто редиректим, но не очищаем токен
      if (!localStorageToken) {
        console.log('[API] No token in localStorage, logging out')
        useAuthStore.getState().logout()
      } else {
        console.log('[API] Token exists in localStorage, trying to sync with store')
        // Пытаемся синхронизировать store
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
        // Не редиректим, если токен есть - возможно это был временный сбой
        return Promise.reject(error)
      }
      
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api







