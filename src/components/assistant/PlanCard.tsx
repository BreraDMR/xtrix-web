import { useEffect } from 'react'
import { HiOutlineCheckCircle, HiOutlineMinusCircle, HiOutlineXCircle } from 'react-icons/hi'
import type { AssistantActionResult, AssistantPlannedAction } from '../../api/types'
import type { AssistantKey } from '../../i18n/assistant'
import type { Locale } from '../../store/localeStore'
import { formatTimeRange } from '../../hooks/useAssistant'
import { minutesSeconds, useCountdown } from '../../hooks/useCountdown'
import { confirmable, outcomeText, type PlanEntry, type Say } from './plan'

const ACTION_LABELS: Record<AssistantPlannedAction['action'], AssistantKey> = {
  find_client: 'action_find_client',
  create_client: 'action_create_client',
  update_client: 'action_update_client',
  find_free_slot: 'action_find_free_slot',
  create_visit: 'action_create_visit',
  reschedule_visit: 'action_reschedule_visit',
  cancel_visit: 'action_cancel_visit',
  add_note: 'action_add_note',
}

const RESULT_LABELS: Record<AssistantActionResult['status'], AssistantKey> = {
  done: 'result_done',
  failed: 'result_failed',
  skipped: 'result_skipped',
}

function clientName(action: AssistantPlannedAction): string | null | undefined {
  if (action.display?.client_name) return action.display.client_name
  // a new client isn't in the database yet, and a search shows what it looks for
  if (action.action === 'create_client') return action.full_name
  if (action.action === 'find_client') return action.name
  return null
}

function ResultLine({ result, say }: { result: AssistantActionResult; say: Say }) {
  const Icon = result.status === 'done' ? HiOutlineCheckCircle : result.status === 'failed' ? HiOutlineXCircle : HiOutlineMinusCircle
  const color = result.status === 'done' ? 'text-green-700 dark:text-green-400'
    : result.status === 'failed' ? 'text-red-700 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
  return (
    <div className={`mt-1 text-sm ${color}`}>
      <span className="inline-flex items-center gap-1 font-medium">
        <Icon className="h-4 w-4" aria-hidden="true" />
        {say(RESULT_LABELS[result.status])}
      </span>
      {result.error && <p className="mt-0.5">{result.error.message}</p>}
    </div>
  )
}

interface PlanCardProps {
  entry: PlanEntry
  locale: Locale
  say: Say
  onConfirm: (id: number) => void
  onCancel: (id: number) => void
  onExpire: (id: number) => void
}

export default function PlanCard({ entry, locale, say, onConfirm, onCancel, onExpire }: PlanCardProps) {
  const { plan, phase, result } = entry
  const canConfirm = confirmable(plan)
  const counting = phase === 'open' && canConfirm
  const secondsLeft = useCountdown(counting ? Date.parse(plan.expires_at) : null)
  const expired = counting && secondsLeft <= 0

  useEffect(() => {
    if (expired) onExpire(entry.id)
  }, [expired, entry.id, onExpire])

  const rows = (action: AssistantPlannedAction): [AssistantKey, string][] => {
    const d = action.display
    const list: [AssistantKey, string | null | undefined][] = [
      ['field_client', clientName(action)],
      ['field_service', d?.service_name],
      ['field_specialist', d?.specialist_name],
      ['field_time', d?.start_time ? formatTimeRange(d.start_time, d.end_time, locale) : null],
      ['field_note', d?.note],
    ]
    return list.filter((row): row is [AssistantKey, string] => !!row[1])
  }

  return (
    <article
      aria-label={plan.summary || say('planReady')}
      className="rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-800 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
    >
      {plan.questions.length > 0 ? (
        <div>
          {plan.summary && <p className="mb-2 font-medium">{plan.summary}</p>}
          <p className="text-gray-600 dark:text-gray-300">{say('asks')}</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {plan.questions.map((question, i) => <li key={i}>{question}</li>)}
          </ul>
          {phase === 'open' && <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{say('answerHint')}</p>}
        </div>
      ) : (
        <div>
          <p className="text-gray-600 dark:text-gray-300">{say('planReady')}</p>
          {plan.summary && <p className="mt-1 font-medium">{plan.summary}</p>}
        </div>
      )}

      {plan.actions.length > 0 && (
        <ol className="mt-3 space-y-2">
          {plan.actions.map((action, index) => {
            const outcome = result?.results.find((r) => r.index === index)
            return (
              <li key={index} className="rounded-md bg-gray-50 p-2 dark:bg-gray-900/40">
                <p className="font-medium">{ACTION_LABELS[action.action] ? say(ACTION_LABELS[action.action]) : action.action}</p>
                {rows(action).length > 0 && (
                  <dl className="mt-1 grid grid-cols-[auto,1fr] gap-x-3 gap-y-0.5 text-gray-700 dark:text-gray-300">
                    {rows(action).map(([label, value]) => (
                      <div key={label} className="contents">
                        <dt className="text-gray-500 dark:text-gray-400">{say(label)}</dt>
                        <dd className="min-w-0 break-words">{value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {outcome && <ResultLine result={outcome} say={say} />}
              </li>
            )
          })}
        </ol>
      )}

      <div className="mt-3">
        {counting && !expired && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onConfirm(entry.id)}
              className="rounded-lg bg-purple-600 px-4 py-2 font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              {say('confirm')}
            </button>
            <button
              type="button"
              onClick={() => onCancel(entry.id)}
              className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              {say('cancel')}
            </button>
            <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
              {say('expiresIn', { time: minutesSeconds(secondsLeft) })}
            </span>
          </div>
        )}
        {phase === 'running' && <p className="text-gray-600 dark:text-gray-300">{say('executing')}</p>}
        {phase === 'done' && result && (
          <p className={`font-medium ${result.ok ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
            {outcomeText(result, say)}
          </p>
        )}
        {phase === 'cancelled' && <p className="text-gray-600 dark:text-gray-300">{say('cancelled')}</p>}
        {(phase === 'expired' || expired) && <p className="text-amber-700 dark:text-amber-400">{say('planExpired')}</p>}
        {phase === 'replaced' && <p className="text-gray-500 dark:text-gray-400">{say('replaced')}</p>}
      </div>
    </article>
  )
}
