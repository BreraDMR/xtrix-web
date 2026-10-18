export type Theme = 'light' | 'dark' | 'system'

export function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system'
}

export function savedTheme(): Theme {
  try {
    const value = localStorage.getItem('theme')
    return isTheme(value) ? value : 'light'
  } catch {
    return 'light'
  }
}

export function applyTheme(theme: Theme) {
  const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
  try {
    localStorage.setItem('theme', theme)
  } catch {
    // Appearance still works when browser storage is unavailable.
  }
}
