import { Link } from 'react-router-dom'
import { useWorkspaceAccessContext } from '../../hooks/useWorkspaceAccess'
import { useTranslation } from '../../hooks/useTranslation'
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useQueryClient, type UseQueryResult } from '@tanstack/react-query'
import { HiOutlineMicrophone, HiOutlinePaperAirplane, HiOutlineSparkles, HiOutlineStop, HiOutlineTrash, HiOutlineX } from 'react-icons/hi'
import api from '../../api/client'
import {
  apiErrorCode, apiErrorMessage, apiErrorStatus, apiIsNetworkError, apiRetryAfter, apiValidationCodes,
} from '../../api/errors'
import type { AssistantExecuteOut, AssistantPlanOut, AssistantStatusOut, AssistantTranscribeOut } from '../../api/types'
import { assistantT, type AssistantGender, type AssistantKey } from '../../i18n/assistant'
import { useLocaleStore } from '../../store/localeStore'
import { ASSISTANT_STATUS_KEY, formatDay, refreshAfterAssistant } from '../../hooks/useAssistant'
import { MESSAGES_KEY, useConversationMessages, useConversations } from '../../hooks/useConversations'
import { minutesSeconds, useCountdown } from '../../hooks/useCountdown'
import { MAX_RECORDING_SECONDS, useVoiceRecorder, type VoiceProblem } from '../../hooks/useVoiceRecorder'
import ConversationList from './ConversationList'
import PlanCard from './PlanCard'
import { confirmable, type PlanEntry, type PlanPhase, type Say } from './plan'

const MAX_REQUEST_LENGTH = 2000
// when a 503 ai_busy somehow comes without Retry-After
const DEFAULT_BUSY_SECONDS = 10
const AUDIO_CODES: AssistantKey[] = ['audio_type_not_supported', 'audio_empty', 'audio_too_large']
// same cap as the API
const MAX_AUDIO_BYTES = 5 * 1024 * 1024
const VOICE_PROBLEMS: Record<VoiceProblem, AssistantKey> = {
  unsupported: 'voiceUnsupported',
  denied: 'voiceDenied',
  failed: 'voiceFailed',
  empty: 'voiceEmpty',
  audio_too_large: 'audio_too_large',
}

function audioFileName(type: string): string {
  const ext = type.includes('mp4') ? 'mp4' : type.includes('ogg') ? 'ogg' : type.includes('mpeg') ? 'mp3' : type.includes('wav') ? 'wav' : 'webm'
  return `voice.${ext}`
}

type Entry =
  | { id: number; kind: 'user'; text: string }
  | { id: number; kind: 'notice'; tone: 'info' | 'error'; text: string }
  | PlanEntry
type NewEntry = Entry extends infer E ? (E extends Entry ? Omit<E, 'id'> : never) : never

// below Tailwind's sm the panel covers the whole screen and acts as a modal
const PHONE = '(max-width: 639px)'
const FOCUSABLE = 'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'

function useFullScreen(): boolean {
  const [full, setFull] = useState(() => typeof window.matchMedia === 'function' && window.matchMedia(PHONE).matches)
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const media = window.matchMedia(PHONE)
    const update = () => setFull(media.matches)
    media.addEventListener?.('change', update)
    return () => media.removeEventListener?.('change', update)
  }, [])
  return full
}

interface AssistantPanelProps {
  open: boolean
  onClose: () => void
  status: UseQueryResult<AssistantStatusOut>
  persona: { name: string; gender: AssistantGender }
}

