import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLabels } from '../i18n/labels'
import { useLocaleStore } from '../store/localeStore'
import { resetStores } from '../test/render'

describe('useLabels', () => {
  beforeEach(resetStores)

  it('translates the codes the API sends', () => {
    const { result } = renderHook(() => useLabels())
    expect(result.current.businessType('salon')).toBe('Beauty Salon')
    expect(result.current.role('business_owner')).toBe('Business owner')
    expect(result.current.visitStatus('in_progress')).toBe('In Progress')
    expect(result.current.subscriptionStatus('pending_cancellation')).toBe('Pending Cancellation')

    act(() => useLocaleStore.setState({ locale: 'cz' }))
    const { result: cz } = renderHook(() => useLabels())
    expect(cz.current.businessType('dental')).toBe('Zubní ordinace')
  })

  it('shows an unknown code as is', () => {
    const { result } = renderHook(() => useLabels())
    expect(result.current.subscriptionStatus('incomplete')).toBe('incomplete')
    expect(result.current.role(null)).toBe('')
  })
})
