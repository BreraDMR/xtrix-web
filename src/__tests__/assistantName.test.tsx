import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, screen } from '@testing-library/react'
import api from '../api/client'
import {
  ASSISTANT_GENDERS,
  DEFAULT_ASSISTANT_NAMES,
  assistantResources,
  assistantT,
  effectiveAssistant,
} from '../i18n/assistant'
import { useAssistantName, useAssistantText } from '../hooks/useAssistantName'
import { useLocaleStore } from '../store/localeStore'
import { apiError, renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }))

const business = (assistant_name: string | null, assistant_gender = 'female') => ({
  id: 1, name: 'Salon', business_type: 'salon', currency: 'CZK', created_at: '2026-10-01T10:00:00',
  assistant_name, assistant_gender,
})

describe('effective assistant name', () => {
  it('has a default name per UI language, same as the API', () => {
    expect(DEFAULT_ASSISTANT_NAMES).toEqual({ ru: 'Сашенька', cz: 'Saška', en: 'Sasha' })
  })

  it("takes the business's own name and gender", () => {
    expect(effectiveAssistant(business('  Marek ', 'male'), 'ru')).toEqual({ name: 'Marek', gender: 'male', isDefault: false })
  })

  it('falls back to the default name for the language, keeping the gender', () => {
    expect(effectiveAssistant(business(null), 'ru')).toEqual({ name: 'Сашенька', gender: 'female', isDefault: true })
    expect(effectiveAssistant(business('   ', 'neuter'), 'cz')).toEqual({ name: 'Saška', gender: 'neuter', isDefault: true })
    expect(effectiveAssistant(null, 'en')).toEqual({ name: 'Sasha', gender: 'female', isDefault: true })
  })

  it('treats an unknown gender as female', () => {
    expect(effectiveAssistant(business('Robo', 'robot'), 'en').gender).toBe('female')
  })
})

describe('assistant phrases', () => {
  it('picks the verb form by gender in ru and cz', () => {
    expect(assistantT('ru', 'visitBooked', { name: 'Сашенька', gender: 'female' })).toBe('Сашенька записала визит')
    expect(assistantT('ru', 'visitBooked', { name: 'Марк', gender: 'male' })).toBe('Марк записал визит')
    expect(assistantT('ru', 'visitBooked', { name: 'Солнышко', gender: 'neuter' })).toBe('Солнышко записало визит')
    expect(assistantT('cz', 'visitBooked', { name: 'Saška', gender: 'female' })).toBe('Saška zapsala návštěvu')
    expect(assistantT('cz', 'visitBooked', { name: 'Marek', gender: 'male' })).toBe('Marek zapsal návštěvu')
    expect(assistantT('cz', 'visitBooked', { name: 'Robo', gender: 'neuter' })).toBe('Robo zapsalo návštěvu')
  })

  it('uses one english form for every gender', () => {
    for (const gender of ASSISTANT_GENDERS) {
      expect(assistantT('en', 'visitBooked', { name: 'Sasha', gender })).toBe('Sasha booked the visit')
    }
  })

  it('fills other values and leaves unknown placeholders visible', () => {
    expect(assistantT('en', 'actionsDone', { name: 'Sasha', gender: 'female', count: 3 })).toBe('Sasha completed actions: 3')
    expect(assistantT('en', 'visitBooked', { gender: 'female' })).toBe('{{name}} booked the visit')
  })

  it('falls back to english, then to the key', () => {
    expect(assistantT('ru', 'missingKey' as never, { name: 'X', gender: 'male' })).toBe('missingKey')
  })

  it('has every phrase in all three languages and all three genders where ru/cz need them', () => {
    const baseKeys = (lang: 'en' | 'ru' | 'cz') =>
      new Set(Object.keys(assistantResources[lang]).map((key) => key.replace(/_(female|male|neuter)$/, '')))
    const en = baseKeys('en')
    expect(baseKeys('ru')).toEqual(en)
    expect(baseKeys('cz')).toEqual(en)
    for (const lang of ['ru', 'cz'] as const) {
      const keys = Object.keys(assistantResources[lang])
      for (const key of keys.filter((k) => /_(female|male|neuter)$/.test(k))) {
        const base = key.replace(/_(female|male|neuter)$/, '')
        for (const gender of ASSISTANT_GENDERS) expect(keys, `${lang}: ${base}_${gender}`).toContain(`${base}_${gender}`)
      }
    }
  })
})

function Probe() {
  const { name, gender, isDefault } = useAssistantName()
  const ta = useAssistantText()
  return <p>{`${name}|${gender}|${isDefault}|${ta('visitBooked')}`}</p>
}

describe('useAssistantName', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
    signIn({ id: 1, role: 'employee', business_id: 1, employer_id: 5 })
  })

  it("uses the business's name and gender", async () => {
    useLocaleStore.setState({ locale: 'ru' })
    vi.mocked(api.get).mockImplementation(routes({ '/businesses/me': business('Марк', 'male') }))
    renderWithProviders(<Probe />)
    expect(await screen.findByText('Марк|male|false|Марк записал визит')).toBeInTheDocument()
  })

  it('shows the default for the UI language right away and follows a language switch', async () => {
    useLocaleStore.setState({ locale: 'cz' })
    vi.mocked(api.get).mockImplementation(routes({ '/businesses/me': business(null) }))
    renderWithProviders(<Probe />)
    expect(screen.getByText('Saška|female|true|Saška zapsala návštěvu')).toBeInTheDocument()
    act(() => useLocaleStore.setState({ locale: 'ru' }))
    expect(await screen.findByText('Сашенька|female|true|Сашенька записала визит')).toBeInTheDocument()
  })

  it('stays on the default when the business cannot be read', async () => {
    vi.mocked(api.get).mockRejectedValue(apiError(403, 'Not allowed'))
    renderWithProviders(<Probe />)
    expect(await screen.findByText('Sasha|female|true|Sasha booked the visit')).toBeInTheDocument()
  })

  it("doesn't ask for a business the user doesn't have", () => {
    signIn({ id: 1, role: 'specialist', business_id: null, employer_id: null })
    renderWithProviders(<Probe />)
    expect(screen.getByText('Sasha|female|true|Sasha booked the visit')).toBeInTheDocument()
    expect(api.get).not.toHaveBeenCalled()
  })
})
