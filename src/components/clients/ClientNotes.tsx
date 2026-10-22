import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../api/client'
import { apiErrorMessage, apiErrorStatus } from '../../api/errors'
import Button from '../../ui/Button'
import LoadingSpinner from '../LoadingSpinner'
import { useWorkspaceAccessContext } from '../../hooks/useWorkspaceAccess'
import { useTranslation } from '../../hooks/useTranslation'
import type { ClientNoteOut } from '../../api/types'

const MAX_NOTE_LENGTH = 2000

export default function ClientNotes({ clientId }: { clientId: number }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const access = useWorkspaceAccessContext()
  const canEdit = access == null || access.crm_mode === 'full'
  const queryKey = ['client-notes', clientId]
  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingBody, setEditingBody] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data: notes = [], isLoading, isError, refetch } = useQuery<ClientNoteOut[]>({
    queryKey,
    queryFn: async () => {
      const { data } = await api.get(`/clients/${clientId}/notes`)
      return data
    },
  })

  const describeError = (err: unknown, fallback: string) =>
    apiErrorStatus(err) === 403 ? t('clientWorkspace.forbidden') : apiErrorMessage(err, fallback)

  const createNote = useMutation({
    mutationFn: (body: string) => api.post(`/clients/${clientId}/notes`, { body }),
    onMutate: async (body: string) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<ClientNoteOut[]>(queryKey) ?? []
      const pending = {
        id: -Date.now(),
        client_id: clientId,
        business_id: 0,
        author_id: null,
        author_name: null,
        body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as ClientNoteOut
      queryClient.setQueryData<ClientNoteOut[]>(queryKey, [pending, ...previous])
      setDraft('')
      setError(null)
      return { previous }
    },
    onError: (err, body, context) => {
      queryClient.setQueryData(queryKey, context?.previous)
      setDraft(body)
      setError(describeError(err, t('clientWorkspace.noteError')))
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const updateNote = useMutation({
    mutationFn: ({ id, body }: { id: number; body: string }) =>
      api.put(`/clients/${clientId}/notes/${id}`, { body }),
    onMutate: async ({ id, body }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<ClientNoteOut[]>(queryKey) ?? []
      queryClient.setQueryData<ClientNoteOut[]>(
        queryKey,
        previous.map((note) =>
          note.id === id ? { ...note, body, updated_at: new Date().toISOString() } : note,
        ),
      )
      setError(null)
      return { previous }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(queryKey, context?.previous)
      setEditingId(variables.id)
      setEditingBody(variables.body)
      setError(describeError(err, t('clientWorkspace.noteError')))
    },
    onSuccess: () => {
      setEditingId(null)
      setEditingBody('')
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })

  const deleteNote = useMutation({
    mutationFn: (id: number) => api.delete(`/clients/${clientId}/notes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: (err) => setError(describeError(err, t('clientWorkspace.noteError'))),
  })

  const submitDraft = () => {
    if (!canEdit) return
    const body = draft.trim()
    if (body) createNote.mutate(body)
  }

  const visibleNotes = (canEdit || !updateNote.isPending ? notes : updateNote.context?.previous ?? notes)
    .filter(note => canEdit || note.id > 0)

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
    <div>
      {canEdit && <div className="space-y-2">
        <textarea
          aria-label={t('clientWorkspace.notePlaceholder')}
          placeholder={t('clientWorkspace.notePlaceholder')}
          value={draft}
          maxLength={MAX_NOTE_LENGTH}
          onChange={(event) => setDraft(event.target.value)}
          rows={3}
          className="ui-input min-h-20 w-full resize-y"
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs tabular-nums text-[var(--workspace-muted)]">
            {draft.length}/{MAX_NOTE_LENGTH}
          </span>
          <Button className="min-h-8 px-3 py-1.5 text-xs" onClick={submitDraft} disabled={!draft.trim() || createNote.isPending}>
            {createNote.isPending ? t('common.saving') : t('clientWorkspace.addNote')}
          </Button>
        </div>
      </div>}

      {canEdit && error && (
        <p role="alert" className="mt-3 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-800">
          {error}
        </p>
      )}

      {visibleNotes.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--workspace-muted)]">{t('clientWorkspace.noNotes')}</p>
      ) : (
        <ul className="mt-3 divide-y divide-[var(--workspace-line)]">
          {visibleNotes.map((note) => {
            const pending = note.id < 0
            const editing = canEdit && editingId === note.id
            return (
              <li
                key={note.id}
                aria-busy={pending || undefined}
                className={`py-3 ${pending ? 'opacity-60' : ''}`}
              >
                {editing ? (
                  <div className="space-y-2">
                    <textarea
                      aria-label={t('common.edit')}
                      value={editingBody}
                      maxLength={MAX_NOTE_LENGTH}
                      onChange={(event) => setEditingBody(event.target.value)}
                      rows={3}
                      className="ui-input min-h-20 w-full resize-y"
                    />
                    <div className="flex gap-2">
                      <Button
                        className="min-h-8 px-3 py-1.5 text-xs"
                        onClick={() => {
                          const body = editingBody.trim()
                          if (body) updateNote.mutate({ id: note.id, body })
                        }}
                        disabled={!editingBody.trim() || updateNote.isPending}
                      >
                        {t('common.save')}
                      </Button>
                      <Button
                        variant="quiet"
                        className="min-h-8 px-2 py-1 text-xs"
                        onClick={() => {
                          setEditingId(null)
                          setEditingBody('')
                        }}
                      >
                        {t('common.cancel')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="whitespace-pre-wrap break-words text-sm text-[var(--workspace-ink)]">{note.body}</p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--workspace-muted)]">
                      <span>
                        {note.author_name || '—'} · {new Date(note.created_at).toLocaleString()}
                      </span>
                      {canEdit && !pending && (
                        <span className="flex gap-2">
                          <Button
                            variant="quiet"
                            className="min-h-8 px-2 py-1 text-xs"
                            onClick={() => {
                              setEditingId(note.id)
                              setEditingBody(note.body)
                              setError(null)
                            }}
                          >
                            {t('common.edit')}
                          </Button>
                          <Button
                            variant="quiet"
                            className="min-h-8 px-2 py-1 text-xs"
                            onClick={() => {
                              if (window.confirm(t('clientWorkspace.deleteNoteConfirm'))) {
                                deleteNote.mutate(note.id)
                              }
                            }}
                          >
                            {t('common.delete')}
                          </Button>
                        </span>
                      )}
                    </div>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
