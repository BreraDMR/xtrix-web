import type { ClientContactIn, ClientContactOut } from '../../api/types'

export type ContactKind = ClientContactIn['kind']

export interface ContactRow {
  key: string
  kind: ContactKind
  value: string
  label: string
  is_primary: boolean
  notify: boolean
}

// same numbers the API enforces
export const CONTACT_LIMITS: Record<ContactKind, number> = { phone: 5, email: 3 }

let rowCounter = 0
const nextKey = () => `contact-${++rowCounter}`

export function emptyContact(kind: ContactKind, isPrimary = false): ContactRow {
  return { key: nextKey(), kind, value: '', label: '', is_primary: isPrimary, notify: true }
}

// what the card has now -> editable rows; an old card may only have the two single fields
export function contactsFromClient(client: {
  contacts?: ClientContactOut[] | null
  contact_phone?: string | null
  contact_email?: string | null
}): ContactRow[] {
  const rows: ContactRow[] = (client.contacts ?? []).map((c) => ({
    key: nextKey(),
    kind: c.kind,
    value: c.value,
    label: c.label ?? '',
    is_primary: c.is_primary,
    notify: c.notify,
  }))
  if (!rows.some((r) => r.kind === 'phone')) {
    rows.push({ ...emptyContact('phone', true), value: client.contact_phone ?? '' })
  }
  if (!rows.some((r) => r.kind === 'email')) {
    rows.push({ ...emptyContact('email', true), value: client.contact_email ?? '' })
  }
  return rows
}

const normalized = (row: ContactRow) =>
  row.kind === 'phone' ? row.value.replace(/[\s\-().]/g, '') : row.value.trim().toLowerCase()

// rows with something typed in, primary settled the way the API settles it
export function contactsPayload(rows: ContactRow[]): ClientContactIn[] {
  // phones first, then emails, each in the order they're shown
  const filled = (['phone', 'email'] as const).flatMap((kind) => rows.filter((r) => r.kind === kind && r.value.trim()))
  return filled.map((r) => {
    const sameKind = filled.filter((o) => o.kind === r.kind)
    const primary = sameKind.find((o) => o.is_primary) ?? sameKind[0]
    return {
      kind: r.kind,
      value: r.value.trim(),
      label: r.label.trim() || null,
      is_primary: primary.key === r.key,
      notify: r.notify,
    }
  })
}

// key of the row -> error text; duplicates are caught here before the API sees them
export function contactErrors(
  rows: ContactRow[],
  check: (row: ContactRow) => string | undefined,
  duplicateText: string,
): Record<string, string> {
  const errors: Record<string, string> = {}
  const seen = new Set<string>()
  for (const row of rows) {
    if (!row.value.trim()) continue
    const problem = check(row)
    if (problem) {
      errors[row.key] = problem
      continue
    }
    const id = `${row.kind}:${normalized(row)}`
    if (seen.has(id)) errors[row.key] = duplicateText
    seen.add(id)
  }
  return errors
}
