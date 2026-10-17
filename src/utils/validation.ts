import { apiErrorMessage, apiValidationErrors } from '../api/errors'



export interface ValidationError {
  field: string
  message: string
}

export type Validator = (value: any) => string | null

export function validateEmail(email: string): string | null {
  if (!email) return null
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return 'Invalid email format'
  }
  return null
}

export function validatePhone(phone: string): string | null {
  if (!phone) return null
  const phoneRegex = /^[+]?[0-9\s\-()]{7,}$/
  if (!phoneRegex.test(phone) || phone.replace(/\D/g, '').length < 7) {
    return 'Invalid phone number format'
  }
  return null
}

export function validateRequired(value: any, fieldName?: string): string | null {
  if (value === null || value === undefined || value === '') {
    return `${fieldName || 'This field'} is required`
  }
  if (typeof value === 'string' && value.trim() === '') {
    return `${fieldName || 'This field'} is required`
  }
  return null
}

export function validateMinLength(value: string, minLength: number, fieldName?: string): string | null {
  if (!value) return null
  if (value.length < minLength) {
    return `${fieldName || 'Field'} must be at least ${minLength} characters`
  }
  return null
}

export function validateMaxLength(value: string, maxLength: number, fieldName?: string): string | null {
  if (!value) return null
  if (value.length > maxLength) {
    return `${fieldName || 'Field'} must be no more than ${maxLength} characters`
  }
  return null
}

export function validateMin(value: number, min: number, fieldName?: string): string | null {
  if (value === null || value === undefined) return null
  if (value < min) {
    return `${fieldName || 'Value'} must be at least ${min}`
  }
  return null
}

export function validateMax(value: number, max: number, fieldName?: string): string | null {
  if (value === null || value === undefined) return null
  if (value > max) {
    return `${fieldName || 'Value'} must be no more than ${max}`
  }
  return null
}

export function validateDate(date: string): string | null {
  if (!date) return null
  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date format'
  }
  if (dateObj > new Date()) {
    return 'Date cannot be in the future'
  }
  return null
}

export function validateDateRange(startDate: string, endDate: string): string | null {
  if (!startDate || !endDate) return null
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (end < start) {
    return 'End date must be after start date'
  }
  return null
}


export function combineValidators(...validators: Validator[]): Validator {
  return (value: any) => {
    for (const validator of validators) {
      const error = validator(value)
      if (error) return error
    }
    return null
  }
}


export function extractApiErrors(error: unknown): Record<string, string> {
  const errors = apiValidationErrors(error)
  if (!Object.keys(errors).length) {
    const message = apiErrorMessage(error, '')
    if (message) errors._general = message
  }
  return errors
}
