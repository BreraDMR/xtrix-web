import { useState } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ContactStep from '../components/booking/ContactStep'
import type { ContactDetails } from '../components/booking/types'
import { renderWithProviders, resetStores } from '../test/render'

function Harness({ onSubmit }: { onSubmit: (value: ContactDetails) => void }) {
  const [value, setValue] = useState<ContactDetails>({
    fullName: '', phone: '', email: '', marketingConsent: false, processingConsent: false,
  })
  return <ContactStep value={value} onChange={setValue} onSubmit={() => onSubmit(value)} onBack={() => {}} />
}

describe('booking ContactStep', () => {
  beforeEach(() => resetStores())

  it('takes a phone and an email together', async () => {
    const onSubmit = vi.fn()
    renderWithProviders(<Harness onSubmit={onSubmit} />)
    await userEvent.type(screen.getByRole('textbox', { name: /name/i }), 'Jana')
    await userEvent.type(document.querySelector('input[name="phone"]') as HTMLInputElement, '+420777123456')
    await userEvent.type(document.querySelector('input[name="email"]') as HTMLInputElement, 'jana@example.com')
    await userEvent.click(screen.getByRole('checkbox', { name: /process my details/i }))
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))

    expect(onSubmit).toHaveBeenCalled()
    expect(screen.queryByText(/only one contact/i)).not.toBeInTheDocument()
  })

  it('still wants at least one contact, and checks both when both are typed', async () => {
    const onSubmit = vi.fn()
    renderWithProviders(<Harness onSubmit={onSubmit} />)
    await userEvent.type(screen.getByRole('textbox', { name: /name/i }), 'Jana')
    await userEvent.click(screen.getByRole('checkbox', { name: /process my details/i }))
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByText('Enter a phone number or an email')).toBeInTheDocument()

    await userEvent.type(document.querySelector('input[name="phone"]') as HTMLInputElement, '12')
    await userEvent.type(document.querySelector('input[name="email"]') as HTMLInputElement, 'nope')
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByText('Check the phone number')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
