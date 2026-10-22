import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios'
import type api from '../api/client'
import type { ClientPage } from '../api/types'
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

export function signIn(user: { id: number; role: string; full_name?: string; business_id?: number | null; employer_id?: number | null }) {
  useAuthStore.setState({ token: 'test-token', user: { full_name: 'Test User', ...user } })
}

export function resetStores() {
  useAuthStore.setState({ token: null, user: null, signedOut: false })
  useLocaleStore.setState({ locale: 'en' })
  localStorage.clear()
}

// an error the way the API sends it: { error: { message, status_code, detail? } }
export function apiError(status: number, message: string, detail?: unknown,
  { headers = {}, type }: { headers?: Record<string, string>; type?: string } = {}) {
  const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig
  return new AxiosError(message, String(status), config, null, {
    status,
    statusText: '',
    headers,
    config,
    data: { error: { message, status_code: status, ...(detail ? { detail } : {}), ...(type ? { type } : {}) } },
  })
}

// api.get mock that answers by URL; anything not listed is a 404
// typed as api.get so it drops straight into vi.mocked(api.get).mockImplementation()
export function routes(table: Record<string, unknown>) {
  // Most component tests exercise an active legacy workspace. Pilot tests override
  // this route explicitly to cover expiry and fail-closed behavior.
  const defaults = {
    '/offers': { offers: [], version: 'test', pilot_mode: false, email_available: true, checkout_available: true, registration_requires_invitation: false },
    '/auth/google/config': { enabled: false, client_id: null },
    '/subscriptions/access': { crm_mode: 'full', trial_end: null, read_only_until: null,
      can_export: true, can_use_ai: true, can_manage_billing: true,
      checkout_available: true, pilot_mode: false, reason: null },
    ...table,
  }
  return ((url: string, config) => {
    if (!(url in defaults)) return Promise.reject(apiError(404, `no mock for ${url}`))
    let data: unknown = defaults[url as keyof typeof defaults]
    if ((url === '/clients/' || url === '/visits/') && Array.isArray(data)) {
      const params = config?.params as Partial<Pick<ClientPage, 'page' | 'per_page'>> | undefined
      const page = params?.page ?? 1
      const per_page = params?.per_page ?? 20
      data = { items: data.slice((page - 1) * per_page, page * per_page),
        total: data.length, page, per_page, pages: Math.ceil(data.length / per_page) }
    }
    return Promise.resolve({ data })
  }) as typeof api.get
}
