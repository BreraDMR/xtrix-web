import type { Locale } from '../store/localeStore'
import type { BusinessOut } from '../api/types'

// The assistant's name and gender, one per business (owner sets them in the business settings).
// Mirrors app/ai/persona.py in the API: empty name = the default for the UI language.
export type AssistantGender = 'female' | 'male' | 'neuter'
export const ASSISTANT_GENDERS: AssistantGender[] = ['female', 'male', 'neuter']
export const DEFAULT_ASSISTANT_GENDER: AssistantGender = 'female'
export const DEFAULT_ASSISTANT_NAMES: Record<Locale, string> = { ru: 'Сашенька', cz: 'Saška', en: 'Sasha' }
export const ASSISTANT_NAME_MAX = 30

export type AssistantPersona = { name: string; gender: AssistantGender; isDefault: boolean }

const isGender = (value: unknown): value is AssistantGender =>
  ASSISTANT_GENDERS.includes(value as AssistantGender)

export function effectiveAssistant(
  business: Pick<BusinessOut, 'assistant_name' | 'assistant_gender'> | null | undefined,
  locale: Locale,
): AssistantPersona {
  const own = (business?.assistant_name ?? '').trim()
  const gender = isGender(business?.assistant_gender) ? business!.assistant_gender as AssistantGender : DEFAULT_ASSISTANT_GENDER
  return own ? { name: own, gender, isDefault: false } : { name: DEFAULT_ASSISTANT_NAMES[locale], gender, isDefault: true }
}

// Phrases for the chat, laid out like an i18next namespace: {{var}} placeholders and the gender
// as context (key_female / key_male / key_neuter), so it can move to i18next as is.
// English has one form; ru and cz need the verb in the assistant's gender.
const en = {
  visitBooked: '{{name}} booked the visit',
  visitMoved: '{{name}} moved the visit',
  visitCancelled: '{{name}} cancelled the visit',
  clientAdded: '{{name}} added the client',
  planReady: '{{name}} prepared a plan, check it and confirm',
  actionsDone: '{{name}} completed actions: {{count}}',
  notUnderstood: "{{name}} didn't understand the request, try rephrasing it",
  ready: '{{name}} is ready to help',
  thinking: '{{name}} is thinking…',
  asks: '{{name}} asks:',
  inputPlaceholder: 'Type a request…',
  send: 'Send',
  confirm: 'Confirm',
  cancel: 'Cancel',
  limitReached: "This month's assistant limit is used up",
} as const

export type AssistantKey = keyof typeof en

const ru: Record<string, string> = {
  visitBooked_female: '{{name}} записала визит',
  visitBooked_male: '{{name}} записал визит',
  visitBooked_neuter: '{{name}} записало визит',
  visitMoved_female: '{{name}} перенесла визит',
  visitMoved_male: '{{name}} перенёс визит',
  visitMoved_neuter: '{{name}} перенесло визит',
  visitCancelled_female: '{{name}} отменила визит',
  visitCancelled_male: '{{name}} отменил визит',
  visitCancelled_neuter: '{{name}} отменило визит',
  clientAdded_female: '{{name}} добавила клиента',
  clientAdded_male: '{{name}} добавил клиента',
  clientAdded_neuter: '{{name}} добавило клиента',
  planReady_female: '{{name}} подготовила план — проверьте и подтвердите',
  planReady_male: '{{name}} подготовил план — проверьте и подтвердите',
  planReady_neuter: '{{name}} подготовило план — проверьте и подтвердите',
  actionsDone_female: '{{name}} выполнила действий: {{count}}',
  actionsDone_male: '{{name}} выполнил действий: {{count}}',
  actionsDone_neuter: '{{name}} выполнило действий: {{count}}',
  notUnderstood_female: '{{name}} не поняла запрос, попробуйте сказать иначе',
  notUnderstood_male: '{{name}} не понял запрос, попробуйте сказать иначе',
  notUnderstood_neuter: '{{name}} не поняло запрос, попробуйте сказать иначе',
  ready_female: '{{name}} готова помочь',
  ready_male: '{{name}} готов помочь',
  ready_neuter: '{{name}} готово помочь',
  thinking: '{{name}} думает…',
  asks: '{{name}} уточняет:',
  inputPlaceholder: 'Напишите запрос…',
  send: 'Отправить',
  confirm: 'Подтвердить',
  cancel: 'Отмена',
  limitReached: 'Лимит помощника на этот месяц исчерпан',
}

