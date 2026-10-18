import type { AssistantExecuteOut, AssistantPlanOut } from '../../api/types'
import type { AssistantKey, AssistantTextOptions } from '../../i18n/assistant'

export type PlanPhase = 'open' | 'running' | 'done' | 'cancelled' | 'expired' | 'replaced' | 'answered'

export interface PlanEntry {
  id: number
  kind: 'plan'
  plan: AssistantPlanOut
  // what was sent for this plan, so an answer to its questions can go out with it
  request: string
  phase: PlanPhase
  result?: AssistantExecuteOut
}

export type Say = (key: AssistantKey, options?: Omit<AssistantTextOptions, 'name' | 'gender'>) => string

// can this plan be confirmed at all: something to do and nothing left to ask
export const confirmable = (plan: AssistantPlanOut) => plan.actions.length > 0 && plan.questions.length === 0

// the one line that says how it went, in the assistant's gender
export function outcomeText(result: AssistantExecuteOut, say: Say): string {
  if (!result.ok) return say('partlyDone', { done: result.done_count, total: result.results.length })
  const done = new Set(result.results.filter((r) => r.status === 'done').map((r) => r.action))
  if (done.has('create_visit')) return say('visitBooked')
  if (done.has('reschedule_visit')) return say('visitMoved')
  if (done.has('cancel_visit')) return say('visitCancelled')
  if (done.has('create_client')) return say('clientAdded')
  return say('actionsDone', { count: result.done_count })
}

