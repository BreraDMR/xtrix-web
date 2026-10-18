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
  open: 'Open the assistant: {{name}}',
  close: 'Close',
  usage: '{{used}} of {{limit}} requests this month',
  notConfigured: "{{name}} isn't set up yet. An administrator needs to connect an AI provider first.",
  statusError: "Couldn't load the assistant",
  retry: 'Try again',
  you: 'You',
  keyboardHint: 'Enter sends, Shift+Enter starts a new line',
  action_find_client: 'Find the client',
  action_create_client: 'Add a client',
  action_update_client: 'Update the client',
  action_find_free_slot: 'Find free time',
  action_create_visit: 'Book a visit',
  action_reschedule_visit: 'Move the visit',
  action_cancel_visit: 'Cancel the visit',
  action_add_note: 'Add a note to the visit',
  field_client: 'Client',
  field_service: 'Service',
  field_specialist: 'Specialist',
  field_time: 'Time',
  field_note: 'Note',
  expiresIn: 'Valid for {{time}}',
  planExpired: 'This plan has expired, send the request again',
  answerHint: 'Answer in a new message',
  executing: '{{name}} is on it…',
  cancelled: 'Cancelled, nothing was changed',
  replaced: 'Replaced by a newer plan',
  result_done: 'Done',
  result_failed: 'Failed',
  result_skipped: 'Skipped',
  partlyDone: '{{name}} completed {{done}} of {{total}} actions',
  limitReachedUntil: "This month's assistant limit is used up. It resets on {{date}}.",
  busy: '{{name}} is busy right now, try again in {{seconds}} s',
  unavailable: "{{name}} can't answer right now, try again a bit later",
  networkError: 'No connection to the server, check the internet and try again',
  requestFailed: 'Something went wrong, try again',
  voiceStart: 'Dictate',
  voiceStop: 'Stop and transcribe',
  voiceDiscard: 'Discard the recording',
  voiceRecording: 'Recording {{time}} / {{max}}',
  voiceTranscribing: 'Turning speech into text…',
  voiceDenied: 'Microphone access is blocked. Allow it in the browser settings and try again.',
  voiceUnsupported: "This browser can't record audio, type the request instead",
  voiceFailed: "Couldn't record audio, try again",
  voiceEmpty: 'Nothing was heard, try again',
  audio_type_not_supported: 'This audio format is not supported',
  audio_empty: 'The recording is empty',
  audio_too_large: 'The recording is too big, keep it under a minute',
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
  open: 'Открыть помощника: {{name}}',
  close: 'Закрыть',
  usage: '{{used}} из {{limit}} запросов в этом месяце',
  notConfigured_female: '{{name}} ещё не настроена. Сначала администратор должен подключить ИИ-провайдера.',
  notConfigured_male: '{{name}} ещё не настроен. Сначала администратор должен подключить ИИ-провайдера.',
  notConfigured_neuter: '{{name}} ещё не настроено. Сначала администратор должен подключить ИИ-провайдера.',
  statusError: 'Не удалось загрузить помощника',
  retry: 'Повторить',
  you: 'Вы',
  keyboardHint: 'Enter — отправить, Shift+Enter — новая строка',
  action_find_client: 'Найти клиента',
  action_create_client: 'Добавить клиента',
  action_update_client: 'Изменить клиента',
  action_find_free_slot: 'Найти свободное время',
  action_create_visit: 'Записать на визит',
  action_reschedule_visit: 'Перенести визит',
  action_cancel_visit: 'Отменить визит',
  action_add_note: 'Добавить заметку к визиту',
  field_client: 'Клиент',
  field_service: 'Услуга',
  field_specialist: 'Специалист',
  field_time: 'Время',
  field_note: 'Заметка',
  expiresIn: 'Действует ещё {{time}}',
  planExpired: 'План устарел, отправьте запрос ещё раз',
  answerHint: 'Ответьте новым сообщением',
  executing: '{{name}} выполняет…',
  cancelled: 'Отменено, ничего не изменилось',
  replaced: 'Заменён новым планом',
  result_done: 'Выполнено',
  result_failed: 'Ошибка',
  result_skipped: 'Пропущено',
  partlyDone_female: '{{name}} выполнила {{done}} из {{total}} действий',
  partlyDone_male: '{{name}} выполнил {{done}} из {{total}} действий',
  partlyDone_neuter: '{{name}} выполнило {{done}} из {{total}} действий',
  limitReachedUntil: 'Лимит помощника на этот месяц исчерпан. Он обновится {{date}}.',
  busy_female: '{{name}} сейчас занята, попробуйте через {{seconds}} с',
  busy_male: '{{name}} сейчас занят, попробуйте через {{seconds}} с',
  busy_neuter: '{{name}} сейчас занято, попробуйте через {{seconds}} с',
  unavailable: '{{name}} сейчас не может ответить, попробуйте чуть позже',
  networkError: 'Нет связи с сервером, проверьте интернет и попробуйте ещё раз',
  requestFailed: 'Что-то пошло не так, попробуйте ещё раз',
  voiceStart: 'Надиктовать',
  voiceStop: 'Остановить и распознать',
  voiceDiscard: 'Удалить запись',
  voiceRecording: 'Запись {{time}} / {{max}}',
  voiceTranscribing: 'Распознаём речь…',
  voiceDenied: 'Доступ к микрофону запрещён. Разрешите его в настройках браузера и попробуйте снова.',
  voiceUnsupported: 'Этот браузер не умеет записывать звук, напишите запрос текстом',
  voiceFailed: 'Не удалось записать звук, попробуйте ещё раз',
  voiceEmpty: 'Ничего не слышно, попробуйте ещё раз',
  audio_type_not_supported: 'Этот формат звука не поддерживается',
  audio_empty: 'Запись пустая',
  audio_too_large: 'Запись слишком большая, уложитесь в минуту',
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
  open: 'Otevřít asistenta: {{name}}',
  close: 'Zavřít',
  usage: '{{used}} z {{limit}} požadavků tento měsíc',
  notConfigured_female: '{{name}} zatím není nastavena. Nejdřív musí správce připojit poskytovatele AI.',
  notConfigured_male: '{{name}} zatím není nastaven. Nejdřív musí správce připojit poskytovatele AI.',
  notConfigured_neuter: '{{name}} zatím není nastaveno. Nejdřív musí správce připojit poskytovatele AI.',
  statusError: 'Asistenta se nepodařilo načíst',
  retry: 'Zkusit znovu',
  you: 'Vy',
  keyboardHint: 'Enter odešle, Shift+Enter přidá nový řádek',
  action_find_client: 'Najít klienta',
  action_create_client: 'Přidat klienta',
  action_update_client: 'Upravit klienta',
  action_find_free_slot: 'Najít volný termín',
  action_create_visit: 'Zapsat návštěvu',
  action_reschedule_visit: 'Přesunout návštěvu',
  action_cancel_visit: 'Zrušit návštěvu',
  action_add_note: 'Přidat poznámku k návštěvě',
  field_client: 'Klient',
  field_service: 'Služba',
  field_specialist: 'Specialista',
  field_time: 'Čas',
  field_note: 'Poznámka',
  expiresIn: 'Platí ještě {{time}}',
  planExpired: 'Plán vypršel, pošlete požadavek znovu',
  answerHint: 'Odpovězte novou zprávou',
  executing: '{{name}} na tom pracuje…',
  cancelled: 'Zrušeno, nic se nezměnilo',
  replaced: 'Nahrazeno novějším plánem',
  result_done: 'Hotovo',
  result_failed: 'Chyba',
  result_skipped: 'Přeskočeno',
  partlyDone_female: '{{name}} provedla {{done}} z {{total}} akcí',
  partlyDone_male: '{{name}} provedl {{done}} z {{total}} akcí',
  partlyDone_neuter: '{{name}} provedlo {{done}} z {{total}} akcí',
  limitReachedUntil: 'Limit asistenta na tento měsíc je vyčerpán. Obnoví se {{date}}.',
  busy_female: '{{name}} je teď zaneprázdněná, zkuste to za {{seconds}} s',
  busy_male: '{{name}} je teď zaneprázdněný, zkuste to za {{seconds}} s',
  busy_neuter: '{{name}} je teď zaneprázdněné, zkuste to za {{seconds}} s',
  unavailable: '{{name}} teď nemůže odpovědět, zkuste to o chvíli později',
  networkError: 'Bez spojení se serverem, zkontrolujte internet a zkuste to znovu',
  requestFailed: 'Něco se pokazilo, zkuste to znovu',
  voiceStart: 'Nadiktovat',
  voiceStop: 'Zastavit a přepsat',
  voiceDiscard: 'Smazat nahrávku',
  voiceRecording: 'Nahrávání {{time}} / {{max}}',
  voiceTranscribing: 'Převádíme řeč na text…',
  voiceDenied: 'Přístup k mikrofonu je zakázaný. Povolte ho v nastavení prohlížeče a zkuste to znovu.',
  voiceUnsupported: 'Tento prohlížeč neumí nahrávat zvuk, napište požadavek textem',
  voiceFailed: 'Zvuk se nepodařilo nahrát, zkuste to znovu',
  voiceEmpty: 'Nic nebylo slyšet, zkuste to znovu',
  audio_type_not_supported: 'Tento formát zvuku není podporovaný',
  audio_empty: 'Nahrávka je prázdná',
  audio_too_large: 'Nahrávka je moc velká, vejděte se do minuty',
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
