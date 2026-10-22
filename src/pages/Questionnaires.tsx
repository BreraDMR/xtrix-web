import { fetchAllServices } from '../api/services'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { HiOutlineClipboardList } from 'react-icons/hi'
import api from '../api/client'
import { apiErrorStatus } from '../api/errors'
import EmptyState from '../components/EmptyState'
import LoadingSpinner from '../components/LoadingSpinner'
import QueryError from '../components/QueryError'
import TemplateEditor from '../components/questionnaires/TemplateEditor'
import { useTranslation } from '../hooks/useTranslation'
import type { QuestionnaireTemplateOut, ServiceOut } from '../api/types'

type EditorState = QuestionnaireTemplateOut | 'new' | null

export default function Questionnaires() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [editor, setEditor] = useState<EditorState>(null)

  const questionnaires = useQuery<QuestionnaireTemplateOut[]>({
    queryKey: ['questionnaires'],
    queryFn: async () => {
      const { data } = await api.get('/businesses/me/questionnaires/')
      return Array.isArray(data) ? data : []
    },
    retry: false,
  })

  const services = useQuery<ServiceOut[]>({
    queryKey: ['services'],
    queryFn: ({ signal }) => fetchAllServices(signal),
  })

  const serviceName = (id: number | null | undefined) => {
    if (id === null || id === undefined) return t('questionnaires.noService')
    return services.data?.find((service) => service.id === id)?.name ?? `#${id}`
  }

  const items = questionnaires.data ?? []

  if (questionnaires.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (questionnaires.isError) {
    const status = apiErrorStatus(questionnaires.error)
    if (status === 404 || status === 403) {
      return (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100">
          {status === 404 ? t('questionnaires.businessRequired') : t('questionnaires.noAccess')}
        </div>
      )
    }
    return <QueryError retry={questionnaires.refetch} />
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t('questionnaires.title')}</h1>
        {editor === null && (
          <button
            onClick={() => setEditor('new')}
            className="rounded-md bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
          >
            {t('questionnaires.new')}
          </button>
        )}
      </div>

      {editor !== null && services.isError && <QueryError retry={services.refetch} />}
      {editor !== null && services.isLoading && <LoadingSpinner />}
      {editor !== null ? (!services.isError && !services.isLoading && (
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <TemplateEditor
            key={editor === 'new' ? 'new' : editor.id}
            template={editor === 'new' ? undefined : editor}
            services={services.data ?? []}
            onChanged={() => {
              void queryClient.invalidateQueries({ queryKey: ['questionnaires'] })
            }}
            onClose={() => setEditor(null)}
          />
        </div>
      )) : items.length === 0 ? (
        <div className="rounded-lg bg-white shadow dark:bg-gray-800">
          <EmptyState
            icon={<HiOutlineClipboardList className="h-10 w-10" />}
            title={t('questionnaires.emptyTitle')}
            description={t('questionnaires.emptyDescription')}
            action={
              <button
                onClick={() => setEditor('new')}
                className="rounded-md bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
              >
                {t('questionnaires.new')}
              </button>
            }
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    {t('questionnaireEditor.name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    {t('questionnaires.fieldsCount')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    {t('questionnaires.service')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    {t('questionnaires.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    {t('questionnaires.updated')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                {items.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {template.name}
                      {template.description && (
                        <p
                          className="mt-1 max-w-md text-xs font-normal text-gray-500 line-clamp-2 dark:text-gray-400"
                          title={template.description}
                        >
                          {template.description}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {template.fields.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {serviceName(template.service_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {template.published_version !== null && template.published_version !== undefined ? (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
                          {t('questionnaires.publishedVersion')} {template.published_version}
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                          {t('questionnaires.draftOnly')}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(template.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <button onClick={() => setEditor(template)} className="text-blue-600 hover:text-blue-800">
                        {t('common.edit')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
