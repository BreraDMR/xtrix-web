import { useRef, useState } from 'react'
import api from '../../api/client'
import { apiErrorMessage } from '../../api/errors'
import { useTranslation } from '../../hooks/useTranslation'
import type { TranslationKey } from '../../i18n/translations'
import type {
  QuestionnaireField,
  QuestionnaireFieldType,
  QuestionnaireOption,
  QuestionnairePublish,
  QuestionnaireTemplateCreate,
  QuestionnaireTemplateOut,
  QuestionnaireVersionOut,
  ServiceOut,
} from '../../api/types'
import FormError from '../FormError'
import LoadingSpinner from '../LoadingSpinner'

interface TemplateEditorProps {
  template?: QuestionnaireTemplateOut
  services: ServiceOut[]
  onChanged: () => void
  onClose: () => void
}

interface EditableField {
  uid: string
  type: QuestionnaireFieldType
  label: string
  description: string
  required: boolean
  optionsText: string
  originalOptions: QuestionnaireOption[]
  key?: string
  maxSelected: string
}

interface FieldErrors {
  label?: string
  hint?: string
  options?: string
  maxSelected?: string
}

const FIELD_TYPES: QuestionnaireFieldType[] = ['text', 'long_text', 'single_choice', 'multi_choice', 'boolean']
const TYPE_LABEL_KEYS: Record<QuestionnaireFieldType, TranslationKey> = {
  text: 'questionnaireEditor.type.text',
  long_text: 'questionnaireEditor.type.long_text',
  single_choice: 'questionnaireEditor.type.single_choice',
  multi_choice: 'questionnaireEditor.type.multi_choice',
  boolean: 'questionnaireEditor.type.boolean',
}
const MAX_FIELDS = 50
const MAX_OPTIONS = 20

let fieldCounter = 0

function nextUid(): string {
  fieldCounter += 1
  return `qfield-${fieldCounter}`
}

function toEditable(field: QuestionnaireField): EditableField {
  return {
    uid: nextUid(),
    type: field.type,
    label: field.label,
    description: field.description ?? '',
    required: field.required,
    optionsText: 'options' in field ? field.options.map((option) => option.label).join('\n') : '',
    originalOptions: 'options' in field ? field.options : [],
    key: field.key,
    maxSelected: field.type === 'multi_choice' && field.max_selected ? String(field.max_selected) : '',
  }
}

function newEditable(type: QuestionnaireFieldType): EditableField {
  return {
    uid: nextUid(),
    type,
    label: '',
    description: '',
    required: false,
    optionsText: '',
    originalOptions: [],
    maxSelected: '',
  }
}

// same rules as the API: plain text, no HTML and no control characters on single lines
function isPlainLine(value: string): boolean {
  return !/[\u0000-\u001F\u007F<>]/.test(value)
}

function isPlainText(value: string): boolean {
  return !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F<>]/.test(value)
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 55)
}

function fieldKeyBase(label: string, index: number): string {
  const base = slug(label) || `field_${index + 1}`
  return /^[a-z]/.test(base) ? base : `field_${base}`
}

function optionValueBase(label: string, index: number): string {
  const base = slug(label) || `option_${index + 1}`
  return /^[a-z0-9]/.test(base) ? base : `option_${base}`
}

function uniqueValue(base: string, used: Set<string>): string {
  let value = base
  let suffix = 2
  while (used.has(value)) {
    value = `${base.slice(0, 58)}_${suffix}`
    suffix += 1
  }
  used.add(value)
  return value
}

