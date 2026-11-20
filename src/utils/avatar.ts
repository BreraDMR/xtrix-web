// Initials on a colour from the Xtrix palette; the same seed always gets the same colour.
// The gradients themselves live in theme.css as --avatar-1..6.
const COLORS = [1, 2, 3, 4, 5, 6].map(index => `var(--avatar-${index})`)

export function avatarBackground(seed: string | number) {
  const text = String(seed)
  let hash = 0
  for (let index = 0; index < text.length; index++) hash = (hash * 31 + text.charCodeAt(index)) >>> 0
  return COLORS[hash % COLORS.length]
}

export function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0] ?? '').join('').toLocaleUpperCase()
}
