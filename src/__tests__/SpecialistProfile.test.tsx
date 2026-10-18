import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import SpecialistProfile from '../pages/SpecialistProfile'
import api from '../api/client'
import { renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), put: vi.fn() } }))

describe('SpecialistProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
    signIn({ id: 3, role: 'specialist' })
  })

  // the codes come from the API in snake_case, some translation keys are camelCase
  it('shows translated business type and category, not the raw key', async () => {
    vi.mocked(api.get).mockImplementation(routes({
      '/specialist-profiles/me': { id: 1, user_id: 3, business_type: 'rehab_center', specialist_category: 'healthcare', is_verified: 'no', created_at: '', updated_at: '' },
    }))
    renderWithProviders(<SpecialistProfile />)
    expect(await screen.findByText('Rehabilitation Center')).toBeInTheDocument()
    expect(screen.getByText('Healthcare')).toBeInTheDocument()
    expect(screen.queryByText(/businessType\.|category\./)).not.toBeInTheDocument()
  })

  it('shows an unknown code as is', async () => {
    vi.mocked(api.get).mockImplementation(routes({
      '/specialist-profiles/me': { id: 1, user_id: 3, business_type: 'spa', specialist_category: 'sport', is_verified: 'no', created_at: '', updated_at: '' },
    }))
    renderWithProviders(<SpecialistProfile />)
    expect(await screen.findByText('spa')).toBeInTheDocument()
    expect(screen.getByText('sport')).toBeInTheDocument()
  })
})
