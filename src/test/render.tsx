import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../store/authStore'
import { useLocaleStore } from '../store/localeStore'

export function renderWithProviders(ui: ReactElement, { router = true } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const result = render(
    <QueryClientProvider client={queryClient}>
      {router ? <MemoryRouter>{ui}</MemoryRouter> : ui}
    </QueryClientProvider>
  )
  return { queryClient, ...result }
}

export function signIn(user: { id: number; role: string; full_name?: string; business_id?: number | null }) {
  useAuthStore.setState({ token: 'test-token', user: { full_name: 'Test User', ...user } })
}

export function resetStores() {
  useAuthStore.setState({ token: null, user: null })
  useLocaleStore.setState({ locale: 'en' })
  localStorage.clear()
}

// an error the way the API sends it: { error: { message, status_code, detail? } }
export function apiError(status: number, message: string, detail?: unknown) {
  const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig
  return new AxiosError(message, String(status), config, null, {
    status,
    statusText: '',
    headers: {},
    config,
    data: { error: { message, status_code: status, ...(detail ? { detail } : {}) } },
  })
}

// api.get mock that answers by URL; anything not listed is a 404
export function routes(table: Record<string, unknown>) {
  return (url: string) =>
    url in table ? Promise.resolve({ data: table[url] }) : Promise.reject(apiError(404, `no mock for ${url}`))
}
