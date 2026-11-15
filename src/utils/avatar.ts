// Initials on a colour from the Xtrix palette; the same seed always gets the same colour.
const COLORS = [
  'linear-gradient(135deg, #b48aee, #8b45dd)',
  'linear-gradient(135deg, #f08bc8, #e04aa8)',
  'linear-gradient(135deg, #7fb0fa, #4f8df7)',
  'linear-gradient(135deg, #5fd09b, #22a06b)',
  'linear-gradient(135deg, #fbbf5e, #f08c0b)',
  'linear-gradient(135deg, #5ad1c5, #14a89b)',
]

export function avatarBackground(seed: string | number) {
  const text = String(seed)
  let hash = 0
  for (let index = 0; index < text.length; index++) hash = (hash * 31 + text.charCodeAt(index)) >>> 0
  return COLORS[hash % COLORS.length]
}

export function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0] ?? '').join('').toLocaleUpperCase()
}
