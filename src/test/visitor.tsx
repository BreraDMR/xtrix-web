import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Where from './Where'
import { AxiosError, AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { vi } from 'vitest'
import visitorApi, { bindVisitorCache } from '../api/visitorClient'
import { useVisitorSession } from '../store/visitorSession'

export type Reply = { status: number; data?: unknown; headers?: Record<string, string> }
type Handler = (config: InternalAxiosRequestConfig) => Reply | Promise<Reply>

// Answers visitor API calls by "METHOD /path" so the real interceptors run on every request.
export function mockVisitorApi(table: Record<string, Reply | Handler>) {
  const calls: InternalAxiosRequestConfig[] = []
  const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => {
    calls.push(config)
    const path = (config.url ?? '').split('?')[0]
    const entry = table[`${(config.method ?? 'get').toUpperCase()} ${path}`]
    const reply: Reply = entry === undefined ? { status: 404, data: { error: { message: 'Not here', status_code: 404 } } }
      : typeof entry === 'function' ? await entry(config) : entry
    const response = { data: reply.data ?? '', status: reply.status, statusText: '', headers: reply.headers ?? {}, config } as AxiosResponse
    if (reply.status >= 400) throw new AxiosError('failed', String(reply.status), config, null, response)
    return response
  })
  visitorApi.defaults.adapter = adapter
  return { calls, adapter }
}

export const error = (status: number, message: string, detail?: unknown, headers?: Record<string, string>): Reply =>
  ({ status, data: { error: { message, status_code: status, ...(detail ? { detail } : {}) } }, headers })

export function signInVisitor(token = 'visitor-token') {
  useVisitorSession.getState().start(token, new Date(Date.now() + 86_400_000).toISOString())
}

export function resetVisitor() {
  useVisitorSession.getState().end()
  try { localStorage.clear(); sessionStorage.clear() } catch { /* jsdom */ }
}

export function header(config: InternalAxiosRequestConfig, name: string): unknown {
  return AxiosHeaders.from(config.headers as AxiosHeaders).get(name)
}

// Renders a visitor page at a path, with the routes the page can send the visitor to.
export function renderVisitor(routes: Record<string, ReactElement>, path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const unbind = bindVisitorCache(client)
  const result = render(<QueryClientProvider client={client}>
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        {Object.entries(routes).map(([route, element]) => <Route key={route} path={route} element={element} />)}
        <Route path="*" element={null} />
      </Routes>
      <Where />
    </MemoryRouter>
  </QueryClientProvider>)
  return { ...result, client, unbind }
}
