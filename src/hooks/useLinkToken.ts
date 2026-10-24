import { useEffect, useLayoutEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

/** Follow a new credential link before the user can act on the previous form. */
export function useLinkToken(readToken: () => string | null): string | null {
  const location = useLocation()
  const [token, setToken] = useState(readToken)

  useLayoutEffect(() => {
    setToken(readToken())
  }, [location.key, location.pathname, location.search, location.hash, readToken])

  useEffect(() => {
    const update = () => setToken(readToken())
    window.addEventListener('hashchange', update)
    window.addEventListener('popstate', update)
    return () => {
      window.removeEventListener('hashchange', update)
      window.removeEventListener('popstate', update)
    }
  }, [readToken])

  return token
}
