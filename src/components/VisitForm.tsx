import { useState, useEffect } from 'react'
import api from '../api/client'
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
}

export default function VisitForm({ visitId, onSuccess, onCancel, initialDateStart, initialDateEnd }: VisitFormProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  
  const getInitialDate = (date?: Date) => {
    if (date) return date.toISOString().slice(0, 16)
    return new Date().toISOString().slice(0, 16)
  }
  
  const [formData, setFormData] = useState<VisitData>({
    client_id: 0,
    specialist_id: 1,
    date_start: getInitialDate(initialDateStart),
    date_end: initialDateEnd ? getInitialDate(initialDateEnd) : undefined,
    status: 'planned',
  })

  useEffect(() => {
    loadClients()
    loadServices()
    if (visitId) {
      loadVisit()
    }
  }, [visitId])

  const loadClients = async () => {
    try {
      const { data } = await api.get('/clients/')
      // API returns paginated response, extract items array
      const items = Array.isArray(data) ? data : (data?.items || data?.data || [])
      setClients(items)
    } catch (error) {
      console.error('Failed to load clients:', error)
    }
  }

  const loadServices = async () => {
    try {
      const { data } = await api.get('/services/')
      // API returns paginated response, extract items array
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
    } catch (error) {
      console.error('Failed to load visit:', error)
    }
  }

  // Вычисляет date_end на основе date_start и duration_minutes
  const calculateDateEnd = (dateStart: string, durationMinutes: number | null | undefined): string | undefined => {
    if (!dateStart || !durationMinutes) return undefined
    
    const start = new Date(dateStart)
    if (isNaN(start.getTime())) return undefined
    
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000)
    return end.toISOString().slice(0, 16)
  }

  // Обработчик изменения услуги - автоматически заполняет цену, название и дату окончания
  const handleServiceChange = (serviceId: string) => {
    const selectedServiceId = serviceId ? parseInt(serviceId) : undefined
    const selectedService = services.find(s => s.id === selectedServiceId)
    
    const updates: Partial<VisitData> = {
      service_id: selectedServiceId,
    }

    if (selectedService) {
      // Автоматически заполняем цену, если она не указана или равна 0
      if (selectedService.price && (!formData.price || formData.price === 0)) {
        updates.price = selectedService.price
      }

      // Автоматически заполняем название услуги, если оно не указано
      if (selectedService.name && !formData.service_name) {
        updates.service_name = selectedService.name
      }

      // Всегда автоматически вычисляем date_end на основе date_start + duration_minutes
      // Это обеспечивает точность расчета времени окончания на основе длительности услуги
      if (selectedService.duration_minutes && formData.date_start) {
        const calculatedDateEnd = calculateDateEnd(formData.date_start, selectedService.duration_minutes)
        if (calculatedDateEnd) {
          updates.date_end = calculatedDateEnd
        }
      }
    } else {
      // Если услуга не выбрана, очищаем автоматически заполненные поля
      if (!formData.service_name || formData.service_name === services.find(s => s.id === formData.service_id)?.name) {
        updates.service_name = undefined
      }
      if (!formData.price || formData.price === services.find(s => s.id === formData.service_id)?.price) {
        updates.price = undefined
      }
    }

    setFormData({ ...formData, ...updates })
  }

  // Обработчик изменения даты начала - пересчитывает date_end, если выбрана услуга
  const handleDateStartChange = (dateStart: string) => {
    const updates: Partial<VisitData> = { date_start: dateStart }

    // Если выбрана услуга, пересчитываем date_end
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
    setLoading(true)

    try {
      const submitData = {
        ...formData,
        date_start: new Date(formData.date_start).toISOString(),
        date_end: formData.date_end ? new Date(formData.date_end).toISOString() : undefined,
      }

      if (visitId) {
        await api.put(`/visits/${visitId}`, submitData)
      } else {
        await api.post('/visits', submitData)
      }
      onSuccess()
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to save visit')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">{t('visits.client')} *</label>
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
              {service.name} ({service.duration_minutes} min)
            </option>
          ))}
        </select>
      </div>

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
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="planned">{t('visits.planned')}</option>
            <option value="in_progress">{t('visits.inProgress')}</option>
            <option value="completed">{t('visits.completed')}</option>
            <option value="cancelled">{t('visits.cancelled')}</option>
          </select>
        </div>
      </div>

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
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
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

