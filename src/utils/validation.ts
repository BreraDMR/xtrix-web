/**
 * Validation utilities for form fields
 */

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
  // Allow international format: +, digits, spaces, dashes, parentheses
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,}$/
  if (!phoneRegex.test(phone)) {
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
  // Check if date is not in the future (for birth dates, etc.)
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

/**
 * Combine multiple validators
 */
export function combineValidators(...validators: Validator[]): Validator {
  return (value: any) => {
    for (const validator of validators) {
      const error = validator(value)
      if (error) return error
    }
    return null
  }
}

/**
 * Extract validation errors from API response
 */
export function extractApiErrors(error: any): Record<string, string> {
  const errors: Record<string, string> = {}
  
  if (!error?.response?.data) {
    return errors
  }
  
  const data = error.response.data
  
  // FastAPI validation errors format
  if (data.detail && Array.isArray(data.detail)) {
    data.detail.forEach((item: any) => {
      if (item.loc && item.loc.length > 0) {
        const field = item.loc[item.loc.length - 1]
        errors[field] = item.msg || 'Validation error'
      }
    })
  }
  
  // Custom validation errors format
  if (data.error?.detail?.validation_errors) {
    data.error.detail.validation_errors.forEach((item: any) => {
      if (item.field && item.message) {
        errors[item.field] = item.message
      }
    })
  }
  
  // General error message
  if (data.error?.message && !Object.keys(errors).length) {
    errors._general = data.error.message
  }
  
  if (data.detail && typeof data.detail === 'string' && !Object.keys(errors).length) {
    errors._general = data.detail
  }
  
  return errors
}
