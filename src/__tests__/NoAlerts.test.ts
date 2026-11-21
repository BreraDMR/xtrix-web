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

// DES-11: a confirm() is still fine, but its question goes through t() like everything else -
// a hard-coded english sentence pops up the same in ru and cz
const LITERAL_CONFIRM = /(^|[^.\w]|\bwindow\.)confirm\s*\(\s*['"`]/

it('asks confirm() questions in the user language', () => {
  const offenders = Object.entries(sources).flatMap(([path, source]) =>
    source.split('\n').flatMap((line, i) => (LITERAL_CONFIRM.test(line) ? [`${path}:${i + 1}: ${line.trim()}`] : [])))
  expect(offenders).toEqual([])
  expect(LITERAL_CONFIRM.test("window.confirm(t('x'))")).toBe(false)
  expect(LITERAL_CONFIRM.test("confirm('Sure?')")).toBe(true)
})
