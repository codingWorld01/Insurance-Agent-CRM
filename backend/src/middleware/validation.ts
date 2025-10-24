import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { sendErrorResponse, ValidationError } from '../utils/errorHandler';

/**
 * Generic validation middleware factory
 */
export const validateRequest = (schema: {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate request body
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }

      // Validate request parameters
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }

      // Validate query parameters
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        const validationError = new ValidationError('Request validation failed', validationErrors);
        sendErrorResponse(res, validationError);
        return;
      }

      sendErrorResponse(res, new Error('Internal server error during validation'));
    }
  };
};

// Common validation schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

export const leadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Phone must be a valid 10-digit Indian mobile number'),
  insuranceInterest: z.enum(['Life', 'Health', 'Auto', 'Home', 'Business']),
  status: z.enum(['New', 'Contacted', 'Qualified', 'Won', 'Lost']).optional(),
  priority: z.enum(['Hot', 'Warm', 'Cold']).optional(),
  notes: z.string().optional()
});

export const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Phone must be a valid 10-digit Indian mobile number'),
  dateOfBirth: z.string().refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime()) && parsed < new Date();
  }, 'Date of birth must be a valid date in the past'),
  age: z.number().int().min(1, 'Age must be at least 1').max(120, 'Age must be less than 120').optional(),
  address: z.string().optional()
});

export const uuidSchema = z.object({
  id: z.string().uuid('Invalid ID format')
});

export const paginationSchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).optional(),
  limit: z.string().transform(val => Math.min(parseInt(val) || 50, 100)).optional(),
  search: z.string().optional(),
  status: z.string().optional()
});

const basePolicySchema = z.object({
  policyNumber: z.string()
    .min(1, 'Policy number is required')
    .max(50, 'Policy number must be less than 50 characters')
    .regex(/^[A-Za-z0-9\-_]+$/, 'Policy number can only contain letters, numbers, hyphens, and underscores'),
  policyType: z.enum(['Life', 'Health', 'Auto', 'Home', 'Business'], {
    errorMap: () => ({ message: 'Policy type must be one of: Life, Health, Auto, Home, Business' })
  }),
  provider: z.string()
    .min(1, 'Insurance provider is required')
    .max(100, 'Provider name must be less than 100 characters')
    .trim(),
  premiumAmount: z.number({
    required_error: 'Premium amount is required',
    invalid_type_error: 'Premium amount must be a number'
  })
    .positive('Premium amount must be greater than 0')
    .max(10000000, 'Premium amount cannot exceed ₹1,00,00,000')
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
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      return parsed >= oneYearAgo;
    }, 'Start date cannot be more than 1 year in the past'),
  expiryDate: z.string()
    .min(1, 'Expiry date is required')
    .refine((date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }, 'Expiry date must be a valid date')
    .refine((date) => {
      const parsed = new Date(date);
      const tenYearsFromNow = new Date();
      tenYearsFromNow.setFullYear(tenYearsFromNow.getFullYear() + 10);
      return parsed <= tenYearsFromNow;
    }, 'Expiry date cannot be more than 10 years in the future'),
  commissionAmount: z.number({
    required_error: 'Commission amount is required',
    invalid_type_error: 'Commission amount must be a number'
  })
    .positive('Commission amount must be greater than 0')
    .max(1000000, 'Commission amount cannot exceed ₹10,00,000')
    .multipleOf(0.01, 'Commission amount must have at most 2 decimal places'),
  status: z.enum(['Active', 'Expired'], {
    errorMap: () => ({ message: 'Status must be either Active or Expired' })
  }).optional()
});

export const policySchema = basePolicySchema.refine((data) => {
  const startDate = new Date(data.startDate);
  const expiryDate = new Date(data.expiryDate);
  return startDate < expiryDate;
}, {
  message: 'Expiry date must be after start date',
  path: ['expiryDate']
});

