import { QueryClient } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it } from 'vitest'
import visitorApi, { bindVisitorCache, visitorKey } from '../api/visitorClient'
import { bindSessionCache } from '../api/sessionCache'
import { useAuthStore } from '../store/authStore'
import { useVisitorSession } from '../store/visitorSession'
import { resetStores } from '../test/render'
import { error, header, mockVisitorApi, resetVisitor, signInVisitor } from '../test/visitor'

const owner = { id: 1, role: 'business_owner', full_name: 'Owner', business_id: 10, employer_id: null }
let client: QueryClient
let unbindVisitor: () => void
let unbindCrm: () => void

beforeEach(() => {
  resetStores()
  resetVisitor()
  useAuthStore.getState().setAuth('crm-token', owner)
  signInVisitor('first-visitor')
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  unbindVisitor = bindVisitorCache(client)
  unbindCrm = bindSessionCache(client)
  client.setQueryData(['clients'], ['CRM data'])
  client.setQueryData(visitorKey('visits'), ['First visitor data'])
})

afterEach(() => { unbindVisitor(); unbindCrm(); client.clear(); resetStores(); resetVisitor() })

it('clears only visitor queries on visitor logout and account switch', () => {
  signInVisitor('second-visitor')
  expect(client.getQueryData(visitorKey('visits'))).toBeUndefined()
  expect(client.getQueryData(['clients'])).toEqual(['CRM data'])
  client.setQueryData(visitorKey('visits'), ['Second visitor data'])
  useVisitorSession.getState().end()
  expect(client.getQueryData(visitorKey('visits'))).toBeUndefined()
  expect(useAuthStore.getState().token).toBe('crm-token')
})

it('preserves the visitor session and its cache when the CRM account changes or signs out', () => {
  useAuthStore.getState().setAuth('other-crm', { ...owner, id: 2, business_id: 20 })
  expect(client.getQueryData(['clients'])).toBeUndefined()
  expect(client.getQueryData(visitorKey('visits'))).toEqual(['First visitor data'])
  useAuthStore.getState().logout()
  expect(client.getQueryData(visitorKey('visits'))).toEqual(['First visitor data'])
  expect(useVisitorSession.getState().session?.token).toBe('first-visitor')
})

it('cancels pending visitor queries before a new visitor can read their responses', async () => {
  let finish!: (value: string) => void
  const response = client.fetchQuery({
    queryKey: visitorKey('pending'),
    queryFn: () => new Promise<string>(resolve => { finish = resolve }),
  }).catch(() => undefined)
  signInVisitor('second-visitor')
  finish('First visitor secret')
  await response
  expect(client.getQueryData(visitorKey('pending'))).toBeUndefined()
  expect(client.getQueryData(['clients'])).toEqual(['CRM data'])
})

it('handles an expired visitor token once without CRM refresh or retry', async () => {
  const { calls } = mockVisitorApi({ 'GET /visitor/me': error(401, 'Expired visitor session') })
  await expect(visitorApi.get('/visitor/me', { headers: { Authorization: 'Bearer crm-token' } })).rejects.toThrow()
  expect(calls).toHaveLength(1)
  expect(header(calls[0], 'Authorization')).toBeFalsy()
  expect(header(calls[0], 'X-Visitor-Token')).toBe('first-visitor')
  expect(useVisitorSession.getState().session).toBeNull()
  expect(useAuthStore.getState().token).toBe('crm-token')
  expect(client.getQueryData(visitorKey('visits'))).toBeUndefined()
})

it('keeps the current visitor session after a wrong reauthentication password', async () => {
  const { calls } = mockVisitorApi({ 'POST /visitor/auth/login': error(401, 'Invalid credentials') })
  await expect(visitorApi.post('/visitor/auth/login', { email: 'jana@example.com', password: 'wrong' })).rejects.toThrow()
  expect(header(calls[0], 'X-Visitor-Token')).toBeFalsy()
  expect(useVisitorSession.getState().session?.token).toBe('first-visitor')
  expect(client.getQueryData(visitorKey('visits'))).toEqual(['First visitor data'])
})

it('does not let a delayed rejection of an old token end the replacement session', async () => {
  let finish!: (reply: ReturnType<typeof error>) => void
  mockVisitorApi({ 'GET /visitor/me': () => new Promise(resolve => { finish = resolve }) })
  const response = visitorApi.get('/visitor/me').catch(() => undefined)
  // Wait for the asynchronous request interceptor and adapter to run.
  await new Promise(resolve => setTimeout(resolve, 0))
  signInVisitor('second-visitor')
  finish(error(401, 'Old session expired'))
  await response
  expect(useVisitorSession.getState().session?.token).toBe('second-visitor')
  expect(useAuthStore.getState().token).toBe('crm-token')
})
