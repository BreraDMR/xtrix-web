import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { HiOutlineCalendar, HiOutlinePlus } from 'react-icons/hi'
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
  const statusRow = (label: string, value: string | number) => (
    <div className="flex items-center justify-between gap-4 rounded-[14px] bg-[#f4f4f6] px-3.5 py-2.5 dark:bg-white/5">
      <dt className="text-xs font-bold text-[var(--workspace-muted)]">{label}</dt>
      <dd className="min-w-[58px] rounded-md border border-[#d9c5f8] bg-[#efe6fc] px-3 py-0.5 text-center text-xs font-semibold tabular-nums dark:border-primary-800 dark:bg-primary-900/40">{value}</dd>
    </div>
  )
  return <section aria-labelledby="business-overview-title" className="mt-8">
    <h2 id="business-overview-title" className="mb-4 text-[17px] font-semibold">{t('dashboard.overview')}</h2>
    <div className="grid items-stretch gap-6 xl:grid-cols-3">
      {!moneyHidden && <Card className="flex flex-col p-7">
        <h3 className="text-[15px] font-semibold">{t('dashboard.thisMonth')}</h3>
        {profit.isPending ? <LoadingSpinner size="sm" /> : profit.isError ? <QueryError retry={profit.refetch} /> : <>
          <p className="mt-2 text-xs font-semibold text-[var(--workspace-muted)]">{t('dashboard.monthlyRevenue')}</p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="text-[34px] font-bold leading-none tabular-nums">{money(profit.data?.revenue)}</span>
            {profit.data?.profit_margin != null && <span className="text-xs font-semibold text-[var(--workspace-muted)]">
              <span className="text-sm font-bold text-brand-pink">{profit.data.profit_margin.toFixed(2)}%</span> {t('dashboard.profitMargin').toLowerCase()}
            </span>}
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div><dt className="font-bold text-[#8f8f99]">{t('dashboard.monthlyExpenses')}:</dt><dd className="font-bold tabular-nums">{money(profit.data?.expenses)}</dd></div>
            <div><dt className="font-bold text-[#8f8f99]">{t('dashboard.monthlyProfit')}:</dt><dd className="font-bold tabular-nums">{money(profit.data?.profit)}</dd></div>
          </dl>
        </>}
        <div className="min-h-6 flex-1" />
        {canOpenFinance && <Link to="/app/finance" className="ui-button ui-button-primary w-full py-2.5 text-[15px]">{t('nav.finance')}</Link>}
      </Card>}
      <Card className="p-7">
        <h3 className="text-[15px] font-semibold">{t('dashboard.visitHistory')}</h3>
        {visits.isPending ? <LoadingSpinner size="sm" /> : visits.isError ? <QueryError retry={visits.refetch} /> :
          <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row xl:flex-col 2xl:flex-row">
            <DonutProgress value={completion} caption={`${completed} / ${total}`} />
            <dl className="w-full space-y-2.5 text-[13px]">
              <div className="flex items-center justify-between gap-4"><dt className="flex items-center gap-2"><span className="h-2 w-2 bg-brand-pink" />{t('dashboard.completedVisits')}</dt><dd className="font-bold tabular-nums">{completed}</dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="flex items-center gap-2"><span className="h-2 w-2 bg-[#e6e6ea]" />{t('dashboard.plannedVisits')}</dt><dd className="font-bold tabular-nums">{visits.data?.visits_by_status?.planned ?? 0}</dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="flex items-center gap-2"><span className="h-2 w-2 bg-[#c81e3a]" />{t('dashboard.cancelledVisits')}</dt><dd className="font-bold tabular-nums">{visits.data?.visits_by_status?.cancelled ?? 0}</dd></div>
              <div className="flex items-center justify-between gap-4 border-t border-[var(--workspace-line)] pt-2.5"><dt className="text-[var(--workspace-muted)]">{t('dashboard.totalVisits')}</dt><dd className="font-bold tabular-nums">{visits.data?.total_visits ?? '—'}</dd></div>
            </dl>
          </div>}
      </Card>
      <Card className="p-7">
        <h3 className="text-[15px] font-semibold">{t('nav.clients')}</h3>
        {clients.isPending ? <LoadingSpinner size="sm" /> : clients.isError ? <QueryError retry={clients.refetch} /> :
          <dl className="mt-5 space-y-3.5">
            {statusRow(t('dashboard.totalClients'), clients.data?.total_clients ?? '—')}
            {statusRow(t('dashboard.newClients'), clients.data?.new_clients ?? '—')}
            {statusRow(t('dashboard.averageSpending'), money(clients.data?.average_spending))}
          </dl>}
      </Card>
    </div>
  </section>
}

export default function Dashboard() {
  const { t } = useTranslation()
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
  const savedVisit = () => {
    setForm(null)
    for (const key of ['visits', 'visits-statistics', 'profit-current-month', 'clients-statistics']) {
      void queryClient.invalidateQueries({ queryKey: [key] })
    }
  }
  return <div>
    <div className="page-toolbar">
      <div><h1 className="page-title">{t('dashboard.title')}</h1><p className="page-subtitle">{t('dashboard.subtitle')}</p></div>
      <div className="page-actions">
        <Link to="/app/calendar" aria-label={t('dashboard.openCalendar')} className="ui-button ui-button-secondary"><HiOutlineCalendar />{t('nav.calendar')}</Link>
        {canEdit && <Button onClick={() => setForm({})}><HiOutlinePlus />{t('visits.newVisit')}</Button>}
      </div>
    </div>
    <Welcome />
    <Checklist />
    <TodayAgenda timeZone={timeZone} onEdit={visitId => setForm({ visitId })} />
    <div className="mt-5"><ServiceStep /><StaffStep /></div>
    <BusinessOverview />
    <ProductTour />
    {form && canEdit && <SidePanel title={t(form.visitId ? 'visits.editVisit' : 'visits.newVisit')} onClose={() => setForm(null)}>
      <VisitForm visitId={form.visitId} onSuccess={savedVisit} onCancel={() => setForm(null)} />
    </SidePanel>}
  </div>
}
