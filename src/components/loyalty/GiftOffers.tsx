import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import api from '../../api/client'
import { apiErrorMessage } from '../../api/errors'
import { useBusinessCurrency } from '../../hooks/useBusinessCurrency'
import { useTranslation } from '../../hooks/useTranslation'
import type { TranslationKey } from '../../i18n/translations'
import type {
  GiftCertificateDetailOut,
  GiftCertificateOut,
  GiftOfferIn,
  GiftOfferOut,
  PublicBookingSettingsOut,
  ServiceOut,
} from '../../api/types'
import { formatCurrency, type Currency } from '../../utils/currency'
import { showDay } from '../../utils/dates'
import LoadingSpinner from '../LoadingSpinner'

type OfferKind = 'money' | 'package'

type OfferDraft = {
  name: string
  description: string
  kind: OfferKind
  price: string
  faceValue: string
  visitsCount: string
  validityDays: string
  serviceIds: number[]
  isActive: boolean
}

const EMPTY_DRAFT: OfferDraft = {
  name: '',
  description: '',
  kind: 'money',
  price: '',
  faceValue: '',
  visitsCount: '1',
  validityDays: '365',
  serviceIds: [],
  isActive: true,
}

function draftFrom(offer: GiftOfferOut): OfferDraft {
  return {
    name: offer.name,
    description: offer.description ?? '',
    kind: offer.kind === 'package' ? 'package' : 'money',
    price: String(offer.price),
    faceValue: offer.face_value == null ? '' : String(offer.face_value),
    visitsCount: String(offer.visits_count ?? 1),
    validityDays: String(offer.validity_days),
    serviceIds: offer.service_ids ?? [],
    isActive: offer.is_active,
  }
}

function payloadFrom(draft: OfferDraft): GiftOfferIn {
  return {
    name: draft.name.trim(),
    description: draft.description.trim() || null,
    kind: draft.kind,
    price: Number(draft.price),
    face_value: draft.kind === 'money' ? Number(draft.faceValue) : null,
    visits_count: draft.kind === 'package' ? Number(draft.visitsCount) : null,
    validity_days: Number(draft.validityDays),
    service_ids: draft.serviceIds,
    is_active: draft.isActive,
  }
}

