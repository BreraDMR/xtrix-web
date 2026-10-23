import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import api, { signOut } from '../api/client'
import { useAuthStore } from '../store/authStore'
import { resetStores } from '../test/render'

const originalAdapter = api.defaults.adapter
const user = { id: 1, role: 'specialist', full_name: 'Jane', business_id: null, employer_id: null }

function fail(config: InternalAxiosRequestConfig, status: number): never {
  throw new AxiosError('Failed', String(status), config, null, { config, status, statusText: '', headers: {}, data: {} })
}
function ok(config: InternalAxiosRequestConfig, data: unknown) {
  return { config, data, status: 200, statusText: '', headers: {} }
}

function otherTabSignsIn() {
  localStorage.setItem('auth_user', JSON.stringify({ ...user, id: 2 }))
  localStorage.setItem('auth_token', 'other-access')
  localStorage.setItem('auth_refresh_token', 'other-refresh')
  // Intentionally do not dispatch storage: it can arrive after an HTTP response.
}

describe('session refresh', () => {
  beforeEach(() => { resetStores(); useAuthStore.getState().setAuth('expired', user); localStorage.setItem('auth_refresh_token', 'refresh') })
  afterEach(() => { api.defaults.adapter = originalAdapter })

  it('shares one token rotation across concurrent unauthorized requests', async () => {
    const refresh = vi.fn()
    const adapter: AxiosAdapter = async config => {
      if (config.url === '/users/refresh') {
        refresh(config.data)
        await new Promise(resolve => setTimeout(resolve, 5))
        return ok(config, { access_token: 'renewed', refresh_token: 'rotated' })
      }
      if (config.headers.Authorization !== 'Bearer renewed') fail(config, 401)
      return ok(config, user)
    }
    api.defaults.adapter = adapter
    const responses = await Promise.all([api.get('/users/me'), api.get('/clients/'), api.get('/visits/')])
    expect(responses.every(response => response.status === 200)).toBe(true)
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(JSON.parse(refresh.mock.calls[0][0])).toEqual({ refresh_token: 'refresh' })
    expect(localStorage.getItem('auth_token')).toBe('renewed')
    expect(localStorage.getItem('auth_refresh_token')).toBe('rotated')
    expect(useAuthStore.getState().user).toEqual(user)
  })

  it('clears an unrecoverable session without recursively refreshing', async () => {
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => fail(config, 401))
    api.defaults.adapter = adapter
    await expect(api.get('/users/me')).rejects.toThrow('Failed')
    expect(adapter).toHaveBeenCalledTimes(2)
    expect(useAuthStore.getState().token).toBeNull()
    expect(localStorage.getItem('auth_refresh_token')).toBeNull()
  })

  it('logs out when even the refreshed token is refused, refreshing only once', async () => {
    const urls: string[] = []
    api.defaults.adapter = async config => {
      urls.push(config.url!)
      if (config.url === '/users/refresh') return ok(config, { access_token: 'renewed', refresh_token: 'rotated' })
      return fail(config, 401)
    }
    await expect(api.get('/clients/')).rejects.toThrow('Failed')
    expect(urls).toEqual(['/clients/', '/users/refresh', '/clients/'])
    expect(useAuthStore.getState().token).toBeNull()
  })

  it('keeps the session when the refresh is only rate limited or offline', async () => {
    for (const status of [429, 503]) {
      api.defaults.adapter = async config => fail(config, config.url === '/users/refresh' ? status : 401)
      await expect(api.get('/clients/')).rejects.toThrow('Failed')
      expect(useAuthStore.getState().token).toBe('expired')
      expect(localStorage.getItem('auth_refresh_token')).toBe('refresh')
    }
  })

  it('picks up tokens another tab rotated instead of logging out', async () => {
    api.defaults.adapter = async config => {
      if (config.url === '/users/refresh') {
        // the other tab won the race and the server already revoked our refresh token
        localStorage.setItem('auth_token', 'other-tab')
        localStorage.setItem('auth_refresh_token', 'other-refresh')
        return fail(config, 401)
      }
      if (config.headers.Authorization !== 'Bearer other-tab') fail(config, 401)
      return ok(config, [])
    }
    await expect(api.get('/clients/')).resolves.toMatchObject({ status: 200 })
    expect(useAuthStore.getState().token).toBe('other-tab')
    expect(localStorage.getItem('auth_refresh_token')).toBe('other-refresh')
  })

  it('keeps the session on a 403 (wrong QR PIN) or a 429, without refreshing', async () => {
    for (const status of [403, 429]) {
      const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => fail(config, status))
      api.defaults.adapter = adapter
      await expect(api.post('/clients/qr-code/access', { pin: '0000' })).rejects.toThrow('Failed')
      expect(adapter).toHaveBeenCalledTimes(1)
      expect(useAuthStore.getState().token).toBe('expired')
      expect(localStorage.getItem('auth_refresh_token')).toBe('refresh')
    }
  })

  it('does not refresh for a request sent without a token', async () => {
    useAuthStore.getState().logout()
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => fail(config, 401))
    api.defaults.adapter = adapter
    await expect(api.get('/users/me')).rejects.toThrow('Failed')
    expect(adapter).toHaveBeenCalledTimes(1)
  })

  it('does not treat a wrong password as an expired session', async () => {
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => fail(config, 401))
    api.defaults.adapter = adapter
    await expect(api.post('/users/login', { email: 'a@b.c', password: 'x' })).rejects.toThrow('Failed')
    expect(adapter).toHaveBeenCalledTimes(1)
    expect(useAuthStore.getState().token).toBe('expired')
  })

  it.each(['/public/client-portal/session', '/public/client-portal/verify', '/auth/google/login', '/public/booking-management'])('keeps a separate credential failure outside the CRM session: %s', async url => {
    const requests: InternalAxiosRequestConfig[] = []
    api.defaults.adapter = async config => {
      requests.push(config)
      if (config.url === '/users/refresh') return ok(config, { access_token: 'renewed', refresh_token: 'rotated' })
      return fail(config, 401)
    }
    await expect(api.post(url, { token: 'expired-guest-token' }, {
      headers: { 'X-Portal-Token': 'expired-portal-token' },
    })).rejects.toThrow('Failed')
    expect(requests.map(request => request.url)).toEqual([url])
    expect(requests[0].headers.Authorization).toBeUndefined()
    expect(requests[0].headers['X-Portal-Token']).toBe('expired-portal-token')
    expect(useAuthStore.getState()).toMatchObject({ token: 'expired', user })
    expect(localStorage.getItem('auth_refresh_token')).toBe('refresh')
  })

  it('does not replay an old mutation with the next account token', async () => {
    let rejectOld!: () => void
    const calls: string[] = []
    api.defaults.adapter = async config => {
      calls.push(String(config.headers.Authorization))
      if (calls.length > 1) return fail(config, 401)
      return new Promise((_resolve, reject) => {
        rejectOld = () => { try { fail(config, 401) } catch (error) { reject(error) } }
      })
    }
    const request = api.post('/visits/', { client_id: 10 }).catch(error => error)
    await vi.waitFor(() => expect(calls).toHaveLength(1))
    useAuthStore.getState().startSession('other-access', 'other-refresh')
    useAuthStore.getState().setAuth('other-access', { ...user, id: 2 })
    rejectOld()
    await request
    expect(calls).toEqual(['Bearer expired'])
    expect(useAuthStore.getState().token).toBe('other-access')
  })

  it.each(['logout', 'new login'])('does not revive a refresh after %s', async (change) => {
    let finishRefresh!: () => void
    api.defaults.adapter = config => {
      if (config.url !== '/users/refresh') return Promise.reject(new AxiosError('Failed', '401', config, null,
        { config, status: 401, statusText: '', headers: {}, data: {} }))
      return new Promise(resolve => { finishRefresh = () => resolve(ok(config, {
        access_token: 'old-renewed', refresh_token: 'old-rotated',
      })) })
    }
    const request = api.get('/clients/').catch(error => error)
    await vi.waitFor(() => expect(finishRefresh).toBeTypeOf('function'))
    if (change === 'logout') useAuthStore.getState().logout()
    else {
      useAuthStore.getState().startSession('other-access', 'other-refresh')
      useAuthStore.getState().setAuth('other-access', { ...user, id: 2 })
    }
    finishRefresh()
    await request
    expect(useAuthStore.getState().token).toBe(change === 'logout' ? null : 'other-access')
    expect(useAuthStore.getState().user?.id ?? null).toBe(change === 'logout' ? null : 2)
  })

  it('rejects an old successful mutation response after switching accounts', async () => {
    let finish!: () => void
    api.defaults.adapter = config => new Promise(resolve => {
      finish = () => resolve(ok(config, { client_id: 10, note: 'Previous salon' }))
    })
    const request = api.post('/visits/', { client_id: 10 })
    const result = request.then(() => 'accepted', () => 'rejected')
    await vi.waitFor(() => expect(finish).toBeTypeOf('function'))
    useAuthStore.getState().startSession('other-access', 'other-refresh')
    finish()
    expect(await result).toBe('rejected')
  })

  it('does not borrow the next account token before its storage event arrives', async () => {
    let finishRefresh!: () => void
    const writes: string[] = []
    api.defaults.adapter = async config => {
      if (config.url === '/users/refresh') return new Promise(resolve => {
        finishRefresh = () => resolve(ok(config, { access_token: 'old-renewed', refresh_token: 'old-rotated' }))
      })
      writes.push(String(config.headers.Authorization))
      if (config.headers.Authorization === 'Bearer other-access') return ok(config, {})
      return fail(config, 401)
    }
    const request = api.put('/businesses/me', { name: 'Previous salon' }).then(() => 'accepted', () => 'rejected')
    await vi.waitFor(() => expect(finishRefresh).toBeTypeOf('function'))
    otherTabSignsIn()
    finishRefresh()
    expect(await request).toBe('rejected')
    expect(writes).toEqual(['Bearer expired'])
    expect(useAuthStore.getState()).toMatchObject({ token: 'other-access', user: { id: 2 } })
    expect(localStorage.getItem('auth_refresh_token')).toBe('other-refresh')
  })

  it('does not send a queued mutation as the account that replaced it in the same turn', async () => {
    const writes: string[] = []
    api.defaults.adapter = async config => {
      writes.push(String(config.headers.Authorization))
      return ok(config, {})
    }
    const request = api.put('/businesses/me', { name: 'Previous salon' }).catch(() => undefined)
    useAuthStore.getState().startSession('other-access', 'other-refresh')
    useAuthStore.getState().setAuth('other-access', { ...user, id: 2 })
    await request
    expect(writes).not.toContain('Bearer other-access')
  })

  it('rejects an action from a stale tab before sending it with the next stored identity', async () => {
    otherTabSignsIn()
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => ok(config, {}))
    api.defaults.adapter = adapter
    await expect(api.put('/businesses/me', { name: 'Previous salon' })).rejects.toThrow('Session changed')
    expect(adapter).not.toHaveBeenCalled()
    expect(useAuthStore.getState()).toMatchObject({ token: 'other-access', user: { id: 2 } })
  })
})

