import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { sendErrorResponse, ValidationError } from '../utils/errorHandler';

/**
 * Enhanced validation middleware specifically for policy template system
 */

// Policy Template validation schemas with comprehensive rules
export const createPolicyTemplateSchema = z.object({
  policyNumber: z.string()
    .min(1, 'Policy number is required')
    .max(50, 'Policy number must be less than 50 characters')
    .regex(/^[A-Za-z0-9\-_]+$/, 'Policy number can only contain letters, numbers, hyphens, and underscores')
    .transform(val => val.trim()),
  policyType: z.enum(['Life', 'Health', 'Auto', 'Home', 'Business'], {
    errorMap: () => ({ message: 'Policy type must be one of: Life, Health, Auto, Home, Business' })
  }),
  provider: z.string()
    .min(1, 'Insurance provider is required')
    .min(2, 'Provider name must be at least 2 characters')
    .max(100, 'Provider name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-&.,()]+$/, 'Provider name contains invalid characters')
    .transform(val => val.trim()),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .transform(val => val?.trim() || undefined)
});

export const updatePolicyTemplateSchema = createPolicyTemplateSchema.partial();

export const policyTemplateQuerySchema = z.object({
  page: z.string()
    .optional()
    .transform(val => {
      const num = parseInt(val || '1');
      return isNaN(num) || num < 1 ? 1 : num;
    }),
  limit: z.string()
    .optional()
    .transform(val => {
      const num = parseInt(val || '50');
      return isNaN(num) || num < 1 ? 50 : Math.min(num, 100);
    }),
  search: z.string()
    .optional()
    .transform(val => val?.trim())
    .refine(val => !val || val.length <= 100, 'Search query cannot exceed 100 characters')
    .refine(val => !val || !/[<>'"&]/.test(val), 'Search query contains invalid characters'),
  policyTypes: z.string()
    .optional()
    .transform(val => val?.split(',').filter(Boolean))
    .refine(val => !val || val.every(type => ['Life', 'Health', 'Auto', 'Home', 'Business'].includes(type)), 
      'Invalid policy type in filter'),
  providers: z.string()
    .optional()
    .transform(val => val?.split(',').filter(Boolean))
    .refine(val => !val || val.every(provider => provider.length <= 100), 
      'Provider name too long in filter'),
  hasInstances: z.string()
    .optional()
    .transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
  sortField: z.enum(['policyNumber', 'policyType', 'provider', 'createdAt', 'instanceCount'])
    .optional()
    .default('policyNumber'),
  sortDirection: z.enum(['asc', 'desc'])
    .optional()
    .default('asc'),
  includeStats: z.string()
    .optional()
    .transform(val => val === 'true')
});

export const policyTemplateSearchSchema = z.object({
  q: z.string()
    .min(1, 'Search query is required')
    .max(100, 'Search query cannot exceed 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_.]+$/, 'Search query contains invalid characters')
    .transform(val => val.trim()),
  excludeClientId: z.string()
    .uuid('Invalid client ID format')
    .optional(),
  limit: z.string()
    .optional()
    .transform(val => {
      const num = parseInt(val || '20');
      return isNaN(num) || num < 1 ? 20 : Math.min(num, 50);
    })
});

// Policy Instance validation schemas with comprehensive rules
export const createPolicyInstanceSchema = z.object({
  policyTemplateId: z.string()
    .uuid('Invalid policy template ID format'),
  premiumAmount: z.number({
    required_error: 'Premium amount is required',
    invalid_type_error: 'Premium amount must be a number'
  })
    .positive('Premium amount must be greater than 0')
    .max(10000000, 'Premium amount cannot exceed $10,000,000')
    .multipleOf(0.01, 'Premium amount must have at most 2 decimal places'),
  startDate: z.string()
    .min(1, 'Start date is required')
    .refine((date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }, 'Start date must be a valid date')
    .refine((date) => {
      const parsed = new Date(date);
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      return parsed <= oneYearFromNow;
    }, 'Start date cannot be more than 1 year in the future')
    .refine((date) => {
      const parsed = new Date(date);
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      return parsed >= twoYearsAgo;
    }, 'Start date cannot be more than 2 years in the past'),
  durationMonths: z.number({
    required_error: 'Duration is required',
    invalid_type_error: 'Duration must be a number'
  })
    .int('Duration must be a whole number')
    .min(1, 'Duration must be at least 1 month')
    .max(120, 'Duration cannot exceed 120 months (10 years)'),
  commissionAmount: z.number({
    required_error: 'Commission amount is required',
    invalid_type_error: 'Commission amount must be a number'
  })
    .nonnegative('Commission amount cannot be negative')
    .max(1000000, 'Commission amount cannot exceed $1,000,000')
    .multipleOf(0.01, 'Commission amount must have at most 2 decimal places')
}).refine((data) => {
  return data.commissionAmount <= data.premiumAmount;
}, {
  message: 'Commission amount cannot exceed premium amount',
  path: ['commissionAmount']
});

export const updatePolicyInstanceSchema = z.object({
  premiumAmount: z.number()
    .positive('Premium amount must be greater than 0')
    .max(10000000, 'Premium amount cannot exceed $10,000,000')
    .multipleOf(0.01, 'Premium amount must have at most 2 decimal places')
    .optional(),
  startDate: z.string()
    .refine((date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }, 'Start date must be a valid date')
    .refine((date) => {
      const parsed = new Date(date);
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      return parsed <= oneYearFromNow;
    }, 'Start date cannot be more than 1 year in the future')
    .optional(),
  durationMonths: z.number()
    .int('Duration must be a whole number')
    .min(1, 'Duration must be at least 1 month')
    .max(120, 'Duration cannot exceed 120 months (10 years)')
    .optional(),
  expiryDate: z.string()
    .refine((date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }, 'Expiry date must be a valid date')
    .refine((date) => {
      const parsed = new Date(date);
      const tenYearsFromNow = new Date();
      tenYearsFromNow.setFullYear(tenYearsFromNow.getFullYear() + 10);
      return parsed <= tenYearsFromNow;
    }, 'Expiry date cannot be more than 10 years in the future')
    .optional(),
  commissionAmount: z.number()
    .nonnegative('Commission amount cannot be negative')
    .max(1000000, 'Commission amount cannot exceed $1,000,000')
    .multipleOf(0.01, 'Commission amount must have at most 2 decimal places')
    .optional(),
  status: z.enum(['Active', 'Expired'], {
    errorMap: () => ({ message: 'Status must be either Active or Expired' })
  }).optional()
}).refine((data) => {
  // Cross-field validation
  if (data.startDate && data.expiryDate) {
    const startDate = new Date(data.startDate);
    const expiryDate = new Date(data.expiryDate);
    return startDate < expiryDate;
  }
  return true;
}, {
  message: 'Expiry date must be after start date',
  path: ['expiryDate']
}).refine((data) => {
  // Commission vs premium validation
  if (data.premiumAmount !== undefined && data.commissionAmount !== undefined) {
    return data.commissionAmount <= data.premiumAmount;
  }
  return true;
}, {
  message: 'Commission amount cannot exceed premium amount',
  path: ['commissionAmount']
});

export const policyInstanceStatusSchema = z.object({
  status: z.enum(['Active', 'Expired'], {
    errorMap: () => ({ message: 'Status must be either Active or Expired' })
  })
});

export const validateAssociationSchema = z.object({
  clientId: z.string()
    .uuid('Invalid client ID format'),
  policyTemplateId: z.string()
    .uuid('Invalid policy template ID format'),
  excludeInstanceId: z.string()
    .uuid('Invalid instance ID format')
    .optional()
});

export const calculateExpirySchema = z.object({
  startDate: z.string()
    .min(1, 'Start date is required')
    .refine((date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }, 'Start date must be a valid date'),
  durationMonths: z.number({
    required_error: 'Duration is required',
    invalid_type_error: 'Duration must be a number'
  })
    .int('Duration must be a whole number')
    .min(1, 'Duration must be at least 1 month')
    .max(120, 'Duration cannot exceed 120 months (10 years)')
});

/**
 * Enhanced validation middleware factory with detailed error reporting
 */
export const validatePolicyTemplateRequest = (schema: {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validationErrors: Array<{ field: string; message: string }> = [];

      // Validate request body
      if (schema.body) {
        try {
          req.body = schema.body.parse(req.body);
        } catch (error) {
          if (error instanceof z.ZodError) {
            error.errors.forEach(err => {
              validationErrors.push({
                field: err.path.join('.'),
                message: err.message
              });
            });
          } else {
            validationErrors.push({
              field: 'body',
              message: 'Invalid request body format'
            });
          }
        }
      }

      // Validate request parameters
      if (schema.params) {
        try {
          req.params = schema.params.parse(req.params);
        } catch (error) {
          if (error instanceof z.ZodError) {
            error.errors.forEach(err => {
              validationErrors.push({
                field: `params.${err.path.join('.')}`,
                message: err.message
              });
            });
          } else {
            validationErrors.push({
              field: 'params',
              message: 'Invalid request parameters'
            });
          }
        }
      }

      // Validate query parameters
      if (schema.query) {
        try {
          req.query = schema.query.parse(req.query);
        } catch (error) {
          if (error instanceof z.ZodError) {
            error.errors.forEach(err => {
              validationErrors.push({
                field: `query.${err.path.join('.')}`,
                message: err.message
              });
            });
          } else {
            validationErrors.push({
              field: 'query',
              message: 'Invalid query parameters'
            });
          }
        }
      }

      // If there are validation errors, return them
      if (validationErrors.length > 0) {
        const validationError = new ValidationError('Request validation failed', validationErrors);
        sendErrorResponse(res, validationError);
        return;
      }

      next();
    } catch (error) {
      console.error('Validation middleware error:', error);
      sendErrorResponse(res, new Error('Internal server error during validation'));
    }
  };
};

/**
 * Business logic validation middleware
 */
export const validateBusinessRules = {
  /**
   * Validate policy template business rules
   */
  policyTemplate: (req: Request, res: Response, next: NextFunction) => {
    try {
      const { policyNumber, provider } = req.body;
      const errors: Array<{ field: string; message: string }> = [];

      // Policy number format validation
      if (policyNumber) {
        // Check for common policy number patterns
        if (policyNumber.length < 3) {
          errors.push({ field: 'policyNumber', message: 'Policy number is too short' });
        }
        
        // Check for sequential characters (potential typo)
        if (/(.)\1{4,}/.test(policyNumber)) {
          errors.push({ field: 'policyNumber', message: 'Policy number appears to have repeated characters' });
        }
      }

      // Provider name validation
      if (provider) {
        // Check for common provider name issues
        if (provider.toLowerCase().includes('test') || provider.toLowerCase().includes('example')) {
          errors.push({ field: 'provider', message: 'Provider name appears to be a test value' });
        }
      }

      if (errors.length > 0) {
        const validationError = new ValidationError('Business rule validation failed', errors);
        sendErrorResponse(res, validationError);
        return;
      }

      next();
    } catch (error) {
      console.error('Business rule validation error:', error);
      next(error);
    }
  },

  /**
   * Validate policy instance business rules
   */
  policyInstance: (req: Request, res: Response, next: NextFunction) => {
    try {
      const { premiumAmount, commissionAmount, startDate, durationMonths } = req.body;
      const errors: Array<{ field: string; message: string }> = [];

      // Premium amount business rules
      if (premiumAmount !== undefined) {
        if (premiumAmount < 100) {
          errors.push({ field: 'premiumAmount', message: 'Premium amount seems unusually low' });
        }
        if (premiumAmount > 500000) {
          errors.push({ field: 'premiumAmount', message: 'Premium amount seems unusually high and may require approval' });
        }
      }

      // Commission percentage validation
      if (premiumAmount !== undefined && commissionAmount !== undefined) {
        const commissionPercentage = (commissionAmount / premiumAmount) * 100;
        if (commissionPercentage > 50) {
          errors.push({ field: 'commissionAmount', message: 'Commission percentage exceeds 50% of premium' });
        }
        if (commissionPercentage < 1 && commissionAmount > 0) {
          errors.push({ field: 'commissionAmount', message: 'Commission percentage seems unusually low' });
        }
      }

      // Date validation
      if (startDate) {
        const start = new Date(startDate);
        const today = new Date();
        const diffDays = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays > 90) {
          errors.push({ field: 'startDate', message: 'Start date is more than 90 days in the future' });
        }
      }

      // Duration validation
      if (durationMonths !== undefined) {
        if (durationMonths < 6) {
          errors.push({ field: 'durationMonths', message: 'Policy duration less than 6 months is unusual' });
        }
        if (durationMonths > 60) {
          errors.push({ field: 'durationMonths', message: 'Policy duration exceeds 5 years' });
        }
      }

      if (errors.length > 0) {
        const validationError = new ValidationError('Business rule validation failed', errors);
        sendErrorResponse(res, validationError);
        return;
      }

      next();
    } catch (error) {
      console.error('Business rule validation error:', error);
      next(error);
    }
  }
};

/**
 * Rate limiting validation for search operations
 */
export const validateSearchRateLimit = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;
    
    // Prevent very short search queries that might cause performance issues
    if (q && typeof q === 'string' && q.trim().length === 1) {
      const validationError = new ValidationError('Search query too short', [
        { field: 'q', message: 'Search query must be at least 2 characters long' }
      ]);
      sendErrorResponse(res, validationError);
      return;
    }

    next();
  } catch (error) {
    console.error('Search rate limit validation error:', error);
    next(error);
  }
};