import { CreatePolicyRequest, UpdatePolicyRequest, ValidationError } from '@/types';

/**
 * Validates policy form data and returns validation errors
 */
export function validatePolicyForm(data: CreatePolicyRequest | UpdatePolicyRequest): ValidationError[] {
  const errors: ValidationError[] = [];

  // Policy number validation
  if ('policyNumber' in data && data.policyNumber !== undefined) {
    if (!data.policyNumber || data.policyNumber.trim().length === 0) {
      errors.push({
        field: 'policyNumber',
        message: 'Policy number is required'
      });
    } else if (data.policyNumber.trim().length > 50) {
      errors.push({
        field: 'policyNumber',
        message: 'Policy number must be 50 characters or less'
      });
    }
  }

  // Provider validation
  if ('provider' in data && data.provider !== undefined) {
    if (!data.provider || data.provider.trim().length === 0) {
      errors.push({
        field: 'provider',
        message: 'Provider is required'
      });
    } else if (data.provider.trim().length > 100) {
      errors.push({
        field: 'provider',
        message: 'Provider name must be 100 characters or less'
      });
    }
  }

  // Premium amount validation
  if ('premiumAmount' in data && data.premiumAmount !== undefined) {
    const premiumErrors = validateAmount(data.premiumAmount, 'Premium amount');
    errors.push(...premiumErrors);
  }

  // Commission amount validation
  if ('commissionAmount' in data && data.commissionAmount !== undefined) {
    const commissionErrors = validateAmount(data.commissionAmount, 'Commission amount');
    errors.push(...commissionErrors);
  }

  // Date range validation
  if ('startDate' in data && 'expiryDate' in data && 
      data.startDate !== undefined && data.expiryDate !== undefined) {
    const dateErrors = validateDateRange(data.startDate, data.expiryDate);
    errors.push(...dateErrors);
  }

  // Individual date validations
  if ('startDate' in data && data.startDate !== undefined) {
    const startDateErrors = validateStartDate(data.startDate);
    errors.push(...startDateErrors);
  }

  if ('expiryDate' in data && data.expiryDate !== undefined) {
    const expiryDateErrors = validateExpiryDate(data.expiryDate);
    errors.push(...expiryDateErrors);
  }

  return errors;
}

/**
 * Validates that an amount is positive and has appropriate decimal precision
 */
export function validateAmount(amount: number, fieldName: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (amount === null || amount === undefined || isNaN(amount)) {
    errors.push({
      field: fieldName.toLowerCase().replace(' ', ''),
      message: `${fieldName} is required`
    });
    return errors;
  }

  if (amount <= 0) {
    errors.push({
      field: fieldName.toLowerCase().replace(' ', ''),
      message: `${fieldName} must be a positive number`
    });
  }

  // Check for appropriate decimal precision (max 2 decimal places)
  const decimalPlaces = (amount.toString().split('.')[1] || '').length;
  if (decimalPlaces > 2) {
    errors.push({
      field: fieldName.toLowerCase().replace(' ', ''),
      message: `${fieldName} cannot have more than 2 decimal places`
    });
  }

  // Check for reasonable maximum (prevent extremely large values)
  if (amount > 999999999.99) {
    errors.push({
      field: fieldName.toLowerCase().replace(' ', ''),
      message: `${fieldName} cannot exceed $999,999,999.99`
    });
  }

  return errors;
}

/**
 * Validates that start date is before expiry date
 */
