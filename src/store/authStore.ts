import { create } from 'zustand'

interface AuthState {
  token: string | null
  user: { id: number; full_name: string; role: string; employer_id?: number | null; business_id?: number | null } | null
  setAuth: (token: string, user: any) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null,
  user: typeof window !== 'undefined' ? (() => {
    try {
      const userStr = localStorage.getItem('auth_user')
      return userStr ? JSON.parse(userStr) : null
    } catch {
      return null
    }
  })() : null,
  setAuth: (token, user) => {
    console.log('[AuthStore] Setting auth:', { hasToken: !!token, user })
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_user', JSON.stringify(user))
      console.log('[AuthStore] Saved to localStorage')
    }
    // Синхронно обновляем состояние
    set({ token, user })
    
    // Проверяем, что обновление произошло
    const updatedState = get()
    console.log('[AuthStore] State updated:', { 
      hasToken: !!updatedState.token,
      tokenLength: updatedState.token?.length 
    })
  },
  logout: () => {
    console.log('[AuthStore] Logging out')
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    }
    set({ token: null, user: null })
  },
}))