const cz: Record<string, string> = {
  visitBooked_female: '{{name}} zapsala návštěvu',
  visitBooked_male: '{{name}} zapsal návštěvu',
  visitBooked_neuter: '{{name}} zapsalo návštěvu',
  visitMoved_female: '{{name}} přesunula návštěvu',
  visitMoved_male: '{{name}} přesunul návštěvu',
  visitMoved_neuter: '{{name}} přesunulo návštěvu',
  visitCancelled_female: '{{name}} zrušila návštěvu',
  visitCancelled_male: '{{name}} zrušil návštěvu',
  visitCancelled_neuter: '{{name}} zrušilo návštěvu',
  clientAdded_female: '{{name}} přidala klienta',
  clientAdded_male: '{{name}} přidal klienta',
  clientAdded_neuter: '{{name}} přidalo klienta',
  planReady_female: '{{name}} připravila plán – zkontrolujte ho a potvrďte',
  planReady_male: '{{name}} připravil plán – zkontrolujte ho a potvrďte',
  planReady_neuter: '{{name}} připravilo plán – zkontrolujte ho a potvrďte',
  actionsDone_female: '{{name}} provedla akcí: {{count}}',
  actionsDone_male: '{{name}} provedl akcí: {{count}}',
  actionsDone_neuter: '{{name}} provedlo akcí: {{count}}',
  notUnderstood_female: '{{name}} požadavku nerozuměla, zkuste to říct jinak',
  notUnderstood_male: '{{name}} požadavku nerozuměl, zkuste to říct jinak',
  notUnderstood_neuter: '{{name}} požadavku nerozumělo, zkuste to říct jinak',
  ready_female: '{{name}} je připravena pomoci',
  ready_male: '{{name}} je připraven pomoci',
  ready_neuter: '{{name}} je připraveno pomoci',
  thinking: '{{name}} přemýšlí…',
  asks: '{{name}} se ptá:',
  inputPlaceholder: 'Napište požadavek…',
  send: 'Odeslat',
  confirm: 'Potvrdit',
  cancel: 'Zrušit',
  limitReached: 'Limit asistenta na tento měsíc je vyčerpán',
}

export const assistantResources: Record<Locale, Record<string, string>> = { en, ru, cz }

export type AssistantTextOptions = { name?: string; gender?: AssistantGender } & Record<string, string | number | undefined>

// i18next order: key_context, then key, in the UI language, then in english, then the key itself
export function assistantT(locale: Locale, key: AssistantKey, options: AssistantTextOptions = {}): string {
  const candidates = options.gender ? [`${key}_${options.gender}`, key] : [key]
  let text: string = key
  for (const lang of [locale, 'en'] as const) {
    const found = candidates.map((k) => assistantResources[lang][k]).find((v) => v !== undefined)
    if (found !== undefined) {
      text = found
      break
    }
  }
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, name: string) =>
    options[name] !== undefined && name !== 'gender' ? String(options[name]) : match)
}

// same checks as the API: trimmed, up to 30 characters (code points, like Python's len),
// no line breaks or other control characters
// eslint-disable-next-line no-control-regex -- control characters are exactly what we look for
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/
export function assistantNameProblem(value: string): 'tooLong' | 'invalid' | null {
  const name = value.trim()
  if (CONTROL_CHARS.test(name)) return 'invalid'
  if ([...name].length > ASSISTANT_NAME_MAX) return 'tooLong'
  return null
}
