import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError, ValidationError } from '../utils/errorHandler';
import { SecurityError } from './enhancedFileUploadSecurity';
import { SecurityLoggingService } from '../services/securityLoggingService';

export interface StandardErrorResponse {
  success: false;
  message: string;
  statusCode: number;
  error: {
    code: string;
    type: string;
    details?: any;
    timestamp: string;
    requestId?: string;
  };
  validation?: Array<{
    field: string;
    message: string;
    code?: string;
  }>;
  security?: {
    blocked: boolean;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    reason?: string;
  };
}

/**
 * Comprehensive error handling middleware
 */
export const comprehensiveErrorHandler = async (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Skip if response already sent
  if (res.headersSent) {
    return next(error);
  }
  // Generate unique request ID for tracking
  const requestId = req.headers['x-request-id'] as string || 
                   `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Log error details
  console.error('Error Handler:', {
    requestId,
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: sanitizeRequestBody(req.body),
    params: req.params,
    query: req.query
  });

  let errorResponse: StandardErrorResponse;

  try {
    // Handle different error types
    if (error instanceof SecurityError) {
      errorResponse = await handleSecurityError(error, req, requestId);
    } else if (error instanceof ValidationError) {
      errorResponse = handleValidationError(error, requestId);
    } else if (error instanceof AppError) {
      errorResponse = handleAppError(error, requestId);
    } else if (error instanceof ZodError) {
      errorResponse = handleZodError(error, requestId);
    } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
      errorResponse = handlePrismaError(error, requestId);
    } else if (error.name === 'MulterError') {
      errorResponse = await handleMulterError(error as any, req, requestId);
    } else if (error.name === 'JsonWebTokenError') {
      errorResponse = handleJWTError(error, requestId);
    } else if (error.name === 'TokenExpiredError') {
      errorResponse = handleTokenExpiredError(error, requestId);
    } else {
      errorResponse = handleUnknownError(error, requestId);
    }

    // Set security headers
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    });

    // Send error response
    res.status(errorResponse.statusCode).json(errorResponse);

  } catch (handlingError) {
    console.error('Error in error handler:', handlingError);
    
    // Fallback error response
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      statusCode: 500,
      error: {
        code: 'INTERNAL_ERROR',
        type: 'InternalError',
        timestamp: new Date().toISOString(),
        requestId
      }
    });
  }
};

/**
 * Handle security errors
 */
async function handleSecurityError(
  error: SecurityError,
  req: Request,
  requestId: string
): Promise<StandardErrorResponse> {
  // Log security event
  await SecurityLoggingService.logFileUploadSecurityEvent(
    req,
    error.code as any || 'SUSPICIOUS_ACTIVITY',
    {
      errorMessage: error.message,
      securityRisk: error.securityRisk,
      metadata: error.metadata
    },
    true
  );

  return {
    success: false,
    message: error.message,
    statusCode: error.statusCode,
    error: {
      code: error.code || 'SECURITY_ERROR',
      type: 'SecurityError',
      details: error.metadata,
      timestamp: new Date().toISOString(),
      requestId
    },
    security: {
      blocked: true,
      riskLevel: determineSeverityLevel(error.securityRisk),
      reason: error.securityRisk
    }
  };
}

/**
 * Handle validation errors
 */
function handleValidationError(
  error: ValidationError,
  requestId: string
): StandardErrorResponse {
  return {
    success: false,
    message: error.message,
    statusCode: error.statusCode,
    error: {
      code: 'VALIDATION_ERROR',
      type: 'ValidationError',
      timestamp: new Date().toISOString(),
      requestId
    },
    validation: error.errors.map(err => ({
      field: err.field,
      message: err.message,
      code: 'INVALID_VALUE'
    }))
  };
}

/**
 * Handle application errors
 */
function handleAppError(
  error: AppError,
  requestId: string
): StandardErrorResponse {
  return {
    success: false,
    message: error.message,
    statusCode: error.statusCode,
    error: {
      code: getErrorCode(error),
      type: error.constructor.name,
      timestamp: new Date().toISOString(),
      requestId
    }
  };
}

/**
 * Handle Zod validation errors
 */
function handleZodError(
  error: ZodError,
  requestId: string
): StandardErrorResponse {
  const validation = error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code
  }));

  return {
    success: false,
    message: 'Validation failed',
    statusCode: 400,
    error: {
      code: 'VALIDATION_ERROR',
      type: 'ZodError',
      timestamp: new Date().toISOString(),
      requestId
    },
    validation
  };
}

/**
 * Handle Prisma database errors
 */
function handlePrismaError(
  error: Prisma.PrismaClientKnownRequestError,
  requestId: string
): StandardErrorResponse {
  let message = 'Database operation failed';
  let statusCode = 500;
  let code = 'DATABASE_ERROR';

  switch (error.code) {
    case 'P2002':
      message = 'A record with this information already exists';
      statusCode = 409;
      code = 'DUPLICATE_RECORD';
      break;
    case 'P2025':
      message = 'Record not found';
      statusCode = 404;
      code = 'RECORD_NOT_FOUND';
      break;
    case 'P2003':
      message = 'Invalid reference to related record';
      statusCode = 400;
      code = 'FOREIGN_KEY_CONSTRAINT';
      break;
    case 'P2014':
      message = 'Required relationship missing';
      statusCode = 400;
      code = 'REQUIRED_RELATION_MISSING';
      break;
  }

  return {
    success: false,
    message,
    statusCode,
    error: {
      code,
      type: 'DatabaseError',
      details: {
        prismaCode: error.code,
        meta: error.meta
      },
      timestamp: new Date().toISOString(),
      requestId
    }
  };
}

/**
 * Handle Multer file upload errors
 */
async function handleMulterError(
  error: any,
  req: Request,
  requestId: string
): Promise<StandardErrorResponse> {
  let message = 'File upload error';
  let code = 'UPLOAD_ERROR';

  switch (error.code) {
    case 'LIMIT_FILE_SIZE':
      message = 'File size exceeds maximum allowed limit';
      code = 'FILE_TOO_LARGE';
      break;
    case 'LIMIT_FILE_COUNT':
      message = 'Too many files uploaded';
      code = 'TOO_MANY_FILES';
      break;
    case 'LIMIT_FIELD_KEY':
      message = 'Field name too long';
      code = 'FIELD_NAME_TOO_LONG';
      break;
    case 'LIMIT_FIELD_VALUE':
      message = 'Field value too long';
      code = 'FIELD_VALUE_TOO_LONG';
      break;
    case 'LIMIT_FIELD_COUNT':
      message = 'Too many fields';
      code = 'TOO_MANY_FIELDS';
      break;
    case 'LIMIT_UNEXPECTED_FILE':
      message = 'Unexpected file field';
      code = 'UNEXPECTED_FILE';
      break;
  }

  // Log as security event if it's a potential abuse
  if (['LIMIT_FILE_SIZE', 'LIMIT_FILE_COUNT', 'TOO_MANY_FIELDS'].includes(code)) {
    await SecurityLoggingService.logFileUploadSecurityEvent(
      req,
      'SUSPICIOUS_ACTIVITY',
      {
        multerError: error.code,
        errorMessage: message
      },
      true
    );
  }

  return {
    success: false,
    message,
    statusCode: 400,
    error: {
      code,
      type: 'FileUploadError',
      details: {
        multerCode: error.code,
        field: error.field,
        limit: error.limit
      },
      timestamp: new Date().toISOString(),
      requestId
    }
  };
}

/**
 * Handle JWT errors
 */
function handleJWTError(
  error: Error,
  requestId: string
): StandardErrorResponse {
  return {
    success: false,
    message: 'Invalid authentication token',
    statusCode: 401,
    error: {
      code: 'INVALID_TOKEN',
      type: 'AuthenticationError',
      timestamp: new Date().toISOString(),
      requestId
    }
  };
}

/**
 * Handle token expired errors
 */
function handleTokenExpiredError(
  error: Error,
  requestId: string
): StandardErrorResponse {
  return {
    success: false,
    message: 'Authentication token has expired',
    statusCode: 401,
    error: {
      code: 'TOKEN_EXPIRED',
      type: 'AuthenticationError',
      timestamp: new Date().toISOString(),
      requestId
    }
  };
}

/**
 * Handle unknown errors
 */
function handleUnknownError(
  error: Error,
  requestId: string
): StandardErrorResponse {
  return {
    success: false,
    message: 'An unexpected error occurred',
    statusCode: 500,
    error: {
      code: 'INTERNAL_ERROR',
      type: 'UnknownError',
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : undefined,
      timestamp: new Date().toISOString(),
      requestId
    }
  };
}

/**
 * Get error code from AppError
 */
function getErrorCode(error: AppError): string {
  switch (error.constructor.name) {
    case 'NotFoundError':
      return 'NOT_FOUND';
    case 'ConflictError':
      return 'CONFLICT';
    case 'UnauthorizedError':
      return 'UNAUTHORIZED';
    case 'ForbiddenError':
      return 'FORBIDDEN';
    default:
      return 'APPLICATION_ERROR';
  }
}

/**
 * Determine security severity level
 */
function determineSeverityLevel(securityRisk?: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (!securityRisk) return 'LOW';
  
  const risk = securityRisk.toLowerCase();
  
  if (risk.includes('malware') || risk.includes('virus') || risk.includes('executable')) {
    return 'CRITICAL';
  }
  
  if (risk.includes('injection') || risk.includes('script') || risk.includes('breach')) {
    return 'HIGH';
  }
  
  if (risk.includes('suspicious') || risk.includes('abuse') || risk.includes('rate limit')) {
    return 'MEDIUM';
  }
  
  return 'LOW';
}

/**
 * Sanitize request body for logging
 */
function sanitizeRequestBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sanitized = { ...body };
  const sensitiveFields = [
    'password', 'token', 'secret', 'key', 'authorization',
    'cookie', 'session', 'csrf', 'api_key', 'access_token'
  ];

  function sanitizeObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        if (sensitiveFields.some(field => lowerKey.includes(field))) {
          result[key] = '[REDACTED]';
        } else {
          result[key] = sanitizeObject(value);
        }
      }
      return result;
    }
    
    return obj;
  }

  return sanitizeObject(sanitized);
}

/**
 * Middleware to add request ID to all requests
 */
export const addRequestId = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = req.headers['x-request-id'] as string || 
                   `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  req.headers['x-request-id'] = requestId;
  res.set('X-Request-ID', requestId);
  
  next();
};

/**
 * Middleware to log request/response for debugging
 */
export const requestResponseLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'];

  // Log request
  console.log('REQUEST:', {
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    timestamp: new Date().toISOString()
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any): Response {
    const duration = Date.now() - startTime;
    
    console.log('RESPONSE:', {
      requestId,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentType: res.get('Content-Type'),
      contentLength: res.get('Content-Length'),
      timestamp: new Date().toISOString()
    });

    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

/**
 * Health check endpoint error handler
 */
export const healthCheckErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Health check error:', error);
  
  res.status(503).json({
    success: false,
    message: 'Service unavailable',
    statusCode: 503,
    error: {
      code: 'SERVICE_UNAVAILABLE',
      type: 'HealthCheckError',
      timestamp: new Date().toISOString()
    }
  });
};