describe('session in other tabs', () => {
  beforeEach(() => { resetStores(); useAuthStore.getState().setAuth('token', user) })

  function storageEvent(key: string | null) {
    window.dispatchEvent(new StorageEvent('storage', { key, storageArea: localStorage }))
  }

  it('signs this tab out when another tab logs out', () => {
    localStorage.clear()
    storageEvent(null)
    expect(useAuthStore.getState()).toMatchObject({ token: null, user: null })
  })

  it('follows a token another tab refreshed', () => {
    localStorage.setItem('auth_token', 'renewed')
    storageEvent('auth_token')
    expect(useAuthStore.getState()).toMatchObject({ token: 'renewed', user })
  })

  it('drops a saved user from before /users/me had business_id, so it gets loaded again', () => {
    localStorage.setItem('auth_user', JSON.stringify({ id: 1, role: 'specialist', full_name: 'Jane' }))
    storageEvent('auth_user')
    expect(useAuthStore.getState()).toMatchObject({ token: 'token', user: null })
  })
})

describe('sign out', () => {
  beforeEach(() => { resetStores(); useAuthStore.getState().setAuth('access', user); localStorage.setItem('auth_refresh_token', 'refresh') })
  afterEach(() => { api.defaults.adapter = originalAdapter })

  it('revokes the refresh token on the server and clears the session right away', async () => {
    const sent: InternalAxiosRequestConfig[] = []
    let answer: () => void = () => {}
    api.defaults.adapter = config => {
      sent.push(config)
      return new Promise(resolve => { answer = () => resolve(ok(config, { message: 'ok' })) })
    }
    signOut()
    // no waiting for the server
    expect(useAuthStore.getState()).toMatchObject({ token: null, user: null })
    expect(localStorage.getItem('auth_refresh_token')).toBeNull()
    await vi.waitFor(() => expect(sent).toHaveLength(1))
    expect(sent[0].url).toBe('/users/logout')
    expect(JSON.parse(sent[0].data)).toEqual({ refresh_token: 'refresh' })
    expect(sent[0].headers.Authorization).toBe('Bearer access')
    answer()
  })

  it('still signs out locally when the server call fails', async () => {
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => fail(config, 401))
    api.defaults.adapter = adapter
    signOut()
    await vi.waitFor(() => expect(adapter).toHaveBeenCalledTimes(1))
    expect(useAuthStore.getState().token).toBeNull()
  })

  it('skips the server call without a refresh token', () => {
    localStorage.removeItem('auth_refresh_token')
    const adapter = vi.fn()
    api.defaults.adapter = adapter
    signOut()
    expect(adapter).not.toHaveBeenCalled()
    expect(useAuthStore.getState().token).toBeNull()
  })
})