export function validateDateRange(startDate: string, expiryDate: string): ValidationError[] {
  const errors: ValidationError[] = [];

  const start = new Date(startDate);
  const expiry = new Date(expiryDate);

  // Check if dates are valid
  if (isNaN(start.getTime())) {
    errors.push({
      field: 'startDate',
      message: 'Start date is invalid'
    });
  }

  if (isNaN(expiry.getTime())) {
    errors.push({
      field: 'expiryDate',
      message: 'Expiry date is invalid'
    });
  }

  // If both dates are valid, check the range
  if (!isNaN(start.getTime()) && !isNaN(expiry.getTime())) {
    if (start >= expiry) {
      errors.push({
        field: 'expiryDate',
        message: 'Expiry date must be after start date'
      });
    }

    // Check if the policy period is reasonable (not more than 50 years)
    const yearsDifference = (expiry.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
    if (yearsDifference > 50) {
      errors.push({
        field: 'expiryDate',
        message: 'Policy period cannot exceed 50 years'
      });
    }
  }

  return errors;
}

/**
 * Validates start date constraints
 */
export function validateStartDate(startDate: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!startDate || startDate.trim().length === 0) {
    errors.push({
      field: 'startDate',
      message: 'Start date is required'
    });
    return errors;
  }

  const start = new Date(startDate);
  
  if (isNaN(start.getTime())) {
    errors.push({
      field: 'startDate',
      message: 'Start date is invalid'
    });
    return errors;
  }

  // Check if start date is not more than 1 year in the future
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  if (start > oneYearFromNow) {
    errors.push({
      field: 'startDate',
      message: 'Start date cannot be more than 1 year in the future'
    });
  }

  // Check if start date is not more than 50 years in the past
  const fiftyYearsAgo = new Date();
  fiftyYearsAgo.setFullYear(fiftyYearsAgo.getFullYear() - 50);

  if (start < fiftyYearsAgo) {
    errors.push({
      field: 'startDate',
      message: 'Start date cannot be more than 50 years in the past'
    });
  }

  return errors;
}

/**
 * Validates expiry date constraints
 */
export function validateExpiryDate(expiryDate: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!expiryDate || expiryDate.trim().length === 0) {
    errors.push({
      field: 'expiryDate',
      message: 'Expiry date is required'
    });
    return errors;
  }

  const expiry = new Date(expiryDate);
  
  if (isNaN(expiry.getTime())) {
    errors.push({
      field: 'expiryDate',
      message: 'Expiry date is invalid'
    });
    return errors;
  }

  // Check if expiry date is not more than 51 years in the future (allowing for 50-year policies starting 1 year from now)
  const fiftyOneYearsFromNow = new Date();
  fiftyOneYearsFromNow.setFullYear(fiftyOneYearsFromNow.getFullYear() + 51);

  if (expiry > fiftyOneYearsFromNow) {
    errors.push({
      field: 'expiryDate',
      message: 'Expiry date cannot be more than 51 years in the future'
    });
  }

  return errors;
}

/**
 * Validates policy number uniqueness (async function for API call)
 */
export async function validatePolicyNumberUniqueness(
  policyNumber: string, 
  excludePolicyId?: string
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  if (!policyNumber || policyNumber.trim().length === 0) {
    return errors; // Skip uniqueness check if policy number is empty
  }

  try {
    const response = await fetch(`/api/policies/validate-number?policyNumber=${encodeURIComponent(policyNumber.trim())}${excludePolicyId ? `&excludeId=${excludePolicyId}` : ''}`);
    
    if (!response.ok) {
      // If API call fails, we'll skip uniqueness validation rather than blocking the user
      console.warn('Failed to validate policy number uniqueness:', response.statusText);
      return errors;
    }

    const result = await response.json();
    
    if (!result.success && result.message === 'Policy number already exists') {
      errors.push({
        field: 'policyNumber',
        message: 'This policy number is already in use'
      });
    }
  } catch (error) {
    // If network error occurs, we'll skip uniqueness validation
    console.warn('Network error during policy number validation:', error);
  }

  return errors;
}

/**
 * Checks if a policy is expiring within the specified number of days
 */
export function isPolicyExpiringSoon(expiryDate: string, daysThreshold: number = 30): boolean {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const thresholdDate = new Date();
  thresholdDate.setDate(now.getDate() + daysThreshold);

  return expiry <= thresholdDate && expiry > now;
}

/**
 * Checks if a policy has expired
 */
export function isPolicyExpired(expiryDate: string): boolean {
  const expiry = new Date(expiryDate);
  const now = new Date();
  
  return expiry <= now;
}

