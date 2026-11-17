import { useQuery } from '@tanstack/react-query'
import visitorApi, { visitorKey } from '../../api/visitorClient'
import type { Schema } from '../../api/types'

// Whether Google sign-in is offered for visitors; any failure counts as "not offered".
export function useVisitorGoogleConfig() {
  const config = useQuery({
    queryKey: visitorKey('google-config'),
    retry: false,
    queryFn: async () => (await visitorApi.get<Schema<'GoogleConfigOut'>>('/visitor/auth/google/config')).data,
  })
  return { clientId: config.data?.enabled && config.data.client_id ? config.data.client_id : null }
}
