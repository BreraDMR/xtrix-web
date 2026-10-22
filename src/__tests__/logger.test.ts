import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { logger } from '../utils/logger'
import { useAuthStore } from '../store/authStore'
import api from '../api/client'
import { apiError, resetStores } from '../test/render'

describe('Debug output', () => {
  beforeEach(() => {
    resetStores()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('does not log or persist diagnostics in production', () => {
    vi.stubEnv('DEV', false)
    logger.log('Session', { id: 1 })
    logger.error('Failed', new Error('Offline'))
    expect(console.log).not.toHaveBeenCalled()
    expect(console.error).not.toHaveBeenCalled()
    expect(localStorage.getItem('app_logs')).toBeNull()
  })

  it('keeps development logs out of localStorage', () => {
    vi.stubEnv('DEV', true)
    logger.log('Session', { id: 1 })
    logger.error('Failed', new Error('Offline'))
    expect(localStorage.getItem('app_logs')).toBeNull()
  })

  it('keeps auth persistence without printing user data', () => {
    useAuthStore.getState().setAuth('secret', { id: 1, full_name: 'Test User', role: 'specialist' })
    expect(localStorage.getItem('auth_token')).toBe('secret')
    useAuthStore.getState().logout()
    expect(localStorage.getItem('auth_token')).toBeNull()
    expect(console.log).not.toHaveBeenCalled()
    expect(console.error).not.toHaveBeenCalled()
    expect(localStorage.getItem('app_logs')).toBeNull()
  })

  it('does not print or persist failed API request diagnostics', async () => {
    useAuthStore.getState().startSession('secret')
    const failure = apiError(401, 'Unauthorized')
    await expect(api.get('/users/me', { adapter: () => Promise.reject(failure) })).rejects.toBe(failure)
    expect(console.log).not.toHaveBeenCalled()
    expect(console.error).not.toHaveBeenCalled()
    expect(localStorage.getItem('app_logs')).toBeNull()
  })
})
