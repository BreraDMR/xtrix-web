import { expect, it } from 'vitest'

// errors go inline or into a toast - a browser alert() blocks the page and can't be styled or translated well
const sources = import.meta.glob(['../**/*.{ts,tsx}', '!../__tests__/**', '!../test/**', '!../**/*.d.ts'], {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>

const ALERT_CALL = /(^|[^.\w]|\bwindow\.)alert\s*\(/

it('has no alert() calls left', () => {
  const offenders = Object.entries(sources).flatMap(([path, source]) =>
    source.split('\n').flatMap((line, i) => (ALERT_CALL.test(line) ? [`${path}:${i + 1}: ${line.trim()}`] : [])))
  expect(Object.keys(sources).length).toBeGreaterThan(60)
  expect(Object.keys(sources)).toContain('../pages/Finance.tsx')
  expect(offenders).toEqual([])
})

it('catches both spellings', () => {
  expect(ALERT_CALL.test("alert('x')")).toBe(true)
  expect(ALERT_CALL.test("  window.alert('x')")).toBe(true)
  expect(ALERT_CALL.test("toast.alert('x')")).toBe(false)
  expect(ALERT_CALL.test('<div role="alert">')).toBe(false)
})
