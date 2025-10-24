/**
 * Enhanced error handling utilities specifically for policy template system
 * Provides comprehensive validation, error parsing, and user-friendly error messages
 */

export interface PolicyTemplateError extends Error {
  code?: string;
  status?: number;
  field?: string;
  retryable?: boolean;
  context?: Record<string, unknown>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
}

export interface NetworkRetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: NetworkRetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2
};

/**
 * Policy Template specific error class
 */
export class PolicyTemplateValidationError extends Error {
  public readonly field?: string;
  public readonly code?: string;
  public readonly retryable: boolean;

  constructor(message: string, field?: string, code?: string, retryable = false) {
    super(message);
    this.name = 'PolicyTemplateValidationError';
    this.field = field;
    this.code = code;
    this.retryable = retryable;
  }
}

/**
 * Policy Instance specific error class
 */
export class PolicyInstanceValidationError extends Error {
  public readonly field?: string;
  public readonly code?: string;
  public readonly retryable: boolean;

  constructor(message: string, field?: string, code?: string, retryable = false) {
    super(message);
    this.name = 'PolicyInstanceValidationError';
    this.field = field;
    this.code = code;
    this.retryable = retryable;
  }
}

/**
 * Comprehensive policy template validation
 */
export function validatePolicyTemplate(data: {
  policyNumber: string;
  policyType: string;
  provider: string;
  description?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  // Policy number validation
  if (!data.policyNumber?.trim()) {
    errors.policyNumber = 'Policy number is required';
  } else {
    const policyNumber = data.policyNumber.trim();
    
    if (policyNumber.length < 3) {
      errors.policyNumber = 'Policy number must be at least 3 characters';
    } else if (policyNumber.length > 50) {
      errors.policyNumber = 'Policy number must be less than 50 characters';
    } else if (!/^[A-Za-z0-9\-_]+$/.test(policyNumber)) {
      errors.policyNumber = 'Policy number can only contain letters, numbers, hyphens, and underscores';
    } else {
      // Check for potential issues
      if (/(.)\1{3,}/.test(policyNumber)) {
        warnings.policyNumber = 'Policy number has repeated characters - please verify';
      }
      if (policyNumber.toLowerCase().includes('test') || policyNumber.toLowerCase().includes('example')) {
        warnings.policyNumber = 'Policy number appears to be a test value';
      }
    }
  }

  // Policy type validation
  if (!data.policyType) {
    errors.policyType = 'Policy type is required';
  } else if (!['Life', 'Health', 'Auto', 'Home', 'Business'].includes(data.policyType)) {
    errors.policyType = 'Invalid policy type selected';
  }

  // Provider validation
  if (!data.provider?.trim()) {
    errors.provider = 'Provider is required';
  } else {
    const provider = data.provider.trim();
    
    if (provider.length < 2) {
      errors.provider = 'Provider name must be at least 2 characters';
    } else if (provider.length > 100) {
      errors.provider = 'Provider name must be less than 100 characters';
    } else if (!/^[a-zA-Z0-9\s\-&.,()]+$/.test(provider)) {
      errors.provider = 'Provider name contains invalid characters';
    } else {
      // Check for potential issues
      if (provider.toLowerCase().includes('test') || provider.toLowerCase().includes('example')) {
        warnings.provider = 'Provider name appears to be a test value';
      }
    }
  }

  // Description validation
  if (data.description && data.description.length > 500) {
    errors.description = 'Description must be less than 500 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings
  };
}

/**
 * Comprehensive policy instance validation
 */
export function validatePolicyInstance(data: {
  policyTemplateId: string;
  premiumAmount: number;
  startDate: string;
  durationMonths?: number;
  expiryDate?: string;
  commissionAmount: number;
}): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  // Policy template ID validation
  if (!data.policyTemplateId) {
    errors.policyTemplateId = 'Policy template is required';
  } else if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.policyTemplateId)) {
    errors.policyTemplateId = 'Invalid policy template ID format';
  }

  // Premium amount validation
  if (data.premiumAmount === undefined || data.premiumAmount === null) {
    errors.premiumAmount = 'Premium amount is required';
  } else if (isNaN(data.premiumAmount)) {
    errors.premiumAmount = 'Premium amount must be a valid number';
  } else if (data.premiumAmount <= 0) {
    errors.premiumAmount = 'Premium amount must be greater than 0';
  } else if (data.premiumAmount > 10000000) {
    errors.premiumAmount = 'Premium amount cannot exceed $10,000,000';
  } else {
    // Business rule warnings
    if (data.premiumAmount < 100) {
      warnings.premiumAmount = 'Premium amount seems unusually low - please verify';
    } else if (data.premiumAmount > 500000) {
      warnings.premiumAmount = 'Premium amount is very high - may require additional approval';
    }
  }

  // Start date validation
  if (!data.startDate) {
    errors.startDate = 'Start date is required';
  } else {
    const startDate = new Date(data.startDate);
    if (isNaN(startDate.getTime())) {
      errors.startDate = 'Start date must be a valid date';
    } else {
      const today = new Date();
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

      if (startDate > oneYearFromNow) {
        errors.startDate = 'Start date cannot be more than 1 year in the future';
      } else if (startDate < twoYearsAgo) {
        errors.startDate = 'Start date cannot be more than 2 years in the past';
      } else {
        // Warnings for unusual dates
        const diffDays = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 90) {
          warnings.startDate = 'Start date is more than 90 days in the future';
        } else if (diffDays < -365) {
          warnings.startDate = 'Start date is more than 1 year in the past';
        }
      }
    }
  }

  // Duration validation (if provided)
  if (data.durationMonths !== undefined) {
    if (isNaN(data.durationMonths)) {
      errors.durationMonths = 'Duration must be a valid number';
    } else if (data.durationMonths < 1) {
      errors.durationMonths = 'Duration must be at least 1 month';
    } else if (data.durationMonths > 120) {
      errors.durationMonths = 'Duration cannot exceed 120 months (10 years)';
    } else {
      // Business rule warnings
      if (data.durationMonths < 6) {
        warnings.durationMonths = 'Policy duration less than 6 months is unusual';
      } else if (data.durationMonths > 60) {
        warnings.durationMonths = 'Policy duration exceeds 5 years';
      }
    }
  }

  // Expiry date validation (if provided)
  if (data.expiryDate) {
    const expiryDate = new Date(data.expiryDate);
    if (isNaN(expiryDate.getTime())) {
      errors.expiryDate = 'Expiry date must be a valid date';
    } else if (data.startDate) {
      const startDate = new Date(data.startDate);
      if (!isNaN(startDate.getTime()) && expiryDate <= startDate) {
        errors.expiryDate = 'Expiry date must be after start date';
      } else {
        const tenYearsFromStart = new Date(startDate);
        tenYearsFromStart.setFullYear(tenYearsFromStart.getFullYear() + 10);
        if (expiryDate > tenYearsFromStart) {
          errors.expiryDate = 'Expiry date cannot be more than 10 years from start date';
        }
      }
    }
  }

  // Commission amount validation
  if (data.commissionAmount === undefined || data.commissionAmount === null) {
    errors.commissionAmount = 'Commission amount is required';
  } else if (isNaN(data.commissionAmount)) {
    errors.commissionAmount = 'Commission amount must be a valid number';
  } else if (data.commissionAmount < 0) {
    errors.commissionAmount = 'Commission amount cannot be negative';
  } else if (data.commissionAmount > 1000000) {
    errors.commissionAmount = 'Commission amount cannot exceed $1,000,000';
  } else if (data.premiumAmount && !isNaN(data.premiumAmount) && data.commissionAmount > data.premiumAmount) {
    errors.commissionAmount = 'Commission amount cannot exceed premium amount';
  } else {
    // Business rule warnings
    if (data.premiumAmount && !isNaN(data.premiumAmount)) {
      const commissionPercentage = (data.commissionAmount / data.premiumAmount) * 100;
      if (commissionPercentage > 50) {
        warnings.commissionAmount = 'Commission percentage exceeds 50% of premium';
      } else if (commissionPercentage < 1 && data.commissionAmount > 0) {
        warnings.commissionAmount = 'Commission percentage seems unusually low';
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings
  };
}

/**
 * Parse API error response and extract meaningful error information
 */
export function parseApiError(error: unknown): {
  message: string;
  field?: string;
  code?: string;
  retryable: boolean;
  details?: Record<string, string>;
} {
  // Handle network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      message: 'Network error. Please check your internet connection.',
      code: 'NETWORK_ERROR',
      retryable: true
    };
  }

  // Handle Response objects
  if (error instanceof Response) {
    return {
      message: getStatusMessage(error.status),
      code: `HTTP_${error.status}`,
      retryable: error.status >= 500 || error.status === 408 || error.status === 429
    };
  }

  // Handle structured API errors
  if (error && typeof error === 'object') {
    const errorObj = error as Record<string, unknown>;
    const message = (errorObj.message as string) || 'An unexpected error occurred';
    const code = (errorObj.code as string) || (errorObj.error as string);
    const status = (errorObj.status as number) || (errorObj.statusCode as number);
    
    // Extract field-specific errors
    const details: Record<string, string> = {};
    if (errorObj.errors && Array.isArray(errorObj.errors)) {
      errorObj.errors.forEach((err: unknown) => {
        if (err && typeof err === 'object') {
          const errObj = err as Record<string, unknown>;
          if (errObj.field && errObj.message && typeof errObj.field === 'string' && typeof errObj.message === 'string') {
            details[errObj.field] = errObj.message;
          }
        }
      });
    }

    return {
      message,
      code,
      retryable: status ? (status >= 500 || status === 408 || status === 429) : false,
      details: Object.keys(details).length > 0 ? details : undefined
    };
  }

  // Handle Error objects
  if (error instanceof Error) {
    return {
      message: error.message || 'An unexpected error occurred',
      retryable: false
    };
  }

  // Fallback for unknown error types
  return {
    message: 'An unexpected error occurred',
    retryable: false
  };
}

