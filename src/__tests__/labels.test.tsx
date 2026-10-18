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

  it('translates units, system expense categories, expense sources and plans', () => {
    act(() => useLocaleStore.setState({ locale: 'ru' }))
    const { result } = renderHook(() => useLabels())
    expect(result.current.unit('pcs')).toBe('шт')
    expect(result.current.unit('ml')).toBe('мл')
    // free text someone typed stays as typed
    expect(result.current.unit('бутылка')).toBe('бутылка')
    expect(result.current.expenseCategory({ code: 'rent', name: 'Rent' })).toBe('Аренда')
    expect(result.current.expenseCategory({ code: null, name: 'Кофе для гостей' })).toBe('Кофе для гостей')
    expect(result.current.expenseSource('salary_payment')).toBe('Выплата зарплаты')
    expect(result.current.expenseSource(null)).toBe('')
    expect(result.current.planName({ code: 'admin_up_to_7_employees', name: 'Admin: up to 7 employees' })).toBe('Бизнес: до 7 сотрудников')
    expect(result.current.planName({ code: 'something_new', name: 'Something new' })).toBe('Something new')

    act(() => useLocaleStore.setState({ locale: 'cz' }))
    const { result: cz } = renderHook(() => useLabels())
    expect(cz.current.unit('pcs')).toBe('ks')
    expect(cz.current.expenseCategory({ code: 'stock_purchase', name: 'Stock purchase' })).toBe('Nákup zboží')
    expect(cz.current.planName({ code: 'solo_pro', name: 'Solo Pro' })).toBe('Solo Pro')
  })
})
