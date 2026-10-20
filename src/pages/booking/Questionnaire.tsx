import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

import api from '../../api/client'
import { apiErrorMessage, apiErrorStatus } from '../../api/errors'
import LanguageSwitcher from '../../components/LanguageSwitcher'
import LoadingSpinner from '../../components/LoadingSpinner'
import FormError from '../../components/FormError'
import { INTL_LOCALE } from '../../components/booking/intl'
import { useTranslation } from '../../hooks/useTranslation'
import type { TranslationKey } from '../../i18n/translations'
import type {
  QuestionnaireAnswersIn,
  QuestionnaireField,
  QuestionnaireFormOut,
  QuestionnaireSubmittedOut,
} from '../../api/types'

type AnswerValue = string | string[] | boolean
type AnswerMap = Record<string, AnswerValue>

const TOKEN_KEY = 'questionnaire_token'
const DRAFT_PREFIX = 'questionnaire_draft:'
const MAX_TOTAL_ANSWER_CHARS = 20_000

const ERROR_KEYS: Record<string, TranslationKey> = {
  required: 'questionnairePage.error.required',
  too_long: 'questionnairePage.error.tooLong',
  invalid_text: 'questionnairePage.error.invalidText',
  expected_text: 'questionnairePage.error.expectedText',
  expected_list: 'questionnairePage.error.unexpected',
  expected_boolean: 'questionnairePage.error.expectedBoolean',
  invalid_option: 'questionnairePage.error.invalidOption',
  too_many_selected: 'questionnairePage.error.tooMany',
  duplicate_option: 'questionnairePage.error.duplicate',
  empty: 'questionnairePage.error.required',
  too_large: 'questionnairePage.error.tooLarge',
  invalid_version: 'questionnairePage.error.unexpected',
}

// the token arrives in the fragment, so it never reaches the static host's access log;
// it is kept for this tab only, and the fragment is removed from the address bar
function initialToken(): string | null {
  let fromHash = ''
  try {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    fromHash = params.get('token') ?? ''
    if (!fromHash && window.location.hash.length > 1 && !window.location.hash.includes('=')) {
      fromHash = window.location.hash.slice(1)
    }
  } catch {
    fromHash = ''
  }
  const token = fromHash.trim()
  if (token) {
    try {
      sessionStorage.setItem(TOKEN_KEY, token)
    } catch {
      // private windows may reject storage, the page still works
    }
    try {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
    } catch {
      // ignore
    }
    return token
  }
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function readDraft(token: string | null): AnswerMap {
  if (!token) return {}
  try {
    const raw = sessionStorage.getItem(DRAFT_PREFIX + token)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const draft: AnswerMap = {}
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === 'string' || typeof value === 'boolean') draft[key] = value
      else if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
        draft[key] = value as string[]
      }
    }
    return draft
  } catch {
    return {}
  }
}

function writeDraft(token: string, answers: AnswerMap) {
  try {
    sessionStorage.setItem(DRAFT_PREFIX + token, JSON.stringify(answers))
  } catch {
    // ignore
  }
}

function clearDraft(token: string) {
  try {
    sessionStorage.removeItem(DRAFT_PREFIX + token)
  } catch {
    // ignore
  }
}

function answerErrorText(code: string, t: (key: TranslationKey, fallback?: string) => string): string {
  const key = ERROR_KEYS[code]
  return key ? t(key) : t('questionnairePage.error.generic')
}

function hasControlChars(value: string, multiline: boolean): boolean {
  return multiline
    ? /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value)
    : /[\u0000-\u001F\u007F]/.test(value)
}

function validateAnswers(fields: QuestionnaireField[], answers: AnswerMap): Record<string, string> {
  const errors: Record<string, string> = {}
  let total = 0

  for (const field of fields) {
    const value = answers[field.key]
    switch (field.type) {
      case 'text':
      case 'long_text': {
        const text = typeof value === 'string' ? value.trim() : ''
        if (!text) {
          if (field.required) errors[field.key] = 'required'
          continue
        }
        total += text.length
        if (text.length > field.max_length) errors[field.key] = 'too_long'
        else if (hasControlChars(text, field.type === 'long_text')) errors[field.key] = 'invalid_text'
        break
      }
      case 'single_choice': {
        if (typeof value !== 'string' || !value) {
          if (field.required) errors[field.key] = 'required'
          continue
        }
        total += value.length
        if (!field.options.some((option) => option.value === value)) errors[field.key] = 'invalid_option'
        break
      }
      case 'multi_choice': {
        const chosen = Array.isArray(value) ? value : []
        if (chosen.length === 0) {
          if (field.required) errors[field.key] = 'required'
          continue
        }
        total += chosen.reduce((sum, item) => sum + item.length, 0)
        if (new Set(chosen).size !== chosen.length) errors[field.key] = 'duplicate_option'
        else if (
          field.max_selected !== null &&
          field.max_selected !== undefined &&
          chosen.length > field.max_selected
        ) {
          errors[field.key] = 'too_many_selected'
        } else if (chosen.some((item) => !field.options.some((option) => option.value === item))) {
          errors[field.key] = 'invalid_option'
        }
        break
      }
      case 'boolean': {
        if (typeof value !== 'boolean' && field.required) errors[field.key] = 'required'
        break
      }
    }
  }

  if (total > MAX_TOTAL_ANSWER_CHARS) errors.answers = 'too_large'
  return errors
}

