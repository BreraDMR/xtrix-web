import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import AccessNotice from '../components/subscription/AccessNotice'
import type { WorkspaceAccess } from '../hooks/useWorkspaceAccess'
import { renderWithProviders, resetStores } from '../test/render'
import { useLocaleStore } from '../store/localeStore'

const trial = { crm_mode: 'full', trial_end: '2026-10-29T20:18:49Z', read_only_until: null } as unknown as WorkspaceAccess

describe('AccessNotice', () => {
  it('shows the trial end as a date and a time without seconds', () => {
    resetStores()
    useLocaleStore.setState({ locale: 'en' })
    renderWithProviders(<AccessNotice access={trial} />)
    const expected = new Date(trial.trial_end!).toLocaleString('en', { dateStyle: 'long', timeStyle: 'short' })
    const text = screen.getByRole('status').textContent ?? ''
    expect(text).toContain(`CRM and AI are free until ${expected}`)
    expect(text).not.toMatch(/\d{1,2}:\d{2}:\d{2}/)
  })
})
