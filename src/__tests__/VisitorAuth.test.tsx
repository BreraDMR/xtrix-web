import { afterEach, beforeEach, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import visitorApi from '../api/visitorClient'
import { VisitorLogin, VisitorRegister, VisitorResetPassword, VisitorSignup } from '../pages/visitor/VisitorAuth'
import { resetStores } from '../test/render'
import { error, header, mockVisitorApi, renderVisitor, resetVisitor, signInVisitor } from '../test/visitor'
import { useAuthStore } from '../store/authStore'
import { useVisitorSession } from '../store/visitorSession'
import { savePendingClaim } from '../components/visitor/links'

const session = { session_token: 'fresh-visitor', expires_at: new Date(Date.now() + 86_400_000).toISOString() }
const noGoogle = { 'GET /visitor/auth/google/config': { status: 200, data: { enabled: false, client_id: null } } }

beforeEach(() => { resetStores(); resetVisitor() })
afterEach(() => { window.location.hash = '' })

it('sends only the visitor token and never the CRM authorization', async () => {
  useAuthStore.getState().setAuth('crm-token', { id: 1, role: 'business_owner', full_name: 'Owner', business_id: 1, employer_id: null })
  signInVisitor('visitor-1')
  const { calls } = mockVisitorApi({ 'GET /visitor/me': { status: 200, data: {} }, 'POST /visitor/auth/login': { status: 200, data: session } })
  await visitorApi.get('/visitor/me')
  await visitorApi.post('/visitor/auth/login', { email: 'a@b.cz', password: 'x' })
  expect(header(calls[0], 'X-Visitor-Token')).toBe('visitor-1')
  expect(header(calls[0], 'Authorization')).toBeFalsy()
  // signing in again must not put the current session at risk
  expect(header(calls[1], 'X-Visitor-Token')).toBeFalsy()
})

it('ends only the visitor session when its token is refused', async () => {
  useAuthStore.getState().setAuth('crm-token', { id: 1, role: 'business_owner', full_name: 'Owner', business_id: 1, employer_id: null })
  signInVisitor('visitor-1')
  mockVisitorApi({ 'GET /visitor/me': error(401, 'Session expired') })
  await expect(visitorApi.get('/visitor/me')).rejects.toThrow()
  expect(useVisitorSession.getState().session).toBeNull()
  expect(useAuthStore.getState().token).toBe('crm-token')
})

it('says only "check your inbox" after asking to sign up', async () => {
  mockVisitorApi({ 'POST /visitor/auth/register/request': { status: 202, data: { message: 'If the address can be used, we sent a link.' } } })
  renderVisitor({ '/visitor/signup': <VisitorSignup /> }, '/visitor/signup')
  await userEvent.type(screen.getByLabelText('Email'), 'jana@example.com')
  await userEvent.click(screen.getByRole('button', { name: 'Send the link' }))
  expect(await screen.findByRole('heading', { name: 'Check your inbox' })).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent("If jana@example.com can be used, we've sent a link there.")
})

it('shows when email sending is unavailable', async () => {
  mockVisitorApi({ 'POST /visitor/auth/password/reset/request': error(503, 'Email sending is not available right now.') })
  renderVisitor({ '/visitor/forgot-password': <VisitorSignup /> }, '/visitor/forgot-password')
  mockVisitorApi({ 'POST /visitor/auth/register/request': error(503, 'Email sending is not available right now.') })
  await userEvent.type(screen.getByLabelText('Email'), 'jana@example.com')
  await userEvent.click(screen.getByRole('button', { name: 'Send the link' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Email sending is not available right now.')
})

it('reads the registration token from the fragment, clears the URL and signs in', async () => {
  window.location.hash = '#token=reg-123'
  const { calls } = mockVisitorApi({ 'POST /visitor/auth/register/complete': { status: 201, data: session } })
  renderVisitor({ '/visitor/register': <VisitorRegister /> }, '/visitor/register')
  await waitFor(() => expect(window.location.hash).toBe(''))
  await userEvent.type(screen.getByLabelText('New password'), 'Str0ng-pass')
  await userEvent.type(screen.getByLabelText('Repeat the password'), 'Str0ng-pass')
  await userEvent.click(screen.getByRole('button', { name: 'Create the account' }))
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/visitor/visits'))
  expect(JSON.parse(String(calls[0].data))).toEqual({ token: 'reg-123', new_password: 'Str0ng-pass' })
  expect(useVisitorSession.getState().session?.token).toBe('fresh-visitor')
})

it('returns to a saved booking link after finishing sign-up', async () => {
  savePendingClaim({ kind: 'manage', token: 'manage-1' })
  window.location.hash = '#token=reg-123'
  mockVisitorApi({ 'POST /visitor/auth/register/complete': { status: 201, data: session } })
  renderVisitor({ '/visitor/register': <VisitorRegister /> }, '/visitor/register')
  await userEvent.type(await screen.findByLabelText('New password'), 'Str0ng-pass')
  await userEvent.type(screen.getByLabelText('Repeat the password'), 'Str0ng-pass')
  await userEvent.click(screen.getByRole('button', { name: 'Create the account' }))
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/visitor/claim'))
})

it.each([
  [400, 'The link is no longer valid'],
  [409, 'Account not created'],
])('handles %s on finishing sign-up', async (status, title) => {
  window.location.hash = '#token=reg-123'
  mockVisitorApi({ 'POST /visitor/auth/register/complete': error(status, 'Server says no') })
  renderVisitor({ '/visitor/register': <VisitorRegister /> }, '/visitor/register')
  await userEvent.type(await screen.findByLabelText('New password'), 'Str0ng-pass')
  await userEvent.type(screen.getByLabelText('Repeat the password'), 'Str0ng-pass')
  await userEvent.click(screen.getByRole('button', { name: 'Create the account' }))
  expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument()
  expect(useVisitorSession.getState().session).toBeNull()
})

it('shows a weak password under the password field', async () => {
  window.location.hash = '#token=reset-1'
  mockVisitorApi({ 'POST /visitor/auth/password/reset/confirm': error(422, 'The password is too weak') })
  renderVisitor({ '/visitor/reset-password': <VisitorResetPassword /> }, '/visitor/reset-password')
  await userEvent.type(await screen.findByLabelText('New password'), 'abc')
  await userEvent.type(screen.getByLabelText('Repeat the password'), 'abc')
  await userEvent.click(screen.getByRole('button', { name: 'Save the password' }))
  expect(await screen.findByText('The password is too weak')).toBeInTheDocument()
  expect(screen.getByLabelText('New password')).toHaveAttribute('aria-invalid', 'true')
})

it('tells how long to wait after too many sign-in attempts', async () => {
  mockVisitorApi({ ...noGoogle, 'POST /visitor/auth/login': error(429, 'Too many attempts', undefined, { 'retry-after': '300' }) })
  renderVisitor({ '/visitor/login': <VisitorLogin /> }, '/visitor/login')
  await userEvent.type(screen.getByLabelText('Email'), 'jana@example.com')
  await userEvent.type(screen.getByLabelText('Password'), 'secret')
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('5 min')
})

it('keeps password sign-in when Google is unavailable', async () => {
  mockVisitorApi({ 'GET /visitor/auth/google/config': error(503, 'Google is not configured'), 'POST /visitor/auth/login': { status: 200, data: session } })
  renderVisitor({ '/visitor/login': <VisitorLogin /> }, '/visitor/login?next=/visitor/profile')
  await userEvent.type(screen.getByLabelText('Email'), 'jana@example.com')
  await userEvent.type(screen.getByLabelText('Password'), 'secret')
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/visitor/profile'))
  expect(screen.queryByRole('region', { name: 'Sign in with Google' })).not.toBeInTheDocument()
})

it('never follows a next address outside the cabinet', async () => {
  signInVisitor()
  mockVisitorApi(noGoogle)
  renderVisitor({ '/visitor/login': <VisitorLogin /> }, '/visitor/login?next=//evil.example/app')
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/visitor/visits'))
})
