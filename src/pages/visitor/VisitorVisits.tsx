import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useInfiniteQuery } from '@tanstack/react-query'
import { LuCalendarPlus, LuMailOpen } from 'react-icons/lu'
import visitorApi, { visitorKey } from '../../api/visitorClient'
import { apiErrorMessage } from '../../api/errors'
import type { Schema } from '../../api/types'
import Tabs from '../../ui/Tabs'
import Select from '../../ui/Select'
import Button from '../../ui/Button'
import LoadingSpinner from '../../components/LoadingSpinner'
import VisitSummary from '../../components/visitor/VisitSummary'
import { Isolated, Notice, VisitorShell } from '../../components/visitor/VisitorUi'
import { useTranslation } from '../../hooks/useTranslation'

type Category = 'upcoming' | 'past' | 'cancelled' | 'all'
type Page = Schema<'VisitorHistoryPage'>
type Cursor = Schema<'VisitorHistoryCursor'>

export default function VisitorVisits() {
  const { t } = useTranslation()
  const location = useLocation()
  const notice = (location.state as { notice?: string } | null)?.notice
  const [category, setCategory] = useState<Category>('upcoming')
  const [businessId, setBusinessId] = useState<number | null>(null)
  // salons met so far, so the filter keeps its options while one salon is selected
  const [salons, setSalons] = useState<Map<number, string>>(() => new Map())

  const feed = useInfiniteQuery<Page, Error, { pages: Page[] }, readonly unknown[], Cursor | null>({
    queryKey: visitorKey('visits', category, businessId),
    initialPageParam: null,
    retry: false,
    queryFn: async ({ pageParam, signal }) => {
      const params: Record<string, string | number> = { category, limit: 25 }
      if (businessId !== null) params.business_id = businessId
      if (pageParam) {
        params.after_start = pageParam.date_start
        params.after_id = pageParam.id
        if (category !== 'all' && pageParam.as_of) params.as_of = pageParam.as_of
      }
      return (await visitorApi.get<Page>('/visitor/visits', { params, signal })).data
    },
    getNextPageParam: last => last.next_cursor ?? undefined,
  })

  const visits = useMemo(() => feed.data?.pages.flatMap(page => page.entries) ?? [], [feed.data])
  useEffect(() => {
    setSalons(previous => {
      const missing = visits.filter(entry => !previous.has(entry.business_id))
      if (!missing.length) return previous
      const next = new Map(previous)
      for (const entry of missing) next.set(entry.business_id, entry.business.name)
      return next
    })
  }, [visits])
  const tabs = [
    { id: 'upcoming' as const, label: t('visitor.feed.upcoming') },
    { id: 'past' as const, label: t('visitor.feed.past') },
    { id: 'cancelled' as const, label: t('visitor.feed.cancelled') },
    { id: 'all' as const, label: t('visitor.feed.all') },
  ]
  const salonOptions = [...salons.entries()].sort((a, b) => a[1].localeCompare(b[1]))

  return <VisitorShell title={t('visitor.feed.title')} subtitle={t('visitor.feed.subtitle')}>
    {notice && <Notice tone="success" className="mb-5">{notice}</Notice>}
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <Tabs tabs={tabs} value={category} onChange={setCategory} label={t('visitor.feed.title')} className="!mb-0" />
      {salonOptions.length > 1 || businessId !== null ? <Select aria-label={t('visitor.feed.salon')} className="w-auto max-w-full"
        value={businessId ?? ''} onChange={event => setBusinessId(event.target.value ? Number(event.target.value) : null)}>
        <option value="">{t('visitor.feed.allSalons')}</option>
        {salonOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
      </Select> : null}
    </div>

    {feed.isPending ? <div className="py-12"><LoadingSpinner /></div>
      : feed.isError && !visits.length ? <Notice tone="error">
        <p>{apiErrorMessage(feed.error, t('common.loadError'))}</p>
        <Button variant="secondary" className="mt-3" onClick={() => void feed.refetch()}>{t('common.retry')}</Button>
      </Notice>
        : !visits.length ? <Empty category={category} filtered={businessId !== null} />
          : <ul className="flex flex-col gap-3">
            {visits.map(visit => <li key={visit.id}>
              <Isolated fallback={<Notice tone="warning">{t('visitor.feed.cardFailed')}</Notice>}>
                <VisitSummary visit={visit} />
              </Isolated>
            </li>)}
          </ul>}

    {feed.isFetchNextPageError && visits.length > 0 && <Notice tone="error" className="mt-4">
      {apiErrorMessage(feed.error, t('common.loadError'))}
    </Notice>}
    {feed.hasNextPage && visits.length > 0 && <div className="mt-6 flex justify-center">
      <Button variant="secondary" disabled={feed.isFetchingNextPage} onClick={() => void feed.fetchNextPage()}>
        {t(feed.isFetchingNextPage ? 'common.loading' : 'visitor.feed.more')}
      </Button>
    </div>}
  </VisitorShell>
}

// An empty cabinet is normal: say how visits get here.
function Empty({ category, filtered }: { category: Category; filtered: boolean }) {
  const { t } = useTranslation()
  if (filtered || category !== 'upcoming' && category !== 'all') return <p className="rounded-[22px] bg-[var(--workspace-panel)] px-6 py-10 text-center text-sm text-[var(--workspace-muted)] shadow-[var(--workspace-card-shadow)]">{t('visitor.feed.emptyCategory')}</p>
  return <section className="ui-card px-6 py-10 text-center sm:px-10">
    <h2 className="text-[19px] font-semibold tracking-[-0.02em]">{t('visitor.feed.emptyTitle')}</h2>
    <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--workspace-muted)]">{t('visitor.feed.emptyText')}</p>
    <ul className="mx-auto mt-7 grid max-w-xl gap-3 text-left sm:grid-cols-2">
      <li className="rounded-2xl bg-[var(--workspace-bg)] p-4">
        <span className="x-icon" aria-hidden="true"><LuCalendarPlus /></span>
        <p className="mt-3 text-sm font-semibold">{t('visitor.feed.howBooking')}</p>
        <p className="mt-1 text-[13px] leading-relaxed text-[var(--workspace-muted)]">{t('visitor.feed.howBookingText')}</p>
      </li>
      <li className="rounded-2xl bg-[var(--workspace-bg)] p-4">
        <span className="x-icon" aria-hidden="true"><LuMailOpen /></span>
        <p className="mt-3 text-sm font-semibold">{t('visitor.feed.howInvite')}</p>
        <p className="mt-1 text-[13px] leading-relaxed text-[var(--workspace-muted)]">{t('visitor.feed.howInviteText')}</p>
      </li>
    </ul>
  </section>
}
