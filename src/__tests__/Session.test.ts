import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import api from '../api/client'
import { useAuthStore } from '../store/authStore'
import { resetStores } from '../test/render'

const originalAdapter = api.defaults.adapter
const user = { id: 1, role: 'specialist', full_name: 'Jane' }

function fail(config: InternalAxiosRequestConfig, status: number): never {
  throw new AxiosError('Failed', String(status), config, null, { config, status, statusText: '', headers: {}, data: {} })
}
function ok(config: InternalAxiosRequestConfig, data: unknown) {
  return { config, data, status: 200, statusText: '', headers: {} }
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
})
