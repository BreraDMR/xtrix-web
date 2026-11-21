// @vitest-environment node
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { visitStatusTone } from '../utils/statusPill'
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

// DES-02d: every status pill is the shared StatusBadge, and its tones are the status tokens,
// so "paid", "sent" or "active" are the same green as a completed visit in both themes
const TONE_TOKENS: Record<string, string> = {
  info: '--status-planned', warning: '--status-in-progress', success: '--status-completed', danger: '--status-cancelled',
}
const toneRule = (tone: string) => {
  const start = theme.indexOf(`.x-status-${tone} {`)
  expect(start, tone).toBeGreaterThanOrEqual(0)
  return theme.slice(start, theme.indexOf('}', start))
}

// DES-11: the audit measured text on screens; these pairs came out under WCAG AA 4.5 in the
// light theme (planned 4.38, completed 3.89, table heads and menu groups 3.36). Small text
// sits on all of them, so each pair needs 4.5 in both themes.
function luminance(hex: string) {
  const channels = hex.replace('#', '').match(/../g)!.map(part => parseInt(part, 16) / 255)
  const [r, g, b] = channels.map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
const TEXT_PAIRS: [string, string][] = [
  ...['green', 'amber', 'red', 'blue', 'pink'].map(tone => [`--tint-${tone}-ink`, `--tint-${tone}`] as [string, string]),
  ...['--workspace-bg', '--workspace-panel', '--workspace-fill', '--workspace-accent-soft'].map(bg => ['--workspace-muted', bg] as [string, string]),
  // subtle is for eyebrows, table heads and menu groups - never on the lavender selection
  ...['--workspace-bg', '--workspace-panel', '--workspace-fill'].map(bg => ['--workspace-subtle', bg] as [string, string]),
]

describe('text contrast', () => {
  for (const [name, themeTokens] of [['light', light], ['dark', dark]] as const) {
    it(`small text reads at 4.5:1 in the ${name} theme`, () => {
      const low = TEXT_PAIRS.flatMap(([ink, bg]) => {
        const fg = tokenValue(ink, themeTokens)!
        const back = tokenValue(bg, themeTokens)!
        expect(fg, ink).toMatch(/^#[0-9a-f]{6}$/i)
        expect(back, bg).toMatch(/^#[0-9a-f]{6}$/i)
        const ratio = contrast(fg, back)
        return ratio < 4.5 ? [`${ink} on ${bg}: ${ratio.toFixed(2)}`] : []
      })
      expect(low).toEqual([])
    })
  }
})

describe('status badge', () => {
  it.each(Object.entries(TONE_TOKENS))('%s tone comes from %s', (tone, token) => {
    expect(toneRule(tone)).toContain(`var(${token}-bg)`)
    expect(toneRule(tone)).toContain(`var(${token}-ink)`)
  })

  it('neutral and accent tones read the workspace tokens', () => {
    expect(toneRule('neutral')).toContain('var(--workspace-fill)')
    expect(toneRule('accent')).toContain('var(--workspace-accent-soft)')
  })

  it.each([['planned', 'info'], ['in_progress', 'warning'], ['completed', 'success'], ['cancelled', 'danger']])(
    'a %s visit is the %s tone', (status, tone) => {
      expect(visitStatusTone(status)).toBe(tone)
    })

  it('an unknown visit status falls back to cancelled, as before', () => {
    expect(visitStatusTone(undefined)).toBe('danger')
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
// The landing keeps its own look.
const BUTTON_SKIP_DIRS = ['src/components/marketing/', 'src/__tests__/', 'src/test/']
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

// DES-02c: older screens painted the accent with plain blue/purple/primary shades, and a
// global rule at the end of theme.css lifted them to the tokens on the dark theme. That
// rule is gone, so a shade left over would come out dark purple on the dark panel.
const LIFTED_SHADE = /(?<![\w:/[-])(?:text-(?:blue|purple|primary|indigo)-(?:600|700|800|900)|bg-(?:blue|purple|primary)-(?:50|100)|border-(?:blue|purple|primary)-(?:200|300))(?![\w/-])/g

// DES-11: the last hand-made solid buttons were green "do it" and red "delete" ones. Green is
// the primary Button here, red is the danger one. The voice
// "stop recording" button keeps its tone on purpose - it shows a state, not a kind of button.
const SOLID_TONE = /\bbg-(?:green|emerald|red|rose|amber|yellow)-600\b/
const TONE_SKIP_FILES = ['src/components/assistant/AssistantPanel.tsx', 'src/components/assistant/ConversationList.tsx']

describe('CRM tone buttons', () => {
  it('use Button instead of a solid green or red one', () => {
    const offenders = sources(resolve(root, 'src'))
      .map(path => relative(root, path))
      .filter(path => path.endsWith('.tsx') && !TONE_SKIP_FILES.includes(path) && !BUTTON_SKIP_DIRS.some(dir => path.startsWith(dir)))
      .flatMap(path => {
        const text = readFileSync(resolve(root, path), 'utf8')
        const hits = CLASS_STRINGS.flatMap(pattern => text.match(pattern) ?? [])
          .filter(value => SOLID_TONE.test(value) && /\btext-white\b/.test(value))
        return hits.length ? [`${path}: ${hits.length}`] : []
      })
    expect(offenders).toEqual([])
  })
})

// DES-11: the subscription page, the trial banner and the load error box drew status words and notices in raw
// green/yellow/red Tailwind shades - 2.9-3.2:1 on white and a light green box in dark mode.
// They take the tint tokens now. The other screens with raw tones are DES-02g.
const TINTED_FILES = ['src/pages/Subscription.tsx', 'src/components/TrialBanner.tsx', 'src/components/QueryError.tsx']

describe('subscription tones', () => {
  it('come from the tint tokens', () => {
    const offenders = TINTED_FILES.flatMap(path => {
      const hits = readFileSync(resolve(root, path), 'utf8').match(PALETTE) ?? []
      return hits.length ? [`${path}: ${hits.length} (${[...new Set(hits)].slice(0, 4).join(' ')})`] : []
    })
    expect(offenders).toEqual([])
  })
})

describe('CRM accent shades', () => {
  it('come from the accent tokens', () => {
    const offenders = sources(resolve(root, 'src'))
      .map(path => relative(root, path))
      .filter(path => !ALLOWED_DIRS.some(dir => path.startsWith(dir)))
      .flatMap(path => {
        const hits = readFileSync(resolve(root, path), 'utf8').match(LIFTED_SHADE) ?? []
        return hits.length ? [`${path}: ${hits.length} (${[...new Set(hits)].slice(0, 3).join(' ')})`] : []
      })
    expect(offenders).toEqual([])
  })

  it('every accent token has a dark value', () => {
    for (const token of ['--workspace-accent', '--workspace-accent-hover', '--workspace-accent-soft', '--workspace-accent-ink', '--workspace-accent-line', '--workspace-accent-fill']) {
      expect(light.has(token), `light ${token}`).toBe(true)
      expect(followsTheme(token), `dark ${token}`).toBe(true)
    }
  })

  it('theme.css has no dark patch for old accent shades', () => {
    expect(theme).not.toMatch(/:root\.dark :is\(\.text-blue-600/)
    expect(theme).not.toMatch(/\.(?:text|bg|border)-(?:blue|purple|primary)-\d/)
  })
})

// DES-02d: a tinted rounded-full pill or a `bg-green-100 text-green-800` tone string is a
// hand-made status badge. theme.css used to repaint some of them with a global rule; that rule
// is gone, so one left over would keep the raw Tailwind tint with no dark value of ours.
// The import wizard's step dots are a stepper, not a status.
const PILL_SKIP_FILES = ['src/components/import/ImportWizard.tsx']
const PILL_PALETTE = 'green|amber|yellow|orange|red|emerald|slate|gray|sky|blue|purple|indigo|rose|teal'
const TINT_PAIR = new RegExp(`(?<![\\w:/-])bg-(${PILL_PALETTE})-(?:50|100)\\s+text-\\1-(?:600|700|800)\\b`)
const TINT = new RegExp(`(?<![\\w:/-])(?:bg-(?:${PILL_PALETTE})-(?:50|100)(?![\\w/-])|bg-\\[var\\(--(?:tint|status)-)`)

describe('CRM status pills', () => {
  it('use StatusBadge instead of a hand-made tinted pill', () => {
    const offenders = sources(resolve(root, 'src'))
      .map(path => relative(root, path))
      .filter(path => path.endsWith('.tsx') && !PILL_SKIP_FILES.includes(path) && !BUTTON_SKIP_DIRS.some(dir => path.startsWith(dir)))
      .flatMap(path => {
        const text = readFileSync(resolve(root, path), 'utf8')
        const hits = CLASS_STRINGS.flatMap(pattern => text.match(pattern) ?? [])
          .filter(value => !/\brounded-(?:md|lg|xl)\b/.test(value))
          .filter(value => TINT_PAIR.test(value) || (/\brounded-full\b/.test(value) && TINT.test(value)))
        return hits.length ? [`${path}: ${hits.length}`] : []
      })
    expect(offenders).toEqual([])
  })

  it('no screen keeps its own status pill component', () => {
    const offenders = sources(resolve(root, 'src'))
      .map(path => relative(root, path))
      .filter(path => path.endsWith('.tsx') && !path.startsWith('src/ui/'))
      .filter(path => /function Status(?:Badge|Chip|Pill)\b/.test(readFileSync(resolve(root, path), 'utf8')))
    expect(offenders).toEqual([])
  })

  it('theme.css has no global patch for old tinted pills', () => {
    expect(theme).not.toMatch(/\.rounded-full(?::is\()?\.bg-/)
  })
})

// DES-02e: Sasha's panel painted its accent with raw purple/blue shades. They happen to match
// the brand in tailwind.config, but they have no dark value of ours and drift as soon as the
// tokens move, so the panel reads the same accent tokens as the rest of the CRM.
const ACCENT_PALETTE = /(?<![\w-])(?:[a-z-]+:)*(?:bg|text|border|border-t|ring|ring-offset|outline|divide|from|to|via|placeholder|accent)-(?:blue|purple|indigo|violet|primary)-\d{2,3}\b/g

describe('assistant', () => {
  it('takes the accent from the theme tokens', () => {
    const files = sources(resolve(root, 'src/components/assistant')).map(path => relative(root, path))
    expect(files.length).toBeGreaterThan(3)
    const offenders = files.flatMap(path => {
      const hits = readFileSync(resolve(root, path), 'utf8').match(ACCENT_PALETTE) ?? []
      return hits.length ? [`${path}: ${hits.length} (${[...new Set(hits)].slice(0, 3).join(' ')})`] : []
    })
    expect(offenders).toEqual([])
  })

  it('the solid accent under white text is the same purple in both themes', () => {
    // the dark --workspace-accent is a light lilac for text; white on it would not read
    expect(light.get('--workspace-accent-fill')).toBe('#8b45dd')
  })
})

// DES-02f: index.css still carried its own dark calendar and dropdown colours from before
// the tokens. theme.css styles the calendar now, and the two sets kept overriding each other,
// so index.css keeps only layout and motion and takes every colour from the tokens.
const indexCss = readFileSync(resolve(root, 'src/index.css'), 'utf8')
const tailwindConfig = readFileSync(resolve(root, 'tailwind.config.js'), 'utf8')
const exportSource = readFileSync(resolve(root, 'src/utils/export.ts'), 'utf8')

describe('legacy global styles', () => {
  it('index.css has no colours of its own', () => {
    expect(indexCss.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([])
  })

  // DES-11: the default border and bare field background came from the Tailwind palette,
  // so in the dark theme every plain `border` was a light gray line on a dark panel
  it('index.css takes border and field colours from the theme', () => {
    expect(indexCss.match(/var\(--color-[\w-]+\)|\bwhite\b/g) ?? []).toEqual([])
  })

  it('the calendar is styled in one place', () => {
    expect(indexCss).not.toContain('react-calendar')
  })

  it('a focused calendar day stays dark in the dark theme', () => {
    // the light hover/focus tint is near-white; dark only overrode hover, so a day focused
    // from the keyboard turned into a white tile with white text
    expect(theme).toMatch(/\.dark \.crm-app \.react-calendar__tile:enabled:focus[^{]*\{[^}]*var\(--workspace-hover\)/)
  })

  it('the rounded-card utility is the card radius token', () => {
    expect(tailwindConfig).toMatch(/card:\s*'var\(--radius-card\)'/)
  })

  it('print and PDF headers wear the brand accent, not the old green', () => {
    expect(exportSource).toContain(`PRINT_ACCENT = '${light.get('--workspace-accent')}'`)
    expect(exportSource).not.toMatch(/#245f4b|139, 92, 246/i)
  })
})