function requestKey(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

const STATUS_KEYS: Record<string, TranslationKey> = {
  active: 'gift.status.active',
  exhausted: 'gift.status.exhausted',
  expired: 'gift.status.expired',
  cancelled: 'gift.status.cancelled',
}

const LEDGER_KEYS: Record<string, TranslationKey> = {
  issued: 'gift.ledger.issued',
  redeemed: 'gift.ledger.redeemed',
  reversed: 'gift.ledger.reversed',
  expired: 'gift.ledger.expired',
}

function StatusChip({ status }: { status: string }) {
  const { t } = useTranslation()
  const tone =
    status === 'active'
      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
      : status === 'exhausted'
        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>
      {t(STATUS_KEYS[status] ?? 'gift.status.active')}
    </span>
  )
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const { t } = useTranslation()
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="gift-modal-title"
        className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id="gift-modal-title" className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            {t('gift.close')}
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function CertificateDetail({
  certificateId,
  canReverse,
  onClose,
}: {
  certificateId: number
  canReverse: boolean
  onClose: () => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [reversed, setReversed] = useState(false)

  const detailQuery = useQuery<GiftCertificateDetailOut>({
    queryKey: ['gift-certificate', certificateId],
    retry: false,
    queryFn: async () => {
      const { data } = await api.get(`/businesses/me/gift-certificates/${certificateId}`)
      return data
    },
  })

  const reverse = useMutation({
    mutationFn: async (entryId: number) => {
      const { data } = await api.post(`/businesses/me/gift-certificates/${certificateId}/reversals`, {
        redemption_entry_id: entryId,
        request_key: requestKey('reverse'),
      })
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['gift-certificate', certificateId] })
      void queryClient.invalidateQueries({ queryKey: ['gift-certificates'] })
      setReversed(true)
    },
  })

  const certificate = detailQuery.data
  const reversedIds = new Set(
    (certificate?.ledger ?? [])
      .filter((row) => row.entry_type === 'reversed' && row.redeems_entry_id != null)
      .map((row) => row.redeems_entry_id as number),
  )

  return (
    <Modal title={t('gift.details')} onClose={onClose}>
      {detailQuery.isLoading ? (
        <LoadingSpinner />
      ) : detailQuery.isError ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {apiErrorMessage(detailQuery.error, t('gift.loadError'))}
        </p>
      ) : certificate ? (
        <div className="space-y-5">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-gray-500 dark:text-gray-400">{t('gift.name')}</dt>
              <dd className="font-medium">{certificate.offer_name}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">{t('gift.kind')}</dt>
              <dd className="font-medium">
                {certificate.kind === 'money' ? t('gift.kindMoney') : t('gift.kindPackage')}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">{t('gift.code')}</dt>
              <dd className="font-medium">•••• {certificate.code_last4}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">{t('gift.remaining')}</dt>
              <dd className="font-medium">
                {certificate.kind === 'money'
                  ? formatCurrency(certificate.money_balance, certificate.currency as Currency)
                  : `${certificate.visits_remaining} / ${certificate.visits_total}`}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">{t('gift.recipient')}</dt>
              <dd className="font-medium">{certificate.recipient_name}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">{t('gift.validUntil')}</dt>
              <dd className="font-medium">{showDay(certificate.expires_at)}</dd>
            </div>
          </dl>

          {reversed && (
            <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
              {t('gift.reverseDone')}
            </p>
          )}
          {reverse.isError && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
              {apiErrorMessage(reverse.error, t('gift.reverseError'))}
            </p>
          )}

          <div>
            <h3 className="mb-2 font-semibold">{t('gift.ledger')}</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">{t('gift.kind')}</th>
                    <th className="px-3 py-2 text-left font-medium">{t('gift.amountToUse')}</th>
                    <th className="px-3 py-2 text-left font-medium">{t('gift.visit')}</th>
                    <th className="px-3 py-2 text-left font-medium">{t('gift.validUntil')}</th>
                    {canReverse && <th className="px-3 py-2" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {(certificate.ledger ?? []).map((row) => (
                    <tr key={row.id}>
                      <td className="px-3 py-2">{t(LEDGER_KEYS[row.entry_type] ?? 'gift.ledger.issued')}</td>
                      <td className="px-3 py-2">
                        {row.amount_delta !== 0
                          ? formatCurrency(row.amount_delta, certificate.currency as Currency)
                          : row.units_delta !== 0
                            ? `${row.units_delta > 0 ? '+' : ''}${row.units_delta} ${t('gift.visitsUnit')}`
                            : '—'}
                      </td>
                      <td className="px-3 py-2">{row.visit_id ?? '—'}</td>
                      <td className="px-3 py-2">{showDay(row.created_at)}</td>
                      {canReverse && (
                        <td className="px-3 py-2 text-right">
                          {row.entry_type === 'redeemed' && !reversedIds.has(row.id) ? (
                            <button
                              type="button"
                              disabled={reverse.isPending}
                              onClick={() => {
                                if (window.confirm(t('gift.reverseConfirm'))) reverse.mutate(row.id)
                              }}
                              className="rounded-md border border-amber-300 px-3 py-1 text-xs font-medium text-amber-800 hover:bg-amber-50 disabled:opacity-60 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-950"
                            >
                              {t('gift.reverse')}
                            </button>
                          ) : null}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}

export default function GiftOffers({ canReverse = false }: { canReverse?: boolean }) {
  const { t } = useTranslation()
  const currency = useBusinessCurrency()
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<OfferDraft | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formError, setFormError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [detailId, setDetailId] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

  const offersQuery = useQuery<GiftOfferOut[]>({
    queryKey: ['gift-offers'],
    queryFn: async () => {
      const { data } = await api.get('/businesses/me/gift-offers')
      return data
    },
  })

  const servicesQuery = useQuery<ServiceOut[]>({
    queryKey: ['services'],
    queryFn: async () => {
      const { data } = await api.get('/services/')
      return Array.isArray(data) ? data : (data?.items ?? [])
    },
  })

  const settingsQuery = useQuery<PublicBookingSettingsOut>({
    queryKey: ['public-booking-settings'],
    retry: false,
    queryFn: async () => {
      const { data } = await api.get('/businesses/me/public-booking')
      return data
    },
  })

  const certificatesQuery = useQuery<GiftCertificateOut[]>({
    queryKey: ['gift-certificates', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '100' })
      if (statusFilter) params.set('status', statusFilter)
      const { data } = await api.get(`/businesses/me/gift-certificates?${params.toString()}`)
      return data
    },
  })

  const saveOffer = useMutation({
    mutationFn: async (payload: GiftOfferIn) => {
      if (editingId != null) {
        const { data } = await api.put(`/businesses/me/gift-offers/${editingId}`, payload)
        return data
      }
      const { data } = await api.post('/businesses/me/gift-offers', payload)
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['gift-offers'] })
      setDraft(null)
      setEditingId(null)
      setFormError('')
    },
    onError: (error) => setFormError(apiErrorMessage(error, t('gift.saveError'))),
  })

  const toggleOffer = useMutation({
    mutationFn: async (offer: GiftOfferOut) => {
      const { data } = await api.put(`/businesses/me/gift-offers/${offer.id}`, {
        ...payloadFrom(draftFrom(offer)),
        is_active: !offer.is_active,
      })
      return data
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['gift-offers'] }),
  })

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timer)
  }, [copied])

  const services = servicesQuery.data ?? []
  const offers = offersQuery.data ?? []
  const certificates = certificatesQuery.data ?? []
  const shopUrl =
    settingsQuery.data?.slug != null
      ? `${window.location.origin}/gift/${encodeURIComponent(settingsQuery.data.slug)}`
      : null

  const serviceNames = (ids: number[]) =>
    ids.length === 0
      ? t('gift.allServices')
      : ids.map((id) => services.find((service) => service.id === id)?.name ?? `#${id}`).join(', ')

  const openCreate = () => {
    setEditingId(null)
    setFormError('')
    setDraft({ ...EMPTY_DRAFT })
  }

  const openEdit = (offer: GiftOfferOut) => {
    setEditingId(offer.id)
    setFormError('')
    setDraft(draftFrom(offer))
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!draft) return
    saveOffer.mutate(payloadFrom(draft))
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('gift.offersTitle')}</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t('gift.offersSubtitle')}</p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            {t('gift.addOffer')}
          </button>
        </div>

        <div className="mt-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <p className="text-sm font-medium">{t('gift.publicLink')}</p>
          {shopUrl ? (
            <>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('gift.publicLinkHint')}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <a
                  href={shopUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-sm text-primary-600 underline dark:text-primary-400"
                >
                  {shopUrl}
                </a>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard
                      .writeText(shopUrl)
                      .then(() => setCopied(true))
                      .catch(() => setCopied(false))
                  }}
                  className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  {copied ? t('gift.copied') : t('gift.copy')}
                </button>
              </div>
            </>
          ) : (
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">{t('gift.needSlug')}</p>
          )}
        </div>

        <div className="mt-5">
          {offersQuery.isLoading ? (
            <LoadingSpinner />
          ) : offersQuery.isError ? (
            <p role="alert" className="text-sm text-red-700 dark:text-red-300">
              {apiErrorMessage(offersQuery.error, t('gift.loadError'))}
            </p>
          ) : offers.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('gift.noOffers')}</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {offers.map((offer) => (
                <li key={offer.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{offer.name}</p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {offer.kind === 'money' ? t('gift.kindMoney') : t('gift.kindPackage')}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        offer.is_active
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {offer.is_active ? t('gift.active') : t('gift.inactive')}
                    </span>
                  </div>
                  {offer.description && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{offer.description}</p>
                  )}
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <dt className="text-gray-500 dark:text-gray-400">{t('gift.price')}</dt>
                    <dd className="text-right font-medium">{formatCurrency(offer.price, currency)}</dd>
                    <dt className="text-gray-500 dark:text-gray-400">
                      {offer.kind === 'money' ? t('gift.faceValue') : t('gift.visitsCount')}
                    </dt>
                    <dd className="text-right font-medium">
                      {offer.kind === 'money'
                        ? formatCurrency(offer.face_value ?? 0, currency)
                        : `${offer.visits_count} ${t('gift.visitsUnit')}`}
                    </dd>
                    <dt className="text-gray-500 dark:text-gray-400">{t('gift.services')}</dt>
                    <dd className="text-right font-medium">{serviceNames(offer.service_ids ?? [])}</dd>
                    <dt className="text-gray-500 dark:text-gray-400">{t('gift.validityDays')}</dt>
                    <dd className="text-right font-medium">{offer.validity_days}</dd>
                  </dl>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(offer)}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      {t('gift.editOffer')}
                    </button>
                    <button
                      type="button"
                      disabled={toggleOffer.isPending}
                      onClick={() => toggleOffer.mutate(offer)}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      {offer.is_active ? t('gift.inactive') : t('gift.active')}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('gift.certificatesTitle')}</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t('gift.certificatesSubtitle')}</p>
          </div>
          <label className="text-sm">
            <span className="sr-only">{t('gift.statusFilter.all')}</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
            >
              <option value="">{t('gift.statusFilter.all')}</option>
              <option value="active">{t('gift.status.active')}</option>
              <option value="exhausted">{t('gift.status.exhausted')}</option>
              <option value="expired">{t('gift.status.expired')}</option>
            </select>
          </label>
        </div>

        {certificatesQuery.isLoading ? (
          <div className="mt-4">
            <LoadingSpinner />
          </div>
        ) : certificatesQuery.isError ? (
          <p role="alert" className="mt-4 text-sm text-red-700 dark:text-red-300">
            {apiErrorMessage(certificatesQuery.error, t('gift.loadError'))}
          </p>
        ) : certificates.length === 0 ? (
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">{t('gift.noCertificates')}</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t('gift.code')}
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t('gift.name')}
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t('gift.remaining')}
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t('gift.recipient')}
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t('gift.validUntil')}
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t('gift.kind')}
                  </th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {certificates.map((certificate) => (
                  <tr key={certificate.id}>
                    <td className="px-4 py-3 text-sm font-medium">•••• {certificate.code_last4}</td>
                    <td className="px-4 py-3 text-sm">{certificate.offer_name}</td>
                    <td className="px-4 py-3 text-sm">
                      {certificate.kind === 'money'
                        ? formatCurrency(certificate.money_balance, certificate.currency as Currency)
                        : `${certificate.visits_remaining} / ${certificate.visits_total}`}
                    </td>
                    <td className="px-4 py-3 text-sm">{certificate.recipient_name}</td>
                    <td className="px-4 py-3 text-sm">{showDay(certificate.expires_at)}</td>
                    <td className="px-4 py-3 text-sm">
                      <StatusChip status={certificate.status} />
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      <button
                        type="button"
                        onClick={() => setDetailId(certificate.id)}
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                      >
                        {t('gift.details')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {draft && (
        <Modal
          title={editingId == null ? t('gift.addOffer') : t('gift.editOffer')}
          onClose={() => {
            setDraft(null)
            setEditingId(null)
            setFormError('')
          }}
        >
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">{t('gift.name')}</span>
                <input
                  required
                  maxLength={100}
                  value={draft.name}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">{t('gift.kind')}</span>
                <select
                  value={draft.kind}
                  onChange={(event) =>
                    setDraft({ ...draft, kind: event.target.value === 'package' ? 'package' : 'money' })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                >
                  <option value="money">{t('gift.kindMoney')}</option>
                  <option value="package">{t('gift.kindPackage')}</option>
                </select>
              </label>
            </div>

            <label className="block text-sm">
              <span className="mb-1 block font-medium">{t('gift.description')}</span>
              <textarea
                rows={2}
                maxLength={500}
                value={draft.description}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">{t('gift.price')}</span>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={draft.price}
                  onChange={(event) => setDraft({ ...draft, price: event.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                />
              </label>
              {draft.kind === 'money' ? (
                <label className="block text-sm">
                  <span className="mb-1 block font-medium">{t('gift.faceValue')}</span>
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={draft.faceValue}
                    onChange={(event) => setDraft({ ...draft, faceValue: event.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                  />
                </label>
              ) : (
                <label className="block text-sm">
                  <span className="mb-1 block font-medium">{t('gift.visitsCount')}</span>
                  <input
                    required
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    value={draft.visitsCount}
                    onChange={(event) => setDraft({ ...draft, visitsCount: event.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                  />
                </label>
              )}
              <label className="block text-sm">
                <span className="mb-1 block font-medium">{t('gift.validityDays')}</span>
                <input
                  required
                  type="number"
                  min="1"
                  max="730"
                  step="1"
                  value={draft.validityDays}
                  onChange={(event) => setDraft({ ...draft, validityDays: event.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                />
              </label>
            </div>

            <label className="block text-sm">
              <span className="mb-1 block font-medium">{t('gift.services')}</span>
              <select
                multiple
                size={Math.min(6, Math.max(3, services.length))}
                value={draft.serviceIds.map(String)}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    serviceIds: Array.from(event.target.selectedOptions).map((option) => Number(option.value)),
                  })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
              >
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">{t('gift.servicesHint')}</span>
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })}
                className="h-4 w-4"
              />
              {t('gift.active')}
            </label>

            {formError && (
              <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
                {formError}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDraft(null)
                  setEditingId(null)
                }}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                {t('gift.close')}
              </button>
              <button
                type="submit"
                disabled={saveOffer.isPending}
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
              >
                {t('gift.save')}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {detailId != null && (
        <CertificateDetail
          certificateId={detailId}
          canReverse={canReverse}
          onClose={() => setDetailId(null)}
        />
      )}
    </div>
  )
}
