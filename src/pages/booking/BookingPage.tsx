import { useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'

import api from '../../api/client'
import { apiErrorStatus } from '../../api/errors'
import LanguageSwitcher from '../../components/LanguageSwitcher'
import LoadingSpinner from '../../components/LoadingSpinner'
import ServiceStep from '../../components/booking/ServiceStep'
import StaffStep from '../../components/booking/StaffStep'
import TimeStep from '../../components/booking/TimeStep'
import { useTranslation } from '../../hooks/useTranslation'
import { useLabels } from '../../i18n/labels'
import type {
  PublicBusinessOut,
  PublicServiceOut,
  PublicSlotOut,
  PublicSlotsOut,
  PublicStaffOut,
} from '../../api/types'
import { formatCurrency, type Currency } from '../../utils/currency'

type BookingStep = 'service' | 'staff' | 'time'

function salonDate(timeZone: string, offsetDays: number): string {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + offsetDays)
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

function PublicFrame({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-gray-900 dark:text-gray-100">
      <header className="border-b border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <span className="text-sm font-medium text-slate-500 dark:text-gray-400">{t('booking.title')}</span>
          <LanguageSwitcher />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-10">{children}</main>
    </div>
  )
}

function Unavailable() {
  const { t } = useTranslation()
  return (
    <PublicFrame>
      <section className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-gray-800">
        <h1 className="text-xl font-semibold">{t('booking.unavailableTitle')}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-slate-500 dark:text-gray-400">{t('booking.unavailableText')}</p>
      </section>
    </PublicFrame>
  )
}

function LoadError({ retry }: { retry: () => unknown }) {
  const { t } = useTranslation()
  return (
    <PublicFrame>
      <section role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
        <p>{t('common.loadError')}</p>
        <button
          type="button"
          onClick={() => void retry()}
          className="mt-3 rounded-md border border-red-300 px-4 py-2 text-sm font-medium hover:bg-red-100 dark:border-red-700 dark:hover:bg-red-900"
        >
          {t('common.retry')}
        </button>
      </section>
    </PublicFrame>
  )
}

export default function BookingPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const { t } = useTranslation()
  const labels = useLabels()

  const [step, setStep] = useState<BookingStep>('service')
  const [selectedService, setSelectedService] = useState<PublicServiceOut | null>(null)
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<PublicSlotOut | null>(null)

  const businessQuery = useQuery<PublicBusinessOut>({
    queryKey: ['public-booking', slug, 'business'],
    queryFn: async () => {
      const { data } = await api.get(`/public/booking/${encodeURIComponent(slug)}`)
      return data
    },
    enabled: Boolean(slug),
    retry: false,
  })

  const business = businessQuery.data
  const servicesQuery = useQuery<PublicServiceOut[]>({
    queryKey: ['public-booking', slug, 'services'],
    queryFn: async () => {
      const { data } = await api.get(`/public/booking/${encodeURIComponent(slug)}/services`)
      return data
    },
    enabled: Boolean(business),
    retry: false,
  })

  const staffQuery = useQuery<PublicStaffOut[]>({
    queryKey: ['public-booking', slug, 'staff', selectedService?.id ?? null],
    queryFn: async () => {
      if (!selectedService) return []
      const { data } = await api.get(`/public/booking/${encodeURIComponent(slug)}/staff`, {
        params: { service_id: selectedService.id },
      })
      return data
    },
    enabled: Boolean(selectedService),
    retry: false,
  })

  const dateFrom = business ? salonDate(business.timezone, 0) : null
  const dateTo = business ? salonDate(business.timezone, 13) : null

  const slotsQuery = useQuery<PublicSlotsOut>({
    queryKey: [
      'public-booking',
      slug,
      'slots',
      selectedService?.id ?? null,
      selectedStaffId,
      dateFrom,
      dateTo,
    ],
    queryFn: async () => {
      if (!selectedService || !dateFrom || !dateTo) throw new Error('Missing booking range')
      const { data } = await api.get(`/public/booking/${encodeURIComponent(slug)}/slots`, {
        params: {
          service_id: selectedService.id,
          staff_id: selectedStaffId ?? undefined,
          date_from: dateFrom,
          date_to: dateTo,
        },
      })
      return data
    },
    enabled: step === 'time' && Boolean(selectedService) && Boolean(dateFrom) && Boolean(dateTo),
    retry: false,
  })

  const handleSelectService = (service: PublicServiceOut) => {
    if (service.id !== selectedService?.id) {
      setSelectedStaffId(null)
      setSelectedSlot(null)
    }
    setSelectedService(service)
    setStep('staff')
  }

  const handleSelectStaff = (staffId: number | null) => {
    setSelectedStaffId(staffId)
    setSelectedSlot(null)
    setStep('time')
  }

  if (businessQuery.isLoading) {
    return (
      <PublicFrame>
        <div className="flex justify-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      </PublicFrame>
    )
  }

  if (businessQuery.isError) {
    if (apiErrorStatus(businessQuery.error) === 404) return <Unavailable />
    return <LoadError retry={businessQuery.refetch} />
  }

  if (!business) return <Unavailable />

  const currency = business.currency as Currency
  const services = servicesQuery.data ?? []

  return (
    <PublicFrame>
      <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{business.name}</h1>
            {business.business_type && (
              <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">{labels.businessType(business.business_type)}</p>
            )}
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            {t('booking.noAccount')}
          </span>
        </div>

        {business.description && (
          <p className="mt-4 whitespace-pre-line text-sm text-slate-600 dark:text-gray-300">{business.description}</p>
        )}

        <div className="mt-6 border-t border-slate-100 pt-4 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-gray-400">{t('booking.contacts')}</h2>
          <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
            {business.address && (
              <div>
                <dt className="text-slate-500 dark:text-gray-400">{t('business.address')}</dt>
                <dd>{business.address}</dd>
              </div>
            )}
            {business.phone && (
              <div>
                <dt className="text-slate-500 dark:text-gray-400">{t('clients.phone')}</dt>
                <dd>
                  <a className="text-primary-600 hover:underline dark:text-primary-400" href={`tel:${business.phone}`}>
                    {business.phone}
                  </a>
                </dd>
              </div>
            )}
            {business.email && (
              <div>
                <dt className="text-slate-500 dark:text-gray-400">{t('clients.email')}</dt>
                <dd>
                  <a className="text-primary-600 hover:underline dark:text-primary-400" href={`mailto:${business.email}`}>
                    {business.email}
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </section>

      <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800 sm:p-8">
        {selectedService && step !== 'service' && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-4 py-3 text-sm dark:bg-gray-700">
            <span className="font-medium">{selectedService.name}</span>
            <span className="text-slate-600 dark:text-gray-300">
              {selectedService.duration_minutes} {t('services.min')} ·{' '}
              {selectedService.price === null || selectedService.price === undefined
                ? t('booking.priceOnRequest')
                : formatCurrency(selectedService.price, currency)}
            </span>
          </div>
        )}

        {step === 'service' ? (
          servicesQuery.isLoading ? (
            <div className="flex justify-center py-10">
              <LoadingSpinner />
            </div>
          ) : servicesQuery.isError ? (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
              <p>{t('common.loadError')}</p>
              <button
                type="button"
                onClick={() => void servicesQuery.refetch()}
                className="mt-2 rounded-md border border-red-300 px-3 py-1.5 font-medium hover:bg-red-100 dark:border-red-700 dark:hover:bg-red-900"
              >
                {t('common.retry')}
              </button>
            </div>
          ) : services.length === 0 ? (
            <>
              <h2 className="text-lg font-semibold">{t('booking.servicesTitle')}</h2>
              <p className="mt-3 text-sm text-slate-500 dark:text-gray-400">{t('booking.noServices')}</p>
            </>
          ) : (
            <ServiceStep
              services={services}
              currency={currency}
              selectedId={selectedService?.id ?? null}
              onSelect={handleSelectService}
            />
          )
        ) : step === 'staff' ? (
          <StaffStep
            staff={staffQuery.data ?? []}
            isLoading={staffQuery.isLoading}
            isError={staffQuery.isError}
            onRetry={staffQuery.refetch}
            onSelect={handleSelectStaff}
            onBack={() => setStep('service')}
          />
        ) : (
          <TimeStep
            days={slotsQuery.data?.days ?? []}
            timezone={slotsQuery.data?.timezone ?? business.timezone}
            selectedStart={selectedSlot?.start ?? null}
            isLoading={slotsQuery.isLoading}
            isError={slotsQuery.isError}
            onRetry={slotsQuery.refetch}
            onSelect={setSelectedSlot}
            onBack={() => setStep('staff')}
          />
        )}
      </section>
    </PublicFrame>
  )
}
