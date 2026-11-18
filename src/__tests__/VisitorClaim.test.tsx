import { afterEach, beforeEach, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import VisitorClaim from '../pages/visitor/VisitorClaim'
import VisitorVisits from '../pages/visitor/VisitorVisits'
import SaveToCabinet from '../components/visitor/SaveToCabinet'
import { pendingClaim } from '../components/visitor/links'
import { renderWithProviders, resetStores } from '../test/render'
import { error, mockVisitorApi, renderVisitor, resetVisitor, signInVisitor } from '../test/visitor'
import { useVisitorSession } from '../store/visitorSession'

const emptyFeed = { 'GET /visitor/visits': { status: 200, data: { entries: [], next_cursor: null } } }
const claimPage = (hash: string) => {
  window.history.replaceState(null, '', `/visitor/claim${hash}`)
  window.location.hash = hash
  return renderVisitor({ '/visitor/claim': <VisitorClaim />, '/visitor/visits': <VisitorVisits /> }, '/visitor/claim')
}

beforeEach(() => { resetStores(); resetVisitor() })
afterEach(() => { window.location.hash = '' })

it('claims a booking with only its manage token and opens the feed', async () => {
  signInVisitor()
  const { calls } = mockVisitorApi({ ...emptyFeed, 'POST /visitor/claims/manage': { status: 204 } })
  claimPage('#token=manage-abc')
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/visitor/visits'))
  expect(await screen.findByText('The booking is saved to your account.')).toBeInTheDocument()
  const claim = calls.find(call => call.url === '/visitor/claims/manage')!
  expect(JSON.parse(String(claim.data))).toEqual({ token: 'manage-abc' })
  expect(window.location.hash).toBe('')
  expect(pendingClaim()).toBeNull()
})

it('keeps the link while the visitor signs in or signs up', async () => {
  const { calls } = mockVisitorApi({})
  claimPage('#invite=invite-1')
  expect(await screen.findByRole('heading', { name: 'Invitation from the salon' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/visitor/login?next=%2Fvisitor%2Fclaim')
  expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute('href', '/visitor/signup')
  expect(pendingClaim()).toEqual({ kind: 'invite', token: 'invite-1' })
  expect(calls).toHaveLength(0)
})

it('claims the saved link after signing in', async () => {
  const { calls } = mockVisitorApi({ ...emptyFeed, 'POST /visitor/claims/client-invite': { status: 204 } })
  claimPage('#invite=invite-1')
  await screen.findByRole('link', { name: 'Sign in' })
  signInVisitor()
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/visitor/visits'))
  expect(JSON.parse(String(calls.find(call => call.url === '/visitor/claims/client-invite')!.data))).toEqual({ token: 'invite-1' })
})

it('sends an already claimed booking to the feed with the message', async () => {
  signInVisitor()
  mockVisitorApi({ ...emptyFeed, 'POST /visitor/claims/manage': error(409, 'This booking is already in an account.') })
  claimPage('#token=manage-abc')
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/visitor/visits'))
  expect(await screen.findByText('This booking is already in an account.')).toBeInTheDocument()
})

it('retries an invitation once on a conflict before giving up', async () => {
  signInVisitor()
  let attempts = 0
  mockVisitorApi({ ...emptyFeed, 'POST /visitor/claims/client-invite': () => (++attempts === 1 ? error(409, 'Busy') : { status: 204 }) })
  claimPage('#invite=invite-1')
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/visitor/visits'))
  expect(attempts).toBe(2)
})

it('says when the link has expired', async () => {
  signInVisitor()
  mockVisitorApi({ 'POST /visitor/claims/manage': error(400, 'Invalid') })
  claimPage('#token=old')
  expect(await screen.findByText(/The link is no longer valid/)).toBeInTheDocument()
  expect(pendingClaim()).toBeNull()
})

it('asks to sign in again when the session has ended, keeping the link', async () => {
  signInVisitor()
  mockVisitorApi({ 'POST /visitor/claims/manage': error(401, 'Session expired') })
  claimPage('#token=manage-abc')
  expect(await screen.findByRole('link', { name: 'Sign in' })).toBeInTheDocument()
  expect(useVisitorSession.getState().session).toBeNull()
  expect(pendingClaim()).toEqual({ kind: 'manage', token: 'manage-abc' })
})

it('offers saving a guest booking with the token in the fragment only', () => {
  renderWithProviders(<SaveToCabinet manageToken="manage/abc" />)
  expect(screen.getByRole('link', { name: 'Save' })).toHaveAttribute('href', '/visitor/claim#token=manage%2Fabc')
})

it('does not resurrect a cleared claim from a legacy tab copy', async () => {
  signInVisitor()
  sessionStorage.setItem('visitor_claim_link', JSON.stringify({ kind: 'manage', token: 'forgotten' }))
  const { calls } = mockVisitorApi({})
  claimPage('')
  expect(await screen.findByRole('heading', { name: 'No link to save' })).toBeInTheDocument()
  expect(calls).toHaveLength(0)
  expect(sessionStorage.getItem('visitor_claim_link')).toBeNull()
})

it('expires the saved link even when the tab still has a copy', async () => {
  signInVisitor()
  const claim = { kind: 'manage', token: 'expired' }
  sessionStorage.setItem('visitor_claim_link', JSON.stringify(claim))
  localStorage.setItem('visitor_pending_claim', JSON.stringify({ ...claim, savedAt: Date.now() - 86_400_001 }))
  const { calls } = mockVisitorApi({})
  claimPage('')
  expect(await screen.findByRole('heading', { name: 'No link to save' })).toBeInTheDocument()
  expect(calls).toHaveLength(0)
  expect(pendingClaim()).toBeNull()
})

it('forgets the previous link when a malformed new link is opened', async () => {
  localStorage.setItem('visitor_pending_claim', JSON.stringify({ kind: 'manage', token: 'previous', savedAt: Date.now() }))
  const { calls } = mockVisitorApi({})
  claimPage('#token=')
  expect(await screen.findByRole('heading', { name: 'No link to save' })).toBeInTheDocument()
  expect(pendingClaim()).toBeNull()
  expect(calls).toHaveLength(0)
})

it.each(['', '   '])('ignores an empty stored credential (%j)', async token => {
  signInVisitor()
  localStorage.setItem('visitor_pending_claim', JSON.stringify({ kind: 'manage', token, savedAt: Date.now() }))
  const { calls } = mockVisitorApi({})
  claimPage('')
  expect(await screen.findByRole('heading', { name: 'No link to save' })).toBeInTheDocument()
  expect(calls).toHaveLength(0)
})
