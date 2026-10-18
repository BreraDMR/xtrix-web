import axios from 'axios'
import translations, { type TranslationKey } from '../i18n/translations'
import { useLocaleStore } from '../store/localeStore'

// The API wraps every error as { error: { message, status_code, type?, detail? } }. Most messages
// come in the user's language already (we send Accept-Language). Validation errors are in
// error.detail.validation_errors, each with a field path like "body -> full_name" plus a code and
// params we translate here - their message is only an english fallback.
interface ApiValidationError {
  field: string
  message: string
  code?: string
  params?: Record<string, unknown>
}

interface ApiErrorBody {
  error?: string | {
    message?: string
    status_code?: number
    type?: string
    detail?: {
      validation_errors?: ApiValidationError[]
      code?: string
      existing_client_id?: number
      matched_by?: string
    }
  }
  detail?: unknown
}

// plain function, not a hook: errors get turned into text inside callbacks
function tr(key: TranslationKey, params: Record<string, unknown> = {}): string {
  const locale = useLocaleStore.getState().locale
  let text = translations[key]?.[locale] || translations[key]?.en || key
  for (const [name, value] of Object.entries(params)) {
    text = text.split(`{${name}}`).join(Array.isArray(value) ? value.join(', ') : String(value))
  }
  return text
}

function cleanMessage(message: string): string {
  return message.replace(/^Value error,\s*/i, '')
}

function errorBody(err: unknown): ApiErrorBody | undefined {
  if (!axios.isAxiosError(err)) return undefined
  const data = err.response?.data
  return data && typeof data === 'object' ? (data as ApiErrorBody) : undefined
}

function errorObject(err: unknown) {
  const error = errorBody(err)?.error
  return error && typeof error === 'object' ? error : undefined
}

export function apiErrorStatus(err: unknown): number | undefined {
  return axios.isAxiosError(err) ? err.response?.status : undefined
}

// seconds from the Retry-After header (a number or an HTTP date), undefined if there isn't one
export function apiRetryAfter(err: unknown): number | undefined {
  if (!axios.isAxiosError(err)) return undefined
  const headers = err.response?.headers as Record<string, unknown> | undefined
  const raw = headers?.['retry-after'] ?? headers?.['Retry-After']
  if (raw === undefined || raw === null || raw === '') return undefined
  const seconds = Number(raw)
  if (Number.isFinite(seconds)) return Math.max(0, Math.ceil(seconds))
  const date = Date.parse(String(raw))
  return Number.isFinite(date) ? Math.max(0, Math.ceil((date - Date.now()) / 1000)) : undefined
}

// POST /clients/ with a phone or email we already have -> 409 pointing at that client
export function apiClientExists(err: unknown): { existingClientId: number; matchedBy?: string } | undefined {
  const detail = errorObject(err)?.detail
  if (apiErrorStatus(err) !== 409 || detail?.code !== 'client_exists' || typeof detail.existing_client_id !== 'number') return undefined
  return { existingClientId: detail.existing_client_id, matchedBy: detail.matched_by }
}

// "body -> full_name" -> "full_name"
export function fieldName(path: string): string {
  const parts = path.split(' -> ')
  return parts[parts.length - 1]
}

const FIELD_LABELS: Record<string, TranslationKey> = {
  full_name: 'field.full_name',
  name: 'field.name',
  email: 'field.email',
  contact_email: 'field.email',
  phone: 'field.phone',
  contact_phone: 'field.phone',
  password: 'field.password',
  birth_date: 'field.birth_date',
  date_start: 'field.date_start',
  date_end: 'field.date_end',
  price: 'field.price',
  amount: 'field.amount',
  quantity: 'field.quantity',
  base_salary: 'field.base_salary',
  commission_rate: 'field.commission_rate',
  currency: 'field.currency',
  duration_minutes: 'field.duration_minutes',
  unit: 'field.unit',
  assistant_name: 'field.assistant_name',
  assistant_gender: 'field.assistant_gender',
}

export function fieldLabel(field: string): string {
  return FIELD_LABELS[field] ? tr(FIELD_LABELS[field]) : field
}

