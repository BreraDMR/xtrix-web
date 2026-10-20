import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Select from '../ui/Select'
import LoadingSpinner from '../components/LoadingSpinner'
import WeeklyEditor from '../components/schedules/WeeklyEditor'
import DateExceptions from '../components/schedules/DateExceptions'
import { useAuthStore } from '../store/authStore'
import { useMyBusiness } from '../hooks/useMyBusiness'
import { useTranslation } from '../hooks/useTranslation'
import type { TranslationKey } from '../i18n/translations'

type Tab = 'weekly' | 'exceptions'

interface EmployeeRow {
  employee_user_id: number
  employee_user?: { full_name?: string; email?: string | null } | null
}

const TABS: { id: Tab; label: TranslationKey }[] = [
  { id: 'weekly', label: 'schedule.tab.weekly' },
  { id: 'exceptions', label: 'schedule.tab.exceptions' },
]

export default function Schedule() {
  const { user } = useAuthStore()
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('weekly')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const canManageSchedule = user?.role === 'admin'
    || user?.role === 'business_owner'
    || user?.role === 'specialist'
  const managesBusiness = user?.role === 'admin' || user?.role === 'business_owner'

  const { data: business, isLoading: businessLoading } = useMyBusiness(!!user && canManageSchedule)

  const { data: employees } = useQuery<EmployeeRow[]>({
    queryKey: ['employees', true],
    queryFn: async () => {
      const { data } = await api.get('/employees/', { params: { is_active: true } })
      return Array.isArray(data) ? data : []
    },
    enabled: !!user && managesBusiness,
  })

  const specialists = useMemo(() => {
    if (!user) return []
    const rows = [{ id: user.id, name: user.full_name }]
    if (managesBusiness) {
      for (const employee of employees ?? []) {
        rows.push({
          id: employee.employee_user_id,
          name: employee.employee_user?.full_name
            || employee.employee_user?.email
            || `#${employee.employee_user_id}`,
        })
      }
    }
    return rows
  }, [user, employees, managesBusiness])

  const activeId = selectedId && specialists.some((item) => item.id === selectedId)
    ? selectedId
    : specialists[0]?.id
  const timeZone = business?.timezone ?? 'UTC'

  if (!user || !canManageSchedule) {
    return (
      <Card className="p-5">
        <h1 className="page-title">{t('schedule.title')}</h1>
        <p className="mt-2 text-sm text-[var(--workspace-muted)]">{t('schedule.noAccess')}</p>
      </Card>
    )
  }

  return (
    <div>
      <div className="page-toolbar">
        <div>
          <h1 className="page-title">{t('schedule.title')}</h1>
          <p className="mt-1 text-sm text-[var(--workspace-muted)]">{t('schedule.subtitle')}</p>
        </div>
        <div className="text-sm text-[var(--workspace-muted)]">
          {t('schedule.timezone')}: <span className="font-medium text-[var(--workspace-ink)]">{timeZone}</span>
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <label className="w-full max-w-xs text-sm">
          <span className="mb-1 block">{t('schedule.specialist')}</span>
          <Select
            value={activeId ?? ''}
            onChange={(event) => setSelectedId(Number(event.target.value))}
            disabled={specialists.length < 2}
          >
            {specialists.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </Select>
        </label>
        <div role="tablist" aria-label={t('schedule.title')} className="flex flex-wrap gap-2">
          {TABS.map((item) => (
            <Button
              key={item.id}
              role="tab"
              aria-selected={tab === item.id}
              variant={tab === item.id ? 'primary' : 'quiet'}
              onClick={() => setTab(item.id)}
            >
              {t(item.label)}
            </Button>
          ))}
        </div>
      </div>

      {businessLoading && (
        <div className="flex h-40 items-center justify-center"><LoadingSpinner size="lg" /></div>
      )}
      {!businessLoading && activeId !== undefined && tab === 'weekly' && (
        <WeeklyEditor key={`weekly-${activeId}`} specialistId={activeId} />
      )}
      {!businessLoading && activeId !== undefined && tab === 'exceptions' && (
        <DateExceptions key={`exceptions-${activeId}`} specialistId={activeId} timeZone={timeZone} />
      )}
    </div>
  )
}
