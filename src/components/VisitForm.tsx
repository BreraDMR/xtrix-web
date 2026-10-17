import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import { apiErrorMessage, apiErrorStatus } from '../api/errors'
import type { ClientOut, Schema } from '../api/types'
import { useAuthStore } from '../store/authStore'
import LoadingSpinner from './LoadingSpinner'
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

type ClientSearchOut = Schema<'ClientSearchOut'>
// a pick from the search (ClientSearchOut, with the medical summary) or from our own list (ClientOut)
type SelectedClient = Pick<ClientOut, 'id' | 'full_name' | 'contact_phone' | 'contact_email'> & {
  basic_medical_info?: ClientSearchOut['basic_medical_info']
}

const PHONE_RE = /^[+]?[0-9\s\-()]+$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function VisitForm({ visitId, onSuccess, onCancel, initialDateStart, initialDateEnd }: VisitFormProps) {
  const { t } = useTranslation()
  const { user: currentUser } = useAuthStore()
  const submitting = useRef(false)
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<ClientOut[]>([])
  const [services, setServices] = useState<any[]>([])
  const [availableSpecialists, setAvailableSpecialists] = useState<any[]>([])
  const [clientSearchQuery, setClientSearchQuery] = useState('')
  const [selectedClient, setSelectedClient] = useState<SelectedClient | null>(null)
  const [nameMatches, setNameMatches] = useState<ClientOut[]>([])
  const [clientNotFound, setClientNotFound] = useState(false)
  const [searchingClient, setSearchingClient] = useState(false)
  const [showClientSearch, setShowClientSearch] = useState(false)
  
  const getInitialDate = (date?: Date) => {
    if (date) return date.toISOString().slice(0, 16)
    return new Date().toISOString().slice(0, 16)
  }
  
  const [formData, setFormData] = useState<VisitData>({
    client_id: 0,
    // without a service to pick a specialist from, the visit is yours
    specialist_id: currentUser?.id ?? 0,
    date_start: getInitialDate(initialDateStart),
    date_end: initialDateEnd ? getInitialDate(initialDateEnd) : undefined,
    status: 'planned',
  })
  
  const [pointsToUse, setPointsToUse] = useState<number>(0)
  const [cashbackToUse, setCashbackToUse] = useState<number>(0)
  
  const currentClientId = formData.client_id || selectedClient?.id
  const { data: clientBalance } = useQuery({
    queryKey: ['client-loyalty-balance', currentClientId],
    queryFn: async () => {
      if (!currentClientId) return null
      try {
        const { data } = await api.get(`/loyalty/balance/${currentClientId}`)
        return data
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null
        }
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
    try {
      const { data } = await api.get('/clients/')
      const items = Array.isArray(data) ? data : (data?.items || data?.data || [])
      setClients(items)
    } catch (error) {
      console.error('Failed to load clients:', error)
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
    try {
      const { data } = await api.get('/services/')
      const items = Array.isArray(data) ? data : (data?.items || data?.data || [])
      setServices(items)
    } catch (error) {
      console.error('Failed to load services:', error)
    }
  }

  const loadVisit = async () => {
    try {
      const { data } = await api.get(`/visits/${visitId}`)
      setFormData({
        ...data,
        date_start: data.date_start ? new Date(data.date_start).toISOString().slice(0, 16) : '',
        date_end: data.date_end ? new Date(data.date_end).toISOString().slice(0, 16) : '',
      })
      
      if (data.service_id) {
        try {
          const { data: serviceDetails } = await api.get(`/services/${data.service_id}`)
          if (serviceDetails.specialists && serviceDetails.specialists.length > 0) {
            setAvailableSpecialists(serviceDetails.specialists)
          }
        } catch (error) {
          console.error('Failed to load service specialists:', error)
        }
      }
    } catch (error) {
      console.error('Failed to load visit:', error)
    }
  }

  const calculateDateEnd = (dateStart: string, durationMinutes: number | null | undefined): string | undefined => {
    if (!dateStart || !durationMinutes) return undefined
    
    try {
      const [datePart, timePart] = dateStart.split('T')
      if (!datePart || !timePart) return undefined
      
      const [year, month, day] = datePart.split('-').map(Number)
      const [hours, minutes] = timePart.split(':').map(Number)
      
      const start = new Date(year, month - 1, day, hours, minutes, 0, 0)
      if (isNaN(start.getTime())) return undefined
      
      const end = new Date(start.getTime() + durationMinutes * 60 * 1000)
      
      const endYear = end.getFullYear()
      const endMonth = String(end.getMonth() + 1).padStart(2, '0')
      const endDay = String(end.getDate()).padStart(2, '0')
      const endHours = String(end.getHours()).padStart(2, '0')
      const endMinutes = String(end.getMinutes()).padStart(2, '0')
      
      return `${endYear}-${endMonth}-${endDay}T${endHours}:${endMinutes}`
    } catch (error) {
      console.error('Error calculating date_end:', error)
      return undefined
    }
  }

  const handleServiceChange = async (serviceId: string) => {
    const selectedServiceId = serviceId ? parseInt(serviceId) : undefined
    const selectedService = services.find(s => s.id === selectedServiceId)
    
    const updates: Partial<VisitData> = {
      service_id: selectedServiceId,
    }

    if (selectedService) {
      try {
        const { data: serviceDetails } = await api.get(`/services/${selectedServiceId}`)
        if (serviceDetails.specialists && serviceDetails.specialists.length > 0) {
          setAvailableSpecialists(serviceDetails.specialists)
          if (!serviceDetails.specialists.find((s: any) => s.id === formData.specialist_id)) {
            updates.specialist_id = serviceDetails.specialists[0].id
          }
        } else {
          setAvailableSpecialists([{
            id: selectedService.specialist_id,
            full_name: selectedService.specialist?.full_name || '',
            email: selectedService.specialist?.email || '',
          }])
          updates.specialist_id = selectedService.specialist_id
        }
      } catch (error) {
        console.error('Failed to load service specialists:', error)
        setAvailableSpecialists([{
          id: selectedService.specialist_id,
          full_name: selectedService.specialist?.full_name || '',
          email: selectedService.specialist?.email || '',
        }])
        updates.specialist_id = selectedService.specialist_id
      }

      if (selectedService.price && (!formData.price || formData.price === 0)) {
        updates.price = selectedService.price
      }

      if (selectedService.name && !formData.service_name) {
        updates.service_name = selectedService.name
      }

      if (selectedService.duration_minutes && formData.date_start) {
        const calculatedDateEnd = calculateDateEnd(formData.date_start, selectedService.duration_minutes)
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
    const updates: Partial<VisitData> = { date_start: dateStart }

    if (formData.service_id) {
      const selectedService = services.find(s => s.id === formData.service_id)
      if (selectedService?.duration_minutes) {
        const calculatedDateEnd = calculateDateEnd(dateStart, selectedService.duration_minutes)
        if (calculatedDateEnd) {
          updates.date_end = calculatedDateEnd
        }
      }
    }

    setFormData({ ...formData, ...updates })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting.current) return
    if (!formData.client_id) {
      alert(t('visits.selectClient'))
      return
    }
    submitting.current = true
    setLoading(true)

    try {
      const submitData = {
        ...formData,
        date_start: new Date(formData.date_start).toISOString(),
        date_end: formData.date_end ? new Date(formData.date_end).toISOString() : undefined,
      }

      let savedVisitId = visitId
      if (visitId) {
        const { data } = await api.put(`/visits/${visitId}`, submitData)
        savedVisitId = data.id || visitId
      } else {
        const { data } = await api.post('/visits/', submitData)
        savedVisitId = data.id
      }
      
      if (currentClientId && (pointsToUse > 0 || cashbackToUse > 0)) {
        try {
          await api.post('/loyalty/use-points', {
            points_to_use: pointsToUse > 0 ? pointsToUse : undefined,
            cashback_to_use: cashbackToUse > 0 ? cashbackToUse : undefined,
            visit_id: savedVisitId,
          }, { params: { client_id: currentClientId } })
        } catch (error: any) {
          console.error('Error using loyalty points:', error)
          alert(apiErrorMessage(error, t('visits.loyaltyError')))
        }
      }
      
      onSuccess()
    } catch (error: any) {
      alert(apiErrorMessage(error, t('visits.saveError')))
    } finally {
      submitting.current = false
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  {t('visits.searching')}
                </div>
              )}

              {clientNotFound && !searchingClient && (
                <p className="text-sm text-gray-500">{t('visits.clientNotFound')}</p>
              )}

              {nameMatches.length > 0 && (
                <div className="border rounded-md divide-y">
                  {nameMatches.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => pickClient(client)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      {client.full_name}
                      {client.contact_phone && <span className="text-gray-500"> · {client.contact_phone}</span>}
                    </button>
                  ))}
                </div>
              )}

              {selectedClient && (
                <div className="p-3 border rounded-md bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{selectedClient.full_name}</p>
                      {selectedClient.contact_phone && (
                        <p className="text-sm text-gray-600">📞 {selectedClient.contact_phone}</p>
                      )}
                      {selectedClient.contact_email && (
                        <p className="text-sm text-gray-600">✉️ {selectedClient.contact_email}</p>
                      )}
                    </div>
                  </div>
                  
                  {}
                  {selectedClient.basic_medical_info && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-700 mb-1">
                        {t('visits.basicMedicalInfo')}
                      </p>
                      {selectedClient.basic_medical_info.allergies && (
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">{t('clientForm.allergies')}:</span> {selectedClient.basic_medical_info.allergies}
                        </p>
                      )}
                      {selectedClient.basic_medical_info.chronic_diseases && (
                        <p className="text-xs text-gray-600">
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
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">{t('visits.service')}</label>
        <select
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
      </div>

      {formData.service_id && availableSpecialists.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-1">{t('visits.specialist')} *</label>
          <select
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
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">{t('visits.serviceName')}</label>
        <input
          type="text"
          value={formData.service_name || ''}
          onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t('visits.startDateTime')} *</label>
          <input
            type="datetime-local"
            value={formData.date_start}
            onChange={(e) => handleDateStartChange(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('visits.endDateTime')}</label>
          <input
            type="datetime-local"
            value={formData.date_end || ''}
            onChange={(e) => setFormData({ ...formData, date_end: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t('visits.price')}</label>
          <input
            type="number"
            step="0.01"
            value={formData.price || ''}
            onChange={(e) =>
              setFormData({ ...formData, price: e.target.value ? parseFloat(e.target.value) : undefined })
            }
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('visits.status')}</label>
          <select
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
        </div>
      </div>

      {}
      {formData.status === 'completed' && (
        <div>
          <label className="block text-sm font-medium mb-1">
            {t('finance.payment_method')} {formData.price ? `(${t('common.required_field')})` : ''}
          </label>
          <select
            value={formData.payment_method || ''}
            onChange={(e) => setFormData({ ...formData, payment_method: e.target.value || undefined })}
            required={!!formData.price}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="">{t('visits.selectPaymentMethod')}</option>
            <option value="card">{t('finance.payment_card')}</option>
            <option value="cash">{t('finance.payment_cash')}</option>
            <option value="other">{t('visits.paymentOther')}</option>
          </select>
        </div>
      )}

      {}
      {currentClientId && clientBalance && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">{t('loyalty.use_points')}</h3>
            {clientBalance.points > 0 && (
              <p className="text-xs text-gray-600 mb-2">
                {t('loyalty.client_balance')}: {clientBalance.points.toFixed(0)} {t('loyalty.points')}
                {clientBalance.cashback > 0 && `, ${clientBalance.cashback.toFixed(2)} € ${t('loyalty.cashback')}`}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('loyalty.points_to_use')}</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={clientBalance.points || 0}
                value={pointsToUse || ''}
                onChange={(e) => setPointsToUse(e.target.value ? parseFloat(e.target.value) : 0)}
                className="w-full px-3 py-2 border rounded-md"
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
                className="w-full px-3 py-2 border rounded-md"
                placeholder="0"
              />
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">{t('visits.notes')}</label>
        <textarea
          value={formData.note || ''}
          onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700 transition-all"
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          disabled={loading}
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