function buildAnswers(fields: QuestionnaireField[], answers: AnswerMap): Record<string, AnswerValue> {
  const payload: Record<string, AnswerValue> = {}
  for (const field of fields) {
    const value = answers[field.key]
    if (value === undefined) continue
    if (typeof value === 'string') {
      const text = value.trim()
      if (text) payload[field.key] = text
    } else if (Array.isArray(value)) {
      if (value.length > 0) payload[field.key] = value
    } else {
      payload[field.key] = value
    }
  }
  return payload
}

function answerFieldCodes(err: unknown): Record<string, string> | null {
  if (!axios.isAxiosError(err)) return null
  const data = err.response?.data as { error?: { detail?: { fields?: unknown } } } | undefined
  const fields = data?.error?.detail?.fields
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) return null
  const codes: Record<string, string> = {}
  for (const [key, value] of Object.entries(fields)) {
    if (typeof value === 'string') codes[key] = value
  }
  return Object.keys(codes).length > 0 ? codes : null
}

function PublicFrame({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-gray-900 dark:text-gray-100">
      <header className="border-b border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-3">
          <span className="text-sm font-medium text-slate-500 dark:text-gray-400">{t('questionnairePage.title')}</span>
          <LanguageSwitcher />
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-6 sm:py-10">{children}</main>
    </div>
  )
}

function Unavailable() {
  const { t } = useTranslation()
  return (
    <PublicFrame>
      <section className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-gray-800">
        <h1 className="text-xl font-semibold">{t('questionnairePage.linkUnavailableTitle')}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-slate-500 dark:text-gray-400">
          {t('questionnairePage.linkUnavailableText')}
        </p>
      </section>
    </PublicFrame>
  )
}

