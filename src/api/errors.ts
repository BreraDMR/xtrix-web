import axios from 'axios'

// The API wraps every error as { error: { message, status_code, detail? } }. The message is
// already in the user's language (we send Accept-Language), validation errors come as
// error.detail.validation_errors with field paths like "body -> full_name".
interface ApiValidationError {
  field: string
  message: string
}

interface ApiErrorBody {
  error?: string | {
    message?: string
    status_code?: number
    detail?: { validation_errors?: ApiValidationError[] }
  }
  detail?: unknown
}

function cleanMessage(message: string): string {
  return message.replace(/^Value error,\s*/i, '')
}

function errorBody(err: unknown): ApiErrorBody | undefined {
  if (!axios.isAxiosError(err)) return undefined
  const data = err.response?.data
  return data && typeof data === 'object' ? (data as ApiErrorBody) : undefined
}

export function apiErrorStatus(err: unknown): number | undefined {
  return axios.isAxiosError(err) ? err.response?.status : undefined
}

// "body -> full_name" -> "full_name"
export function fieldName(path: string): string {
  const parts = path.split(' -> ')
  return parts[parts.length - 1]
}

export function apiValidationErrors(err: unknown): Record<string, string> {
  const errors: Record<string, string> = {}
  const error = errorBody(err)?.error
  if (typeof error === 'string') return errors
  for (const item of error?.detail?.validation_errors ?? []) {
    if (item.field && item.message) errors[fieldName(item.field)] = cleanMessage(item.message)
  }
  return errors
}

export function apiErrorMessage(err: unknown, fallback: string): string {
  const body = errorBody(err)
  if (typeof body?.error === 'string') return cleanMessage(body.error)
  const first = body?.error?.detail?.validation_errors?.[0]
  if (first) return `${fieldName(first.field)}: ${cleanMessage(first.message)}`
  if (body?.error?.message) return cleanMessage(body.error.message)
  if (typeof body?.detail === 'string') return cleanMessage(body.detail)
  return fallback
}
