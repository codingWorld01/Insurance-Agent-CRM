import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errorHandler';

// Error codes and their e, ValidationError, AppError, PolicyTemplateErrors, PolicyInstanceErrors } from '../utils/errorHandler';

/**
 * Enhanced error handling middleware for policy template system
 */

interface ErrorContext {
  operation: string;
  resource: string;
  userId?: string;
  clientId?: string;
  templateId?: string;
  instanceId?: string;
}

/**
 * Comprehensive error handler with context-aware error messages
 */
export const enhancedErrorHandler = (context: Partial<ErrorContext> = {}) => {
  return (error: Error, req: Request, res: Response, next: NextFunction): void => {
    // Log error with context
    console.error(`[${new Date().toISOString()}] Enhanced Error Handler:`, {
      error: error.message,
      stack: error.stack,
      context,
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: req.method !== 'GET' ? req.body : undefined,
      query: req.query
    });

    // Handle specific error types with enhanced messages
    if (error instanceof ValidationError) {
      // Add context to validation errors
      const enhancedErrors = error.errors.map(err => ({
        ...err,
        context: context.resource || 'unknown'
      }));

      res.status(error.statusCode).json({
        success: false,
        message: getContextualErrorMessage(error.message, context),
        statusCode: error.statusCode,
        errors: enhancedErrors,
        code: 'VALIDATION_ERROR',
        retryable: false
      });
      return;
    }

    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: getContextualErrorMessage(error.message, context),
        statusCode: error.statusCode,
        code: getErrorCode(error),
        retryable: isRetryableError(error)
      });
      return;
    }

    // Handle Prisma errors with enhanced context
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const enhancedError = handleEnhancedPrismaError(error, context);
      sendErrorResponse(res, enhancedError);
      return;
    }

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const validationError = new ValidationError(
        getContextualErrorMessage('Validation failed', context),
        error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      );
      sendErrorResponse(res, validationError);
      return;
    }

    // Handle network and timeout errors
    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      res.status(408).json({
        success: false,
        message: 'Request timeout. Please try again.',
        statusCode: 408,
        code: 'TIMEOUT_ERROR',
        retryable: true
      });
      return;
    }

    // Handle rate limiting errors
    if (error.message.includes('Too many requests')) {
      res.status(429).json({
        success: false,
        message: 'Too many requests. Please slow down and try again.',
        statusCode: 429,
        code: 'RATE_LIMIT_ERROR',
        retryable: true,
        retryAfter: 60 // seconds
      });
      return;
    }

    // Handle unknown errors
    console.error('Unhandled error in enhanced error handler:', error);
    res.status(500).json({
      success: false,
      message: getContextualErrorMessage('Internal server error', context),
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      retryable: true
    });
  };
};

/**
 * Enhanced Prisma error handler with context
 */
function handleEnhancedPrismaError(error: Prisma.PrismaClientKnownRequestError, context: Partial<ErrorContext>): AppError {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      const target = error.meta?.target as string[] | undefined;
      
      if (target?.includes('policyNumber')) {
        return PolicyTemplateErrors.DUPLICATE_POLICY_NUMBER();
      }
      
      if (target?.includes('policyTemplateId') && target?.includes('clientId')) {
        return PolicyInstanceErrors.DUPLICATE_ASSOCIATION();
      }
      
      if (target?.includes('email')) {
        return new ValidationError('Email already exists', [
          { field: 'email', message: 'A user with this email already exists' }
        ]);
      }
      
      return new ValidationError('Duplicate entry', [
        { field: 'unique', message: `A record with this ${target?.join(', ') || 'information'} already exists` }
      ]);

    case 'P2025':
      // Record not found - provide context-specific messages
      if (context.resource === 'policyTemplate') {
        return PolicyTemplateErrors.NOT_FOUND();
      }
      if (context.resource === 'policyInstance') {
        return PolicyInstanceErrors.NOT_FOUND();
      }
      if (context.resource === 'client') {
        return PolicyInstanceErrors.CLIENT_NOT_FOUND();
      }
      return new AppError('Record not found', 404);

    case 'P2003':
      // Foreign key constraint violation
      if (error.meta?.field_name === 'policyTemplateId') {
        return PolicyInstanceErrors.TEMPLATE_NOT_FOUND();
      }
      if (error.meta?.field_name === 'clientId') {
        return PolicyInstanceErrors.CLIENT_NOT_FOUND();
      }
      return new ValidationError('Invalid reference', [
        { field: 'reference', message: 'Referenced record does not exist' }
      ]);

    case 'P2014':
      // Required relation violation
      return new ValidationError('Missing required relationship', [
        { field: 'relation', message: 'Required related record is missing' }
      ]);

    case 'P2021':
      // Table does not exist
      return new AppError('Database configuration error - table not found', 500);

    case 'P2022':
      // Column does not exist
      return new AppError('Database schema error - column not found', 500);

    case 'P2024':
      // Connection timeout
      return new AppError('Database connection timeout. Please try again.', 503);

    default:
      console.error('Unhandled Prisma error:', error);
      return new AppError('Database operation failed', 500);
  }
}

/**
 * Get contextual error message based on operation and resource
 */
