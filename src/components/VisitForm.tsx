import { format } from 'date-fns'
import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import FormError from './FormError'
import { apiErrorMessage, apiErrorStatus, apiFormErrors } from '../api/errors'
import type { ClientLoyaltyBalance, ClientOut, ClientPage, GiftCertificateDetailOut, Schema, ServiceOut, ServiceSpecialistOut, VisitOut } from '../api/types'
import { fetchAllServices } from '../api/services'
import { allPages } from '../api/allPages'
import QueryError from './QueryError'
import { useAuthStore } from '../store/authStore'
import { useBusinessCurrency } from '../hooks/useBusinessCurrency'
import { formatCurrency } from '../utils/currency'
import LoadingSpinner from './LoadingSpinner'
import QuestionnaireAnswers from './clients/QuestionnaireAnswers'
import { useTranslation } from '../hooks/useTranslation'

interface VisitFormProps {
  visitId?: number
  onSuccess: () => void
  onCancel: () => void
  initialDateStart?: Date
  initialDateEnd?: Date
}

interface VisitData {
  client_id: number
  specialist_id: number
  service_id?: number
  date_start: string
  date_end?: string
  service_name?: string
  note?: string
  price?: number
  status: string
  payment_method?: string
}

interface VisitItemDraft {
  service_id?: number
  specialist_id?: number
  service_name?: string
  duration_minutes?: number
  price?: number
  specialists: ServiceSpecialistOut[]
}

type ClientSearchOut = Schema<'ClientSearchOut'>
// a pick from the search (ClientSearchOut, with the medical summary) or from our own list (ClientOut)
type SelectedClient = Pick<ClientOut, 'id' | 'full_name' | 'contact_phone' | 'contact_email'> & {
  basic_medical_info?: ClientSearchOut['basic_medical_info']
}

const PHONE_RE = /^[+]?[0-9\s\-()]+$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// who can take the service: its specialists, or at least the one it belongs to
function specialistsFor(service: ServiceOut): ServiceSpecialistOut[] {
  if (service.specialists?.length) return service.specialists
  return [{ id: service.specialist_id, full_name: service.specialist?.full_name ?? '' }]
}

type VisitInstant = { wall: string; iso: string }

function visitInstant(date: Date): VisitInstant {
  return { wall: format(date, "yyyy-MM-dd'T'HH:mm"), iso: date.toISOString() }
}

function resolveVisitInstant(wall: string, saved: VisitInstant | null): Date {
  return new Date(saved?.wall === wall ? saved.iso : wall)
}

const VISIT_FIELDS = ['client_id', 'service_id', 'specialist_id', 'service_name', 'date_start', 'date_end', 'price', 'status', 'payment_method', 'note']

function newGiftRequestKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `redeem-${crypto.randomUUID()}`
  }
  return `redeem-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

export default function VisitForm({ visitId, onSuccess, onCancel, initialDateStart, initialDateEnd }: VisitFormProps) {
  const { t } = useTranslation()
  const { user: currentUser } = useAuthStore()
  const currency = useBusinessCurrency()
  const submitting = useRef(false)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [savedWithLoyaltyError, setSavedWithLoyaltyError] = useState(false)
  const [savedWithGiftError, setSavedWithGiftError] = useState(false)
  const [giftLookupCode, setGiftLookupCode] = useState('')
  const [giftCode, setGiftCode] = useState('')
  const [giftCertificate, setGiftCertificate] = useState<GiftCertificateDetailOut | null>(null)
  const [giftAmount, setGiftAmount] = useState('')
  const [giftError, setGiftError] = useState('')
  const [lookingUpGift, setLookingUpGift] = useState(false)
  const [retryingGift, setRetryingGift] = useState(false)
  const giftRequestKey = useRef('')
  const lastSavedVisitId = useRef<number | null>(null)
  const visitSaved = useRef(false)
  const [clients, setClients] = useState<ClientOut[]>([])
  const [clientsLoading, setClientsLoading] = useState(false)
  const [clientsFailed, setClientsFailed] = useState(false)
  const [servicesLoading, setServicesLoading] = useState(false)
  const [servicesFailed, setServicesFailed] = useState(false)
  const [services, setServices] = useState<ServiceOut[]>([])
  const [availableSpecialists, setAvailableSpecialists] = useState<ServiceSpecialistOut[]>([])
  const [itemsMode, setItemsMode] = useState(false)
  const [items, setItems] = useState<VisitItemDraft[]>([])
  const initialItems = useRef<Pick<VisitItemDraft, 'service_id' | 'specialist_id'>[] | null>(null)
  const existingPricesUnknown = useRef(false)
  const [clientSearchQuery, setClientSearchQuery] = useState('')
  const [selectedClient, setSelectedClient] = useState<SelectedClient | null>(null)
  const [nameMatches, setNameMatches] = useState<ClientOut[]>([])
  const [clientNotFound, setClientNotFound] = useState(false)
  const [searchingClient, setSearchingClient] = useState(false)
  const [showClientSearch, setShowClientSearch] = useState(false)
  
  // datetime-local cannot distinguish the two copies of an autumn hour.
  const initialStart = useRef(initialDateStart ?? new Date(Math.floor(Date.now() / 60000) * 60000))
  const startInstant = useRef<VisitInstant | null>(visitInstant(initialStart.current))
  const endInstant = useRef<VisitInstant | null>(initialDateEnd ? visitInstant(initialDateEnd) : null)

  const [formData, setFormData] = useState<VisitData>(() => ({
    client_id: 0,
    // without a service to pick a specialist from, the visit is yours
    specialist_id: currentUser?.id ?? 0,
    date_start: startInstant.current!.wall,
    date_end: endInstant.current?.wall,
    status: 'planned',
  }))
  
  const [pointsToUse, setPointsToUse] = useState<number>(0)
  const [cashbackToUse, setCashbackToUse] = useState<number>(0)
  
  const currentClientId = formData.client_id || selectedClient?.id
  const { data: clientBalance } = useQuery({
    queryKey: ['client-loyalty-balance', currentClientId],
    queryFn: async () => {
      if (!currentClientId) return null
      try {
        const { data } = await api.get<ClientLoyaltyBalance>(`/loyalty/balance/${currentClientId}`)
        return data
      } catch {
        // no balance yet (404) or no loyalty program - just don't offer points
        return null
      }
    },
    enabled: !!currentClientId,
    retry: false,
  })

  useEffect(() => {
    loadClients()
    loadServices()
    if (visitId) {
      loadVisit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loaders are plain functions, rerun only on these
  }, [visitId])
  
  useEffect(() => {
    setPointsToUse(0)
    setCashbackToUse(0)
  }, [currentClientId])

  const loadClients = async () => {
    setClientsLoading(true)
    setClientsFailed(false)
    setClients([])
    try {
      const items = await allPages<ClientOut>(async page => (await api.get<ClientPage>('/clients/', {
        params: { page, per_page: 100 },
      })).data)
      setClients(items)
    } catch (error) {
      console.error('Failed to load clients:', error)
      setClientsFailed(true)
    } finally {
      setClientsLoading(false)
    }
  }

  const pickClient = (client: SelectedClient) => {
    setSelectedClient(client)
    setNameMatches([])
    setClientNotFound(false)
    setFormData((prev) => ({ ...prev, client_id: client.id }))
  }

  // The API only ever searches your own clients, and by name only together with a birth
  // date - so phone/email go to /clients/search and names are matched in our own list.
  const searchClient = async (query: string) => {
    const q = query.trim()
    setClientNotFound(false)
    setNameMatches([])
    if (q.length < 2) {
      setSelectedClient(null)
      return
    }

    if (!PHONE_RE.test(q) && !EMAIL_RE.test(q)) {
      const needle = q.toLowerCase()
      const matches = clients.filter((c) => c.full_name.toLowerCase().includes(needle)).slice(0, 5)
      if (matches.length === 1) {
        pickClient(matches[0])
      } else {
        setSelectedClient(null)
        setNameMatches(matches)
        setClientNotFound(matches.length === 0)
      }
      return
    }

    setSearchingClient(true)
    try {
      const params = PHONE_RE.test(q) ? { phone: q } : { email: q }
      const { data } = await api.get<ClientSearchOut>('/clients/search', { params })
      pickClient(data)
    } catch (error) {
      setSelectedClient(null)
      if (apiErrorStatus(error) === 404) {
        setClientNotFound(true)
      } else {
        console.error('Failed to search client:', error)
      }
    } finally {
      setSearchingClient(false)
    }
  }

  useEffect(() => {
    if (!clientSearchQuery) {
      setSelectedClient(null)
      return
    }

    const timeoutId = setTimeout(() => {
      searchClient(clientSearchQuery)
    }, 500)

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loaders are plain functions, rerun only on these
  }, [clientSearchQuery])

  const loadServices = async () => {
    setServicesLoading(true)
    setServicesFailed(false)
    setServices([])
    try {
      setServices(await fetchAllServices())
    } catch (error) {
      console.error('Failed to load services:', error)
      setServicesFailed(true)
    } finally {
      setServicesLoading(false)
    }
  }

  const loadVisit = async () => {
    try {
      const { data } = await api.get<VisitOut>(`/visits/${visitId}`)
      // Null can mean redacted, so don't replace an unknown saved price from the catalogue.
      existingPricesUnknown.current = data.price == null || Boolean(data.items?.some(item => item.price == null))
      initialItems.current = null
      setItems([])
      setItemsMode(false)
      startInstant.current = data.date_start ? visitInstant(new Date(data.date_start)) : null
      endInstant.current = data.date_end ? visitInstant(new Date(data.date_end)) : null
      setFormData({
        client_id: data.client_id,
        specialist_id: data.specialist_id,
        service_id: data.service_id ?? undefined,
        service_name: data.service_name ?? undefined,
        note: data.note ?? undefined,
        price: data.price ?? undefined,
        payment_method: data.payment_method ?? undefined,
        status: data.status ?? 'planned',
        date_start: data.date_start ? format(new Date(data.date_start), "yyyy-MM-dd'T'HH:mm") : '',
        date_end: data.date_end ? format(new Date(data.date_end), "yyyy-MM-dd'T'HH:mm") : '',
      })
      
      if (data.service_id) {
        try {
          const { data: serviceDetails } = await api.get<ServiceOut>(`/services/${data.service_id}`)
          if (serviceDetails.specialists?.length) {
            setAvailableSpecialists(serviceDetails.specialists)
          }
        } catch (error) {
          console.error('Failed to load service specialists:', error)
        }
      }

      if (Array.isArray(data.items) && data.items.length > 1) {
        const drafts = await Promise.all(
          data.items.map(async (item: { service_id?: number | null; specialist_id?: number | null; service_name?: string | null; duration_minutes?: number; price?: number | null }) => {
            let specialists: ServiceSpecialistOut[] = []
            if (item.service_id) {
              try {
                const { data: serviceDetails } = await api.get<ServiceOut>(`/services/${item.service_id}`)
                specialists = specialistsFor(serviceDetails)
              } catch (error) {
                console.error('Failed to load service specialists:', error)
              }
            }
            if (!specialists.length && item.specialist_id) {
              specialists = [{ id: item.specialist_id, full_name: '' }]
            }
            return {
              service_id: item.service_id ?? undefined,
              specialist_id: item.specialist_id ?? specialists[0]?.id ?? data.specialist_id,
              service_name: item.service_name ?? undefined,
              duration_minutes: item.duration_minutes,
              price: item.price ?? undefined,
              specialists,
            }
          }),
        )
        initialItems.current = drafts.map(({ service_id, specialist_id }) => ({ service_id, specialist_id }))
        setItems(drafts)
        setItemsMode(true)
      }
    } catch (error) {
      console.error('Failed to load visit:', error)
    }
  }

  const calculateDateEnd = (dateStart: string, durationMinutes: number | null | undefined, remember = false): string | undefined => {
    if (!dateStart || !durationMinutes) return undefined
    
    try {
      const start = resolveVisitInstant(dateStart, startInstant.current)
      if (isNaN(start.getTime())) return undefined
      
      const end = new Date(start.getTime() + durationMinutes * 60 * 1000)
      
      const endYear = end.getFullYear()
      const endMonth = String(end.getMonth() + 1).padStart(2, '0')
      const endDay = String(end.getDate()).padStart(2, '0')
      const endHours = String(end.getHours()).padStart(2, '0')
      const endMinutes = String(end.getMinutes()).padStart(2, '0')
      
      const wall = `${endYear}-${endMonth}-${endDay}T${endHours}:${endMinutes}`
      if (remember) endInstant.current = { wall, iso: end.toISOString() }
      return wall
    } catch (error) {
      console.error('Error calculating date_end:', error)
      return undefined
    }
  }

  const itemsComplete = items.length > 0 && items.every((item) => item.service_id && item.duration_minutes && item.specialist_id)
  const itemsTotalMinutes = items.reduce((sum, item) => sum + (item.duration_minutes ?? 0), 0)
  const itemsHavePrice = items.every((item) => item.price !== undefined && item.price !== null)
  const itemsTotalPrice = items.reduce((sum, item) => sum + (item.price ?? 0), 0)
  const chainEnd = itemsMode && itemsTotalMinutes > 0 ? calculateDateEnd(formData.date_start, itemsTotalMinutes) : undefined
  const payableTotal = itemsMode ? (itemsHavePrice ? itemsTotalPrice : undefined) : formData.price
  const visitServiceIds = (itemsMode
    ? items.map((item) => item.service_id)
    : [formData.service_id]
  ).filter((id): id is number => id != null)
  const giftScopeIds = giftCertificate?.service_ids ?? []
  const giftScopeMismatch =
    giftScopeIds.length > 0 &&
    (visitServiceIds.length === 0 || !visitServiceIds.every((id) => giftScopeIds.includes(id)))
  const giftMoneyMax = giftCertificate?.kind === 'money'
    ? Math.min(
        giftCertificate.money_balance,
        payableTotal != null ? payableTotal : giftCertificate.money_balance,
      )
    : 0
  const giftPreview = giftCertificate
    ? giftCertificate.kind === 'package'
      ? payableTotal ?? 0
      : Math.min(giftMoneyMax, giftAmount ? Number(giftAmount) : giftMoneyMax)
    : 0
  const amountDue = giftCertificate
    ? Math.max(0, (payableTotal ?? 0) - giftPreview)
    : payableTotal

  const addItem = () => {
    if (!itemsMode) {
      const selected = services.find((service) => service.id === formData.service_id)
      const specialists = selected
        ? specialistsFor({ ...selected, specialists: selected.specialists ?? null })
        : availableSpecialists
      const specialistId = specialists.some((person) => person.id === formData.specialist_id)
        ? formData.specialist_id
        : specialists[0]?.id ?? formData.specialist_id
      const first: VisitItemDraft = {
        service_id: selected?.id,
        specialist_id: specialistId,
        service_name: selected?.name ?? formData.service_name,
        duration_minutes: selected?.duration_minutes ?? undefined,
        price: formData.price,
        specialists,
      }
      setItems(selected ? [first, { specialist_id: specialistId, specialists: [] }] : [first])
      setItemsMode(true)
      setFieldErrors({})
      return
    }
    setItems((previous) => [
      ...previous,
      { specialist_id: formData.specialist_id, specialists: [] },
    ])
  }

  const handleItemServiceChange = async (index: number, rawServiceId: string) => {
    const serviceId = rawServiceId ? parseInt(rawServiceId) : undefined
    if (!serviceId) {
      setItems((previous) => previous.map((item, position) => position === index
        ? { specialist_id: item.specialist_id, specialists: [] }
        : item))
      return
    }

    const selected = services.find((service) => service.id === serviceId)
    let specialists = selected
      ? specialistsFor({ ...selected, specialists: selected.specialists ?? null })
      : []
    if (selected) {
      try {
        const { data: serviceDetails } = await api.get<ServiceOut>(`/services/${serviceId}`)
        specialists = specialistsFor(serviceDetails)
      } catch (error) {
        console.error('Failed to load service specialists:', error)
      }
    }

    setItems((previous) => previous.map((item, position) => {
      if (position !== index) return item
      const sameService = serviceId === item.service_id
      const preferred = item.specialist_id && specialists.some((person) => person.id === item.specialist_id)
        ? item.specialist_id
        : specialists.some((person) => person.id === formData.specialist_id)
          ? formData.specialist_id
          : specialists[0]?.id ?? item.specialist_id
      return {
        service_id: serviceId,
        specialist_id: preferred,
        service_name: sameService ? item.service_name : selected?.name ?? item.service_name,
        duration_minutes: sameService ? item.duration_minutes : selected?.duration_minutes ?? undefined,
        price: sameService ? item.price : existingPricesUnknown.current ? undefined : selected?.price ?? undefined,
        specialists,
      }
    }))
  }

  const moveItem = (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= items.length) return
    setItems((previous) => {
      const next = [...previous]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const removeItem = (index: number) => {
    if (items.length <= 1) return
    setItems((previous) => previous.filter((_, position) => position !== index))
  }

  const handleServiceChange = async (serviceId: string) => {
    const selectedServiceId = serviceId ? parseInt(serviceId) : undefined
    const selectedService = services.find(s => s.id === selectedServiceId)
    
    const updates: Partial<VisitData> = {
      service_id: selectedServiceId,
    }

    if (selectedService) {
      try {
        const { data: serviceDetails } = await api.get<ServiceOut>(`/services/${selectedServiceId}`)
        const specialists = specialistsFor(serviceDetails)
        setAvailableSpecialists(specialists)
        if (!specialists.find((s) => s.id === formData.specialist_id)) {
          updates.specialist_id = specialists[0].id
        }
      } catch (error) {
        console.error('Failed to load service specialists:', error)
        // the list item has the service's own specialist too
        setAvailableSpecialists(specialistsFor({ ...selectedService, specialists: null }))
        updates.specialist_id = selectedService.specialist_id
      }

      if (selectedService.price != null && formData.price === undefined && !existingPricesUnknown.current) {
        updates.price = selectedService.price
      }

      if (selectedService.name && !formData.service_name) {
        updates.service_name = selectedService.name
      }

      if (selectedService.duration_minutes && formData.date_start) {
        const calculatedDateEnd = calculateDateEnd(formData.date_start, selectedService.duration_minutes, true)
        if (calculatedDateEnd) {
          updates.date_end = calculatedDateEnd
        }
      }
    } else {
      setAvailableSpecialists([])
      
      if (!formData.service_name || formData.service_name === services.find(s => s.id === formData.service_id)?.name) {
        updates.service_name = undefined
      }
      if (!formData.price || formData.price === services.find(s => s.id === formData.service_id)?.price) {
        updates.price = undefined
      }
    }

    setFormData({ ...formData, ...updates })
  }

  const handleDateStartChange = (dateStart: string) => {
    startInstant.current = null
    const updates: Partial<VisitData> = { date_start: dateStart }

    if (formData.service_id) {
      const selectedService = services.find(s => s.id === formData.service_id)
      if (selectedService?.duration_minutes) {
        const calculatedDateEnd = calculateDateEnd(dateStart, selectedService.duration_minutes, true)
        if (calculatedDateEnd) {
          updates.date_end = calculatedDateEnd
        }
      }
    }

    setFormData({ ...formData, ...updates })
  }

  const resetGift = () => {
    setGiftCertificate(null)
    setGiftCode('')
    setGiftLookupCode('')
    setGiftAmount('')
    setGiftError('')
    giftRequestKey.current = ''
  }

  const lookupGift = async () => {
    const code = giftLookupCode.trim()
    if (!code || lookingUpGift) return
    setLookingUpGift(true)
    setGiftError('')
    try {
      const { data } = await api.get<GiftCertificateDetailOut>('/businesses/me/gift-certificates/lookup', {
        params: { code },
      })
      const usable =
        data.status === 'active' &&
        (data.kind === 'money' ? data.money_balance > 0 : data.visits_remaining > 0)
      if (!usable) {
        setGiftCertificate(null)
        setGiftCode('')
        setGiftError(t('gift.unusable'))
        return
      }
      setGiftCertificate(data)
      setGiftCode(code)
      setGiftAmount('')
      giftRequestKey.current = newGiftRequestKey()
      setPointsToUse(0)
      setCashbackToUse(0)
    } catch (error) {
      setGiftCertificate(null)
      setGiftCode('')
      setGiftError(apiErrorMessage(error, t('gift.notFound')))
    } finally {
      setLookingUpGift(false)
    }
  }

  const redeemGift = async (savedVisitId: number) => {
    if (!giftRequestKey.current) giftRequestKey.current = newGiftRequestKey()
    await api.post('/businesses/me/gift-certificates/redeem', {
      code: giftCode,
      visit_id: savedVisitId,
      amount: giftCertificate?.kind === 'money' && giftAmount ? Number(giftAmount) : undefined,
      request_key: giftRequestKey.current,
    })
  }

  const retryGift = async () => {
    const savedVisitId = lastSavedVisitId.current
    if (!savedVisitId || !giftCertificate) return
    setRetryingGift(true)
    setFormError('')
    try {
      await redeemGift(savedVisitId)
      onSuccess()
    } catch (error) {
      setFormError(apiErrorMessage(error, t('gift.applyError')))
    } finally {
      setRetryingGift(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (clientsLoading || clientsFailed || servicesLoading || servicesFailed) return
    if (submitting.current || visitSaved.current) return
    setFormError('')
    setFieldErrors({})
    if (itemsMode && !itemsComplete) {
      setFormError(t('visits.itemsIncomplete'))
      return
    }
    if (!itemsMode && formData.date_end && (!Number.isFinite(resolveVisitInstant(formData.date_end, endInstant.current).getTime()) || resolveVisitInstant(formData.date_end, endInstant.current) <= resolveVisitInstant(formData.date_start, startInstant.current))) {
      setFormError(t('validation.visitEnd'))
      return
    }
    if (!itemsMode && formData.price !== undefined && (!Number.isFinite(formData.price) || formData.price < 0)) {
      setFormError(t('validation.price'))
      return
    }
    if (giftCertificate) {
      if (giftScopeMismatch) {
        setFormError(t('gift.scopeMismatch'))
        return
      }
      if (giftCertificate.kind === 'money' && giftAmount) {
        const parsed = Number(giftAmount)
        if (
          !Number.isFinite(parsed) ||
          parsed <= 0 ||
          parsed > giftCertificate.money_balance ||
          (payableTotal != null && parsed > payableTotal)
        ) {
          setFormError(t('gift.amountTooHigh'))
          return
        }
      }
    }
    if (!formData.client_id) {
      setFormError(t('visits.selectClient'))
      return
    }
    submitting.current = true
    setLoading(true)

    try {
      const itemPayload = items.map((item) => ({
        service_id: item.service_id!,
        specialist_id: item.specialist_id,
      }))
      // Unchanged items must keep their saved prices, not today's catalogue prices.
      const itemsChanged = !initialItems.current || initialItems.current.length !== itemPayload.length ||
        itemPayload.some((item, index) => item.service_id !== initialItems.current![index].service_id ||
          item.specialist_id !== initialItems.current![index].specialist_id)
      const { price, payment_method, ...details } = formData
      const payment = payment_method !== undefined ? { payment_method } : {}
      const draftPayload = itemsMode
        ? {
            client_id: formData.client_id,
            specialist_id: itemPayload[0].specialist_id,
            date_start: resolveVisitInstant(formData.date_start, startInstant.current).toISOString(),
            status: formData.status,
            note: formData.note,
            ...(formData.status === 'completed' ? payment : {}),
            ...(itemsChanged ? { items: itemPayload } : {}),
          }
        : {
            ...details,
            ...(price !== undefined ? { price } : {}),
            ...payment,
            date_start: resolveVisitInstant(formData.date_start, startInstant.current).toISOString(),
            date_end: formData.date_end ? resolveVisitInstant(formData.date_end, endInstant.current).toISOString() : undefined,
          }

      const submitData = Object.fromEntries(Object.entries(draftPayload).filter(([, value]) => value !== undefined))

      let savedVisitId = visitId
      if (visitId) {
        const { data } = await api.put(`/visits/${visitId}`, submitData)
        savedVisitId = data.id || visitId
      } else {
        const { data } = await api.post('/visits/', submitData)
        savedVisitId = data.id
      }
      
      if (savedVisitId == null) throw new Error('Visit was saved without an id')
      visitSaved.current = true
      lastSavedVisitId.current = savedVisitId
      if (giftCertificate) {
        try {
          await redeemGift(savedVisitId)
        } catch (error) {
          console.error('Error applying gift certificate:', error)
          setFormError(apiErrorMessage(error, t('gift.applyError')))
          setSavedWithGiftError(true)
          return
        }
      } else if (currentClientId && (pointsToUse > 0 || cashbackToUse > 0)) {
        try {
          await api.post('/loyalty/use-points', {
            points_to_use: pointsToUse > 0 ? pointsToUse : undefined,
            cashback_to_use: cashbackToUse > 0 ? cashbackToUse : undefined,
            visit_id: savedVisitId,
          }, { params: { client_id: currentClientId } })
        } catch (error) {
          console.error('Error using loyalty points:', error)
          setFormError(apiErrorMessage(error, t('visits.loyaltyError')))
          setSavedWithLoyaltyError(true)
          return
        }
      }
      
      onSuccess()
    } catch (error) {
      const { fields, general } = apiFormErrors(error, VISIT_FIELDS, t('visits.saveError'))
      setFieldErrors(fields)
      setFormError(general)
    } finally {
      submitting.current = false
      setLoading(false)
    }
  }

  if (savedWithLoyaltyError || savedWithGiftError) {
    return (
      <div className="space-y-4">
        <p>{savedWithGiftError ? t('gift.savedGiftWarning') : t('visits.savedLoyaltyWarning')}</p>
        <div role="alert"><FormError message={formError} /></div>
        <div className="flex gap-2">
          {savedWithGiftError && (
            <button
              type="button"
              onClick={() => void retryGift()}
              disabled={retryingGift}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-60"
            >
              {t('gift.useGift')}
            </button>
          )}
          <button type="button" onClick={onSuccess} className="px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600">
            {t('common.close')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && <div role="alert"><FormError message={formError} /></div>}
      {clientsFailed && <QueryError retry={loadClients} />}
      {servicesFailed && <QueryError retry={loadServices} />}
      <div>
        <label className="block text-sm font-medium mb-1">{t('visits.client')} *</label>
        <div className="space-y-2">
          {}
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={() => setShowClientSearch(false)}
              className={`px-3 py-1 text-sm rounded-md ${
                !showClientSearch
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {t('visits.clientList')}
            </button>
            <button
              type="button"
              onClick={() => setShowClientSearch(true)}
              className={`px-3 py-1 text-sm rounded-md ${
                showClientSearch
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {t('visits.clientSearch')}
            </button>
          </div>

          {showClientSearch ? (
            <div className="space-y-2">
              {}
              <input
                type="text"
                value={clientSearchQuery}
                onChange={(e) => setClientSearchQuery(e.target.value)}
                placeholder={t('visits.searchClientPlaceholder')}
                className="w-full px-3 py-2 border rounded-md"
                disabled={searchingClient}
              />
              
              {searchingClient && (
                <div className="text-sm text-gray-500 flex items-center gap-2 dark:text-gray-400">
                  <LoadingSpinner size="sm" />
                  {t('visits.searching')}
                </div>
              )}

              {clientNotFound && !searchingClient && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('visits.clientNotFound')}</p>
              )}

              {nameMatches.length > 0 && (
                <div className="border rounded-md divide-y">
                  {nameMatches.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => pickClient(client)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-900"
                    >
                      {client.full_name}
                      {client.contact_phone && <span className="text-gray-500 dark:text-gray-400"> · {client.contact_phone}</span>}
                    </button>
                  ))}
                </div>
              )}

              {selectedClient && (
                <div className="p-3 border rounded-md bg-gray-50 dark:bg-gray-900">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{selectedClient.full_name}</p>
                      {selectedClient.contact_phone && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">📞 {selectedClient.contact_phone}</p>
                      )}
                      {selectedClient.contact_email && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">✉️ {selectedClient.contact_email}</p>
                      )}
                    </div>
                  </div>
                  
                  {}
                  {selectedClient.basic_medical_info && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-medium text-gray-700 mb-1 dark:text-gray-300">
                        {t('visits.basicMedicalInfo')}
                      </p>
                      {selectedClient.basic_medical_info.allergies && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          <span className="font-medium">{t('clientForm.allergies')}:</span> {selectedClient.basic_medical_info.allergies}
                        </p>
                      )}
                      {selectedClient.basic_medical_info.chronic_diseases && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          <span className="font-medium">{t('clientForm.chronicDiseases')}:</span> {selectedClient.basic_medical_info.chronic_diseases}
                        </p>
                      )}
                      {selectedClient.basic_medical_info.pregnancy && (
                        <p className="text-xs text-yellow-700 font-medium">⚠️ {t('clientForm.pregnancy')}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <select
              aria-invalid={fieldErrors.client_id ? true : undefined}
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: parseInt(e.target.value) })}
              required
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value={0}>{t('visits.selectClient')}</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.full_name}
                </option>
              ))}
            </select>
          )}
          {fieldErrors.client_id && <FormError message={fieldErrors.client_id} />}
        </div>
      </div>

      {itemsMode ? (
        <div className="space-y-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
          <div className="flex items-center justify-between gap-2">
            <label className="block text-sm font-medium">{t('visits.service')} *</label>
            <button
              type="button"
              onClick={addItem}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-900"
            >
              + {t('visits.addService')}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('visits.chainHint')}</p>

          {items.map((item, index) => (
            <div
              key={index}
              data-visit-item={index}
              className="space-y-2 rounded-md border border-gray-200 p-3 dark:border-gray-700"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {index + 1}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label={`${t('visits.moveServiceUp')} ${index + 1}`}
                    title={t('visits.moveServiceUp')}
                    disabled={index === 0}
                    onClick={() => moveItem(index, -1)}
                    className="rounded border border-gray-300 px-2 py-0.5 text-sm disabled:opacity-40 dark:border-gray-600"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label={`${t('visits.moveServiceDown')} ${index + 1}`}
                    title={t('visits.moveServiceDown')}
                    disabled={index === items.length - 1}
                    onClick={() => moveItem(index, 1)}
                    className="rounded border border-gray-300 px-2 py-0.5 text-sm disabled:opacity-40 dark:border-gray-600"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    aria-label={`${t('visits.removeService')} ${index + 1}`}
                    title={t('visits.removeService')}
                    disabled={items.length <= 1}
                    onClick={() => removeItem(index)}
                    className="rounded border border-gray-300 px-2 py-0.5 text-sm text-red-600 disabled:opacity-40 dark:border-gray-600 dark:text-red-400"
                  >
                    ×
                  </button>
                </div>
              </div>

              <select
                aria-label={`${t('visits.service')} ${index + 1}`}
                value={item.service_id ?? ''}
                onChange={(e) => void handleItemServiceChange(index, e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">{t('visits.selectService')}</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} ({service.duration_minutes} {t('services.min')})
                  </option>
                ))}
              </select>

              {item.service_id && item.specialists.length > 0 && (
                <select
                  aria-label={`${t('visits.specialist')} ${index + 1}`}
                  value={item.specialist_id ?? ''}
                  onChange={(e) => {
                    const specialistId = parseInt(e.target.value)
                    setItems((previous) => previous.map((row, position) => position === index
                      ? { ...row, specialist_id: specialistId }
                      : row))
                  }}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {item.specialists.map((spec) => (
                    <option key={spec.id} value={spec.id}>
                      {spec.full_name || `#${spec.id}`} {spec.email ? `(${spec.email})` : ''}
                    </option>
                  ))}
                </select>
              )}

              {item.service_id && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.duration_minutes ?? 0} {t('services.min')} ·{' '}
                  {item.price === null || item.price === undefined
                    ? t('booking.priceOnRequest')
                    : formatCurrency(item.price, currency)}
                </p>
              )}
            </div>
          ))}

          <div className="grid grid-cols-1 gap-1 border-t border-gray-200 pt-2 text-sm dark:border-gray-700 sm:grid-cols-3">
            <p>
              <span className="text-gray-500 dark:text-gray-400">{t('visits.chainTotal')}: </span>
              <span className="font-medium">{itemsHavePrice ? formatCurrency(itemsTotalPrice, currency) : t('booking.priceOnRequest')}</span>
            </p>
            <p>
              <span className="text-gray-500 dark:text-gray-400">{t('visits.chainDuration')}: </span>
              <span className="font-medium">{itemsTotalMinutes} {t('services.min')}</span>
            </p>
            {chainEnd && (
              <p>
                <span className="text-gray-500 dark:text-gray-400">{t('visits.chainEnd')}: </span>
                <span className="font-medium">{format(new Date(chainEnd), 'HH:mm')}</span>
              </p>
            )}
          </div>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium mb-1">{t('visits.service')}</label>
          <select
            aria-invalid={fieldErrors.service_id ? true : undefined}
            value={formData.service_id || ''}
            onChange={(e) => handleServiceChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="">{t('visits.selectService')}</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} ({service.duration_minutes} {t('services.min')})
              </option>
            ))}
          </select>
          {fieldErrors.service_id && <FormError message={fieldErrors.service_id} />}
          {services.length > 0 && (
            <button
              type="button"
              onClick={addItem}
              className="mt-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-900"
            >
              + {t('visits.addService')}
            </button>
          )}
        </div>
      )}

      {!itemsMode && formData.service_id && availableSpecialists.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-1">{t('visits.specialist')} *</label>
          <select
            aria-invalid={fieldErrors.specialist_id ? true : undefined}
            value={formData.specialist_id}
            onChange={(e) => setFormData({ ...formData, specialist_id: parseInt(e.target.value) })}
            required
            className="w-full px-3 py-2 border rounded-md"
          >
            {availableSpecialists.map((spec) => (
              <option key={spec.id} value={spec.id}>
                {spec.full_name} {spec.email ? `(${spec.email})` : ''}
              </option>
            ))}
          </select>
          {fieldErrors.specialist_id && <FormError message={fieldErrors.specialist_id} />}
        </div>
      )}

      {!itemsMode && (
        <div>
          <label className="block text-sm font-medium mb-1">{t('visits.serviceName')}</label>
          <input
            aria-invalid={fieldErrors.service_name ? true : undefined}
            type="text"
            value={formData.service_name || ''}
            onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
          />
          {fieldErrors.service_name && <FormError message={fieldErrors.service_name} />}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t('visits.startDateTime')} *</label>
          <input
            aria-invalid={fieldErrors.date_start ? true : undefined}
            type="datetime-local"
            style={{ minWidth: 0, maxWidth: '100%' }}
            value={formData.date_start}
            onChange={(e) => handleDateStartChange(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md"
          />
          {fieldErrors.date_start && <FormError message={fieldErrors.date_start} />}
        </div>
        {!itemsMode ? (
          <div>
            <label className="block text-sm font-medium mb-1">{t('visits.endDateTime')}</label>
            <input
              aria-invalid={fieldErrors.date_end ? true : undefined}
              type="datetime-local"
              style={{ minWidth: 0, maxWidth: '100%' }}
              value={formData.date_end || ''}
              onChange={(e) => { endInstant.current = null; setFormData({ ...formData, date_end: e.target.value }) }}
              className="w-full px-3 py-2 border rounded-md"
            />
            {fieldErrors.date_end && <FormError message={fieldErrors.date_end} />}
          </div>
        ) : (
          <div className="flex items-end pb-2 text-sm text-gray-500 dark:text-gray-400">
            {chainEnd
              ? `${t('visits.chainEnd')} ${format(new Date(chainEnd), 'HH:mm')}`
              : t('visits.chainHint')}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {!itemsMode && (
          <div>
            <label className="block text-sm font-medium mb-1">{t('visits.price')}</label>
            <input
              aria-invalid={fieldErrors.price ? true : undefined}
              type="number"
              min="0"
              step="0.01"
              value={formData.price ?? ''}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value ? parseFloat(e.target.value) : undefined })
              }
              className="w-full px-3 py-2 border rounded-md"
            />
            {fieldErrors.price && <FormError message={fieldErrors.price} />}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">{t('visits.status')}</label>
          <select
            aria-invalid={fieldErrors.status ? true : undefined}
            value={formData.status}
            onChange={(e) => {
              const newStatus = e.target.value
              setFormData({ 
                ...formData, 
                status: newStatus,
                payment_method: newStatus === 'completed' ? formData.payment_method : undefined
              })
            }}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="planned">{t('visits.planned')}</option>
            <option value="in_progress">{t('visits.inProgress')}</option>
            <option value="completed">{t('visits.completed')}</option>
            <option value="cancelled">{t('visits.cancelled')}</option>
          </select>
          {fieldErrors.status && <FormError message={fieldErrors.status} />}
        </div>
      </div>

      {}
      {formData.status === 'completed' && (
        <div>
          <label className="block text-sm font-medium mb-1">
            {t('finance.payment_method')} {amountDue ? `(${t('common.required_field')})` : ''}
          </label>
          <select
            aria-invalid={fieldErrors.payment_method ? true : undefined}
            value={formData.payment_method || ''}
            onChange={(e) => setFormData({ ...formData, payment_method: e.target.value || undefined })}
            required={!!amountDue}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="">{t('visits.selectPaymentMethod')}</option>
            <option value="card">{t('finance.payment_card')}</option>
            <option value="cash">{t('finance.payment_cash')}</option>
            <option value="other">{t('visits.paymentOther')}</option>
          </select>
          {fieldErrors.payment_method && <FormError message={fieldErrors.payment_method} />}
        </div>
      )}

      {currentClientId && (
        <div className="border-t border-gray-200 pt-4 mt-4 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">{t('gift.useGift')}</h3>
          {!giftCertificate ? (
            <>
              <p className="text-xs text-gray-600 mb-2 dark:text-gray-400">{t('gift.codeHint')}</p>
              <div className="flex flex-wrap gap-2">
                <input
                  value={giftLookupCode}
                  onChange={(event) => setGiftLookupCode(event.target.value)}
                  aria-label={t('gift.code')}
                  placeholder={t('gift.code')}
                  className="min-w-0 flex-1 px-3 py-2 border rounded-md"
                />
                <button
                  type="button"
                  onClick={() => void lookupGift()}
                  disabled={lookingUpGift || !giftLookupCode.trim()}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  {t('gift.lookup')}
                </button>
              </div>
              {giftError && <div role="alert" className="mt-2"><FormError message={giftError} /></div>}
            </>
          ) : (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="text-sm">
                  <p className="font-medium text-emerald-900 dark:text-emerald-100">
                    {giftCertificate.kind === 'money' ? t('gift.kindMoney') : t('gift.kindPackage')} ·{' '}
                    •••• {giftCertificate.code_last4}
                  </p>
                  <p className="mt-1 text-emerald-800 dark:text-emerald-200">
                    {giftCertificate.kind === 'money'
                      ? `${t('gift.balance')}: ${formatCurrency(giftCertificate.money_balance, currency)}`
                      : `${t('gift.visitsLeft')}: ${giftCertificate.visits_remaining} / ${giftCertificate.visits_total}`}
                  </p>
                  <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                    {t('gift.forService')}:{' '}
                    {giftScopeIds.length === 0
                      ? t('gift.anyService')
                      : giftScopeIds
                          .map((id) => services.find((service) => service.id === id)?.name ?? `#${id}`)
                          .join(', ')}
                  </p>
                  <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                    {t('gift.validUntil')}: {new Date(giftCertificate.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetGift}
                  className="rounded-md border border-emerald-300 px-3 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-200 dark:hover:bg-emerald-900"
                >
                  {t('gift.remove')}
                </button>
              </div>
              {giftCertificate.kind === 'money' && (
                <label className="mt-3 block text-sm">
                  <span className="mb-1 block font-medium text-emerald-900 dark:text-emerald-100">
                    {t('gift.amountToUse')}
                  </span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    max={giftMoneyMax}
                    value={giftAmount}
                    onChange={(event) => setGiftAmount(event.target.value)}
                    placeholder={giftMoneyMax.toFixed(2)}
                    className="w-full rounded-md border border-emerald-300 px-3 py-2 dark:border-emerald-700 dark:bg-gray-700"
                  />
                  <span className="mt-1 block text-xs text-emerald-700 dark:text-emerald-300">
                    {t('gift.amountHint')}
                  </span>
                </label>
              )}
              <p className="mt-2 text-sm font-medium text-emerald-900 dark:text-emerald-100">
                {t('gift.amountDue')}: {formatCurrency(amountDue ?? 0, currency)}
              </p>
              {giftScopeMismatch && (
                <div role="alert" className="mt-2"><FormError message={t('gift.scopeMismatch')} /></div>
              )}
              {giftError && <div role="alert" className="mt-2"><FormError message={giftError} /></div>}
            </div>
          )}
        </div>
      )}

      {}
      {currentClientId && clientBalance && (
        <div className="border-t border-gray-200 pt-4 mt-4 dark:border-gray-700">
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">{t('loyalty.use_points')}</h3>
            {giftCertificate && (
              <p className="text-xs text-amber-700 mb-2 dark:text-amber-300">{t('gift.loyaltyDisabled')}</p>
            )}
            {clientBalance.points > 0 && (
              <p className="text-xs text-gray-600 mb-2 dark:text-gray-400">
                {t('loyalty.client_balance')}: {clientBalance.points.toFixed(0)} {t('loyalty.points')}
                {clientBalance.cashback > 0 && `, ${clientBalance.cashback.toFixed(2)} € ${t('loyalty.cashback')}`}
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('loyalty.points_to_use')}</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={clientBalance.points || 0}
                value={pointsToUse || ''}
                onChange={(e) => setPointsToUse(e.target.value ? parseFloat(e.target.value) : 0)}
                disabled={Boolean(giftCertificate)}
                className="w-full px-3 py-2 border rounded-md disabled:opacity-60"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('loyalty.cashback_to_use')}</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={clientBalance.cashback || 0}
                value={cashbackToUse || ''}
                onChange={(e) => setCashbackToUse(e.target.value ? parseFloat(e.target.value) : 0)}
                disabled={Boolean(giftCertificate)}
                className="w-full px-3 py-2 border rounded-md disabled:opacity-60"
                placeholder="0"
              />
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">{t('visits.notes')}</label>
        <textarea
          aria-invalid={fieldErrors.note ? true : undefined}
          value={formData.note || ''}
          onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border rounded-md"
        />
        {fieldErrors.note && <FormError message={fieldErrors.note} />}
      </div>

      {visitId && <QuestionnaireAnswers visitId={visitId} />}

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700 transition-all dark:border-gray-600 dark:hover:bg-gray-900 dark:text-gray-300"
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          disabled={loading || clientsLoading || clientsFailed || servicesLoading || servicesFailed}
          className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" />
              <span>{t('common.loading')}</span>
            </>
          ) : (
            visitId ? t('visits.updateVisit') : t('visits.createVisit')
          )}
        </button>
      </div>
    </form>
  )
}

