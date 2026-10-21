export interface GoogleIdentity {
  initialize: (options: { client_id: string; nonce: string; auto_select: boolean; callback: (response: { credential: string }) => void }) => void
  renderButton: (element: HTMLElement, options: { theme: 'outline'; size: 'large'; shape: 'rectangular'; text: 'continue_with'; locale: string; width: number }) => void
  cancel: () => void
}

declare global {
  interface Window { google?: { accounts: { id: GoogleIdentity } } }
}
let pending: Promise<GoogleIdentity> | null = null
export function loadGoogleIdentity(): Promise<GoogleIdentity> {
  if (window.google?.accounts.id) return Promise.resolve(window.google.accounts.id)
  pending ??= new Promise<GoogleIdentity>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => window.google?.accounts.id ? resolve(window.google.accounts.id) : reject(new Error('Google Identity unavailable'))
    script.onerror = () => { script.remove(); reject(new Error('Google Identity unavailable')) }
    document.head.appendChild(script)
  }).catch(error => { pending = null; throw error })
  return pending
}
