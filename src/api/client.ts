import axios from 'axios'
import { useAuthStore } from '../store/authStore'

// КРИТИЧЕСКИ ВАЖНО: Используем HTTPS по умолчанию для Railway
// Production URL для Railway (ВСЕГДА HTTPS)
const RAILWAY_PROD_URL = 'https://xtrix-production.up.railway.app'

// Use environment variable for API URL
// Fallback: Railway prod (если деплой на Vercel) или /api (локальная разработка)
let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
                   (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app') 
                     ? RAILWAY_PROD_URL 
                     : '/api')

// Дополнительная защита: принудительно меняем HTTP на HTTPS для Railway
if (API_BASE_URL.includes('railway.app') && API_BASE_URL.startsWith('http:')) {
  API_BASE_URL = API_BASE_URL.replace(/^http:/, 'https:')
  console.warn('[API Client] ⚠️ Fixed HTTP to HTTPS:', API_BASE_URL)
}

console.log('[API Client] 🌐 Using API:', API_BASE_URL)

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  // ВАЖНО: FastAPI routing - добавляем trailing slash ТОЛЬКО для collection endpoints
  if (config.url && !config.url.includes('?')) {
    // НЕ добавляем trailing slash для этих эндпоинтов (они возвращают 307 с /)
    const skipTrailingSlash = ['/login', '/register', '/2fa', '/me', '/revenue', '/metrics'].some(path => 
      config.url?.includes(path)
    )
    
    // Добавляем trailing slash ТОЛЬКО для collection endpoints (clients, services, visits)
    const needsTrailingSlash = ['/clients', '/services', '/visits', '/calendar'].some(path =>
      config.url?.includes(path) && !config.url?.match(/\/\d+$/)
    )
    
    if (!skipTrailingSlash && needsTrailingSlash && !config.url.endsWith('/')) {
      config.url = config.url + '/'
      console.log('[API Client] 📌 Added trailing slash:', config.url)
    }
  }
  
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
  
  const locale = navigator.language.split('-')[0] || 'en'
  
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







