import { useState, useEffect } from 'react'
import api from '../api/client'
import { useTranslation, getTranslatedSpecialistType } from '../hooks/useTranslation'

interface SpecialistTypesResponse {
  categories: {
    [key: string]: {
      name: string
      types: string[]
    }
  }
}

interface SpecialistTypeSelectorProps {
  value?: string
  onChange: (value: string) => void
  required?: boolean
  disabled?: boolean
}

export default function SpecialistTypeSelector({
  value,
  onChange,
  required = false,
  disabled = false,
}: SpecialistTypeSelectorProps) {
  const { t, locale } = useTranslation()
  const [typesData, setTypesData] = useState<SpecialistTypesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTypes()
  }, [])

  const loadTypes = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/specialist-profiles/types')
      setTypesData(data)
    } catch (err) {
      console.error('Failed to load specialist types:', err)
      setError('Failed to load specialist types')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
        {t('common.loading')}
      </div>
    )
  }

  if (error || !typesData) {
    return (
      <div className="w-full px-4 py-3 border border-red-300 rounded-lg bg-red-50 text-red-700">
        {error || t('common.error')}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <option value="">-- {t('register.selectSpecialistType')} --</option>
        {Object.entries(typesData.categories).map(([categoryKey, category]) => (
          <optgroup key={categoryKey} label={category.name}>
            {category.types.map((type) => (
              <option key={type} value={type}>
                {getTranslatedSpecialistType(type, locale)}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {value && (() => {
        const categoryEntry = Object.entries(typesData.categories).find(([, cat]) => 
          cat.types.includes(value)
        )
        const categoryName = categoryEntry?.[1].name
        
        if (!categoryName) return null
        
        return (
          <div className="text-sm text-gray-600 mt-1">
            Category: {categoryName}
          </div>
        )
      })()}
    </div>
  )
}

