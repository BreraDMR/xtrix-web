import { describe, it, expect, beforeEach } from 'vitest'
import {
  apiClientExists, apiErrorCode, apiErrorMessage, apiFormErrors, apiErrorStatus, apiIsNetworkError, apiRetryAfter,
  apiValidationCodes, apiValidationErrors,
} from '../api/errors'
import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios'
import { apiError, resetStores } from '../test/render'
import { useLocaleStore } from '../store/localeStore'

describe('API errors', () => {
  beforeEach(() => resetStores())

  it('reads the message where the API puts it', () => {
    const err = apiError(409, 'This time is already booked for the specialist')
    expect(apiErrorMessage(err, 'fallback')).toBe('This time is already booked for the specialist')
    expect(apiErrorStatus(err)).toBe(409)
  })

  it('names the first invalid field of a validation error', () => {
    const err = apiError(422, 'Validation error: 1 field(s) failed validation', {
      validation_errors: [{ field: 'body -> contact_email', message: 'value is not a valid email address' }],
    })
    expect(apiErrorMessage(err, 'fallback')).toBe('Email: value is not a valid email address')
    expect(apiValidationErrors(err)).toEqual({ contact_email: 'value is not a valid email address' })
  })

  it('strips backend Value error prefixes from messages and field errors', () => {
    const err = apiError(422, 'Value error, Invalid input', { validation_errors: [{ field: 'body -> price', message: 'Value error, Price must be positive' }] })
    expect(apiErrorMessage(err, 'fallback')).toBe('Price: Price must be positive')
    expect(apiValidationErrors(err)).toEqual({ price: 'Price must be positive' })
    expect(apiErrorMessage(apiError(400, 'Value error, Invalid input'), 'fallback')).toBe('Invalid input')
  })

  it('reads a plain string error from older servers', () => {
    const response = apiError(400, 'unused').response!
    const err = new AxiosError('Bad', '400', response.config, null, {
      ...response, data: { error: 'Something went wrong' },
    })
    expect(apiErrorMessage(err, 'fallback')).toBe('Something went wrong')
    expect(apiValidationErrors(err)).toEqual({})
  })

  it('turns a 429 into a translated wait message with the Retry-After seconds', () => {
    const err = apiError(429, 'Too many requests, try again in 42 s', undefined, { headers: { 'retry-after': '42' }, type: 'RateLimitExceeded' })
    expect(apiRetryAfter(err)).toBe(42)
    expect(apiErrorMessage(err, 'fallback')).toBe('Too many requests. Try again in 42 s.')
    useLocaleStore.setState({ locale: 'ru' })
    expect(apiErrorMessage(err, 'fallback')).toBe('Слишком много запросов. Повторите через 42 с.')
    useLocaleStore.setState({ locale: 'cz' })
    expect(apiErrorMessage(err, 'fallback')).toBe('Příliš mnoho požadavků. Zkuste to znovu za 42 s.')
  })

  it('shows long waits in minutes and copes with a missing Retry-After', () => {
    expect(apiErrorMessage(apiError(429, 'x', undefined, { headers: { 'retry-after': '900' } }), 'f')).toBe('Too many requests. Try again in 15 min.')
    expect(apiErrorMessage(apiError(429, 'x'), 'f')).toBe('Too many requests. Try again a bit later.')
  })

  it('says a throttled login is about failed attempts', () => {
    const err = apiError(429, 'Account is locked', undefined, { headers: { 'retry-after': '30' }, type: 'LoginThrottled' })
    expect(apiErrorMessage(err, 'fallback')).toBe('Too many failed sign-in attempts. Try again in 30 s.')
  })

  it('translates unknown routes and methods in the common format', () => {
    expect(apiErrorMessage(apiError(404, 'Not Found'), 'fallback')).toBe('Not found.')
    expect(apiErrorMessage(apiError(405, 'Method Not Allowed'), 'fallback')).toBe('This action is not supported.')
    // a real "not found" from an endpoint keeps its own text
    expect(apiErrorMessage(apiError(404, 'Client not found'), 'fallback')).toBe('Client not found')
  })

  it('translates validation errors by code and params, field by field', () => {
    const err = apiError(422, 'Validation error: 3 field(s) failed validation', {
      validation_errors: [
        { field: 'body -> full_name', message: 'String should have at least 2 characters', code: 'string_too_short', params: { min_length: 2 } },
        { field: 'body -> price', message: 'Input should be greater than or equal to 0', code: 'greater_than_equal', params: { ge: 0 } },
        { field: 'body -> birth_date', message: 'Date should be between 1900-01-01 and 2100-12-31', code: 'date_out_of_range', params: { min: '1900-01-01', max: '2100-12-31' } },
        { field: 'body -> used_products -> 0 -> quantity', message: 'Input should be a number, not true/false', code: 'number_type', params: {} },
        { field: 'body -> notes', message: 'Some brand new check', code: 'brand_new_code', params: {} },
      ],
    })
    expect(apiValidationErrors(err)).toEqual({
      full_name: 'At least 2 characters',
      price: 'Must be at least 0',
      birth_date: 'Date must be between 1900-01-01 and 2100-12-31',
      quantity: 'Enter a number',
      notes: 'Some brand new check',
    })
    useLocaleStore.setState({ locale: 'ru' })
    expect(apiValidationErrors(err).full_name).toBe('Минимальная длина — 2')
    expect(apiErrorMessage(err, 'fallback')).toBe('Имя: Минимальная длина — 2')
  })

  it('translates the custom codes the API adds', () => {
    const err = apiError(422, 'Validation error', {
      validation_errors: [
        { field: 'body -> date_end', message: 'End date/time must be after start date/time', code: 'invalid_time_range', params: {} },
        { field: 'body -> password', message: 'Password must contain at least one uppercase letter', code: 'weak_password', params: {} },
        { field: 'body -> name', message: "This field can't be empty", code: 'null_not_allowed', params: {} },
        { field: 'body -> full_name', message: 'String should have at least 1 character', code: 'string_too_short', params: { min_length: 1 } },
      ],
    })
    expect(apiValidationErrors(err)).toEqual({
      date_end: 'The end must be after the start and the visit no longer than 24 hours',
      password: 'Password is too weak: use 8+ characters with upper and lower case letters, a digit and a symbol',
      name: "This field can't be empty",
      full_name: "This field can't be empty",
    })
  })

  it('finds the existing client in a client_exists conflict', () => {
    const err = apiError(409, 'This client is already in your list', { code: 'client_exists', existing_client_id: 17, matched_by: 'phone' })
    expect(apiClientExists(err)).toEqual({ existingClientId: 17, matchedBy: 'phone' })
    expect(apiClientExists(apiError(409, 'This time is already booked'))).toBeUndefined()
  })

  it('reads the error code and the validation codes', () => {
    expect(apiErrorCode(apiError(503, 'Busy', { code: 'ai_busy', retry_after: 5 }))).toBe('ai_busy')
    expect(apiErrorCode(apiError(500, 'boom'))).toBeUndefined()
    expect(apiErrorCode(new Error('x'))).toBeUndefined()
    const audio = apiError(422, 'Validation failed', {
      validation_errors: [{ field: 'body -> file', message: 'too big', code: 'audio_too_large' }, { field: 'body -> x', message: 'm' }],
    })
    expect(apiValidationCodes(audio)).toEqual(['audio_too_large'])
    expect(apiValidationCodes(new Error('x'))).toEqual([])
  })

  it('tells a request that got no answer from an error answer', () => {
    const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig
    expect(apiIsNetworkError(new AxiosError('Network Error', 'ERR_NETWORK', config, {}))).toBe(true)
    expect(apiIsNetworkError(apiError(503, 'Busy'))).toBe(false)
    expect(apiIsNetworkError(new Error('x'))).toBe(false)
  })

  it('falls back for anything that is not an API error', () => {
    expect(apiErrorMessage(new Error('boom'), 'fallback')).toBe('fallback')
    expect(apiErrorStatus(new Error('boom'))).toBeUndefined()
  })

  it('splits validation errors into the fields a form shows and a general message for the rest', () => {
    const err = apiError(422, 'Validation error', {
      validation_errors: [
        { field: 'body -> price', message: 'x', code: 'greater_than_equal', params: { ge: 0 } },
        { field: 'body -> specialist_id', message: 'Field required', code: 'missing', params: {} },
      ],
    })
    expect(apiFormErrors(err, ['price', 'name'], 'fallback')).toEqual({
      fields: { price: 'Must be at least 0' },
      general: 'specialist_id: Required field',
    })
    expect(apiFormErrors(apiError(409, 'Already booked'), ['price'], 'fallback')).toEqual({ fields: {}, general: 'Already booked' })
    expect(apiFormErrors(new Error('x'), ['price'], 'fallback')).toEqual({ fields: {}, general: 'fallback' })
  })
})
