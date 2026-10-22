import api from './client'
import { allPages } from './allPages'
import type { ServiceOut, ServicePage } from './types'

export function fetchAllServices(signal?: AbortSignal): Promise<ServiceOut[]> {
  return allPages<ServiceOut>(async page => (await api.get<ServicePage>('/services/', {
    params: { page, per_page: 100 }, signal,
  })).data)
}