/**
 * Get user-friendly error messages based on HTTP status codes
 */
function getStatusMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input and try again.';
    case 401:
      return 'Your session has expired. Please log in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 408:
      return 'Request timeout. Please try again.';
    case 409:
      return 'There was a conflict with your request. This may be due to duplicate data.';
    case 422:
      return 'Invalid data provided. Please check your input.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Server error. Please try again later.';
    case 502:
      return 'Service temporarily unavailable. Please try again later.';
    case 503:
      return 'Service unavailable. Please try again later.';
    case 504:
      return 'Request timeout. Please try again.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Enhanced fetch with retry logic and comprehensive error handling
 */
export async function fetchWithRetryAndValidation(
  url: string,
  options: RequestInit = {},
  retryConfig: Partial<NetworkRetryConfig> = {}
): Promise<Response> {
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  let lastError: Error;

  // Validate URL
  try {
    new URL(url, window.location.origin);
  } catch {
    throw new PolicyTemplateValidationError('Invalid URL provided', 'url', 'INVALID_URL');
  }

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // If response is ok, return it
      if (response.ok) {
        return response;
      }

      // Parse error from response
      let errorData: Record<string, unknown> = {};
      try {
        errorData = await response.json();
      } catch {
        // If JSON parsing fails, use status-based error
        errorData = { message: getStatusMessage(response.status) };
      }

      const error = new PolicyTemplateValidationError(
        (errorData.message as string) || getStatusMessage(response.status),
        errorData.field as string,
        (errorData.code as string) || `HTTP_${response.status}`,
        response.status >= 500 || response.status === 408 || response.status === 429
      );

      lastError = error;

      // If not retryable or last attempt, throw error
      if (!error.retryable || attempt === config.maxAttempts) {
        throw error;
      }

      // Calculate delay for next attempt
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
        config.maxDelay
      );

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));

    } catch (error) {
      // Handle AbortError (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        lastError = new PolicyTemplateValidationError(
          'Request timeout. Please try again.',
          undefined,
          'TIMEOUT_ERROR',
          true
        );
      }
      // Handle network errors
      else if (error instanceof TypeError && error.message.includes('fetch')) {
        lastError = new PolicyTemplateValidationError(
          'Network error. Please check your connection.',
          undefined,
          'NETWORK_ERROR',
          true
        );
      }
      // Handle our custom errors
      else if (error instanceof PolicyTemplateValidationError) {
        lastError = error;
      }
      // Handle unknown errors
      else {
        lastError = new PolicyTemplateValidationError(
          'An unexpected error occurred',
          undefined,
          'UNKNOWN_ERROR',
          false
        );
      }

      // If not retryable or last attempt, throw error
      if (!lastError.retryable || attempt === config.maxAttempts) {
        throw lastError;
      }

      // Calculate delay for next attempt
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
        config.maxDelay
      );

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Validate search query for security and performance
 */