export const updatePolicySchema = basePolicySchema.partial().refine((data) => {
  if (data.startDate && data.expiryDate) {
    const startDate = new Date(data.startDate);
    const expiryDate = new Date(data.expiryDate);
    return startDate < expiryDate;
  }
  return true;
}, {
  message: 'Expiry date must be after start date',
  path: ['expiryDate']
});

export const policyQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).optional(),
  limit: z.string().transform(val => Math.min(parseInt(val) || 50, 100)).optional(),
  clientId: z.string().uuid('Invalid client ID format').optional(),
  status: z.enum(['Active', 'Expired']).optional()
});

// Policy Template validation schemas
export const policyTemplateSchema = z.object({
  policyNumber: z.string()
    .min(1, 'Policy number is required')
    .max(50, 'Policy number must be less than 50 characters')
    .regex(/^[A-Za-z0-9\-_]+$/, 'Policy number can only contain letters, numbers, hyphens, and underscores'),
  policyType: z.enum(['Life', 'Health', 'Auto', 'Home', 'Business'], {
    errorMap: () => ({ message: 'Policy type must be one of: Life, Health, Auto, Home, Business' })
  }),
  provider: z.string()
    .min(1, 'Insurance provider is required')
    .max(100, 'Provider name must be less than 100 characters')
    .trim(),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
});

export const updatePolicyTemplateSchema = policyTemplateSchema.partial();

export const policyTemplateQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).optional(),
  limit: z.string().transform(val => Math.min(parseInt(val) || 50, 100)).optional(),
  search: z.string().optional(),
  policyTypes: z.string().optional(),
  providers: z.string().optional(),
  hasInstances: z.string().optional(),
  sortField: z.string().optional(),
  sortDirection: z.enum(['asc', 'desc']).optional(),
  includeStats: z.string().optional()
});

export const policyTemplateSearchSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  excludeClientId: z.string().uuid('Invalid client ID format').optional(),
  limit: z.string().transform(val => Math.min(parseInt(val) || 20, 50)).optional()
});

// Policy Instance validation schemas
export const policyInstanceSchema = z.object({
  policyTemplateId: z.string().uuid('Invalid policy template ID format'),
  premiumAmount: z.number({
    required_error: 'Premium amount is required',
    invalid_type_error: 'Premium amount must be a number'
  })
    .positive('Premium amount must be greater than 0')
    .max(10000000, 'Premium amount cannot exceed ₹1,00,00,000')
    .multipleOf(0.01, 'Premium amount must have at most 2 decimal places'),
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
    .max(120, 'Duration cannot exceed 120 months (10 years)'),
  commissionAmount: z.number({
    required_error: 'Commission amount is required',
    invalid_type_error: 'Commission amount must be a number'
  })
    .positive('Commission amount must be greater than 0')
    .max(1000000, 'Commission amount cannot exceed ₹10,00,000')
    .multipleOf(0.01, 'Commission amount must have at most 2 decimal places')
});

export const updatePolicyInstanceSchema = z.object({
  premiumAmount: z.number()
    .positive('Premium amount must be greater than 0')
    .max(10000000, 'Premium amount cannot exceed ₹1,00,00,000')
    .multipleOf(0.01, 'Premium amount must have at most 2 decimal places')
    .optional(),
  startDate: z.string()
    .refine((date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }, 'Start date must be a valid date')
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
    .optional(),
  commissionAmount: z.number()
    .positive('Commission amount must be greater than 0')
    .max(1000000, 'Commission amount cannot exceed ₹10,00,000')
    .multipleOf(0.01, 'Commission amount must have at most 2 decimal places')
    .optional(),
  status: z.enum(['Active', 'Expired'], {
    errorMap: () => ({ message: 'Status must be either Active or Expired' })
  }).optional()
}).refine((data) => {
  if (data.startDate && data.expiryDate) {
    const startDate = new Date(data.startDate);
    const expiryDate = new Date(data.expiryDate);
    return startDate < expiryDate;
  }
  return true;
}, {
  message: 'Expiry date must be after start date',
  path: ['expiryDate']
});