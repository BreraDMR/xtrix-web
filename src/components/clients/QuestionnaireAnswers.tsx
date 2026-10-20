import { useQuery } from '@tanstack/react-query'

import api from '../../api/client'
import { apiErrorStatus } from '../../api/errors'
import { INTL_LOCALE } from '../booking/intl'
import FormError from '../FormError'
import LoadingSpinner from '../LoadingSpinner'
import { useTranslation } from '../../hooks/useTranslation'
import type { QuestionnaireAnswersOut, QuestionnaireField } from '../../api/types'

interface QuestionnaireAnswersProps {
  visitId: number
}

function optionLabel(field: Extract<QuestionnaireField, { options: unknown }>, value: string): string {
  return field.options.find((option) => option.value === value)?.label ?? value
}

function answerText(field: QuestionnaireField, value: unknown, yes: string, no: string, blank: string): string {
  switch (field.type) {
    case 'text':
    case 'long_text':
      return typeof value === 'string' && value ? value : blank
    case 'single_choice':
      return typeof value === 'string' && value ? optionLabel(field, value) : blank
    case 'multi_choice':
      return Array.isArray(value) && value.length > 0
        ? value
            .filter((item): item is string => typeof item === 'string')
            .map((item) => optionLabel(field, item))
            .join(', ') || blank
        : blank
    case 'boolean':
      return value === true ? yes : value === false ? no : blank
  }
}

export default function QuestionnaireAnswers({ visitId }: QuestionnaireAnswersProps) {
  const { t, locale } = useTranslation()

  const { data, isLoading, isError, error, refetch } = useQuery<QuestionnaireAnswersOut>({
    queryKey: ['visit-questionnaire', visitId],
    queryFn: async () => {
      const { data } = await api.get<QuestionnaireAnswersOut>(`/visits/${visitId}/questionnaire`)
      return data
    },
    retry: false,
  })

  if (isLoading) {
    return (
      <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
        <LoadingSpinner size="sm" />
      </div>
    )
  }

  if (isError) {
    const status = apiErrorStatus(error)
    // no published questionnaire was sent for this visit, or the guest has not answered yet
    if (status === 404) return null
    if (status === 403) {
      return (
        <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('questionnaireAnswers.title')}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('questionnaireAnswers.noAccess')}
          </p>
        </div>
      )
    }
    return (
      <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('questionnaireAnswers.title')}
        </h3>
        <FormError message={t('questionnaireAnswers.loadError')} />
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-900"
        >
          {t('common.retry')}
        </button>
      </div>
    )
  }

  if (!data) return null

  return (
    <section className="border-t border-gray-200 pt-4 dark:border-gray-700">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{data.name}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t('questionnaireAnswers.version')} {data.version}
          <span className="mx-1.5">·</span>
          {t('questionnaireAnswers.submittedAt')}{' '}
          {new Date(data.submitted_at).toLocaleString(INTL_LOCALE[locale])}
        </p>
      </div>
      {data.description && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{data.description}</p>
      )}

      <dl className="mt-3 divide-y divide-gray-100 text-sm dark:divide-gray-700">
        {data.fields.map((field) => (
          <div key={field.key} className="py-2">
            <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">{field.label}</dt>
            <dd className="mt-0.5 whitespace-pre-wrap break-words text-gray-900 dark:text-gray-100">
              {answerText(
                field,
                data.answers[field.key],
                t('questionnairePage.yes'),
                t('questionnairePage.no'),
                '—',
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
