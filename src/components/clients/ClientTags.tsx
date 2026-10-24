import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../api/client'
import { apiErrorMessage, apiErrorStatus } from '../../api/errors'
import Button from '../../ui/Button'
import Input from '../../ui/Input'
import { useWorkspaceAccessContext } from '../../hooks/useWorkspaceAccess'
import LoadingSpinner from '../LoadingSpinner'
import { useTranslation } from '../../hooks/useTranslation'
import type { ClientProfileOut } from '../../api/types'

const MAX_TAGS = 20
const MAX_TAG_LENGTH = 40
const MAX_PREFERENCES_LENGTH = 2000

export default function ClientTags({ clientId }: { clientId: number }) {
  return <ClientTagsEditor key={clientId} clientId={clientId} />
}

function ClientTagsEditor({ clientId }: { clientId: number }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const access = useWorkspaceAccessContext()
  const canEdit = access == null || access.crm_mode === 'full'
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
  const displayedTags = canEdit ? localTags : profile?.tags ?? []
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
    if (!canEdit) return
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
        <Button variant="secondary" onClick={() => void refetch()} className="mt-2 min-h-8 px-3 py-1 text-xs">
          {t('common.retry')}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        {displayedTags.length === 0 ? (
          <p className="mb-2 text-sm text-[var(--workspace-muted)]">{t('clientWorkspace.noTags')}</p>
        ) : (
          <ul className="mb-2 flex flex-wrap gap-2" aria-label={t('clientWorkspace.tags')}>
            {displayedTags.map((tag) => (
              <li
                key={tag}
                className="flex max-w-full items-center gap-1 rounded-md bg-[var(--workspace-accent-soft)] px-2 py-1 text-xs text-[var(--workspace-accent)]"
              >
                <span className="break-all">{tag}</span>
                {canEdit && <Button
                  variant="quiet"
                  aria-label={`${t('common.delete')}: ${tag}`}
                  onClick={() => setTags(localTags.filter((item) => item !== tag))}
                  className="min-h-7 shrink-0 px-1.5 py-0 leading-none"
                >
                  ×
                </Button>}
              </li>
            ))}
          </ul>
        )}
        {canEdit && <div className="flex gap-2">
          <Input
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
            className="min-w-0 flex-1"
          />
          <Button
            variant="secondary"
            onClick={addTag}
            disabled={!tagDraft.trim() || localTags.length >= MAX_TAGS}
          >
            {t('clientWorkspace.addTag')}
          </Button>
        </div>}
        {canEdit && localTags.length >= MAX_TAGS && (
          <p className="mt-1 text-xs text-[var(--workspace-muted)]">{MAX_TAGS}/{MAX_TAGS}</p>
        )}
      </div>

      {canEdit ? <div>
        <label className="mb-1 block text-xs font-medium text-[var(--workspace-ink)]" htmlFor="client-preferences">
          {t('clientWorkspace.preferences')}
        </label>
        <textarea
          id="client-preferences"
          value={localPreferences}
          maxLength={MAX_PREFERENCES_LENGTH}
          placeholder={t('clientWorkspace.preferencesPlaceholder')}
          onChange={(event) => setPreferences(event.target.value)}
          rows={3}
          className="ui-input min-h-20 w-full resize-y"
        />
      </div> : <dl>
        <dt className="mb-1 text-xs font-medium text-[var(--workspace-muted)]">{t('clientWorkspace.preferences')}</dt>
        <dd className="whitespace-pre-wrap break-words text-sm text-[var(--workspace-ink)]">{profile?.preferences || '—'}</dd>
      </dl>}

      {canEdit && error && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-800">
          {error}
        </p>
      )}

      {canEdit && <div className="flex justify-end">
        <Button className="min-h-8 px-3 py-1.5 text-xs" onClick={() => save.mutate()} disabled={!dirty || save.isPending}>
          {save.isPending ? t('common.saving') : t('clientWorkspace.saveProfile')}
        </Button>
      </div>}
    </div>
  )
}
