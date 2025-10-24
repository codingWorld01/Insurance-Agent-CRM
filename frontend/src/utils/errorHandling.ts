/**
 * Comprehensive error handling utilities for the policy page
 * Provides network error handling, retry mechanisms, and user-friendly error messages
 */

export interface ErrorDetails {
  code?: string
  message: string
  details?: string
  retryable?: boolean
  timestamp: Date
}

export interface RetryConfig {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
}

export interface NetworkError extends Error {
  status?: number
  code?: string
  retryable?: boolean
}

// Default retry configuration
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2
}

/**
 * Enhanced error class for policy page operations
 */
export class PolicyPageError extends Error {
  public readonly code?: string
  public readonly status?: number
  public readonly retryable: boolean
  public readonly timestamp: Date
  public readonly context?: Record<string, any>

  constructor(
    message: string,
    options: {
      code?: string
      status?: number
      retryable?: boolean
      context?: Record<string, any>
      cause?: Error
    } = {}
  ) {
    super(message)
    this.name = 'PolicyPageError'
    this.code = options.code
    this.status = options.status
    this.retryable = options.retryable ?? this.isRetryableByDefault()
    this.timestamp = new Date()
    this.context = options.context

    if (options.cause) {
      this.cause = options.cause
    }
  }

  private isRetryableByDefault(): boolean {
    // Network errors and server errors are generally retryable
    if (this.status) {
      return this.status >= 500 || this.status === 408 || this.status === 429
    }
    return false
  }

  toErrorDetails(): ErrorDetails {
    return {
      code: this.code,
      message: this.message,
      details: this.context ? JSON.stringify(this.context) : undefined,
      retryable: this.retryable,
      timestamp: this.timestamp
    }
  }
}

/**
 * Parse and enhance fetch response errors
 */
export async function parseResponseError(response: Response): Promise<PolicyPageError> {
  let message = 'An unexpected error occurred'
  let code: string | undefined
  let context: Record<string, any> | undefined

  try {
    const errorData = await response.json()
    message = errorData.message || message
    code = errorData.code || errorData.error
    context = errorData.details || errorData.context
  } catch {
    // If JSON parsing fails, use status-based messages
    message = getStatusMessage(response.status)
  }

  return new PolicyPageError(message, {
    code,
    status: response.status,
    context: {
      ...context,
      url: response.url,
      statusText: response.statusText
    }
  })
}

/**
 * Get user-friendly error messages based on HTTP status codes
 */
export function getStatusMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input and try again.'
    case 401:
      return 'Your session has expired. Please log in again.'
    case 403:
      return 'You do not have permission to perform this action.'
    case 404:
      return 'The requested resource was not found.'
    case 408:
      return 'Request timeout. Please try again.'
    case 409:
      return 'There was a conflict with your request. Please refresh and try again.'
    case 422:
      return 'Invalid data provided. Please check your input.'
    case 429:
      return 'Too many requests. Please wait a moment and try again.'
    case 500:
      return 'Server error. Please try again later.'
    case 502:
      return 'Service temporarily unavailable. Please try again later.'
    case 503:
      return 'Service unavailable. Please try again later.'
    case 504:
      return 'Request timeout. Please try again.'
    default:
      return 'An unexpected error occurred. Please try again.'
  }
}

/**
 * Enhanced fetch with automatic retry logic and error handling
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryConfig: Partial<RetryConfig> = {}
): Promise<Response> {
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig }
  let lastError: PolicyPageError

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      const response = await fetch(url, options)

      // If response is ok, return it
      if (response.ok) {
        return response
      }

      // Parse error from response
      const error = await parseResponseError(response)
      lastError = error

      // If not retryable or last attempt, throw error
      if (!error.retryable || attempt === config.maxAttempts) {
        throw error
      }

      // Calculate delay for next attempt
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
        config.maxDelay
      )

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay))

    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        lastError = new PolicyPageError('Network error. Please check your connection.', {
          code: 'NETWORK_ERROR',
          retryable: true,
          context: { attempt, url },
          cause: error
        })
      } else if (error instanceof PolicyPageError) {
        lastError = error
      } else {
        lastError = new PolicyPageError('An unexpected error occurred', {
          code: 'UNKNOWN_ERROR',
          retryable: false,
          context: { attempt, url },
          cause: error instanceof Error ? error : new Error(String(error))
        })
      }

      // If not retryable or last attempt, throw error
      if (!lastError.retryable || attempt === config.maxAttempts) {
        throw lastError
      }

      // Calculate delay for next attempt
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
        config.maxDelay
      )

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

/**
 * Validate filter inputs and return validation errors
 */
