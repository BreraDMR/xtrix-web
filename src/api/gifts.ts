import api from './client'
import type { GiftCertificateOut } from './types'

export async function fetchCertificates(status?: string, signal?: AbortSignal): Promise<GiftCertificateOut[]> {
  const rows: GiftCertificateOut[] = []
  const ids = new Set<number>()
  const limit = 100
  for (let offset = 0; ; offset += limit) {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    if (status) params.set('status', status)
    const { data } = await api.get<GiftCertificateOut[]>(`/businesses/me/gift-certificates?${params}`, { signal })
    if (data.length > limit) throw new Error('Unexpected certificate page')
    for (const certificate of data) {
      if (ids.has(certificate.id)) throw new Error('Certificate directory changed')
      ids.add(certificate.id)
      rows.push(certificate)
    }
    if (data.length < limit) return rows
  }
}
