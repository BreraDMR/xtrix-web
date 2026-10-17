import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from '../App'
import { resetStores } from '../test/render'

describe('App', () => {
  beforeEach(resetStores)

  it('sends a signed-out visitor to the login page', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <App />
      </QueryClientProvider>
    )
    expect(screen.getByText('Xtrix')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/login')
    expect(localStorage.getItem('app_logs')).toBeNull()
  })
})