export function validateFilters(filters: any): string[] {
  const errors: string[] = []

  // Validate date ranges
  if (filters.expiryDateRange) {
    const { start, end } = filters.expiryDateRange
    if (start && end) {
      const startDate = new Date(start)
      const endDate = new Date(end)
      
      if (isNaN(startDate.getTime())) {
        errors.push('Invalid start date format')
      }
      
      if (isNaN(endDate.getTime())) {
        errors.push('Invalid end date format')
      }
      
      if (startDate > endDate) {
        errors.push('Start date must be before end date')
      }
      
      // Check if date range is too large (more than 10 years)
      const yearsDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
      if (yearsDiff > 10) {
        errors.push('Date range cannot exceed 10 years')
      }
    }
  }

  // Validate premium ranges
  if (filters.premiumRange) {
    const { min, max } = filters.premiumRange
    if (min !== undefined && (isNaN(min) || min < 0)) {
      errors.push('Minimum premium must be a positive number')
    }
    if (max !== undefined && (isNaN(max) || max < 0)) {
      errors.push('Maximum premium must be a positive number')
    }
    if (min !== undefined && max !== undefined && min > max) {
      errors.push('Minimum premium cannot be greater than maximum premium')
    }
    if (max !== undefined && max > 1000000) {
      errors.push('Maximum premium cannot exceed $1,000,000')
    }
  }

  // Validate commission ranges
  if (filters.commissionRange) {
    const { min, max } = filters.commissionRange
    if (min !== undefined && (isNaN(min) || min < 0)) {
      errors.push('Minimum commission must be a positive number')
    }
    if (max !== undefined && (isNaN(max) || max < 0)) {
      errors.push('Maximum commission must be a positive number')
    }
    if (min !== undefined && max !== undefined && min > max) {
      errors.push('Minimum commission cannot be greater than maximum commission')
    }
    if (max !== undefined && max > 100000) {
      errors.push('Maximum commission cannot exceed $100,000')
    }
  }

  // Validate search query
  if (filters.search && typeof filters.search === 'string') {
    if (filters.search.length > 100) {
      errors.push('Search query cannot exceed 100 characters')
    }
    
    // Check for potentially dangerous characters
    const dangerousChars = /[<>'"&]/
    if (dangerousChars.test(filters.search)) {
      errors.push('Search query contains invalid characters')
    }
  }

  // Validate arrays
  if (filters.policyTypes && !Array.isArray(filters.policyTypes)) {
    errors.push('Policy types must be an array')
  }

  if (filters.providers && !Array.isArray(filters.providers)) {
    errors.push('Providers must be an array')
  }

  return errors
}

/**
 * Sanitize search query to prevent XSS and injection attacks
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') {
    return ''
  }

  return query
    .trim()
    .replace(/[<>'"&]/g, '') // Remove potentially dangerous characters
    .substring(0, 100) // Limit length
}

/**
 * Check if the user is online
 */
export function isOnline(): boolean {
  return navigator.onLine
}

/**
 * Create an offline error
 */
export function createOfflineError(): PolicyPageError {
  return new PolicyPageError('You are currently offline. Please check your internet connection.', {
    code: 'OFFLINE_ERROR',
    retryable: true,
    context: { offline: true }
  })
}

/**
 * Format error for display to users
 */
export function formatErrorForDisplay(error: unknown): {
  title: string
  message: string
  retryable: boolean
  code?: string
} {
  if (error instanceof PolicyPageError) {
    return {
      title: getErrorTitle(error.code),
      message: error.message,
      retryable: error.retryable,
      code: error.code
    }
  }

  if (error instanceof Error) {
    return {
      title: 'Error',
      message: error.message || 'An unexpected error occurred',
      retryable: false
    }
  }

  return {
    title: 'Error',
    message: 'An unexpected error occurred',
    retryable: false
  }
}

/**
 * Get appropriate error title based on error code
 */
function getErrorTitle(code?: string): string {
  switch (code) {
    case 'NETWORK_ERROR':
      return 'Connection Error'
    case 'OFFLINE_ERROR':
      return 'Offline'
    case 'VALIDATION_ERROR':
      return 'Invalid Input'
    case 'PERMISSION_ERROR':
      return 'Permission Denied'
    case 'NOT_FOUND_ERROR':
      return 'Not Found'
    case 'SERVER_ERROR':
      return 'Server Error'
    case 'TIMEOUT_ERROR':
      return 'Request Timeout'
    case 'RATE_LIMIT_ERROR':
      return 'Too Many Requests'
    default:
      return 'Error'
  }
}

/**
 * Debounce function for search and filter operations
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

/**
 * Create a timeout promise for race conditions
 */
export function createTimeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new PolicyPageError('Request timeout', {
        code: 'TIMEOUT_ERROR',
        retryable: true,
        context: { timeout: ms }
      }))
    }, ms)
  })
}

/**
 * Race a promise with a timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 30000
): Promise<T> {
  return Promise.race([
    promise,
    createTimeoutPromise(timeoutMs)
  ])
}