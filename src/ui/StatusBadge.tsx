import type { HTMLAttributes } from 'react'

// One status pill for every screen. The tone picks the colour from the status tokens in
// theme.css, so "paid", "sent" or "active" are the same green as a completed visit in both
// themes and nobody carries a palette of their own. `dot` adds the small coloured dot in front.
export type StatusTone = 'info' | 'warning' | 'success' | 'danger' | 'neutral' | 'accent'

type Props = HTMLAttributes<HTMLSpanElement> & { tone: StatusTone; dot?: boolean }

export default function StatusBadge({ tone, dot = false, className = '', ...props }: Props) {
  return <span className={`x-status x-status-${tone}${dot ? ' x-status-dot' : ''} ${className}`.trim()} {...props} />
}