export default function QuestionnairePage() {
  const { t, locale } = useTranslation()
  const [token] = useState(initialToken)
  const [answers, setAnswers] = useState<AnswerMap>(() => readDraft(token))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [justSubmitted, setJustSubmitted] = useState<QuestionnaireSubmittedOut | null>(null)
  const submitLock = useRef(false)

  const formQuery = useQuery<QuestionnaireFormOut>({
    queryKey: ['public-questionnaire', token],
    queryFn: async () => {
      const { data } = await api.get('/public/questionnaires', {
        headers: { 'X-Questionnaire-Token': token ?? '' },
      })
      return data
    },
    enabled: Boolean(token),
    retry: false,
  })

  useEffect(() => {
    if (!token) return
    writeDraft(token, answers)
  }, [answers, token])

  const submittedAt = justSubmitted?.submitted_at ?? formQuery.data?.submitted_at ?? null

  useEffect(() => {
    if (!token || !submittedAt) return
    clearDraft(token)
  }, [token, submittedAt])

  const setAnswer = (key: string, value: AnswerValue) => {
    setAnswers((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      if (!(key in current)) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const form = formQuery.data
    if (!form || !token || submitLock.current) return
    setSubmitError('')
    const nextErrors = validateAnswers(form.fields, answers)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setSubmitError(
        nextErrors.answers
          ? answerErrorText(nextErrors.answers, t)
          : t('questionnairePage.checkAnswers'),
      )
      return
    }

    submitLock.current = true
    setSubmitting(true)
    try {
      const payload: QuestionnaireAnswersIn = { answers: buildAnswers(form.fields, answers) }
      const { data } = await api.post<QuestionnaireSubmittedOut>('/public/questionnaires/answers', payload, {
        headers: { 'X-Questionnaire-Token': token },
      })
      setJustSubmitted(data)
      clearDraft(token)
    } catch (err) {
      const codes = answerFieldCodes(err)
      if (codes) {
        const fieldCodes: Record<string, string> = {}
        let general = ''
        for (const [key, code] of Object.entries(codes)) {
          if (key === 'answers') general = answerErrorText(code, t)
          else fieldCodes[key] = code
        }
        setErrors(fieldCodes)
        setSubmitError(general || apiErrorMessage(err, t('questionnairePage.checkAnswers')))
      } else {
        setSubmitError(apiErrorMessage(err, t('questionnairePage.submitError')))
      }
      if (apiErrorStatus(err) === 409) void formQuery.refetch()
    } finally {
      submitLock.current = false
      setSubmitting(false)
    }
  }

  if (!token) return <Unavailable />

  if (formQuery.isLoading) {
    return (
      <PublicFrame>
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </PublicFrame>
    )
  }

  if (formQuery.isError) {
    if (apiErrorStatus(formQuery.error) === 404) return <Unavailable />
    return (
      <PublicFrame>
        <section
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
        >
          <p>{apiErrorMessage(formQuery.error, t('common.loadError'))}</p>
          <button
            type="button"
            onClick={() => void formQuery.refetch()}
            className="mt-3 rounded-md border border-red-300 px-4 py-2 text-sm font-medium hover:bg-red-100 dark:border-red-700 dark:hover:bg-red-900"
          >
            {t('common.retry')}
          </button>
        </section>
      </PublicFrame>
    )
  }

  const form = formQuery.data
  if (!form) return <Unavailable />

  if (submittedAt) {
    const recent = justSubmitted !== null
    return (
      <PublicFrame>
        <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800 sm:p-8">
          <h1 className="text-xl font-semibold">
            {recent ? t('questionnairePage.savedTitle') : t('questionnairePage.alreadySubmittedTitle')}
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">
            {recent ? t('questionnairePage.savedText') : t('questionnairePage.alreadySubmittedText')}
          </p>
          <dl className="mt-5 divide-y divide-slate-100 text-sm dark:divide-gray-700">
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-slate-500 dark:text-gray-400">{t('questionnairePage.version')}</dt>
              <dd className="text-right font-medium">{form.version}</dd>
            </div>
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-slate-500 dark:text-gray-400">{t('questionnairePage.sentAt')}</dt>
              <dd className="text-right font-medium">
                {new Date(submittedAt).toLocaleString(INTL_LOCALE[locale])}
              </dd>
            </div>
          </dl>
        </section>
      </PublicFrame>
    )
  }

  const renderInput = (field: QuestionnaireField) => {
    const value = answers[field.key]
    const invalid = Boolean(errors[field.key])
    const inputClass = 'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900'

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            maxLength={field.max_length}
            value={typeof value === 'string' ? value : ''}
            onChange={(event) => setAnswer(field.key, event.target.value)}
            aria-invalid={invalid || undefined}
            placeholder={t('questionnairePage.textPlaceholder')}
            className={inputClass}
          />
        )
      case 'long_text':
        return (
          <textarea
            rows={4}
            maxLength={field.max_length}
            value={typeof value === 'string' ? value : ''}
            onChange={(event) => setAnswer(field.key, event.target.value)}
            aria-invalid={invalid || undefined}
            placeholder={t('questionnairePage.textPlaceholder')}
            className={inputClass}
          />
        )
      case 'single_choice':
        return (
          <div className="space-y-2">
            {field.options.map((option) => (
              <label key={option.value} className="flex items-start gap-2 text-sm">
                <input
                  type="radio"
                  name={`question-${field.key}`}
                  value={option.value}
                  checked={value === option.value}
                  onChange={() => setAnswer(field.key, option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        )
      case 'multi_choice': {
        const selected = Array.isArray(value) ? value : []
        const limitReached =
          field.max_selected !== null &&
          field.max_selected !== undefined &&
          selected.length >= field.max_selected
        return (
          <div className="space-y-2">
            {field.max_selected !== null && field.max_selected !== undefined && (
              <p className="text-xs text-slate-500 dark:text-gray-400">
                {t('questionnairePage.maxSelected')} {field.max_selected}
              </p>
            )}
            {field.options.map((option) => {
              const checked = selected.includes(option.value)
              return (
                <label key={option.value} className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={!checked && limitReached}
                    onChange={(event) => {
                      const next = event.target.checked
                        ? [...selected, option.value]
                        : selected.filter((item) => item !== option.value)
                      setAnswer(field.key, next)
                    }}
                  />
                  <span>{option.label}</span>
                </label>
              )
            })}
          </div>
        )
      }
      case 'boolean':
        return (
          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={`question-${field.key}`}
                checked={value === true}
                onChange={() => setAnswer(field.key, true)}
              />
              {t('questionnairePage.yes')}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={`question-${field.key}`}
                checked={value === false}
                onChange={() => setAnswer(field.key, false)}
              />
              {t('questionnairePage.no')}
            </label>
          </div>
        )
    }
  }

  return (
    <PublicFrame>
      <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800 sm:p-8">
        <header>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {t('questionnairePage.title')}
          </p>
          <h1 className="mt-1 text-xl font-semibold">{form.name}</h1>
          {form.description && (
            <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">{form.description}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
            <span>
              {t('questionnairePage.version')} {form.version}
            </span>
            <span>
              {t('questionnairePage.validUntil')}{' '}
              {new Date(form.expires_at).toLocaleDateString(INTL_LOCALE[locale])}
            </span>
          </div>
        </header>

        <p className="mt-4 text-xs text-slate-400">{t('questionnairePage.draftHint')}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {form.fields.map((field) => {
            const code = errors[field.key]
            return (
              <div key={field.key} className="rounded-xl border border-slate-200 p-4 dark:border-gray-700">
                <p className="text-sm font-medium">
                  {field.label}
                  {field.required && <span className="ml-1 text-red-500">*</span>}
                </p>
                {field.description && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">{field.description}</p>
                )}
                <div className="mt-3">{renderInput(field)}</div>
                {code && <FormError message={answerErrorText(code, t)} />}
              </div>
            )
          })}

          {submitError && (
            <div role="alert">
              <FormError message={submitError} />
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary-600 px-5 py-2.5 font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {submitting && <LoadingSpinner size="sm" />}
            {submitting ? t('questionnairePage.submitting') : t('questionnairePage.submit')}
          </button>
        </form>
      </section>
    </PublicFrame>
  )
}
