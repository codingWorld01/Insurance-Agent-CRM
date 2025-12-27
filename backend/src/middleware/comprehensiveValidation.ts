import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { sendErrorResponse, ValidationError, AppError } from '../utils/errorHandler';

/**
 * Enhanced rate limiting for different operations
 */
export const createRateLimiters = () => {
  // General API rate limiter
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      statusCode: 429
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        message: 'Too many requests from this IP, please try again later.',
        statusCode: 429,
        retryAfter: Math.round((req as any).rateLimit?.resetTime / 1000)
      });
    }
  });

  // Strict rate limiter for search operations
  const searchLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // Limit each IP to 60 search requests per minute
    message: {
      success: false,
      message: 'Too many search requests, please slow down.',
      statusCode: 429
    },
    skip: (req) => {
      // Skip rate limiting for queries longer than 3 characters (more specific searches)
      const query = req.query.q || req.query.search;
      return typeof query === 'string' && query.length > 3;
    },
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        message: 'Too many search requests, please slow down.',
        statusCode: 429,
        retryAfter: Math.round((req as any).rateLimit?.resetTime / 1000)
      });
    }
  });

  // Very strict rate limiter for creation operations
  const createLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20, // Limit each IP to 20 creation requests per minute
    message: {
      success: false,
      message: 'Too many creation requests, please slow down.',
      statusCode: 429
    },
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        message: 'Too many creation requests, please slow down.',
        statusCode: 429,
        retryAfter: Math.round((req as any).rateLimit?.resetTime / 1000)
      });
    }
  });

  // Moderate rate limiter for update operations
  const updateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // Limit each IP to 30 update requests per minute
    message: {
      success: false,
      message: 'Too many update requests, please slow down.',
      statusCode: 429
    },
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        message: 'Too many update requests, please slow down.',
        statusCode: 429,
        retryAfter: Math.round((req as any).rateLimit?.resetTime / 1000)
      });
    }
  });

  return {
    general: generalLimiter,
    search: searchLimiter,
    create: createLimiter,
    update: updateLimiter
  };
};

/**
 * Security validation middleware
 */
export const securityValidation = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check for common security headers
    const userAgent = req.get('User-Agent');
    if (!userAgent || userAgent.length < 10) {
      throw new ValidationError('Invalid request', [
        { field: 'headers', message: 'Invalid or missing User-Agent header' }
      ]);
    }

    // Check for suspicious patterns in query parameters
    const queryString = JSON.stringify(req.query);
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /expression\s*\(/i,
      /vbscript:/i,
      /data:text\/html/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(queryString)) {
        throw new ValidationError('Invalid request', [
          { field: 'query', message: 'Request contains potentially malicious content' }
        ]);
      }
    }

    // Check request body for suspicious content
    if (req.body && typeof req.body === 'object') {
      const bodyString = JSON.stringify(req.body);
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(bodyString)) {
          throw new ValidationError('Invalid request', [
            { field: 'body', message: 'Request body contains potentially malicious content' }
          ]);
        }
      }
    }

    next();
  } catch (error) {
    if (error instanceof ValidationError) {
      sendErrorResponse(res, error);
    } else {
      sendErrorResponse(res, new AppError('Security validation failed', 400));
    }
  }
};

/**
 * Request size validation middleware
 */
export const requestSizeValidation = (maxSizeKB: number = 100) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check Content-Length header
      const contentLength = req.get('Content-Length');
      if (contentLength) {
        const sizeInKB = parseInt(contentLength) / 1024;
        if (sizeInKB > maxSizeKB) {
          throw new ValidationError('Request too large', [
            { field: 'content', message: `Request size exceeds ${maxSizeKB}KB limit` }
          ]);
        }
      }

      // Check actual body size if available
      if (req.body) {
        const bodySize = JSON.stringify(req.body).length / 1024;
        if (bodySize > maxSizeKB) {
          throw new ValidationError('Request too large', [
            { field: 'body', message: `Request body exceeds ${maxSizeKB}KB limit` }
          ]);
        }
      }

      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        sendErrorResponse(res, error);
      } else {
        sendErrorResponse(res, new AppError('Request size validation failed', 400));
      }
    }
  };
};

/**
 * Enhanced input sanitization middleware
 */
export const inputSanitization = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Sanitize query parameters
    if (req.query) {
      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string') {
          // Remove potentially dangerous characters
          req.query[key] = value
            .replace(/[<>'"&]/g, '') // Remove HTML/XML characters
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+\s*=/gi, '') // Remove event handlers
            .trim();
        }
      }
    }

    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      sanitizeObject(req.body);
    }

    next();
  } catch (error) {
    sendErrorResponse(res, new AppError('Input sanitization failed', 400));
  }
};

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      obj[key] = value
        .replace(/[<>'"&]/g, '') // Remove HTML/XML characters
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .trim();
    } else if (typeof value === 'object' && value !== null) {
      sanitizeObject(value as Record<string, unknown>);
    }
  }
}

/**
 * Database connection validation middleware
 */
export const databaseHealthCheck = (req: Request, res: Response, next: NextFunction) => {
  // This would typically check database connectivity
  // For now, we'll just ensure the request can proceed
  next();
};

/**
 * Request logging middleware for audit purposes
 */
export const auditLogging = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const originalSend = res.send;

  // Log request details
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentLength: req.get('Content-Length'),
    query: Object.keys(req.query).length > 0 ? req.query : undefined
  });

  // Override res.send to log response details
  res.send = function(body: any) {
    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] Response ${res.statusCode} - ${duration}ms`);
    return originalSend.call(this, body);
  };

  next();
};

/**
 * Comprehensive validation middleware factory
 */
export const createComprehensiveValidation = (options: {
  enableRateLimit?: boolean;
  enableSecurity?: boolean;
  enableSanitization?: boolean;
  enableAuditLogging?: boolean;
  maxRequestSizeKB?: number;
  rateLimitType?: 'general' | 'search' | 'create' | 'update';
} = {}) => {
  const {
    enableRateLimit = true,
    enableSecurity = true,
    enableSanitization = true,
    enableAuditLogging = true,
    maxRequestSizeKB = 100,
    rateLimitType = 'general'
  } = options;

  const middlewares: Array<(req: Request, res: Response, next: NextFunction) => void> = [];

  // Add audit logging first
  if (enableAuditLogging) {
    middlewares.push(auditLogging);
  }

  // Add rate limiting
  if (enableRateLimit) {
    const rateLimiters = createRateLimiters();
    middlewares.push(rateLimiters[rateLimitType]);
  }

  // Add security validation
  if (enableSecurity) {
    middlewares.push(securityValidation);
  }

  // Add request size validation
  middlewares.push(requestSizeValidation(maxRequestSizeKB));

  // Add input sanitization
  if (enableSanitization) {
    middlewares.push(inputSanitization);
  }

  // Add database health check
  middlewares.push(databaseHealthCheck);

  return middlewares;
};

/**
 * Error boundary middleware for comprehensive error handling
 */
export const errorBoundary = (error: Error, req: Request, res: Response, next: NextFunction) => {
  // Log the error for debugging
  console.error(`[${new Date().toISOString()}] Error in ${req.method} ${req.path}:`, {
    error: error.message,
    stack: error.stack,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Send appropriate error response
  sendErrorResponse(res, error);
};

/**
 * 404 handler for unmatched routes
 */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    statusCode: 404
  });
};

/**
 * Health check endpoint middleware
 */
export const healthCheck = (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Service is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
};