/**
 * Formats validation errors for display
 */
export function formatValidationErrors(errors: ValidationError[]): Record<string, string> {
  const formattedErrors: Record<string, string> = {};
  
  errors.forEach(error => {
    formattedErrors[error.field] = error.message;
  });
  
  return formattedErrors;
}

/**
 * Validates policy number format and constraints
 */
export function validatePolicyNumber(policyNumber: string): string | null {
  if (!policyNumber || policyNumber.trim().length === 0) {
    return 'Policy number is required';
  }

  const trimmed = policyNumber.trim();
  
  if (trimmed.length < 4) {
    return 'Policy number must be at least 4 characters';
  }

  if (trimmed.length > 50) {
    return 'Policy number must be less than 50 characters';
  }

  // Only allow letters, numbers, and hyphens
  if (!/^[A-Za-z0-9\-]+$/.test(trimmed)) {
    return 'Policy number can only contain letters, numbers, and hyphens';
  }

  return null;
}

/**
 * Validates policy dates
 */
export function validatePolicyDates(startDate: string, expiryDate: string): Record<string, string> {
  const errors: Record<string, string> = {};

  // Validate start date format
  const start = new Date(startDate);
  if (isNaN(start.getTime())) {
    errors.startDate = 'Invalid start date format';
    return errors;
  }

  // Validate expiry date format
  const expiry = new Date(expiryDate);
  if (isNaN(expiry.getTime())) {
    errors.expiryDate = 'Invalid expiry date format';
    return errors;
  }

  // Check if expiry is after start
  if (expiry <= start) {
    errors.expiryDate = 'Expiry date must be after start date';
  }

  // Check if start date is not too far in future
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  if (start > oneYearFromNow) {
    errors.startDate = 'Start date cannot be more than 1 year in the future';
  }

  // Check minimum policy duration (30 days)
  const thirtyDaysLater = new Date(start);
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
  if (expiry < thirtyDaysLater) {
    errors.expiryDate = 'Policy duration must be at least 30 days';
  }

  // Check maximum policy duration (5 years)
  const fiveYearsLater = new Date(start);
  fiveYearsLater.setFullYear(fiveYearsLater.getFullYear() + 5);
  if (expiry > fiveYearsLater) {
    errors.expiryDate = 'Policy duration cannot exceed 5 years';
  }

  return errors;
}

/**
 * Validates policy amounts (premium and commission)
 */
export function validatePolicyAmounts(premiumAmount: number, commissionAmount: number): Record<string, string> {
  const errors: Record<string, string> = {};

  // Validate premium amount
  if (premiumAmount <= 0) {
    errors.premiumAmount = 'Premium amount must be positive';
  } else {
    // Check decimal precision
    const premiumDecimals = (premiumAmount.toString().split('.')[1] || '').length;
    if (premiumDecimals > 2) {
      errors.premiumAmount = 'Premium amount can have at most 2 decimal places';
    }

    // Check maximum amount (1 crore rupees)
    if (premiumAmount > 10000000) {
      errors.premiumAmount = 'Premium amount cannot exceed ₹1,00,00,000';
    }
  }

  // Validate commission amount
  if (commissionAmount <= 0) {
    errors.commissionAmount = 'Commission amount must be positive';
  } else {
    // Check decimal precision
    const commissionDecimals = (commissionAmount.toString().split('.')[1] || '').length;
    if (commissionDecimals > 2) {
      errors.commissionAmount = 'Commission amount can have at most 2 decimal places';
    }

    // Check maximum amount (10 lakh rupees)
    if (commissionAmount > 1000000) {
      errors.commissionAmount = 'Commission amount cannot exceed ₹10,00,000';
    }

    // Check commission percentage (should not exceed 50% of premium)
    if (premiumAmount > 0 && commissionAmount > premiumAmount * 0.5) {
      errors.commissionAmount = 'Commission cannot exceed 50% of premium amount';
    }
  }

  return errors;
}