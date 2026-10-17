import { describe, it, expect } from 'vitest'
import { apiErrorMessage, apiErrorStatus, apiValidationErrors } from '../api/errors'
import { AxiosError } from 'axios'
import { apiError } from '../test/render'

describe('API errors', () => {
  it('reads the message where the API puts it', () => {
    const err = apiError(409, 'This time is already booked for the specialist')
    expect(apiErrorMessage(err, 'fallback')).toBe('This time is already booked for the specialist')
    expect(apiErrorStatus(err)).toBe(409)
  })

  it('names the first invalid field of a validation error', () => {
    const err = apiError(422, 'Validation error: 1 field(s) failed validation', {
      validation_errors: [{ field: 'body -> contact_email', message: 'value is not a valid email address' }],
    })
    expect(apiErrorMessage(err, 'fallback')).toBe('contact_email: value is not a valid email address')
    expect(apiValidationErrors(err)).toEqual({ contact_email: 'value is not a valid email address' })
  })

  it('reads a plain string error from the rate limiter', () => {
    const response = apiError(429, 'unused').response!
    const err = new AxiosError('Rate limit', '429', response.config, null, {
      ...response, data: { error: 'Rate limit exceeded' },
    })
    expect(apiErrorMessage(err, 'fallback')).toBe('Rate limit exceeded')
    expect(apiValidationErrors(err)).toEqual({})
  })

  it('falls back for anything that is not an API error', () => {
    expect(apiErrorMessage(new Error('boom'), 'fallback')).toBe('fallback')
    expect(apiErrorStatus(new Error('boom'))).toBeUndefined()
  })
})
