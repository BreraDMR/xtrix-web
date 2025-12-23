import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import ClientForm from '../components/ClientForm'
import SearchBar from '../components/SearchBar'
import LoadingSpinner from '../components/LoadingSpinner'
import { useTranslation } from '../hooks/useTranslation'

export default function Clients() {
  const { t } = useTranslation()

interface Client {
  id: number
  full_name: string
  contact_phone?: string
  contact_email?: string
  date_of_birth?: string
  gender?: string
}

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | undefined>()
  const [searchQuery, setSearchQuery] = useState('')
  const [genderFilter, setGenderFilter] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data } = await api.get('/clients/')
      // API returns paginated response, extract items array
      return Array.isArray(data) ? data : (data?.items || data?.data || [])
    },
  })

  const filteredClients = useMemo(() => {
    if (!clients) return []
    
    return clients.filter((client) => {
      const matchesSearch =
        searchQuery === '' ||
        client.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.contact_phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.contact_email?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesGender = genderFilter === null || client.gender === genderFilter
      
      return matchesSearch && matchesGender
    })
  }, [clients, searchQuery, genderFilter])

  const handleSuccess = () => {
    setShowForm(false)
    setEditingId(undefined)
    queryClient.invalidateQueries({ queryKey: ['clients'] })
  }

  const handleEdit = (id: number) => {
    setEditingId(id)
    setShowForm(true)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('clients.title')}</h1>
        {!showForm && (
          <button
            onClick={() => {
              setEditingId(undefined)
              setShowForm(true)
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {t('clients.addClient')}
          </button>
        )}
      </div>

      {!showForm && (
        <div className="mb-6 space-y-4">
          <SearchBar
            placeholder={t('clients.searchPlaceholder')}
            onSearch={setSearchQuery}
          />
          <div className="flex gap-4">
            <select
              value={genderFilter || ''}
              onChange={(e) => setGenderFilter(e.target.value || null)}
              className="px-4 py-2 border rounded-md"
            >
              <option value="">{t('clients.allGenders')}</option>
              <option value="male">{t('clients.male')}</option>
              <option value="female">{t('clients.female')}</option>
              <option value="other">{t('clients.other')}</option>
            </select>
            {(searchQuery || genderFilter) && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setGenderFilter(null)
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                {t('clients.clearFilters')}
              </button>
            )}
          </div>
        </div>
      )}

      {showForm ? (
        <div className="bg-white p-6 rounded-lg shadow">
          <ClientForm
            clientId={editingId}
            onSuccess={handleSuccess}
            onCancel={() => {
              setShowForm(false)
              setEditingId(undefined)
            }}
          />
        </div>
      ) : (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {t('clients.name')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {t('clients.phone')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {t('clients.email')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  {searchQuery || genderFilter ? t('clients.noClientsMatch') : t('clients.noClientsFound')}
                </td>
              </tr>
            ) : (
              filteredClients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {client.full_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {client.contact_phone || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {client.contact_email || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button
                    onClick={() => handleEdit(client.id)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {t('common.edit')}
                  </button>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      )}
    </div>
  )
}

