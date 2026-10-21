export const PORTAL_TOKEN_KEY = 'client_portal_token'

export function readPortalToken(): string | null {
  try {
    return sessionStorage.getItem(PORTAL_TOKEN_KEY)
  } catch {
    return null
  }
}

export function savePortalToken(token: string): void {
  try {
    sessionStorage.setItem(PORTAL_TOKEN_KEY, token)
  } catch {
    // private windows may reject storage; the current page still works
  }
}

export function clearPortalToken(): void {
  try {
    sessionStorage.removeItem(PORTAL_TOKEN_KEY)
  } catch {
    // nothing to clear
  }
}

export function portalHeaders(token: string) {
  return { 'X-Portal-Token': token }
}
