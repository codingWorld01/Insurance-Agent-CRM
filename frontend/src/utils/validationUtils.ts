/**
 * Validation utilities for client management forms
 */

/**
 * Validates Indian PAN number format
 * Format: AAAAA9999A (5 letters, 4 digits, 1 letter)
 */
export function validatePAN(pan: string): boolean {
  if (!pan) return true // Optional field
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
  return panRegex.test(pan.toUpperCase())
}

/**
 * Validates Indian GST number format
 * Format: 99AAAAA9999A9A9 (15 characters)
 */
export function validateGST(gst: string): boolean {
  if (!gst) return true // Optional field
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/
  return gstRegex.test(gst.toUpperCase())
}

/**
 * Validates Indian mobile number
 * Format: 10 digits starting with 6, 7, 8, or 9
 */
export function validateMobileNumber(mobile: string): boolean {
  if (!mobile) return false // Required field
  const mobileRegex = /^[6-9]\d{9}$/
  return mobileRegex.test(mobile.replace(/\D/g, ''))
}

/**
 * Validates phone number (more flexible than mobile)
 * Allows landline numbers as well
 */
export function validatePhoneNumber(phone: string): boolean {
  if (!phone) return true // Optional field
  const cleanPhone = phone.replace(/\D/g, '')
  // Mobile: 10 digits starting with 6-9
  // Landline: 10-11 digits
  return /^[6-9]\d{9}$/.test(cleanPhone) || /^\d{10,11}$/.test(cleanPhone)
}

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
  if (!email) return true // Optional field
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validates date is in the past (for birth dates)
 */
export function validateBirthDate(date: Date | string): boolean {
  if (!date) return false // Required field
  const birthDate = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  return birthDate < today
}

/**
 * Validates age is within reasonable range
 */
export function validateAge(age: number): boolean {
  return age >= 0 && age <= 150
}

/**
 * Validates required string field
 */
export function validateRequired(value: string): boolean {
  return Boolean(value && value.trim().length > 0)
}

/**
 * Validates string length
 */
export function validateLength(value: string, min: number = 0, max: number = 255): boolean {
  if (!value) return true // Let required validation handle empty values
  return value.length >= min && value.length <= max
}

/**
 * Validates numeric value within range
 */
export function validateNumericRange(value: number, min: number = 0, max: number = Number.MAX_SAFE_INTEGER): boolean {
  return value >= min && value <= max
}

/**
 * Formats PAN number for display
 */
export function formatPAN(pan: string): string {
  return pan.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)
}

/**
 * Formats GST number for display
 */
export function formatGST(gst: string): string {
  return gst.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15)
}

/**
 * Formats mobile number for display
 */
export function formatMobileNumber(mobile: string): string {
  const digits = mobile.replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 5) {
    return digits
  } else if (digits.length <= 10) {
    return `${digits.slice(0, 5)} ${digits.slice(5)}`
  }
  return `${digits.slice(0, 5)} ${digits.slice(5, 10)}`
}

/**
 * Get validation error message for PAN
 */
export function getPANErrorMessage(pan: string): string | null {
  if (!pan) return null
  if (!validatePAN(pan)) {
    return "PAN must be in format AAAAA9999A (5 letters, 4 digits, 1 letter)"
  }
  return null
}

/**
 * Get validation error message for GST
 */
export function getGSTErrorMessage(gst: string): string | null {
  if (!gst) return null
  if (!validateGST(gst)) {
    return "GST number must be 15 characters in format 99AAAAA9999A9A9"
  }
  return null
}

/**
 * Get validation error message for mobile number
 */
export function getMobileErrorMessage(mobile: string): string | null {
  if (!mobile) return "Mobile number is required"
  if (!validateMobileNumber(mobile)) {
    return "Mobile number must be 10 digits starting with 6, 7, 8, or 9"
  }
  return null
}

/**
 * Get validation error message for email
 */
export function getEmailErrorMessage(email: string): string | null {
  if (!email) return null
  if (!validateEmail(email)) {
    return "Please enter a valid email address"
  }
  return null
}

/**
 * Get validation error message for birth date
 */
export function getBirthDateErrorMessage(date: Date | string | null): string | null {
  if (!date) return "Birth date is required"
  if (!validateBirthDate(date)) {
    return "Birth date must be in the past"
  }
  return null
}