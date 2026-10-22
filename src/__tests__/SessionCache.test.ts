import { QueryClient } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { bindSessionCache } from '../api/sessionCache'
import { useAuthStore } from '../store/authStore'
import { resetStores } from '../test/render'

const owner = { id: 1, role: 'business_owner', full_name: 'Owner', business_id: 10, employer_id: null }
let client: QueryClient
let unbind: () => void

beforeEach(() => {
  resetStores()
  useAuthStore.getState().setAuth('owner-token', owner)
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  unbind = bindSessionCache(client)
  client.setQueryData(['clients'], [{ full_name: 'Private salon client' }])
  client.setQueryData(['subscriptions', 'access'], { crm_mode: 'full' })
})

afterEach(() => { unbind(); client.clear(); resetStores() })

it('removes cached data and mutation results immediately on logout', () => {
  client.getMutationCache().build(client, {}, {
    data: { private: 'result' }, error: null, failureCount: 0, failureReason: null,
    isPaused: false, status: 'success', variables: undefined, submittedAt: Date.now(), context: undefined,
  })
  useAuthStore.getState().logout()
  expect(client.getQueryCache().getAll()).toHaveLength(0)
  expect(client.getMutationCache().getAll()).toHaveLength(0)
})

it('clears data before the new login loads its user', () => {
  useAuthStore.getState().startSession('new-user-token', 'new-refresh')
  expect(client.getQueryData(['clients'])).toBeUndefined()
})

it.each([
  { ...owner, id: 2 },
  { ...owner, business_id: 20 },
  { ...owner, role: 'employee', employer_id: 2 },
])('clears the previous identity or permission scope', (nextUser) => {
  useAuthStore.getState().setAuth('token', nextUser)
  expect(client.getQueryData(['clients'])).toBeUndefined()
})

it('keeps cached data on a same-session token refresh or name update', () => {
  useAuthStore.getState().setToken('refreshed')
  useAuthStore.getState().setAuth('refreshed', { ...owner, full_name: 'New name' })
  expect(client.getQueryData(['clients'])).toEqual([{ full_name: 'Private salon client' }])
})

it('follows logout in another tab before its next render', () => {
  localStorage.clear()
  window.dispatchEvent(new StorageEvent('storage', { key: null, storageArea: localStorage }))
  expect(client.getQueryData(['clients'])).toBeUndefined()
})

it('does not let an old response repopulate the cache after login changes', async () => {
  let finish!: (value: string) => void
  const response = client.fetchQuery({ queryKey: ['private-pending'], queryFn: () =>
    new Promise<string>(resolve => { finish = resolve }) }).catch(() => undefined)
  useAuthStore.getState().startSession('new-user-token')
  finish('Previous salon secret')
  await response
  expect(client.getQueryData(['private-pending'])).toBeUndefined()
})
