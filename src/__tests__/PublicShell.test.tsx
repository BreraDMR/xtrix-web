import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import api from '../api/client'
import PublicShell from '../components/public/PublicShell'
import BookingPage from '../pages/booking/BookingPage'
import Unsubscribe from '../pages/Unsubscribe'
import { renderWithProviders, resetStores } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn() } }))

// DES-10: guest pages share one Xtrix frame with the visitor's own way into the cabinet.
describe('public shell', () => {
  beforeEach(() => {
    resetStores()
    vi.mocked(api.get).mockReset()
  })

  it('carries the brand, the page title, the cabinet link and the language switch', () => {
    const { container } = renderWithProviders(<PublicShell title="Book a visit"><p>body</p></PublicShell>)
    const header = screen.getByRole('banner')
    expect(within(header).getByText('Xtrix')).toBeInTheDocument()
    expect(within(header).getByText('Book a visit')).toBeInTheDocument()
    expect(within(header).getByRole('link', { name: 'My account' })).toHaveAttribute('href', '/visitor/visits')
    expect(within(header).getByRole('button', { name: 'EN' })).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveTextContent('body')
    expect(container.firstElementChild).toHaveClass('crm-workspace')
  })

  it('wraps the booking page while it loads', () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => {}))
    renderWithProviders(
      <MemoryRouter initialEntries={['/booking/demo']}>
        <Routes><Route path="/booking/:slug" element={<BookingPage />} /></Routes>
      </MemoryRouter>,
      { router: false },
    )
    expect(within(screen.getByRole('banner')).getByRole('link', { name: 'My account' })).toBeInTheDocument()
  })

  it('wraps the unsubscribe page', () => {
    renderWithProviders(<Unsubscribe />)
    expect(within(screen.getByRole('banner')).getByText('Xtrix')).toBeInTheDocument()
  })
})
