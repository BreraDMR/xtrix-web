// @vitest-environment node
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { visitStatusClass } from '../utils/statusPill'
import { avatarBackground } from '../utils/avatar'

// DES-02: one set of tokens in theme.css that both themes fill in, and the CRM screens
// read colours from it instead of carrying their own hex values around.
const root = resolve(__dirname, '..', '..')
const theme = readFileSync(resolve(root, 'src/ui/theme.css'), 'utf8')

// crude but enough: the first `:root {` and `:root.dark {` blocks of the base layer
function block(selector: string) {
  const start = theme.indexOf(`${selector} {`)
  expect(start, `${selector} block`).toBeGreaterThanOrEqual(0)
  return theme.slice(start, theme.indexOf('\n  }', start))
}
const tokens = (css: string) => new Map([...css.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(match => [match[1], match[2].trim()]))
const light = tokens(block(':root'))
const dark = tokens(block(':root.dark'))
// the dark theme only overrides what changes, so look a token up there first, then in light,
// and follow plain var(--x) references down to the real value
function tokenValue(token: string, themeTokens: Map<string, string>): string | undefined {
  const value = themeTokens.get(token) ?? light.get(token)
  const ref = value?.match(/^var\((--[\w-]+)\)$/)
  return ref ? tokenValue(ref[1], themeTokens) : value
}
// a token follows the theme when dark sets it or it points at something dark sets
const followsTheme = (token: string): boolean => {
  if (dark.has(token)) return true
  const ref = light.get(token)?.match(/^var\((--[\w-]+)\)$/)
  return ref ? followsTheme(ref[1]) : false
}

const STATUSES = ['planned', 'in-progress', 'completed', 'cancelled']
const COLOUR_TOKENS = [
  ...STATUSES.flatMap(status => [`--status-${status}-bg`, `--status-${status}-ink`]),
  '--chart-track', '--chart-axis', '--chart-axis-soft', '--chart-muted', '--chart-negative', '--chart-tooltip-bg',
  '--tone-success', '--tone-danger', '--icon-muted', '--notice-bg', '--notice-ink', '--notice-line',
]
// series colours carry white text (staff badges, avatars), so they are the same in both themes
const SHARED_TOKENS = [
  '--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5', '--chart-6',
  '--avatar-1', '--avatar-2', '--avatar-3', '--avatar-4', '--avatar-5', '--avatar-6',
]
const SCALE_TOKENS = [
  '--text-caption', '--text-small', '--text-control', '--text-body', '--text-title', '--text-section',
  '--radius-chip', '--radius-control', '--radius-tile', '--radius-card', '--radius-sheet', '--radius-pill',
  '--control-height', '--control-height-lg', '--space-1', '--space-2', '--space-3', '--space-4', '--space-5', '--space-6',
]

describe('design tokens', () => {
  it('every surface colour has a value for each theme', () => {
    for (const token of COLOUR_TOKENS) {
      expect(light.has(token), `light ${token}`).toBe(true)
      expect(followsTheme(token), `dark ${token}`).toBe(true)
    }
    for (const token of SHARED_TOKENS) expect(light.has(token), token).toBe(true)
  })

  it('type, radius, spacing and density live in one scale', () => {
    for (const token of SCALE_TOKENS) expect(light.has(token), token).toBe(true)
  })

  it('a planned visit does not wear the brand accent', () => {
    // buttons, the active menu item and "planned" were all the same purple, so a status read as an action
    for (const themeTokens of [light, dark]) {
      expect(tokenValue('--status-planned-ink', themeTokens)).toMatch(/^#/)
      expect(tokenValue('--status-planned-ink', themeTokens)).not.toBe(tokenValue('--workspace-accent', themeTokens))
      expect(tokenValue('--status-planned-bg', themeTokens)).not.toBe(tokenValue('--workspace-accent-soft', themeTokens))
    }
  })

  it('the base components read the scale instead of their own numbers', () => {
    const rule = (selector: string) => {
      const start = theme.indexOf(`  ${selector} {`)
      expect(start, selector).toBeGreaterThanOrEqual(0)
      return theme.slice(start, theme.indexOf('}', start))
    }
    expect(rule('.ui-card')).toContain('var(--radius-card)')
    expect(rule('.ui-button')).toMatch(/min-height: var\(--control-height\)/)
    expect(rule('.ui-button')).toContain('var(--radius-pill)')
    expect(rule('.ui-input')).toMatch(/min-height: var\(--control-height-lg\)/)
    expect(rule('.ui-input')).toContain('var(--radius-control)')
    expect(rule('.x-stat')).toContain('var(--radius-tile)')
    expect(rule('.x-status')).toContain('var(--radius-pill)')
  })
})

describe('visit status pill', () => {
  it.each(['planned', 'in_progress', 'completed', 'cancelled'])('%s comes from the status tokens', status => {
    const classes = visitStatusClass(status)
    expect(classes).toContain(`x-status-${status.replace('_', '-')}`)
    expect(classes).not.toMatch(/#[0-9a-f]{3,6}/i)
  })

  it('an unknown status falls back to cancelled, as before', () => {
    expect(visitStatusClass(undefined)).toContain('x-status-cancelled')
  })

  it('calendar blocks use the same status colours', () => {
    for (const status of STATUSES) {
      const start = theme.indexOf(`.x-ev-${status.replace('-', '_')} {`)
      expect(start, status).toBeGreaterThanOrEqual(0)
      expect(theme.slice(start, theme.indexOf('}', start))).toContain(`var(--status-${status}-bg)`)
    }
  })
})

describe('avatars', () => {
  it('pick a colour from the tokens', () => {
    expect(avatarBackground('Jana Nováková')).toMatch(/^var\(--avatar-[1-6]\)$/)
  })
})

// The public landing keeps its own illustration colours (DES-10), and a few values are
// data, not paint: a colour picker default, the theme preview swatches and the print sheet.
const ALLOWED = new Set([
  'src/pages/Loyalty.tsx',
  'src/pages/Settings.tsx',
  'src/utils/export.ts',
])
const ALLOWED_DIRS = ['src/components/marketing/', 'src/__tests__/', 'src/test/']

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sources(path)
    return /\.(ts|tsx)$/.test(name) && !name.endsWith('.d.ts') ? [path] : []
  })
}

