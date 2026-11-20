import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { LuArrowRight, LuCalendar, LuCalendarCheck, LuPlus, LuUsers, LuWallet } from 'react-icons/lu'
import api from '../api/client'
import { apiErrorStatus } from '../api/errors'
import type { Schema } from '../api/types'
import Card from '../ui/Card'
import Button from '../ui/Button'
import SidePanel from '../ui/SidePanel'
import QueryError from '../components/QueryError'
import LoadingSpinner from '../components/LoadingSpinner'
import VisitForm from '../components/VisitForm'
import TodayAgenda from '../components/dashboard/TodayAgenda'
import DonutProgress from '../components/DonutProgress'
import WeekOverview from '../components/dashboard/WeekOverview'
import { useMyBusiness } from '../hooks/useMyBusiness'
import { useAuthStore } from '../store/authStore'
import { useTranslation } from '../hooks/useTranslation'
import { useBusinessCurrency } from '../hooks/useBusinessCurrency'
import { useWorkspaceAccessContext } from '../hooks/useWorkspaceAccess'
import { formatCurrency } from '../utils/currency'
import Welcome from '../components/onboarding/Welcome'
import Checklist from '../components/onboarding/Checklist'
import BusinessStep from '../components/onboarding/BusinessStep'
import ServiceStep from '../components/onboarding/ServiceStep'
import StaffStep from '../components/onboarding/StaffStep'
import ProductTour from '../components/onboarding/ProductTour'

function BusinessOverview() {
  const { t } = useTranslation()
  const currency = useBusinessCurrency()
  const profit = useQuery({
    queryKey: ['profit-current-month'],
    queryFn: async () => (await api.get<Schema<'ProfitReportResponse'>>('/expenses/reports/profit')).data,
    retry: false,
  })
  const visits = useQuery({
    queryKey: ['visits-statistics'],
    queryFn: async () => (await api.get<Schema<'VisitStatisticsResponse'>>('/analytics/visits/statistics')).data,
    retry: false,
  })
  const clients = useQuery({
    queryKey: ['clients-statistics'],
    queryFn: async () => (await api.get<Schema<'ClientStatisticsResponse'>>('/analytics/clients/statistics')).data,
    retry: false,
  })
  const money = (amount: number | null | undefined) => amount == null ? '—' : formatCurrency(amount, currency)
  // 403 means this person may not see money (staff without the box ticked, a solo without a
  // business) - that's not an error to retry, the card just isn't theirs
  const moneyHidden = profit.isError && apiErrorStatus(profit.error) === 403
  const { user } = useAuthStore()
  const canOpenFinance = user?.role === 'admin' || user?.role === 'business_owner'
  const total = visits.data?.total_visits ?? 0
  const completed = visits.data?.visits_by_status?.completed ?? 0
  const completion = total > 0 ? (completed / total) * 100 : 0
  const row = (label: string, value: string | number, dot?: string) => (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <dt className="flex items-center gap-2.5 text-[13.5px] text-[var(--workspace-muted)]">
        {dot && <span aria-hidden="true" className={`h-2 w-2 rounded-full ${dot}`} />}{label}
      </dt>
      <dd className="text-[15px] font-medium tracking-[-0.01em] tabular-nums">{value}</dd>
    </div>
  )
  return <section aria-labelledby="business-overview-title" className="mt-12">
    <div className="mb-4 flex items-baseline justify-between">
      <h2 id="business-overview-title" className="text-[20px] font-semibold tracking-[-0.02em]">{t('dashboard.overview')}</h2>
    </div>
    <div className="grid items-stretch gap-5 xl:grid-cols-3">
      {!moneyHidden && <Card className="flex flex-col p-7">
        <h3 className="x-stat-label"><span className="x-icon" aria-hidden="true"><LuWallet /></span>{t('dashboard.thisMonth')}</h3>
        {profit.isPending ? <LoadingSpinner size="sm" /> : profit.isError ? <QueryError retry={profit.refetch} /> : <>
          <p className="mt-5 text-[13.5px] text-[var(--workspace-muted)]">{t('dashboard.monthlyRevenue')}</p>
          <p className="mt-1 font-display text-[44px] font-semibold leading-none tracking-[-0.04em] tabular-nums">{money(profit.data?.revenue)}</p>
          {profit.data?.profit_margin != null && <p className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--x-lavender)] px-2.5 py-1 text-xs font-medium text-[var(--workspace-accent)]">
            {profit.data.profit_margin.toFixed(1)}% · {t('dashboard.profitMargin').toLowerCase()}
          </p>}
          <dl className="mt-6 divide-y divide-[var(--workspace-line)] border-t border-[var(--workspace-line)] pt-3">
            {row(t('dashboard.monthlyExpenses'), money(profit.data?.expenses))}
            {row(t('dashboard.monthlyProfit'), money(profit.data?.profit))}
          </dl>
        </>}
        <div className="min-h-6 flex-1" />
        {canOpenFinance && <Link to="/app/finance" className="ui-button ui-button-secondary w-full">{t('nav.finance')}<LuArrowRight aria-hidden="true" /></Link>}
      </Card>}
      <Card className="p-7">
        <h3 className="x-stat-label"><span className="x-icon" aria-hidden="true"><LuCalendarCheck /></span>{t('dashboard.visitHistory')}</h3>
        {visits.isPending ? <LoadingSpinner size="sm" /> : visits.isError ? <QueryError retry={visits.refetch} /> :
          <div className="mt-6 flex flex-col items-center gap-7">
            <DonutProgress value={completion} caption={`${completed} / ${total}`} />
            <dl className="w-full divide-y divide-[var(--workspace-line)]">
              {row(t('dashboard.completedVisits'), completed, 'bg-brand-pink')}
              {row(t('dashboard.plannedVisits'), visits.data?.visits_by_status?.planned ?? 0, 'bg-[var(--workspace-control)]')}
              {row(t('dashboard.cancelledVisits'), visits.data?.visits_by_status?.cancelled ?? 0, 'bg-[var(--chart-negative)]')}
              {row(t('dashboard.totalVisits'), visits.data?.total_visits ?? '—')}
            </dl>
          </div>}
      </Card>
      <Card className="p-7">
        <h3 className="x-stat-label"><span className="x-icon" aria-hidden="true"><LuUsers /></span>{t('nav.clients')}</h3>
        {clients.isPending ? <LoadingSpinner size="sm" /> : clients.isError ? <QueryError retry={clients.refetch} /> : <>
          <p className="mt-5 text-[13.5px] text-[var(--workspace-muted)]">{t('dashboard.totalClients')}</p>
          <p className="mt-1 font-display text-[44px] font-semibold leading-none tracking-[-0.04em] tabular-nums"><span className="x-gradient-text">{clients.data?.total_clients ?? '—'}</span></p>
          <dl className="mt-6 divide-y divide-[var(--workspace-line)] border-t border-[var(--workspace-line)] pt-3">
            {row(t('dashboard.newClients'), clients.data?.new_clients ?? '—')}
            {row(t('dashboard.averageSpending'), money(clients.data?.average_spending))}
          </dl>
        </>}
      </Card>
    </div>
  </section>
}

