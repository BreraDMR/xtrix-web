import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from '../App'
import { resetStores } from '../test/render'

describe('App', () => {
  beforeEach(() => {
    resetStores()
    sessionStorage.clear()
  })

  it('keeps the client portal sign-in public and separate from the CRM login', () => {
    window.history.pushState({}, '', '/client/portal')
    render(
      <QueryClientProvider client={new QueryClient()}>
        <App />
      </QueryClientProvider>
    )
    expect(screen.getByRole('heading', { name: 'Sign in to your client area' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/client/portal')
    expect(screen.queryByRole('button', { name: 'Logout' })).not.toBeInTheDocument()
  })

  it('sends a signed-out visitor of the workspace to the login page', () => {
    // the marketing page is public, so the guard is exercised through an app route
    window.history.pushState({}, '', '/app')
    render(
      <QueryClientProvider client={new QueryClient()}>
        <App />
      </QueryClientProvider>
    )
    expect(screen.getByRole('heading', { name: 'Xtrix' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/login')
    expect(localStorage.getItem('app_logs')).toBeNull()
  })
})
