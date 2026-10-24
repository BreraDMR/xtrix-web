import { describe, expect, it } from 'vitest'
import { sanitizeReturnTo } from '../utils/returnTo'

describe('return links use the same canonical path as the browser', () => {
  it.each(['/\t/escape.invalid/path', '/\n/escape.invalid/path', '/\r/escape.invalid/path'])('refuses control characters in %j', path => {
    expect(sanitizeReturnTo(path)).toBe('/app')
  })
  it.each(['/app/../login', '/app/%2e%2e/register?next=x', '/%6cogin', '/LOGIN', '/%2f%2fescape.invalid'])('refuses canonical auth loops and ambiguous paths in %j', path => {
    expect(sanitizeReturnTo(path)).toBe('/app')
  })
  it.each([
    ['/subscription?session_id=paid#receipt', '/app/subscription?session_id=paid#receipt'],
    ['/app/./calendar?date=2026-10-25#visit', '/app/calendar?date=2026-10-25#visit'],
    ['/booking/salon?service=1', '/booking/salon?service=1'],
    ['/app/clients?search=two%20words', '/app/clients?search=two%20words'],
  ])('preserves valid query and fragment for %s', (path, expected) => {
    expect(sanitizeReturnTo(path)).toBe(expected)
  })
})
