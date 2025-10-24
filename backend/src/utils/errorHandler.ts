import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

export interface ApiError {
  success: false;
  message: string;
  statusCode: number;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public errors: Array<{ field: string; message: string }>;

  constructor(message: string, errors: Array<{ field: string; message: string }>) {
    super(message, 400);
    this.errors = errors;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403);
  }
}

/**
 * Handle Prisma database errors
 */
export function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): AppError {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      const target = error.meta?.target as string[] | undefined;
      if (target?.includes('policyNumber')) {
        return new ConflictError('A policy with this policy number already exists');
      }
      if (target?.includes('email')) {
        return new ConflictError('A user with this email already exists');
      }
      return new ConflictError('A record with this information already exists');

    case 'P2025':
      // Record not found
      return new NotFoundError('Record');

    case 'P2003':
      // Foreign key constraint violation
      return new ValidationError('Invalid reference to related record', [
        { field: 'reference', message: 'Referenced record does not exist' }
      ]);

    case 'P2014':
      // Required relation violation
      return new ValidationError('Required relationship missing', [
        { field: 'relation', message: 'Required related record is missing' }
      ]);

    case 'P2021':
      // Table does not exist
      return new AppError('Database configuration error', 500);

    case 'P2022':
      // Column does not exist
      return new AppError('Database schema error', 500);

    default:
      console.error('Unhandled Prisma error:', error);
      return new AppError('Database operation failed', 500);
  }
}

/**
 * Handle Zod validation errors
 */
export function handleZodError(error: z.ZodError): ValidationError {
  const errors = error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }));

  return new ValidationError('Validation failed', errors);
}

/**
 * Send standardized error response
 */
export function sendErrorResponse(res: Response, error: AppError | Error): void {
  // Handle known application errors
  if (error instanceof ValidationError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      statusCode: error.statusCode,
      errors: error.errors
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      statusCode: error.statusCode
    });
    return;
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const appError = handlePrismaError(error);
    sendErrorResponse(res, appError);
    return;
  }

  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    const validationError = handleZodError(error);
    sendErrorResponse(res, validationError);
    return;
  }

  // Handle unknown errors
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    statusCode: 500
  });
}

/**
 * Policy-specific error messages
 */
export const PolicyErrors = {
  NOT_FOUND: () => new NotFoundError('Policy'),
  CLIENT_NOT_FOUND: () => new NotFoundError('Client'),
  DUPLICATE_POLICY_NUMBER: () => new ConflictError('A policy with this policy number already exists'),
  INVALID_DATE_RANGE: () => new ValidationError('Invalid date range', [
    { field: 'expiryDate', message: 'Expiry date must be after start date' }
  ]),
  INVALID_PREMIUM: () => new ValidationError('Invalid premium amount', [
    { field: 'premiumAmount', message: 'Premium amount must be a positive number' }
  ]),
  INVALID_COMMISSION: () => new ValidationError('Invalid commission amount', [
    { field: 'commissionAmount', message: 'Commission amount must be a positive number' }
  ]),
  POLICY_HAS_DEPENDENCIES: () => new ConflictError('Cannot delete policy with active claims or dependencies'),
  UNAUTHORIZED_ACCESS: () => new ForbiddenError('You do not have permission to access this policy'),
  INVALID_STATUS_TRANSITION: (from: string, to: string) => 
    new ValidationError('Invalid status transition', [
      { field: 'status', message: `Cannot change status from ${from} to ${to}` }
    ])
};

/**
 * Policy Template specific error messages
 */
export const PolicyTemplateErrors = {
  NOT_FOUND: () => new NotFoundError('Policy Template'),
  DUPLICATE_POLICY_NUMBER: () => new ConflictError('A policy template with this policy number already exists'),
  INVALID_POLICY_TYPE: () => new ValidationError('Invalid policy type', [
    { field: 'policyType', message: 'Policy type must be one of: Life, Health, Auto, Home, Business' }
  ]),
  INVALID_PROVIDER: () => new ValidationError('Invalid provider', [
    { field: 'provider', message: 'Provider name is required and must be valid' }
  ]),
  HAS_ACTIVE_INSTANCES: (count: number) => new ConflictError(
    `Cannot delete policy template with ${count} active policy instances. Please remove all instances first.`
  ),
  UNAUTHORIZED_ACCESS: () => new ForbiddenError('You do not have permission to access this policy template')
};

/**
 * Policy Instance specific error messages
 */
export const PolicyInstanceErrors = {
  NOT_FOUND: () => new NotFoundError('Policy Instance'),
  TEMPLATE_NOT_FOUND: () => new NotFoundError('Policy Template'),
  CLIENT_NOT_FOUND: () => new NotFoundError('Client'),
  DUPLICATE_ASSOCIATION: () => new ConflictError('Client already has a policy instance for this template'),
  INVALID_DATE_RANGE: () => new ValidationError('Invalid date range', [
    { field: 'expiryDate', message: 'Expiry date must be after start date' }
  ]),
  INVALID_PREMIUM: () => new ValidationError('Invalid premium amount', [
    { field: 'premiumAmount', message: 'Premium amount must be greater than 0' }
  ]),
  INVALID_COMMISSION: () => new ValidationError('Invalid commission amount', [
    { field: 'commissionAmount', message: 'Commission amount cannot be negative' }
  ]),
  COMMISSION_EXCEEDS_PREMIUM: () => new ValidationError('Invalid commission amount', [
    { field: 'commissionAmount', message: 'Commission amount cannot exceed premium amount' }
  ]),
  INVALID_DURATION: () => new ValidationError('Invalid duration', [
    { field: 'durationMonths', message: 'Duration must be between 1 and 120 months' }
  ]),
  UNAUTHORIZED_ACCESS: () => new ForbiddenError('You do not have permission to access this policy instance')
};

/**
 * Async error handler wrapper
 */
export const asyncHandler = (fn: Function) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};