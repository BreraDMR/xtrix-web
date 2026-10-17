import { describe, it, expect } from 'vitest'
import { apiErrorMessage, apiErrorStatus, apiValidationErrors } from '../api/errors'
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

  it('falls back for anything that is not an API error', () => {
    expect(apiErrorMessage(new Error('boom'), 'fallback')).toBe('fallback')
    expect(apiErrorStatus(new Error('boom'))).toBeUndefined()
  })
})
