import type { ReactNode } from 'react'
import type { IconType } from 'react-icons'

// One KPI tile for a <dl> row: gradient icon, label, large number and an optional hint.
export default function StatTile({ icon: Icon, label, value, hint, tone, className = '' }: {
  icon: IconType
  label: string
  value: ReactNode
  hint?: ReactNode
  tone?: 'positive' | 'negative'
  className?: string
}) {
  return <div className={`x-stat ${className}`}>
    <dt className="x-stat-label"><span className="x-icon" aria-hidden="true"><Icon /></span>{label}</dt>
    <dd className={`x-stat-value [overflow-wrap:break-word] ${tone === 'negative' ? 'text-red-600 dark:text-red-400' : ''}`}>
      {tone === 'positive' ? <span className="x-gradient-text">{value}</span> : value}
    </dd>
    {hint != null && <dd className="mt-2 text-xs text-[var(--workspace-muted)]">{hint}</dd>}
  </div>
}