describe('CRM screens', () => {
  it('carry no hex colours of their own', () => {
    const offenders = sources(resolve(root, 'src'))
      .map(path => relative(root, path))
      .filter(path => !ALLOWED.has(path) && !ALLOWED_DIRS.some(dir => path.startsWith(dir)))
      .flatMap(path => {
        const hits = readFileSync(resolve(root, path), 'utf8').match(/#[0-9a-fA-F]{6}\b/g) ?? []
        return hits.map(hit => `${path} ${hit}`)
      })
    expect(offenders).toEqual([])
  })
})

// DES-10: everything a guest opens from a link (booking, manage, waitlist offer, forms,
// payments, gifts, unsubscribe, the cabinet) should look like the same Xtrix, so it reads the
// theme tokens too. Raw Tailwind palette classes here were the old gray-and-blue booking look.
const PUBLIC_DIRS = [
  'src/pages/booking/', 'src/components/booking/', 'src/pages/client/',
  'src/pages/visitor/', 'src/components/visitor/', 'src/components/public/', 'src/components/client/',
]
const PUBLIC_FILES = ['src/pages/Unsubscribe.tsx', 'src/components/subscription/PublicFeatureGate.tsx', 'src/components/FormError.tsx']
const PALETTE = /\b(?:bg|text|border|ring|divide|from|to|placeholder|outline|accent)-(?:gray|slate|zinc|neutral|stone|blue|indigo|purple|violet|green|emerald|red|rose|amber|yellow|orange|pink|sky|teal|primary)-\d{2,3}\b/g

describe('public screens', () => {
  it('take colours from the theme, not the raw Tailwind palette', () => {
    const files = sources(resolve(root, 'src'))
      .map(path => relative(root, path))
      .filter(path => PUBLIC_FILES.includes(path) || PUBLIC_DIRS.some(dir => path.startsWith(dir)))
    expect(files.length).toBeGreaterThan(20)
    const offenders = files.flatMap(path => {
      const hits = readFileSync(resolve(root, path), 'utf8').match(PALETTE) ?? []
      return hits.length ? [`${path}: ${hits.length} (${[...new Set(hits)].slice(0, 3).join(' ')})`] : []
    })
    expect(offenders).toEqual([])
  })
})

// DES-02a: a white rounded box on a CRM screen is a card, so it wears ui-card (or <Card>).
// theme.css used to dress these up with a global rule under main; that rule is gone now,
// so a hand-made one would come out with no border in dark mode and the wrong corners.
// Inputs, selects and buttons are not cards. The assistant lives in a portal - DES-02e.
const CARD_SKIP_DIRS = ['src/components/assistant/', 'src/components/marketing/', 'src/__tests__/', 'src/test/']
const HAND_MADE_CARD = /<(?:div|section|article)\b[^>]*?className=["'`{][^>]*?\bbg-white(?![\w/-])[^"'`]*?\brounded-(?:lg|xl)\b|<(?:div|section|article)\b[^>]*?className=["'`{][^>]*?\brounded-(?:lg|xl)\b[^"'`]*?\bbg-white(?![\w/-])/g

describe('CRM cards', () => {
  it('use ui-card instead of a white rounded box', () => {
    const offenders = sources(resolve(root, 'src'))
      .map(path => relative(root, path))
      .filter(path => path.endsWith('.tsx') && !CARD_SKIP_DIRS.some(dir => path.startsWith(dir)))
      .flatMap(path => {
        const hits = readFileSync(resolve(root, path), 'utf8').match(HAND_MADE_CARD) ?? []
        return hits.length ? [`${path}: ${hits.length}`] : []
      })
    expect(offenders).toEqual([])
  })

  it('theme.css has no global patch for old white cards', () => {
    expect(theme.includes("[class~='bg-white']")).toBe(false)
  })
})

// DES-02b: a solid accent button is the primary Button. theme.css used to repaint hand-made
// `bg-purple-600 text-white` buttons with a global rule; that rule is gone, so one left over
// would come out flat purple with its own corners and no focus ring of ours.
// The assistant has its own pass (DES-02e), the landing keeps its own look.
const BUTTON_SKIP_DIRS = ['src/components/assistant/', 'src/components/marketing/', 'src/__tests__/', 'src/test/']
// OfferCards only draws its link on the landing (Pricing passes `registration`)
const BUTTON_SKIP_FILES = ['src/components/subscription/OfferCards.tsx']
// each quote kind on its own, so an apostrophe in a label does not pair up with a class string
const CLASS_STRINGS = [/"[^"\n]*"/g, /'[^'\n]*'/g, /`[^`]*`/g]
const SOLID_ACCENT = /\bbg-(?:blue|purple|primary|indigo)-600\b/

describe('CRM buttons', () => {
  it('use Button instead of a hand-made accent button', () => {
    const offenders = sources(resolve(root, 'src'))
      .map(path => relative(root, path))
      .filter(path => path.endsWith('.tsx') && !BUTTON_SKIP_FILES.includes(path) && !BUTTON_SKIP_DIRS.some(dir => path.startsWith(dir)))
      .flatMap(path => {
        const text = readFileSync(resolve(root, path), 'utf8')
        const hits = CLASS_STRINGS.flatMap(pattern => text.match(pattern) ?? [])
          .filter(value => SOLID_ACCENT.test(value) && /\btext-white\b/.test(value))
        return hits.length ? [`${path}: ${hits.length}`] : []
      })
    expect(offenders).toEqual([])
  })

  it('theme.css has no global patch for old accent buttons', () => {
    expect(theme).not.toMatch(/\.bg-(?:blue|purple|primary|indigo)-600/)
  })
})
