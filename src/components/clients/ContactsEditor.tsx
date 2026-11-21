import { useId } from 'react'

import { useTranslation } from '../../hooks/useTranslation'
import type { TranslationKey } from '../../i18n/translations'
import FormError from '../FormError'
import { CONTACT_LIMITS, emptyContact, type ContactKind, type ContactRow } from './contacts'

interface ContactsEditorProps {
  rows: ContactRow[]
  onChange: (rows: ContactRow[]) => void
  errors?: Record<string, string>
}

const SECTION: Record<ContactKind, { title: TranslationKey; add: TranslationKey; item: TranslationKey; max: TranslationKey }> = {
  phone: { title: 'contacts.phones', add: 'contacts.addPhone', item: 'contacts.phoneN', max: 'contacts.maxPhones' },
  email: { title: 'contacts.emails', add: 'contacts.addEmail', item: 'contacts.emailN', max: 'contacts.maxEmails' },
}

export default function ContactsEditor({ rows, onChange, errors = {} }: ContactsEditorProps) {
  const { t } = useTranslation()
  const groupId = useId()

  const update = (key: string, patch: Partial<ContactRow>) =>
    onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)))

  const makePrimary = (row: ContactRow) =>
    onChange(rows.map((r) => (r.kind === row.kind ? { ...r, is_primary: r.key === row.key } : r)))

  const remove = (row: ContactRow) => {
    let next = rows.filter((r) => r.key !== row.key)
    const left = next.filter((r) => r.kind === row.kind)
    if (left.length === 0) {
      // keep one empty field so there's always somewhere to type
      next = [...next, emptyContact(row.kind, true)]
    } else if (row.is_primary) {
      next = next.map((r) => (r.key === left[0].key ? { ...r, is_primary: true } : r))
    }
    onChange(next)
  }

  const add = (kind: ContactKind) => onChange([...rows, emptyContact(kind)])

  return (
    <div className="space-y-4">
      {(['phone', 'email'] as const).map((kind) => {
        const mine = rows.filter((r) => r.kind === kind)
        const full = mine.length >= CONTACT_LIMITS[kind]
        return (
          <fieldset key={kind} className="space-y-2">
            <legend className="mb-1.5 block text-xs font-semibold text-[var(--workspace-muted)]">
              {t(SECTION[kind].title)}
            </legend>
            {mine.map((row, index) => {
              const name = t(SECTION[kind].item).replace('{n}', String(index + 1))
              return (
                <div key={row.key} className="rounded-md border border-[var(--workspace-line)] p-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type={kind === 'phone' ? 'tel' : 'email'}
                      inputMode={kind === 'phone' ? 'tel' : 'email'}
                      aria-label={name}
                      value={row.value}
                      onChange={(e) => update(row.key, { value: e.target.value })}
                      aria-invalid={errors[row.key] ? true : undefined}
                      maxLength={kind === 'phone' ? 50 : 255}
                      className={`min-w-0 flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        errors[row.key] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    <input
                      type="text"
                      aria-label={t('contacts.label')}
                      placeholder={t('contacts.label')}
                      value={row.label}
                      onChange={(e) => update(row.key, { label: e.target.value })}
                      maxLength={50}
                      className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                    <label className="flex items-center gap-1.5">
                      <input
                        type="radio"
                        name={`${groupId}-${kind}-primary`}
                        checked={row.is_primary}
                        onChange={() => makePrimary(row)}
                      />
                      {t('contacts.primary')}
                    </label>
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={row.notify}
                        onChange={(e) => update(row.key, { notify: e.target.checked })}
                      />
                      {t('contacts.notify')}
                    </label>
                    {(mine.length > 1 || row.value) && (
                      <button
                        type="button"
                        onClick={() => remove(row)}
                        aria-label={`${t('contacts.remove')}: ${name}`}
                        className="ml-auto text-sm text-red-600 hover:underline"
                      >
                        {t('contacts.remove')}
                      </button>
                    )}
                  </div>
                  {errors[row.key] && <FormError message={errors[row.key]} />}
                </div>
              )
            })}
            <button
              type="button"
              onClick={() => add(kind)}
              disabled={full}
              title={full ? t(SECTION[kind].max) : undefined}
              className="text-sm font-medium text-[var(--workspace-accent)] hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
            >
              {t(SECTION[kind].add)}
            </button>
            {full && <p className="text-xs text-[var(--workspace-muted)]">{t(SECTION[kind].max)}</p>}
          </fieldset>
        )
      })}
    </div>
  )
}
