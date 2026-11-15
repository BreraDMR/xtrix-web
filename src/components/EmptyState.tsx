import React from 'react'
import { useTranslation } from '../hooks/useTranslation'

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

export default function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  const { t } = useTranslation()
  
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[var(--workspace-fill)] text-[var(--workspace-muted)]">{icon}</div>}
      <h3 className="mb-1 text-[17px] font-semibold tracking-[-0.02em] text-[var(--workspace-ink)]">
        {title || t('common.noData')}
      </h3>
      {description && (
        <p className="mb-4 max-w-sm text-[13.5px] text-[var(--workspace-muted)]">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
