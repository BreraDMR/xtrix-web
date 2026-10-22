import type { QueryClient } from '@tanstack/react-query'
import { useAuthStore, type SessionUser } from '../store/authStore'

function scope(user: SessionUser | null) {
  return user ? JSON.stringify([user.id, user.role, user.business_id ?? null, user.employer_id ?? null]) : null
}

export function bindSessionCache(client: QueryClient) {
  // Run before React renders the next account. Clearing also cancels old queries,
  // so a response arriving after logout cannot fill the new account's cache.
  return useAuthStore.subscribe((next, previous) => {
    const changedScope = scope(next.user) !== scope(previous.user)
    const changedUnknownSession = next.token !== previous.token && (!next.user || !previous.user)
    if (changedScope || changedUnknownSession) client.clear()
  })
}
