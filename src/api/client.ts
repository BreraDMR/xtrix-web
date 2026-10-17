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
  
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const localStorageToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
      
      if (!localStorageToken) {
        useAuthStore.getState().logout()
      } else {
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