export default function Dashboard() {
  const { t, locale } = useTranslation()
  const { user, token } = useAuthStore()
  const business = useMyBusiness(!!user)
  const access = useWorkspaceAccessContext()
  const canEdit = !access || access.crm_mode === 'full'
  const queryClient = useQueryClient()
  const [form, setForm] = useState<{ visitId?: number } | null>(null)
  if (!token) return null
  if (business.isPending) return <LoadingSpinner size="lg" />
  if (business.isError) return <QueryError retry={business.refetch} />
  if (user?.role === 'business_owner' && business.data === null) return <>
    <Welcome /><Checklist /><BusinessStep />
  </>
  const timeZone = business.data?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
  const now = new Date()
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', hourCycle: 'h23' }).format(now))
  const greeting = t(hour < 12 ? 'dashboard.greeting.morning' : hour < 18 ? 'dashboard.greeting.afternoon' : 'dashboard.greeting.evening')
  const firstName = user?.full_name?.trim().split(/\s+/)[0]
  const today = new Intl.DateTimeFormat(locale === 'cz' ? 'cs-CZ' : locale === 'ru' ? 'ru-RU' : 'en-GB', { timeZone, weekday: 'long', day: 'numeric', month: 'long' }).format(now)
  const savedVisit = () => {
    setForm(null)
    for (const key of ['visits', 'visits-statistics', 'profit-current-month', 'clients-statistics']) {
      void queryClient.invalidateQueries({ queryKey: [key] })
    }
  }
  return <div>
    <div className="page-toolbar">
      <div>
        <p className="mb-2 text-[13.5px] font-medium"><span className="x-gradient-text">{greeting}{firstName ? `, ${firstName}` : ''}</span><span className="text-[var(--workspace-muted)]"> · {today}</span></p>
        <h1 className="page-title">{t('dashboard.title')}</h1><p className="page-subtitle">{t('dashboard.subtitle')}</p>
      </div>
      <div className="page-actions">
        <Link to="/app/calendar" aria-label={t('dashboard.openCalendar')} className="ui-button ui-button-secondary"><LuCalendar />{t('nav.calendar')}</Link>
        {canEdit && <Button onClick={() => setForm({})}><LuPlus />{t('visits.newVisit')}</Button>}
      </div>
    </div>
    <Welcome />
    <Checklist />
    <TodayAgenda timeZone={timeZone} onEdit={visitId => setForm({ visitId })} />
    <div className="mt-5"><ServiceStep /><StaffStep /></div>
    <WeekOverview timeZone={timeZone} />
    <BusinessOverview />
    <ProductTour />
    {form && canEdit && <SidePanel title={t(form.visitId ? 'visits.editVisit' : 'visits.newVisit')} onClose={() => setForm(null)}>
      <VisitForm visitId={form.visitId} onSuccess={savedVisit} onCancel={() => setForm(null)} />
    </SidePanel>}
  </div>
}
