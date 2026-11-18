import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const key = 'visitor_session'
const session = { token: 'visitor-token', expiresAt: new Date(Date.now() + 86_400_000).toISOString() }

beforeEach(() => {
  vi.resetModules()
  localStorage.clear()
  sessionStorage.clear()
})
afterEach(() => vi.restoreAllMocks())

it('keeps the visitor credential in this tab only and removes it on logout', async () => {
  const { useVisitorSession } = await import('../store/visitorSession')
  useVisitorSession.getState().start(session.token, session.expiresAt)
  expect(JSON.parse(sessionStorage.getItem(key)!)).toEqual(session)
  expect(localStorage.getItem(key)).toBeNull()
  useVisitorSession.getState().end()
  expect(sessionStorage.getItem(key)).toBeNull()
})

it('restores a valid session when the same tab reloads', async () => {
  sessionStorage.setItem(key, JSON.stringify(session))
  const { useVisitorSession, visitorToken } = await import('../store/visitorSession')
  expect(useVisitorSession.getState().session).toEqual(session)
  expect(visitorToken()).toBe(session.token)
})

it('discards the old shared credential without importing it into a new tab', async () => {
  localStorage.setItem(key, JSON.stringify(session))
  const { useVisitorSession } = await import('../store/visitorSession')
  expect(useVisitorSession.getState().session).toBeNull()
  expect(localStorage.getItem(key)).toBeNull()
  expect(sessionStorage.getItem(key)).toBeNull()
})

it.each(['broken-json', '{}', JSON.stringify({ ...session, expiresAt: 'invalid' }),
  JSON.stringify({ ...session, expiresAt: '2000-01-01T00:00:00Z' })])('discards unusable tab storage (%s)', async value => {
  sessionStorage.setItem(key, value)
  const { useVisitorSession } = await import('../store/visitorSession')
  expect(useVisitorSession.getState().session).toBeNull()
  expect(sessionStorage.getItem(key)).toBeNull()
})

it('keeps an in-memory session when tab storage is blocked without persisting elsewhere', async () => {
  const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage) {
    if (this === sessionStorage) throw new DOMException('Blocked', 'SecurityError')
  })
  const { useVisitorSession, visitorToken } = await import('../store/visitorSession')
  useVisitorSession.getState().start(session.token, session.expiresAt)
  expect(visitorToken()).toBe(session.token)
  expect(setItem.mock.instances).not.toContain(localStorage)
  expect(localStorage.getItem(key)).toBeNull()
  useVisitorSession.getState().end()
  expect(visitorToken()).toBeNull()
})

it('ignores another tab changing or clearing its local storage', async () => {
  const { useVisitorSession } = await import('../store/visitorSession')
  useVisitorSession.getState().start(session.token, session.expiresAt)
  localStorage.setItem(key, JSON.stringify({ ...session, token: 'someone-else' }))
  window.dispatchEvent(new StorageEvent('storage', { key, storageArea: localStorage }))
  expect(useVisitorSession.getState().session).toEqual(session)
  localStorage.clear()
  window.dispatchEvent(new StorageEvent('storage', { key: null, storageArea: localStorage }))
  expect(useVisitorSession.getState().session).toEqual(session)
})

it('expires the in-memory session and its stored credential together', async () => {
  const { useVisitorSession, visitorToken } = await import('../store/visitorSession')
  useVisitorSession.getState().start(session.token, '2000-01-01T00:00:00Z')
  expect(visitorToken()).toBeNull()
  expect(useVisitorSession.getState().session).toBeNull()
  expect(sessionStorage.getItem(key)).toBeNull()
})
