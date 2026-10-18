import { expect, it } from 'vitest'
import { withoutBlanks } from '../utils/payload'

it('drops empty strings and undefined, keeps 0, false and null', () => {
  expect(withoutBlanks({ name: 'Salon', phone: '', email: undefined, price: 0, active: false, note: null }))
    .toEqual({ name: 'Salon', price: 0, active: false, note: null })
})
