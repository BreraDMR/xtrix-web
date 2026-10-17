import axios from 'axios'

// The API wraps every error as { error: { message, status_code, detail? } }. The message is
// already in the user's language (we send Accept-Language), validation errors come as
// error.detail.validation_errors with field paths like "body -> full_name".
interface ApiValidationError {
  field: string
  message: string
}

interface ApiErrorBody {
  error?: {
    message?: string
    status_code?: number
    detail?: { validation_errors?: ApiValidationError[] }
  }
  detail?: unknown
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
  for (const item of errorBody(err)?.error?.detail?.validation_errors ?? []) {
    if (item.field && item.message) errors[fieldName(item.field)] = item.message
  }
  return errors
}

export function apiErrorMessage(err: unknown, fallback: string): string {
  const body = errorBody(err)
  const first = body?.error?.detail?.validation_errors?.[0]
  if (first) return `${fieldName(first.field)}: ${first.message}`
  if (body?.error?.message) return body.error.message
  if (typeof body?.detail === 'string') return body.detail
  return fallback
}
