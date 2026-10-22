import { describe, expect, it } from 'vitest'
import { formatDays } from '../utils/plural'

describe('formatDays', () => {
  it('picks the right plural form in every language', () => {
    expect([1, 2, 5, 30].map((n) => formatDays(n, 'en'))).toEqual(['1 day', '2 days', '5 days', '30 days'])
    expect([1, 3, 5, 21, 365].map((n) => formatDays(n, 'ru'))).toEqual(['1 день', '3 дня', '5 дней', '21 день', '365 дней'])
    expect([1, 3, 5, 30, 365].map((n) => formatDays(n, 'cz'))).toEqual(['1 den', '3 dny', '5 dní', '30 dní', '365 dní'])
  })
})