export function validateSearchQuery(query: string): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  if (!query) {
    return { isValid: true, errors, warnings };
  }

  const trimmedQuery = query.trim();

  // Length validation
  if (trimmedQuery.length < 2) {
    errors.search = 'Search query must be at least 2 characters long';
  } else if (trimmedQuery.length > 100) {
    errors.search = 'Search query cannot exceed 100 characters';
  }

  // Security validation - check for potentially dangerous characters
  if (/[<>'"&]/.test(trimmedQuery)) {
    errors.search = 'Search query contains invalid characters';
  }

  // Performance validation - check for very broad searches
  if (trimmedQuery.length === 1) {
    warnings.search = 'Single character searches may return many results';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings
  };
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(
  errors: Record<string, string>,
  warnings: Record<string, string> = {}
): {
  hasErrors: boolean;
  hasWarnings: boolean;
  errorMessages: string[];
  warningMessages: string[];
  fieldErrors: Record<string, string>;
  fieldWarnings: Record<string, string>;
} {
  return {
    hasErrors: Object.keys(errors).length > 0,
    hasWarnings: Object.keys(warnings).length > 0,
    errorMessages: Object.values(errors),
    warningMessages: Object.values(warnings),
    fieldErrors: errors,
    fieldWarnings: warnings
  };
}

/**
 * Debounce function for validation operations
 */
export function debounceValidation<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}