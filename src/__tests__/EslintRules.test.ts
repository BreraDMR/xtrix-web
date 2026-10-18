// @vitest-environment node
import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

// eslint 8 ships no types, this is the bit we use
type LintResult = { messages: { ruleId: string | null; message: string }[] }
type ESLintApi = { ESLint: new (options?: { cwd?: string }) => { lintText(code: string, options: { filePath: string }): Promise<LintResult[]> } }

const require = createRequire(import.meta.url)
const { ESLint } = require('eslint') as ESLintApi
const eslint = new ESLint()

async function ruleIds(filePath: string, code: string) {
  const [result] = await eslint.lintText(code, { filePath })
  return result.messages.map((m) => m.ruleId)
}

describe('no process in app code', () => {
  // Vite only swaps import.meta.env, a process.env left in the bundle blows up in the browser
  it('flags process in src', async () => {
    expect(await ruleIds('src/utils/probe.ts', 'export const url = process.env.API_URL\n')).toContain('no-restricted-globals')
    expect(await ruleIds('src/components/Probe.tsx', 'export const dev = process.env.NODE_ENV === "development"\n')).toContain('no-restricted-globals')
  })

  it('leaves import.meta.env alone', async () => {
    expect(await ruleIds('src/utils/probe.ts', 'export const url = import.meta.env.VITE_API_URL\n')).toEqual([])
  })

  it('allows process in e2e and config files, they run in Node', async () => {
    expect(await ruleIds('e2e/probe.ts', 'export const url = process.env.E2E_API_URL\n')).not.toContain('no-restricted-globals')
    expect(await ruleIds('playwright.config.ts', 'export const ci = !!process.env.CI\n')).not.toContain('no-restricted-globals')
    expect(await ruleIds('vite.config.ts', 'export const cwd = process.cwd()\n')).not.toContain('no-restricted-globals')
  })
}, 30_000)