function getContextualErrorMessage(message: string, context: Partial<ErrorContext>): string {
  const { operation, resource } = context;
  
  if (!operation || !resource) {
    return message;
  }

  const resourceName = resource === 'policyTemplate' ? 'policy template' : 
                      resource === 'policyInstance' ? 'policy instance' : 
                      resource;

  switch (operation) {
    case 'create':
      return `Failed to create ${resourceName}: ${message}`;
    case 'update':
      return `Failed to update ${resourceName}: ${message}`;
    case 'delete':
      return `Failed to delete ${resourceName}: ${message}`;
    case 'fetch':
    case 'get':
      return `Failed to retrieve ${resourceName}: ${message}`;
    case 'search':
      return `Failed to search ${resourceName}s: ${message}`;
    default:
      return message;
  }
}

/**
 * Get error code based on error type
 */
function getErrorCode(error: AppError): string {
  if (error instanceof ValidationError) {
    return 'VALIDATION_ERROR';
  }
  
  switch (error.statusCode) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 422:
      return 'UNPROCESSABLE_ENTITY';
    case 429:
      return 'RATE_LIMIT_ERROR';
    case 500:
      return 'INTERNAL_ERROR';
    case 502:
      return 'BAD_GATEWAY';
    case 503:
      return 'SERVICE_UNAVAILABLE';
    case 504:
      return 'GATEWAY_TIMEOUT';
    default:
      return 'UNKNOWN_ERROR';
  }
}

/**
 * Determine if error is retryable
 */
function isRetryableError(error: AppError): boolean {
  const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
  return retryableStatusCodes.includes(error.statusCode);
}

/**
 * Request validation middleware with enhanced error reporting
 */
export const validateRequest = (schema: {
  body?: z.ZodSchema;
  params?: z.ZodSchema;
  query?: z.ZodSchema;
}, context: Partial<ErrorContext> = {}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validationErrors: Array<{ field: string; message: string }> = [];

      // Validate request body
      if (schema.body && req.body !== undefined) {
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

      // If there are validation errors, return them with context
      if (validationErrors.length > 0) {
        const contextualMessage = getContextualErrorMessage('Request validation failed', context);
        const validationError = new ValidationError(contextualMessage, validationErrors);
        sendErrorResponse(res, validationError);
        return;
      }

      next();
    } catch (error) {
      console.error('Request validation middleware error:', error);
      const contextualMessage = getContextualErrorMessage('Internal server error during validation', context);
      sendErrorResponse(res, new AppError(contextualMessage, 500));
    }
  };
};

/**
 * Business rule validation middleware
 */
export const validateBusinessRules = (
  validationFn: (req: Request) => Promise<void> | void,
  context: Partial<ErrorContext> = {}
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await validationFn(req);
      next();
    } catch (error) {
      if (error instanceof ValidationError || error instanceof AppError) {
        // Enhance error message with context
        const contextualMessage = getContextualErrorMessage(error.message, context);
        if (error instanceof ValidationError) {
          const enhancedError = new ValidationError(contextualMessage, error.errors);
          sendErrorResponse(res, enhancedError);
        } else {
          const enhancedError = new AppError(contextualMessage, error.statusCode);
          sendErrorResponse(res, enhancedError);
        }
      } else {
        console.error('Business rule validation error:', error);
        const contextualMessage = getContextualErrorMessage('Business rule validation failed', context);
        sendErrorResponse(res, new AppError(contextualMessage, 400));
      }
    }
  };
};

/**
 * Async operation wrapper with enhanced error handling
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
  context: Partial<ErrorContext> = {}
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      // Add context to request for error handler
      (req as any).errorContext = context;
      next(error);
    });
  };
};

/**
 * Rate limiting error handler
 */
export const rateLimitErrorHandler = (req: Request, res: Response): void => {
  res.status(429).json({
    success: false,
    message: 'Too many requests from this IP. Please try again later.',
    statusCode: 429,
    code: 'RATE_LIMIT_ERROR',
    retryable: true,
    retryAfter: Math.round((req as any).rateLimit?.resetTime / 1000) || 60
  });
};

/**
 * Security validation error handler
 */
export const securityErrorHandler = (error: Error, req: Request, res: Response): void => {
  console.warn(`Security validation failed for ${req.ip}:`, {
    error: error.message,
    method: req.method,
    path: req.path,
    userAgent: req.get('User-Agent'),
    query: req.query
  });

  res.status(400).json({
    success: false,
    message: 'Request contains invalid or potentially malicious content',
    statusCode: 400,
    code: 'SECURITY_ERROR',
    retryable: false
  });
};

/**
 * Database connection error handler
 */
export const databaseErrorHandler = (error: Error, req: Request, res: Response): void => {
  console.error('Database connection error:', error);
  
  res.status(503).json({
    success: false,
    message: 'Database service temporarily unavailable. Please try again later.',
    statusCode: 503,
    code: 'DATABASE_ERROR',
    retryable: true
  });
};

/**
 * Timeout error handler
 */
export const timeoutErrorHandler = (req: Request, res: Response): void => {
  res.status(408).json({
    success: false,
    message: 'Request timeout. The operation took too long to complete.',
    statusCode: 408,
    code: 'TIMEOUT_ERROR',
    retryable: true
  });
};