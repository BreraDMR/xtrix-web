import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import Tabs from '../ui/Tabs'

const TABS = [
  { id: 'one', label: 'One' },
  { id: 'two', label: 'Two' },
  { id: 'three', label: 'Three' },
] as const

function Harness() {
  const [value, setValue] = useState<'one' | 'two' | 'three'>('one')
  return (
    <>
      <Tabs tabs={TABS} value={value} onChange={setValue} label="Sections" />
      <p>Showing {value}</p>
    </>
  )
}

describe('Tabs', () => {
  it('marks the selected tab and keeps only it in the Tab order', () => {
    render(<Harness />)
    expect(screen.getByRole('tablist', { name: 'Sections' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('tabindex', '-1')
  })

  it('switches on click and with the arrow, Home and End keys', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('tab', { name: 'Two' }))
    expect(screen.getByText('Showing two')).toBeInTheDocument()

    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Three' })).toHaveFocus()
    expect(screen.getByText('Showing three')).toBeInTheDocument()

    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'One' })).toHaveFocus()

    await userEvent.keyboard('{ArrowLeft}')
    expect(screen.getByText('Showing three')).toBeInTheDocument()

    await userEvent.keyboard('{Home}')
    expect(screen.getByText('Showing one')).toBeInTheDocument()
    await userEvent.keyboard('{End}')
    expect(screen.getByRole('tab', { name: 'Three' })).toHaveAttribute('aria-selected', 'true')
  })
})
