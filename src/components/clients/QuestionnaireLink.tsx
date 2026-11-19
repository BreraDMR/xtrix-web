import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'

import api from '../../api/client'
import { apiErrorStatus } from '../../api/errors'
import type { QuestionnaireTemplateOut, QuestionnaireTokenOut } from '../../api/types'
import { useTranslation } from '../../hooks/useTranslation'
import { INTL_LOCALE } from '../booking/intl'
import FormError from '../FormError'

interface QuestionnaireLinkProps {
  visitId: number
  serviceId?: number | null
}

// The token goes into the fragment, so it never reaches the static host's access log;
// the public page moves it to sessionStorage and strips it from the address bar.
function guestUrl(token: string): string {
  return `${window.location.origin}/questionnaire#token=${encodeURIComponent(token)}`
}

export default function QuestionnaireLink({ visitId, serviceId }: QuestionnaireLinkProps) {
  const { t, locale } = useTranslation()

  // Owners see their templates, so the block shows up only where a questionnaire is
  // actually bound to the service. Staff get 403 on that list; for them the button stays
  // and the API answers "no questionnaire" itself.
  const templates = useQuery<QuestionnaireTemplateOut[]>({
    queryKey: ['questionnaires'],
    queryFn: async () => {
      const { data } = await api.get('/businesses/me/questionnaires/')
      return Array.isArray(data) ? data : []
    },
    retry: false,
  })
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)

  // a POST, not a query: every click issues a fresh token, so only on purpose
  const issue = useMutation<QuestionnaireTokenOut, unknown>({
    mutationFn: async () => {
      const { data } = await api.post<QuestionnaireTokenOut>(`/visits/${visitId}/questionnaire-token`)
      return data
    },
    onSuccess: () => {
      setCopied(false)
      setCopyError(false)
    },
  })

  const url = issue.data ? guestUrl(issue.data.token) : ''
  const status = issue.isError ? apiErrorStatus(issue.error) : undefined

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setCopyError(false)
    } catch {
      setCopied(false)
      setCopyError(true)
    }
  }

  if (templates.isLoading) return null
  const bound = templates.data?.some(
    (template) => template.service_id != null && template.service_id === serviceId && template.published_version != null,
  )
  if (templates.data && !bound) return null

  return (
    <section className="border-t border-gray-200 pt-4 dark:border-gray-700">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('questionnaireAnswers.title')}</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('questionnaireLink.hint')}</p>

      {issue.data ? (
        <div className="mt-3 space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              aria-label={t('questionnaireLink.label')}
              value={url}
              onFocus={(event) => event.currentTarget.select()}
              className="min-w-0 flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-900"
            />
            <button
              type="button"
              onClick={() => void copy()}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-900"
            >
              {t('questionnaireLink.copy')}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('questionnaireAnswers.version')} {issue.data.version}
            <span className="mx-1.5">·</span>
            {t('questionnaireLink.validUntil')}{' '}
            {new Date(issue.data.expires_at).toLocaleString(INTL_LOCALE[locale])}
          </p>
          {copied && <p role="status" className="text-xs text-green-700 dark:text-green-400">{t('questionnaireLink.copied')}</p>}
          {copyError && <FormError message={t('questionnaireLink.copyError')} />}
        </div>
      ) : (
        <button
          type="button"
          disabled={issue.isPending}
          onClick={() => issue.mutate()}
          className="mt-3 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-900"
        >
          {t('questionnaireLink.create')}
        </button>
      )}

      {status === 404 && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t('questionnaireLink.notAvailable')}</p>
      )}
      {status === 403 && <FormError message={t('questionnaireAnswers.noAccess')} />}
      {issue.isError && status !== 404 && status !== 403 && <FormError message={t('questionnaireLink.error')} />}
    </section>
  )
}
