// @vitest-environment node
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Every page (public booking too) used to pull Inter from Google Fonts, which hands the
// visitor's IP to Google before they agreed to anything. The font ships with the app now.
const root = resolve(__dirname, '..', '..')
const read = (path: string) => readFileSync(resolve(root, path), 'utf8')
const GOOGLE_FONTS = /fonts\.(googleapis|gstatic)\.com/

describe('fonts are served from our own origin', () => {
  it('index.html loads nothing from Google Fonts', () => {
    expect(read('index.html')).not.toMatch(GOOGLE_FONTS)
  })

  it('the CSP no longer allows Google Fonts', () => {
    const vercel = JSON.parse(read('vercel.json')) as { headers: { headers: { key: string; value: string }[] }[] }
    const csp = vercel.headers.flatMap(rule => rule.headers).find(header => header.key === 'Content-Security-Policy')
    expect(csp?.value).toBeTruthy()
    expect(csp?.value).not.toMatch(GOOGLE_FONTS)
  })

  it('Inter is bundled and first in line after the system fonts', () => {
    expect(read('src/main.tsx')).toMatch(/import '@fontsource-variable\/inter(\/opsz\.css)?'/)
    expect(read('tailwind.config.js')).toMatch(/'"Inter Variable"'/)
    expect(read('src/index.css')).toMatch(/'Inter Variable'/)
    expect(read('src/ui/theme.css')).toMatch(/"SF Pro Text", "Inter Variable"/)
  })
})
