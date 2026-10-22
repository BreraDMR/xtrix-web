import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { HiOutlineCalendar, HiOutlinePlus } from 'react-icons/hi'
import api from '../api/client'
import type { Schema } from '../api/types'
import Card from '../ui/Card'
import Button from '../ui/Button'
import SidePanel from '../ui/SidePanel'
import QueryError from '../components/QueryError'
import LoadingSpinner from '../components/LoadingSpinner'
import VisitForm from '../components/VisitForm'
import TodayAgenda from '../components/dashboard/TodayAgenda'
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
  return <section aria-labelledby="business-overview-title" className="mt-8 border-t border-[var(--workspace-line)] pt-6">
    <h2 id="business-overview-title" className="mb-4 text-base font-semibold">{t('dashboard.overview')}</h2>
    <div className="grid items-start gap-4 xl:grid-cols-3">
      <Card className="p-5">
        <h3 className="mb-4 text-sm font-medium">{t('dashboard.thisMonth')}</h3>
        {profit.isPending ? <LoadingSpinner size="sm" /> : profit.isError ? <QueryError retry={profit.refetch} /> :
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-[var(--workspace-muted)]">{t('dashboard.monthlyRevenue')}</dt><dd className="font-medium tabular-nums">{money(profit.data?.revenue)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[var(--workspace-muted)]">{t('dashboard.monthlyExpenses')}</dt><dd className="font-medium tabular-nums">{money(profit.data?.expenses)}</dd></div>
            <div className="flex justify-between gap-4 border-t border-[var(--workspace-line)] pt-3"><dt className="text-[var(--workspace-muted)]">{t('dashboard.monthlyProfit')}</dt><dd className="font-semibold tabular-nums">{money(profit.data?.profit)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[var(--workspace-muted)]">{t('dashboard.profitMargin')}</dt><dd className="tabular-nums">{profit.data?.profit_margin == null ? '—' : `${profit.data.profit_margin.toFixed(2)}%`}</dd></div>
          </dl>}
      </Card>
      <Card className="p-5">
        <h3 className="mb-4 text-sm font-medium">{t('dashboard.visitHistory')}</h3>
        {visits.isPending ? <LoadingSpinner size="sm" /> : visits.isError ? <QueryError retry={visits.refetch} /> :
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-[var(--workspace-muted)]">{t('dashboard.totalVisits')}</dt><dd className="font-semibold tabular-nums">{visits.data?.total_visits ?? '—'}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[var(--workspace-muted)]">{t('dashboard.completedVisits')}</dt><dd className="tabular-nums">{visits.data?.visits_by_status?.completed ?? 0}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[var(--workspace-muted)]">{t('visits.planned')}</dt><dd className="tabular-nums">{visits.data?.visits_by_status?.planned ?? 0}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[var(--workspace-muted)]">{t('visits.cancelled')}</dt><dd className="tabular-nums">{visits.data?.visits_by_status?.cancelled ?? 0}</dd></div>
          </dl>}
      </Card>
      <Card className="p-5">
        <h3 className="mb-4 text-sm font-medium">{t('nav.clients')}</h3>
        {clients.isPending ? <LoadingSpinner size="sm" /> : clients.isError ? <QueryError retry={clients.refetch} /> :
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-[var(--workspace-muted)]">{t('dashboard.totalClients')}</dt><dd className="font-semibold tabular-nums">{clients.data?.total_clients ?? '—'}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[var(--workspace-muted)]">{t('dashboard.newClients')}</dt><dd className="tabular-nums">{clients.data?.new_clients ?? '—'}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[var(--workspace-muted)]">{t('dashboard.averageSpending')}</dt><dd className="tabular-nums">{money(clients.data?.average_spending)}</dd></div>
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
        <Link to="/app/calendar" className="ui-button ui-button-secondary"><HiOutlineCalendar />{t('dashboard.openCalendar')}</Link>
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
