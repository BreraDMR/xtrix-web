import { useLayoutEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

/** Follow a new credential link before the user can act on the previous form. */
export function useLinkToken(readToken: () => string | null): string | null {
  const location = useLocation()
  const current = useRef<{ token: string | null } | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useLayoutEffect(() => {
    const update = () => {
      // Reading consumes the fragment. Keep it in memory when tab storage is blocked.
      if (current.current === null || window.location.hash.length > 1) {
        current.current = { token: readToken() }
      }
      setToken(current.current.token)
    }
    update()
    window.addEventListener('hashchange', update)
    window.addEventListener('popstate', update)
    return () => {
      window.removeEventListener('hashchange', update)
      window.removeEventListener('popstate', update)
    }
  }, [location.key, location.pathname, location.search, location.hash, readToken])

  return token
}