const CODE_KEYS: Record<string, TranslationKey> = {
  missing: 'validation.code.missing',
  null_not_allowed: 'validation.code.empty',
  string_too_short: 'validation.code.string_too_short',
  string_too_long: 'validation.code.string_too_long',
  greater_than_equal: 'validation.code.greater_than_equal',
  greater_than: 'validation.code.greater_than',
  less_than_equal: 'validation.code.less_than_equal',
  less_than: 'validation.code.less_than',
  number_type: 'validation.code.number',
  int_type: 'validation.code.number',
  int_parsing: 'validation.code.number',
  int_from_float: 'validation.code.number',
  float_type: 'validation.code.number',
  float_parsing: 'validation.code.number',
  decimal_type: 'validation.code.number',
  decimal_parsing: 'validation.code.number',
  date_type: 'validation.code.date',
  date_parsing: 'validation.code.date',
  date_from_datetime_parsing: 'validation.code.date',
  datetime_type: 'validation.code.date',
  datetime_parsing: 'validation.code.date',
  datetime_from_date_parsing: 'validation.code.date',
  date_out_of_range: 'validation.code.date_out_of_range',
  invalid_time_range: 'validation.code.invalid_time_range',
  end_before_start: 'validation.code.end_before_start',
  weak_password: 'validation.code.weak_password',
  invalid_phone: 'validation.code.invalid_phone',
  invalid_email: 'validation.code.invalid_email',
  invalid_birth_date: 'validation.code.invalid_birth_date',
  invalid_currency: 'validation.code.invalid_currency',
  invalid_timezone: 'validation.code.invalid_timezone',
  invalid_choice: 'validation.code.invalid_choice',
  invalid_assistant_name: 'validation.code.invalid_assistant_name',
  payment_method_required: 'validation.code.payment_method_required',
  string_type: 'validation.code.string_type',
  bool_type: 'validation.code.bool',
  bool_parsing: 'validation.code.bool',
}

export function validationMessage(item: ApiValidationError): string {
  const params = item.params ?? {}
  // a blank name comes back as "at least 1 character", which reads odd
  if (item.code === 'string_too_short' && Number(params.min_length) === 1) return tr('validation.code.empty')
  const key = item.code ? CODE_KEYS[item.code] : undefined
  return key ? tr(key, params) : cleanMessage(item.message ?? '')
}

function validationItems(err: unknown): ApiValidationError[] {
  return errorObject(err)?.detail?.validation_errors ?? []
}

export function apiValidationErrors(err: unknown): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const item of validationItems(err)) {
    if (!item.field) continue
    const field = fieldName(item.field)
    // first error per field wins, it's usually the most basic one
    if (!(field in errors)) errors[field] = validationMessage(item)
  }
  return errors
}

function waitText(seconds: number): string {
  return seconds >= 120 ? tr('time.minutes', { n: Math.ceil(seconds / 60) }) : tr('time.seconds', { n: seconds })
}

export function apiErrorMessage(err: unknown, fallback: string): string {
  const status = apiErrorStatus(err)
  const body = errorBody(err)
  const error = errorObject(err)
  if (status === 429) {
    const wait = apiRetryAfter(err)
    const login = error?.type === 'LoginThrottled'
    if (wait === undefined) return tr(login ? 'errors.loginThrottledLater' : 'errors.tooManyRequestsLater')
    return tr(login ? 'errors.loginThrottled' : 'errors.tooManyRequests', { wait: waitText(wait) })
  }
  if (status === 405) return tr('errors.methodNotAllowed')
  if (typeof body?.error === 'string') return cleanMessage(body.error)
  const first = validationItems(err)[0]
  if (first) return `${fieldLabel(fieldName(first.field))}: ${validationMessage(first)}`
  // an unknown route answers with the framework's own english "Not Found"
  if (status === 404 && (error?.message === 'Not Found' || body?.detail === 'Not Found')) return tr('errors.notFound')
  if (error?.message) return cleanMessage(error.message)
  if (typeof body?.detail === 'string') return cleanMessage(body.detail)
  return fallback
}

// For a form: errors for fields it shows go under those fields, anything else (another field,
// a conflict, a server error) becomes one general message above the form.
export function apiFormErrors(err: unknown, formFields: readonly string[], fallback: string): { fields: Record<string, string>; general: string } {
  const all = apiValidationErrors(err)
  const fields: Record<string, string> = {}
  const rest: string[] = []
  for (const [field, message] of Object.entries(all)) {
    if (formFields.includes(field)) fields[field] = message
    else rest.push(`${fieldLabel(field)}: ${message}`)
  }
  if (!Object.keys(all).length) return { fields, general: apiErrorMessage(err, fallback) }
  return { fields, general: rest.join('; ') }
}
