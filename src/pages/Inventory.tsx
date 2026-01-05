import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from '../hooks/useTranslation'
import { useAuthStore } from '../store/authStore'
import api from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'

interface Product {
  id: number
  name: string
  description?: string
  unit: string
  quantity: number
  min_quantity: number
  price_per_unit?: number
  category?: string
  barcode?: string
  supplier?: string
  location?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function Inventory() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState<Product | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [addQuantityProduct, setAddQuantityProduct] = useState<Product | null>(null)
  const [addQuantityValue, setAddQuantityValue] = useState('')

  // Получаем список товаров
  const { data: productsResponse, isLoading } = useQuery({
    queryKey: ['products', searchTerm, lowStockOnly],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (lowStockOnly) params.append('low_stock_only', 'true')
      const { data } = await api.get(`/products?${params.toString()}`)
      return data
    },
  })

  const products: Product[] = productsResponse?.items || []
  const lowStockProducts = products.filter(p => p.quantity <= p.min_quantity)

  // Создание товара
  const createMutation = useMutation({
    mutationFn: async (product: Partial<Product>) => {
      // Получаем business_id из текущего пользователя
      const businessId = user?.business_id
      if (!businessId) throw new Error('Business ID not found')
      
      const { data } = await api.post('/products', {
        ...product,
        business_id: businessId,
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setShowAddForm(false)
    },
  })

  // Обновление товара
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Product> & { id: number }) => {
      const { data } = await api.put(`/products/${id}`, updates)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setShowEditForm(null)
    },
  })

  // Удаление товара
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/products/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  // Добавление количества
  const addQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      const { data } = await api.post(`/products/${id}/add-quantity?quantity=${quantity}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setAddQuantityProduct(null)
      setAddQuantityValue('')
    },
  })

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">{t('inventory.title')}</h1>
        {(user?.role === 'admin' || user?.role === 'business_owner') && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + {t('inventory.add_product')}
          </button>
        )}
      </div>

      {/* Предупреждение о низком остатке */}
      {lowStockProducts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-yellow-600 text-xl mr-2">⚠️</span>
            <div>
              <h3 className="font-semibold text-yellow-900">
                {t('inventory.low_stock_warning').replace('{count}', lowStockProducts.length.toString())}
              </h3>
              <p className="text-sm text-yellow-700">{t('inventory.low_stock_description')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Фильтры и поиск */}
      <div className="flex gap-4 items-center">
        <input
          type="text"
          placeholder={t('inventory.search_placeholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => setLowStockOnly(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span>{t('inventory.low_stock_only')}</span>
        </label>
      </div>

      {/* Таблица товаров */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('inventory.name')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('inventory.category')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('inventory.quantity')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('inventory.min_quantity')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('inventory.price')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('inventory.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr
                key={product.id}
                className={product.quantity <= product.min_quantity ? 'bg-yellow-50' : ''}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{product.name}</div>
                  {product.description && (
                    <div className="text-sm text-gray-500">{product.description}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.category || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        product.quantity <= product.min_quantity ? 'text-red-600' : 'text-gray-900'
                      }`}
                    >
                      {product.quantity} {product.unit}
                    </span>
                    {product.quantity <= product.min_quantity && (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                        {t('inventory.low_stock')}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.min_quantity} {product.unit}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.price_per_unit ? `${product.price_per_unit} €` : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  {(user?.role === 'admin' || user?.role === 'business_owner') && (
                    <>
                      <button
                        onClick={() => setShowEditForm(product)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {t('inventory.edit')}
                      </button>
                      <button
                        onClick={() => setAddQuantityProduct(product)}
                        className="text-green-600 hover:text-green-900"
                      >
                        {t('inventory.add_quantity')}
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(product.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        {t('inventory.delete')}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {t('inventory.no_products')}
          </div>
        )}
      </div>

      {/* Форма добавления товара */}
      {showAddForm && (
        <ProductForm
          onSubmit={(product) => createMutation.mutate(product)}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Форма редактирования товара */}
      {showEditForm && (
        <ProductForm
          product={showEditForm}
          onSubmit={(updates) => updateMutation.mutate({ id: showEditForm.id, ...updates })}
          onCancel={() => setShowEditForm(null)}
        />
      )}

      {/* Диалог добавления количества */}
      {addQuantityProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              {t('inventory.add_quantity_to')} {addQuantityProduct.name}
            </h3>
            <input
              type="number"
              step="0.01"
              min="0"
              value={addQuantityValue}
              onChange={(e) => setAddQuantityValue(e.target.value)}
              placeholder={t('inventory.quantity')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setAddQuantityProduct(null)
                  setAddQuantityValue('')
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => {
                  const quantity = parseFloat(addQuantityValue)
                  if (quantity > 0) {
                    addQuantityMutation.mutate({ id: addQuantityProduct.id, quantity })
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Компонент формы товара
function ProductForm({
  product,
  onSubmit,
  onCancel,
}: {
  product?: Product
  onSubmit: (product: Partial<Product>) => void
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState<Partial<Product>>({
    name: product?.name || '',
    description: product?.description || '',
    unit: product?.unit || 'шт',
    quantity: product?.quantity || 0,
    min_quantity: product?.min_quantity || 0,
    price_per_unit: product?.price_per_unit || undefined,
    category: product?.category || '',
    barcode: product?.barcode || '',
    supplier: product?.supplier || '',
    location: product?.location || '',
    is_active: product?.is_active ?? true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Валидация обязательных полей
    if (!formData.name || !formData.name.trim()) {
      alert(t('inventory.name') + ' ' + t('common.error'))
      return
    }
    if (!formData.unit || !formData.unit.trim()) {
      alert(t('inventory.unit') + ' ' + t('common.error'))
      return
    }
    onSubmit(formData)
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div 
        className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4">
          {product ? t('inventory.edit_product') : t('inventory.add_product')}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('inventory.name')} *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('inventory.description')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('inventory.unit')} *
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('inventory.category')}
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('inventory.quantity')} *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('inventory.min_quantity')} *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.min_quantity}
                onChange={(e) => setFormData({ ...formData, min_quantity: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('inventory.price')}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price_per_unit || ''}
                onChange={(e) => setFormData({ ...formData, price_per_unit: parseFloat(e.target.value) || undefined })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('inventory.barcode')}
              </label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('inventory.supplier')}
              </label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('inventory.location')}
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          </div>
          <div className="flex gap-2 justify-end mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

