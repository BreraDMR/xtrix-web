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
      {icon && <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-lavender text-primary-500">{icon}</div>}
      <h3 className="text-[15px] font-bold text-brand-ink mb-1">
        {title || t('common.noData')}
      </h3>
      {description && (
        <p className="text-xs font-semibold text-[#8f8f99] max-w-md mb-4">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