export default function AssistantPanel({ open, onClose, status, persona }: AssistantPanelProps) {
  const access = useWorkspaceAccessContext()
  const { t } = useTranslation()
  const subscriptionRequired = access !== undefined && !access?.can_use_ai
  const locale = useLocaleStore((state) => state.locale)
  const queryClient = useQueryClient()
  const say: Say = useCallback(
    (key, options = {}) => assistantT(locale, key, { ...options, name: persona.name, gender: persona.gender }),
    [locale, persona.name, persona.gender],
  )

  const [entries, setEntries] = useState<Entry[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [busy, setBusy] = useState<{ until: number; fromModel: boolean } | null>(null)
  const [limitUntil, setLimitUntil] = useState<number | null>(null)
  const [notConfigured, setNotConfigured] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const nextId = useRef(1)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const fullScreen = useFullScreen()
  const titleId = useId()
  const hintId = useId()

  const busySeconds = useCountdown(busy?.until ?? null)
  const data = status.data
  const off = data?.enabled === false || notConfigured
  const ready = !!data && !off && !subscriptionRequired
  const limitReached = (!!data && data.used >= data.limit) || (limitUntil !== null && Date.now() < limitUntil)
  const resetsAt = data?.resets_at ?? (limitUntil ? new Date(limitUntil).toISOString() : null)
  // the pilot counts requests per day, the paid plans per month - the server says which
  const daily = data?.period === 'day'

  const {
    conversations,
    activeId,
    selectConversation,
    createConversation,
    renameConversation,
    archiveConversation,
    isCreating,
    hasMore,
    loadMore,
    isLoadingMore,
  } = useConversations(open)

  const messagesQuery = useConversationMessages(activeId, open)
  // switching chats must never leave the previous plan on screen, even while the new
  // messages load or fail; an in-flight send owns its freshly created conversation
  const shownActiveId = useRef(activeId)
  useLayoutEffect(() => {
    if (shownActiveId.current === activeId) return
    shownActiveId.current = activeId
    if (!sending) setEntries([])
  }, [activeId, sending])

  useEffect(() => {
    const msgs = messagesQuery.items
    if (!msgs) return
    if (msgs.length === 0) {
      setEntries([])
      return
    }
    const mapped: Entry[] = msgs.map((m) => {
      if (m.role === 'user') {
        return { id: nextId.current++, kind: 'user', text: m.text }
      }
      if (m.plan) {
        return {
          id: nextId.current++,
          kind: 'plan',
          plan: m.plan,
          request: m.text,
          phase: m.result ? 'done' : m.status === 'expired' ? 'expired' : 'open',
          ...(m.result ? { result: m.result } : {}),
        }
      }
      return {
        id: nextId.current++,
        kind: 'notice',
        tone: m.status === 'failed' ? 'error' : 'info',
        text: m.text || (m.error_code ? say('requestFailed') : say('notUnderstood')),
      }
    })
    setEntries(mapped)
  }, [messagesQuery.items, say])

  const add = useCallback((entry: NewEntry) => {
    const id = nextId.current++
    setEntries((prev) => [...prev, { ...entry, id } as Entry])
  }, [])
  const notice = useCallback((message: string, tone: 'info' | 'error' = 'error') => add({ kind: 'notice', tone, text: message }), [add])
  const setPhase = useCallback((id: number, phase: PlanPhase, result?: AssistantExecuteOut) => {
    setEntries((prev) => prev.map((e) => (e.kind === 'plan' && e.id === id ? { ...e, phase, ...(result ? { result } : {}) } : e)))
  }, [])

  // focus goes in when the panel opens (to the input once there is one)
  useEffect(() => {
    if (!open) return
    if (ready) inputRef.current?.focus()
    else closeRef.current?.focus()
  }, [open, ready])

  useEffect(() => {
    const log = logRef.current
    if (log) log.scrollTop = log.scrollHeight
    // Confirm/Cancel disappear once used; don't leave the keyboard user on <body>
    const focused = document.activeElement
    if (open && (!focused || focused === document.body)) inputRef.current?.focus()
  }, [entries, sending, open])

  const handleError = useCallback((err: unknown) => {
    const code = apiErrorCode(err)
    const wait = apiRetryAfter(err)
    if (code === 'ai_limit_reached') {
      setLimitUntil(Date.now() + (wait ?? 3600) * 1000)
      queryClient.invalidateQueries({ queryKey: ASSISTANT_STATUS_KEY })
      return
    }
    if (code === 'ai_busy') {
      setBusy({ until: Date.now() + (wait ?? DEFAULT_BUSY_SECONDS) * 1000, fromModel: true })
      return
    }
    if (code === 'ai_not_configured') {
      setNotConfigured(true)
      queryClient.invalidateQueries({ queryKey: ASSISTANT_STATUS_KEY })
      return
    }
    if (code === 'ai_unavailable') return notice(say('unavailable'))
    if (apiIsNetworkError(err)) return notice(say('networkError'))
    if (apiErrorStatus(err) === 429 && wait) setBusy({ until: Date.now() + wait * 1000, fromModel: false })
    const audio = AUDIO_CODES.find((c) => apiValidationCodes(err).includes(c))
    notice(audio ? say(audio) : apiErrorMessage(err, say('requestFailed')))
  }, [notice, queryClient, say])

  // the heard text goes into the input for the user to check, it's never sent from here
  const upload = async (audio: Blob) => {
    if (audio.size > MAX_AUDIO_BYTES) {
      voice.setProblem('audio_too_large')
      return
    }
    const form = new FormData()
    form.append('file', audio, audioFileName(audio.type))
    setTranscribing(true)
    try {
      const { data: heard } = await api.post<AssistantTranscribeOut>('/assistant/transcribe', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const words = heard.text.trim()
      if (!words) voice.setProblem('empty')
      else {
        setText((current) => (current.trim() ? `${current.trimEnd()} ${words}` : words).slice(0, MAX_REQUEST_LENGTH))
        inputRef.current?.focus()
      }
      queryClient.invalidateQueries({ queryKey: ASSISTANT_STATUS_KEY })
    } catch (err) {
      handleError(err)
    } finally {
      setTranscribing(false)
    }
  }
  const voice = useVoiceRecorder(upload)
  const { discard: discardVoice } = voice
  useEffect(() => {
    if (!open) discardVoice()
  }, [open, discardVoice])

  const canSend = ready && !!text.trim() && !sending && busySeconds === 0 && !limitReached && !voice.recording && !transcribing
  const micDisabled = sending || transcribing || busySeconds > 0 || limitReached
  // keep the request key with the text it belongs to: a lost answer retried with the same
  // key is replayed by the server instead of spending a second model call
  const pendingRequest = useRef<{ conversationId: string; text: string; requestId: string } | null>(null)

  const send = async () => {
    const typed = text.trim()
    if (!canSend || subscriptionRequired) return
    // the model has no memory: an answer to its questions goes out together with the request it asked about
    const lastPlan = [...entries].reverse().find((e): e is PlanEntry => e.kind === 'plan')
    const asking = lastPlan && lastPlan.phase === 'open' && lastPlan.plan.questions.length > 0 ? lastPlan : null
    const request = (asking ? `${asking.request}\n${typed}` : typed).slice(0, MAX_REQUEST_LENGTH)
    add({ kind: 'user', text: typed })
    setText('')
    setSending(true)
    try {
      let targetConvId = activeId
      if (!targetConvId) {
        const newConv = await createConversation()
        targetConvId = newConv.id
      }
      const pending = pendingRequest.current
      const client_request_id = pending && pending.conversationId === targetConvId && pending.text === request
        ? pending.requestId
        : crypto.randomUUID()
      pendingRequest.current = { conversationId: targetConvId, text: request, requestId: client_request_id }
      const { data: plan } = await api.post<AssistantPlanOut>('/assistant/plan', {
        text: request,
        locale,
        conversation_id: targetConvId,
        client_request_id,
      })
      pendingRequest.current = null
      const id = nextId.current++
      setEntries((prev) => {
        const older = prev.map((e) => (e.kind === 'plan' && e.phase === 'open'
          ? { ...e, phase: (confirmable(e.plan) ? 'replaced' : 'answered') as PlanPhase } : e))
        if (!plan.actions.length && !plan.questions.length) {
          return [...older, { id, kind: 'notice', tone: 'info', text: plan.summary || say('notUnderstood') }]
        }
        return [...older, { id, kind: 'plan', plan, request, phase: 'open' }]
      })
      queryClient.invalidateQueries({ queryKey: ASSISTANT_STATUS_KEY })
      queryClient.invalidateQueries({ queryKey: [...MESSAGES_KEY, targetConvId] })
    } catch (err) {
      // give the text back so it can be sent again, unless something new was typed meanwhile
      setText((current) => current || typed)
      handleError(err)
    } finally {
      setSending(false)
    }
  }

  const confirm = useCallback(async (id: number) => {
    const entry = entries.find((e): e is PlanEntry => e.kind === 'plan' && e.id === id)
    if (!entry || entry.phase !== 'open') return
    setPhase(id, 'running')
    try {
      const { data: result } = await api.post<AssistantExecuteOut>('/assistant/execute', { plan_id: entry.plan.plan_id })
      setPhase(id, 'done', result)
      refreshAfterAssistant(queryClient)
    } catch (err) {
      if (apiErrorCode(err) === 'plan_not_found') {
        setPhase(id, 'expired')
        return
      }
      setPhase(id, 'open')
      handleError(err)
    }
  }, [entries, handleError, queryClient, setPhase])

  const cancel = useCallback((id: number) => setPhase(id, 'cancelled'), [setPhase])
  const expire = useCallback((id: number) => setPhase(id, 'expired'), [setPhase])

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onClose()
      return
    }
    // full screen there's nothing to see behind the panel, so Tab goes round inside it
    if (event.key === 'Tab' && fullScreen && panelRef.current) {
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
  }

  const onInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      void send()
    }
  }

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal={fullScreen || undefined}
      aria-labelledby={titleId}
      hidden={!open}
      onKeyDown={onKeyDown}
      className={open
        ? 'fixed inset-0 z-[60] flex flex-col bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[400px] sm:border-l sm:border-gray-200 sm:shadow-2xl dark:sm:border-gray-700'
        : 'hidden'}
    >
      <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
          <HiOutlineSparkles className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="truncate text-base font-semibold">{persona.name}</h2>
          {data && <p className="text-xs text-gray-500 dark:text-gray-400">{say(daily ? 'usageDay' : 'usage', { used: data.used, limit: data.limit })}</p>}
        </div>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={say('close')}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-200"
        >
          <HiOutlineX className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {subscriptionRequired ? (
        <div className="m-4 rounded-xl bg-blue-50 p-4 text-sm text-blue-900 dark:bg-blue-950/30 dark:text-blue-100">
          <p>{t('pilot.aiSubscribe')}</p>
          <Link to="/app/subscription" onClick={onClose} className="mt-3 inline-block font-semibold underline">{t('subscription.title')}</Link>
        </div>
      ) : status.isError && !data ? (
        <div role="alert" className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
          <p>{say('statusError')}</p>
          <button type="button" onClick={() => void status.refetch()} className="mt-3 rounded border border-red-300 px-3 py-1.5">
            {say('retry')}
          </button>
        </div>
      ) : !data ? (
        <div className="flex flex-1 items-center justify-center" aria-busy="true">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-purple-200 border-t-purple-600" />
        </div>
      ) : off ? (
        <p className="m-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-700 dark:bg-gray-900/40 dark:text-gray-300">{say('notConfigured')}</p>
      ) : (
        <>
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            onSelect={(id) => selectConversation(id)}
            onNewChat={() => createConversation()}
            onRename={(id, title) => renameConversation({ id, title })}
            onArchive={(id) => archiveConversation(id)}
            isCreating={isCreating}
            hasMore={hasMore}
            onLoadMore={() => loadMore()}
            isLoadingMore={isLoadingMore}
          />
          <div
            ref={logRef}
            role="log"
            aria-live="polite"
            aria-label={persona.name}
            className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-4 dark:bg-gray-900/30"
          >
            {messagesQuery.hasNextPage && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => void messagesQuery.fetchNextPage()}
                  disabled={messagesQuery.isFetchingNextPage}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  {say('loadEarlierMessages')}
                </button>
              </div>
            )}
            {entries.length === 0 && <p className="text-center text-sm text-gray-500 dark:text-gray-400">{say('ready')}</p>}
            {entries.map((entry) => {
              if (entry.kind === 'user') {
                return (
                  <div key={entry.id} className="flex justify-end">
                    <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-lg bg-purple-600 px-3 py-2 text-sm text-white">
                      <span className="sr-only">{say('you')}: </span>
                      {entry.text}
                    </p>
                  </div>
                )
              }
              if (entry.kind === 'notice') {
                return (
                  <p
                    key={entry.id}
                    role={entry.tone === 'error' ? 'alert' : undefined}
                    className={entry.tone === 'error'
                      ? 'rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200'
                      : 'max-w-[85%] rounded-lg bg-white px-3 py-2 text-sm text-gray-800 shadow-sm dark:bg-gray-800 dark:text-gray-100'}
                  >
                    {entry.text}
                  </p>
                )
              }
              return (
                <PlanCard key={entry.id} entry={entry} locale={locale} say={say} onConfirm={confirm} onCancel={cancel} onExpire={expire} />
              )
            })}
            {sending && <p className="text-sm text-gray-500 dark:text-gray-400">{say('thinking')}</p>}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault()
              void send()
            }}
            className="border-t border-gray-200 p-3 dark:border-gray-700"
          >
            {limitReached && resetsAt && (
              <p role="status" className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
                {say(daily ? 'limitReachedUntilDay' : 'limitReachedUntil', { date: formatDay(resetsAt, locale) })}
              </p>
            )}
            {busy?.fromModel && busySeconds > 0 && (
              <p role="status" className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
                {say('busy', { seconds: busySeconds })}
              </p>
            )}
            {voice.recording && (
              <div className="mb-2 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
                <span className="h-2.5 w-2.5 flex-shrink-0 animate-pulse rounded-full bg-red-600" aria-hidden="true" />
                <span role="timer" className="min-w-0 flex-1">
                  {say('voiceRecording', { time: minutesSeconds(voice.seconds), max: minutesSeconds(MAX_RECORDING_SECONDS) })}
                </span>
                <button
                  type="button"
                  onClick={voice.discard}
                  aria-label={say('voiceDiscard')}
                  className="rounded-lg p-2 text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-red-200 dark:hover:bg-red-900/50"
                >
                  <HiOutlineTrash className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={voice.stop}
                  className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  <HiOutlineStop className="h-5 w-5" aria-hidden="true" />
                  {say('voiceStop')}
                </button>
              </div>
            )}
            {transcribing && <p role="status" className="mb-2 text-sm text-gray-600 dark:text-gray-300">{say('voiceTranscribing')}</p>}
            {voice.problem && (
              <p role="alert" className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
                {say(VOICE_PROBLEMS[voice.problem])}
              </p>
            )}
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={onInputKeyDown}
                aria-label={say('inputPlaceholder')}
                aria-describedby={hintId}
                placeholder={say('inputPlaceholder')}
                maxLength={MAX_REQUEST_LENGTH}
                rows={2}
                className="min-h-[44px] min-w-0 flex-1 resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
              {data.voice_enabled && !voice.recording && (
                <button
                  type="button"
                  onClick={() => void voice.start()}
                  disabled={micDisabled}
                  aria-label={say('voiceStart')}
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <HiOutlineMicrophone className="h-5 w-5" aria-hidden="true" />
                </button>
              )}
              <button
                type="submit"
                disabled={!canSend}
                aria-label={say('send')}
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-purple-600 text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <HiOutlinePaperAirplane className="h-5 w-5 rotate-90" aria-hidden="true" />
              </button>
            </div>
            <p id={hintId} className="mt-1 hidden text-xs text-gray-500 dark:text-gray-400 sm:block">{say('keyboardHint')}</p>
          </form>
        </>
      )}
    </div>
  )
}