function optionLabels(field: EditableField): string[] {
  return field.optionsText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function buildOptions(field: EditableField): QuestionnaireOption[] {
  const used = new Set<string>()
  return optionLabels(field).map((label, index) => {
    const existing = field.originalOptions.find((option) => option.label === label)
    return { label, value: uniqueValue(existing?.value ?? optionValueBase(label, index), used) }
  })
}

function buildField(field: EditableField, index: number, usedKeys: Set<string>): QuestionnaireField | null {
  const label = field.label.trim()
  if (!label) return null
  const description = field.description.trim() || null
  const key = uniqueValue(field.key ?? fieldKeyBase(label, index), usedKeys)
  const base = { key, label, description, required: field.required }
  switch (field.type) {
    case 'text':
      return { ...base, type: 'text', max_length: 255 }
    case 'long_text':
      return { ...base, type: 'long_text', max_length: 2000 }
    case 'single_choice':
      return { ...base, type: 'single_choice', options: buildOptions(field) }
    case 'multi_choice': {
      const maxSelected = field.maxSelected.trim() ? Number(field.maxSelected) : null
      return {
        ...base,
        type: 'multi_choice',
        options: buildOptions(field),
        max_selected: maxSelected === null ? null : maxSelected,
      }
    }
    case 'boolean':
      return { ...base, type: 'boolean' }
  }
}

function PreviewControl({ field, placeholder }: { field: EditableField; placeholder: string }) {
  const options = optionLabels(field)
  const inputClass = 'w-full rounded-md border bg-gray-50 px-3 py-2 text-sm dark:bg-gray-900'
  switch (field.type) {
    case 'text':
      return <input disabled placeholder={placeholder} className={inputClass} />
    case 'long_text':
      return <textarea disabled placeholder={placeholder} rows={3} className={inputClass} />
    case 'single_choice':
      return (
        <div className="space-y-1.5">
          {options.map((option, index) => (
            <label key={`${option}-${index}`} className="flex items-center gap-2 text-sm">
              <input type="radio" disabled />
              {option}
            </label>
          ))}
          {options.length === 0 && <span className="text-sm text-gray-400">{placeholder}</span>}
        </div>
      )
    case 'multi_choice':
      return (
        <div className="space-y-1.5">
          {options.map((option, index) => (
            <label key={`${option}-${index}`} className="flex items-center gap-2 text-sm">
              <input type="checkbox" disabled />
              {option}
            </label>
          ))}
          {options.length === 0 && <span className="text-sm text-gray-400">{placeholder}</span>}
        </div>
      )
    case 'boolean':
      return <input type="checkbox" disabled />
  }
}

export default function TemplateEditor({ template, services, onChanged, onClose }: TemplateEditorProps) {
  const { t } = useTranslation()
  const [templateId, setTemplateId] = useState<number | null>(template?.id ?? null)
  const [publishedVersion, setPublishedVersion] = useState<number | null>(template?.published_version ?? null)
  const [name, setName] = useState(template?.name ?? '')
  const [description, setDescription] = useState(template?.description ?? '')
  const [serviceId, setServiceId] = useState<number | null>(template?.service_id ?? null)
  const [fields, setFields] = useState<EditableField[]>(() => (template?.fields ?? []).map(toEditable))
  const [showPreview, setShowPreview] = useState(false)
  const [busy, setBusy] = useState<'save' | 'publish' | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [nameError, setNameError] = useState('')
  const [descriptionError, setDescriptionError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, FieldErrors>>({})
  const submitting = useRef(false)

  const updateField = (uid: string, patch: Partial<EditableField>) => {
    setFields((current) => current.map((field) => (field.uid === uid ? { ...field, ...patch } : field)))
  }

  const moveField = (index: number, delta: number) => {
    setFields((current) => {
      const target = index + delta
      if (target < 0 || target >= current.length) return current
      const next = [...current]
      const [item] = next.splice(index, 1)
      next.splice(target, 0, item)
      return next
    })
  }

  const validate = (forPublish: boolean): boolean => {
    let ok = true
    setNameError('')
    setDescriptionError('')
    const nextFieldErrors: Record<string, FieldErrors> = {}
    let general = ''

    const trimmedName = name.trim()
    if (!trimmedName) {
      setNameError(t('questionnaireEditor.errorName'))
      ok = false
    } else if (!isPlainLine(trimmedName)) {
      setNameError(t('questionnaireEditor.errorPlainText'))
      ok = false
    }
    if (!isPlainText(description)) {
      setDescriptionError(t('questionnaireEditor.errorPlainText'))
      ok = false
    }
    if (forPublish && fields.length === 0) {
      general = t('questionnaireEditor.errorFieldsRequired')
      ok = false
    }

    for (const field of fields) {
      const errors: FieldErrors = {}
      if (!field.label.trim()) errors.label = t('questionnaireEditor.errorLabel')
      else if (!isPlainLine(field.label)) errors.label = t('questionnaireEditor.errorPlainText')
      if (!isPlainText(field.description)) errors.hint = t('questionnaireEditor.errorPlainText')

      if (field.type === 'single_choice' || field.type === 'multi_choice') {
        const labels = optionLabels(field)
        const unique = new Set(labels.map((label) => label.toLowerCase()))
        if (labels.length < 2 || labels.length > MAX_OPTIONS) {
          errors.options = t('questionnaireEditor.errorOptionsCount')
        } else if (unique.size !== labels.length) {
          errors.options = t('questionnaireEditor.errorOptionsDuplicate')
        } else if (labels.some((label) => !isPlainLine(label))) {
          errors.options = t('questionnaireEditor.errorPlainText')
        } else if (labels.some((label) => label.length > 255)) {
          errors.options = t('questionnaireEditor.errorOptionLong')
        }

        if (field.type === 'multi_choice' && !errors.options && field.maxSelected.trim()) {
          const maxSelected = Number(field.maxSelected)
          if (!Number.isInteger(maxSelected) || maxSelected < 1 || maxSelected > labels.length) {
            errors.maxSelected = t('questionnaireEditor.errorMaxSelected')
          }
        }
      }

      if (Object.keys(errors).length > 0) {
        nextFieldErrors[field.uid] = errors
        ok = false
      }
    }

    setFieldErrors(nextFieldErrors)
    setError(general)
    return ok
  }

  const buildPayload = (): QuestionnaireTemplateCreate => {
    const usedKeys = new Set<string>()
    const payloadFields: QuestionnaireField[] = []
    fields.forEach((field, index) => {
      const built = buildField(field, index, usedKeys)
      if (built) payloadFields.push(built)
    })
    return {
      name: name.trim(),
      description: description.trim() || null,
      fields: payloadFields,
    }
  }

  const submit = async (mode: 'save' | 'publish') => {
    if (submitting.current) return
    setSuccess('')
    if (!validate(mode === 'publish')) return
    const payload = buildPayload()
    submitting.current = true
    setBusy(mode)
    try {
      let id = templateId
      if (id === null) {
        const { data } = await api.post<QuestionnaireTemplateOut>('/businesses/me/questionnaires/', payload)
        id = data.id
        setTemplateId(id)
      } else {
        await api.patch<QuestionnaireTemplateOut>(`/businesses/me/questionnaires/${id}`, payload)
      }
      if (mode === 'publish') {
        const body: QuestionnairePublish = { service_id: serviceId }
        const { data } = await api.post<QuestionnaireVersionOut>(`/businesses/me/questionnaires/${id}/publish`, body)
        setPublishedVersion(data.version)
        setSuccess(`${t('questionnaires.publishedVersion')} ${data.version}`)
      } else {
        setSuccess(t('questionnaireEditor.saved'))
      }
      onChanged()
    } catch (err) {
      setError(apiErrorMessage(err, t(mode === 'publish' ? 'questionnaireEditor.publishError' : 'questionnaireEditor.saveError')))
    } finally {
      submitting.current = false
      setBusy(null)
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        void submit('save')
      }}
      className="space-y-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">
            {templateId === null ? t('questionnaireEditor.createTitle') : t('questionnaireEditor.editTitle')}
          </h2>
          {publishedVersion !== null && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('questionnaires.publishedVersion')} {publishedVersion}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-900"
        >
          {t('questionnaires.backToList')}
        </button>
      </div>

      {error && (
        <div role="alert">
          <FormError message={error} />
        </div>
      )}
      {success && (
        <p role="status" className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300">
          {success}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="questionnaire-name" className="mb-1 block text-sm font-medium">
            {t('questionnaireEditor.name')} *
          </label>
          <input
            id="questionnaire-name"
            type="text"
            maxLength={255}
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={nameError ? true : undefined}
            placeholder={t('questionnaireEditor.namePlaceholder')}
            className="w-full rounded-md border px-3 py-2"
          />
          {nameError && <FormError message={nameError} />}
        </div>
        <div>
          <label htmlFor="questionnaire-description" className="mb-1 block text-sm font-medium">
            {t('questionnaireEditor.description')}
          </label>
          <input
            id="questionnaire-description"
            type="text"
            maxLength={500}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            aria-invalid={descriptionError ? true : undefined}
            placeholder={t('questionnaireEditor.descriptionPlaceholder')}
            className="w-full rounded-md border px-3 py-2"
          />
          {descriptionError && <FormError message={descriptionError} />}
        </div>
      </div>

      <div>
        <label htmlFor="questionnaire-service" className="mb-1 block text-sm font-medium">
          {t('questionnaireEditor.service')}
        </label>
        <select
          id="questionnaire-service"
          value={serviceId ?? ''}
          onChange={(event) => setServiceId(event.target.value ? Number(event.target.value) : null)}
          className="w-full max-w-md rounded-md border px-3 py-2"
        >
          <option value="">{t('questionnaires.noService')}</option>
          {serviceId !== null && !services.some((service) => service.id === serviceId) && (
            <option value={serviceId}>#{serviceId}</option>
          )}
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('questionnaireEditor.serviceHint')}</p>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">{t('questionnaireEditor.fields')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('questionnaireEditor.fieldsHint')}</p>
          </div>
          <button
            type="button"
            disabled={fields.length >= MAX_FIELDS}
            onClick={() => setFields((current) => [...current, newEditable('text')])}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('questionnaireEditor.add')}
          </button>
        </div>

        {fields.map((field, index) => {
          const errors = fieldErrors[field.uid] ?? {}
          const isChoice = field.type === 'single_choice' || field.type === 'multi_choice'
          return (
            <div key={field.uid} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                  {t('questionnaireEditor.fields')} {index + 1}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label={t('questionnaireEditor.moveUp')}
                    title={t('questionnaireEditor.moveUp')}
                    disabled={index === 0}
                    onClick={() => moveField(index, -1)}
                    className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-30 dark:text-gray-300 dark:hover:bg-gray-900"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label={t('questionnaireEditor.moveDown')}
                    title={t('questionnaireEditor.moveDown')}
                    disabled={index === fields.length - 1}
                    onClick={() => moveField(index, 1)}
                    className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-30 dark:text-gray-300 dark:hover:bg-gray-900"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    aria-label={t('questionnaireEditor.remove')}
                    title={t('questionnaireEditor.remove')}
                    onClick={() => setFields((current) => current.filter((item) => item.uid !== field.uid))}
                    className="rounded px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor={`${field.uid}-type`} className="mb-1 block text-sm font-medium">
                    {t('questionnaireEditor.type')}
                  </label>
                  <select
                    id={`${field.uid}-type`}
                    value={field.type}
                    onChange={(event) =>
                      updateField(field.uid, { type: event.target.value as QuestionnaireFieldType })
                    }
                    className="w-full rounded-md border px-3 py-2"
                  >
                    {FIELD_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {t(TYPE_LABEL_KEYS[type])}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor={`${field.uid}-label`} className="mb-1 block text-sm font-medium">
                    {t('questionnaireEditor.label')} *
                  </label>
                  <input
                    id={`${field.uid}-label`}
                    type="text"
                    maxLength={255}
                    value={field.label}
                    onChange={(event) => updateField(field.uid, { label: event.target.value })}
                    aria-invalid={errors.label ? true : undefined}
                    placeholder={t('questionnaireEditor.labelPlaceholder')}
                    className="w-full rounded-md border px-3 py-2"
                  />
                  {errors.label && <FormError message={errors.label} />}
                </div>
              </div>

              <div className="mt-3">
                <label htmlFor={`${field.uid}-hint`} className="mb-1 block text-sm font-medium">
                  {t('questionnaireEditor.fieldHint')}
                </label>
                <input
                  id={`${field.uid}-hint`}
                  type="text"
                  maxLength={500}
                  value={field.description}
                  onChange={(event) => updateField(field.uid, { description: event.target.value })}
                  aria-invalid={errors.hint ? true : undefined}
                  placeholder={t('questionnaireEditor.fieldHintPlaceholder')}
                  className="w-full rounded-md border px-3 py-2"
                />
                {errors.hint && <FormError message={errors.hint} />}
              </div>

              {isChoice && (
                <div className="mt-3">
                  <label htmlFor={`${field.uid}-options`} className="mb-1 block text-sm font-medium">
                    {t('questionnaireEditor.options')} *
                  </label>
                  <textarea
                    id={`${field.uid}-options`}
                    rows={Math.max(3, Math.min(8, optionLabels(field).length + 1))}
                    value={field.optionsText}
                    onChange={(event) => updateField(field.uid, { optionsText: event.target.value })}
                    aria-invalid={errors.options ? true : undefined}
                    className="w-full rounded-md border px-3 py-2"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('questionnaireEditor.optionsHint')}</p>
                  {errors.options && <FormError message={errors.options} />}
                </div>
              )}

              {field.type === 'multi_choice' && (
                <div className="mt-3 max-w-xs">
                  <label htmlFor={`${field.uid}-max`} className="mb-1 block text-sm font-medium">
                    {t('questionnaireEditor.maxSelected')}
                  </label>
                  <input
                    id={`${field.uid}-max`}
                    type="number"
                    min={1}
                    max={Math.max(1, optionLabels(field).length)}
                    step={1}
                    value={field.maxSelected}
                    onChange={(event) => updateField(field.uid, { maxSelected: event.target.value })}
                    aria-invalid={errors.maxSelected ? true : undefined}
                    placeholder={t('questionnaireEditor.maxSelectedHint')}
                    className="w-full rounded-md border px-3 py-2"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('questionnaireEditor.maxSelectedHint')}</p>
                  {errors.maxSelected && <FormError message={errors.maxSelected} />}
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(event) => updateField(field.uid, { required: event.target.checked })}
                  />
                  {t('questionnaireEditor.required')}
                </label>
                {field.key && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t('questionnaireEditor.keyHint')}: <code>{field.key}</code>
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">{t('questionnaireEditor.previewTitle')}</h3>
          <button
            type="button"
            onClick={() => setShowPreview((current) => !current)}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-900"
          >
            {showPreview ? t('questionnaireEditor.hidePreview') : t('questionnaireEditor.preview')}
          </button>
        </div>
        {showPreview && (
          <div className="mt-4 space-y-4">
            <div>
              <h4 className="text-lg font-semibold">{name.trim() || t('questionnaires.untitled')}</h4>
              {description.trim() && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{description.trim()}</p>
              )}
            </div>
            {fields.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('questionnaires.emptyFields')}</p>
            ) : (
              fields.map((field) => (
                <div key={field.uid}>
                  <p className="text-sm font-medium">
                    {field.label.trim() || t('questionnaireEditor.label')}
                    {field.required && <span className="ml-1 text-red-500">*</span>}
                  </p>
                  {field.description.trim() && (
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{field.description.trim()}</p>
                  )}
                  <div className="mt-2">
                    <PreviewControl field={field} placeholder={t('questionnaireEditor.answerPlaceholder')} />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-900"
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          disabled={busy !== null}
          className="flex items-center gap-2 rounded-md border border-primary-600 px-5 py-2.5 font-medium text-primary-700 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-primary-300 dark:hover:bg-primary-900/20"
        >
          {busy === 'save' && <LoadingSpinner size="sm" />}
          {t('questionnaireEditor.saveDraft')}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void submit('publish')}
          className="flex items-center gap-2 rounded-md bg-primary-600 px-5 py-2.5 font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy === 'publish' && <LoadingSpinner size="sm" />}
          {busy === 'publish' ? t('questionnaireEditor.publishing') : t('questionnaireEditor.publish')}
        </button>
      </div>
    </form>
  )
}
