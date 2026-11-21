import { useEffect } from 'react'
import { LuCircleCheck, LuCircleMinus, LuCircleX } from 'react-icons/lu'
import type { AssistantActionResult, AssistantPlannedAction } from '../../api/types'
import type { AssistantKey } from '../../i18n/assistant'
import type { Locale } from '../../store/localeStore'
import { formatTimeRange } from '../../hooks/useAssistant'
import { minutesSeconds, useCountdown } from '../../hooks/useCountdown'
import { confirmable, outcomeText, type PlanEntry, type Say } from './plan'
import { AssistantBubble, LogCard } from './ChatBubbles'
import Button from '../../ui/Button'

// each step is said in the assistant's voice: "Sasha will book a visit", then "Sasha booked the visit"
const STEP_LABELS: Record<AssistantPlannedAction['action'], { will: AssistantKey; did: AssistantKey }> = {
  find_client: { will: 'will_find_client', did: 'did_find_client' },
  create_client: { will: 'will_create_client', did: 'did_create_client' },
  update_client: { will: 'will_update_client', did: 'did_update_client' },
  find_free_slot: { will: 'will_find_free_slot', did: 'did_find_free_slot' },
  create_visit: { will: 'will_create_visit', did: 'did_create_visit' },
  reschedule_visit: { will: 'will_reschedule_visit', did: 'did_reschedule_visit' },
  cancel_visit: { will: 'will_cancel_visit', did: 'did_cancel_visit' },
  add_note: { will: 'will_add_note', did: 'did_add_note' },
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
  const Icon = result.status === 'done' ? LuCircleCheck : result.status === 'failed' ? LuCircleX : LuCircleMinus
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
  name: string
  locale: Locale
  say: Say
  onConfirm: (id: number) => void
  onCancel: (id: number) => void
  onExpire: (id: number) => void
}

export default function PlanCard({ entry, name, locale, say, onConfirm, onCancel, onExpire }: PlanCardProps) {
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

  const asking = plan.questions.length > 0
  // what the assistant says goes in its bubble; the steps and buttons go in the log in the middle
  const speech = asking ? (
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
  )

  const footer = (
    <>
      {counting && !expired && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button onClick={() => onConfirm(entry.id)}>{say('confirm')}</Button>
          <Button variant="secondary" onClick={() => onCancel(entry.id)}>{say('cancel')}</Button>
          <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
            {say('expiresIn', { time: minutesSeconds(secondsLeft) })}
          </span>
        </div>
      )}
      {phase === 'running' && <p className="mt-3 text-gray-600 dark:text-gray-300">{say('executing')}</p>}
      {/* every step already shows its own green line, so the summary only matters when something went wrong */}
      {phase === 'done' && result && (!result.ok || plan.actions.length === 0) && (
        <p className={`mt-3 font-medium ${result.ok ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
          {outcomeText(result, say)}
        </p>
      )}
      {phase === 'cancelled' && <p className="mt-3 text-gray-600 dark:text-gray-300">{say('cancelled')}</p>}
      {(phase === 'expired' || expired) && <p className="mt-3 text-amber-700 dark:text-amber-400">{say('planExpired')}</p>}
      {phase === 'replaced' && <p className="mt-3 text-gray-500 dark:text-gray-400">{say('replaced')}</p>}
    </>
  )

  return (
    <article aria-label={plan.summary || say('planReady')} className="space-y-3">
      <AssistantBubble name={name} tone={phase === 'replaced' || phase === 'answered' ? 'muted' : 'plain'}>
        {speech}
        {plan.actions.length === 0 && footer}
      </AssistantBubble>
      {plan.actions.length > 0 && (
        <LogCard label={say('logLabel')}>
          <ol className="space-y-2">
            {plan.actions.map((action, index) => {
              const outcome = result?.results.find((r) => r.index === index)
              return (
                <li key={index} className="rounded-md bg-gray-50 p-2 dark:bg-gray-900/40">
                  <p className={`flex items-center gap-1 font-medium ${outcome?.status === 'done' ? 'text-green-700 dark:text-green-400' : ''}`}>
                    {outcome?.status === 'done' && <LuCircleCheck className="h-4 w-4 flex-shrink-0" aria-hidden="true" />}
                    {STEP_LABELS[action.action]
                      ? say(outcome?.status === 'done' ? STEP_LABELS[action.action].did : STEP_LABELS[action.action].will)
                      : action.action}
                  </p>
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
                  {/* a done step already says so in its own line; failed and skipped ones get the result */}
                  {outcome && outcome.status !== 'done' && <ResultLine result={outcome} say={say} />}
                </li>
              )
            })}
          </ol>
          {footer}
        </LogCard>
      )}
    </article>
  )
}
