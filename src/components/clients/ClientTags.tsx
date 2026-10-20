import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../api/client'
import { apiErrorMessage, apiErrorStatus } from '../../api/errors'
import Button from '../../ui/Button'
import LoadingSpinner from '../LoadingSpinner'
import { useTranslation } from '../../hooks/useTranslation'
import type { ClientProfileOut } from '../../api/types'

const MAX_TAGS = 20
const MAX_TAG_LENGTH = 40
const MAX_PREFERENCES_LENGTH = 2000

export default function ClientTags({ clientId }: { clientId: number }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const queryKey = ['client-profile', clientId]
  const [tags, setTags] = useState<string[] | null>(null)
  const [preferences, setPreferences] = useState<string | null>(null)
  const [tagDraft, setTagDraft] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data: profile, isLoading, isError, refetch } = useQuery<ClientProfileOut>({
    queryKey,
    queryFn: async () => {
      const { data } = await api.get(`/clients/${clientId}/profile`)
      return data
    },
  })

  const localTags = tags ?? profile?.tags ?? []
  const localPreferences = preferences ?? profile?.preferences ?? ''
  const dirty = tags !== null || preferences !== null

  const save = useMutation({
    mutationFn: () =>
      api.put<ClientProfileOut>(`/clients/${clientId}/profile`, {
        tags: localTags,
        preferences: localPreferences.trim() || null,
      }),
    onSuccess: (response) => {
      queryClient.setQueryData<ClientProfileOut>(queryKey, response.data)
      setTags(null)
      setPreferences(null)
      setError(null)
    },
    onError: (err) => {
      setError(
        apiErrorStatus(err) === 403
          ? t('clientWorkspace.forbidden')
          : apiErrorMessage(err, t('clientWorkspace.profileError')),
      )
    },
  })

  const addTag = () => {
    const cleaned = tagDraft.trim().replace(/\s+/g, ' ')
    if (!cleaned || localTags.length >= MAX_TAGS) return
    if (localTags.some((tag) => tag.toLowerCase() === cleaned.toLowerCase())) {
      setTagDraft('')
      return
    }
    setTags([...localTags, cleaned])
    setTagDraft('')
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <LoadingSpinner />
      </div>
    )
  }
  if (isError) {
    return (
      <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
        <p>{t('common.loadError')}</p>
        <button type="button" onClick={() => void refetch()} className="mt-2 underline">
          {t('common.retry')}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        {localTags.length === 0 ? (
          <p className="mb-2 text-sm text-[var(--workspace-muted)]">{t('clientWorkspace.noTags')}</p>
        ) : (
          <ul className="mb-2 flex flex-wrap gap-2" aria-label={t('clientWorkspace.tags')}>
            {localTags.map((tag) => (
              <li
                key={tag}
                className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700 dark:bg-blue-900/30 dark:text-blue-200"
              >
                {tag}
                <button
                  type="button"
                  aria-label={`${t('common.delete')}: ${tag}`}
                  onClick={() => setTags(localTags.filter((item) => item !== tag))}
                  className="rounded-full px-1 leading-none hover:bg-blue-100 dark:hover:bg-blue-800"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            aria-label={t('clientWorkspace.tagPlaceholder')}
            placeholder={t('clientWorkspace.tagPlaceholder')}
            value={tagDraft}
            maxLength={MAX_TAG_LENGTH}
            disabled={localTags.length >= MAX_TAGS}
            onChange={(event) => setTagDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                addTag()
              }
            }}
            className="min-w-0 flex-1 rounded-md border border-[var(--workspace-line)] bg-[var(--workspace-panel)] px-3 py-2 text-sm text-[var(--workspace-ink)]"
          />
          <Button
            variant="secondary"
            onClick={addTag}
            disabled={!tagDraft.trim() || localTags.length >= MAX_TAGS}
          >
            {t('clientWorkspace.addTag')}
          </Button>
        </div>
        {localTags.length >= MAX_TAGS && (
          <p className="mt-1 text-xs text-[var(--workspace-muted)]">{MAX_TAGS}/{MAX_TAGS}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--workspace-ink)]" htmlFor="client-preferences">
          {t('clientWorkspace.preferences')}
        </label>
        <textarea
          id="client-preferences"
          value={localPreferences}
          maxLength={MAX_PREFERENCES_LENGTH}
          placeholder={t('clientWorkspace.preferencesPlaceholder')}
          onChange={(event) => setPreferences(event.target.value)}
          rows={3}
          className="w-full rounded-md border border-[var(--workspace-line)] bg-[var(--workspace-panel)] px-3 py-2 text-sm text-[var(--workspace-ink)]"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button onClick={() => save.mutate()} disabled={!dirty || save.isPending}>
          {save.isPending ? t('common.saving') : t('clientWorkspace.saveProfile')}
        </Button>
      </div>
    </div>
  )
}
