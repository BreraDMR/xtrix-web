import { act, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { VisitorLogin, VisitorSignup } from '../pages/visitor/VisitorAuth'
import { loadGoogleIdentity, type GoogleIdentity } from '../utils/googleIdentity'
import { useAuthStore } from '../store/authStore'
import { useVisitorSession } from '../store/visitorSession'
import { header, mockVisitorApi, renderVisitor, resetVisitor } from '../test/visitor'
import { resetStores } from '../test/render'

vi.mock('../utils/googleIdentity', () => ({ loadGoogleIdentity: vi.fn() }))

let callback: (answer: { credential: string }) => void
const identity = { initialize: vi.fn<GoogleIdentity['initialize']>(), renderButton: vi.fn(), cancel: vi.fn() }
const session = { session_token: 'google-visitor', expires_at: new Date(Date.now() + 86_400_000).toISOString() }

beforeEach(() => {
  vi.clearAllMocks()
  resetStores()
  resetVisitor()
  identity.initialize.mockImplementation(options => { callback = options.callback })
  vi.mocked(loadGoogleIdentity).mockResolvedValue(identity)
})

it.each([
  ['/visitor/login', <VisitorLogin />],
  ['/visitor/signup', <VisitorSignup />],
] as const)('offers independent Google access at %s without creating a CRM session', async (path, page) => {
  useAuthStore.getState().setAuth('crm-token', { id: 1, role: 'business_owner', full_name: 'Owner', business_id: 1, employer_id: null })
  const { calls } = mockVisitorApi({
    'GET /visitor/auth/google/config': { status: 200, data: { enabled: true, client_id: 'visitor.apps.googleusercontent.com' } },
    'POST /visitor/auth/google/nonce': { status: 200, data: { nonce: 'visitor-nonce', expires_in: 600 } },
    'POST /visitor/auth/google/login': { status: 200, data: session },
  })
  renderVisitor({ [path]: page }, path)
  await waitFor(() => expect(identity.renderButton).toHaveBeenCalled())
  expect(identity.initialize).toHaveBeenCalledWith(expect.objectContaining({
    client_id: 'visitor.apps.googleusercontent.com', nonce: 'visitor-nonce', auto_select: false,
  }))
  await act(async () => callback({ credential: 'google-credential' }))
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/visitor/visits'))
  const login = calls.find(call => call.url === '/visitor/auth/google/login')!
  expect(JSON.parse(String(login.data))).toEqual({ credential: 'google-credential', nonce: 'visitor-nonce' })
  expect(calls.every(call => call.url?.startsWith('/visitor/'))).toBe(true)
  expect(calls.every(call => !header(call, 'Authorization') && !header(call, 'X-Visitor-Token'))).toBe(true)
  expect(useVisitorSession.getState().session?.token).toBe('google-visitor')
  expect(useAuthStore.getState().token).toBe('crm-token')
})
