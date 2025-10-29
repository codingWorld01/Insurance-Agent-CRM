import { Request, Response, NextFunction } from 'express';
import { SecurityError } from './enhancedFileUploadSecurity';
import { SecurityLoggingService } from '../services/securityLoggingService';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  maxFileSize: number;
  maxTotalSize: number;
  blockDuration?: number;
  skipSuccessfulRequests?: boolean;
}

interface ClientRateLimit {
  requests: number;
  totalSize: number;
  firstRequest: number;
  resetTime: number;
  blockedUntil?: number;
  violations: number;
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, ClientRateLimit>();

// Different rate limits for different upload types
const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  document: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50,
    maxFileSize: 10 * 1024 * 1024, // 10MB per file
    maxTotalSize: 100 * 1024 * 1024, // 100MB total per hour
    blockDuration: 15 * 60 * 1000 // 15 minutes
  },
  profileImage: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
    maxFileSize: 5 * 1024 * 1024, // 5MB per file
    maxTotalSize: 50 * 1024 * 1024, // 50MB total per hour
    blockDuration: 10 * 60 * 1000 // 10 minutes
  },
  bulk: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    maxFileSize: 10 * 1024 * 1024, // 10MB per file
    maxTotalSize: 200 * 1024 * 1024, // 200MB total per hour
    blockDuration: 30 * 60 * 1000 // 30 minutes
  }
};

/**
 * Enhanced rate limiting middleware for file uploads
 */
export function createUploadRateLimit(uploadType: keyof typeof RATE_LIMIT_CONFIGS) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const config = RATE_LIMIT_CONFIGS[uploadType];
      if (!config) {
        throw new Error(`Unknown upload type: ${uploadType}`);
      }

      const clientId = getClientIdentifier(req);
      const now = Date.now();
      
      // Get or create client rate limit data
      let clientData = rateLimitStore.get(clientId);
      
      // Check if client is currently blocked
      if (clientData?.blockedUntil && now < clientData.blockedUntil) {
        const remainingTime = Math.ceil((clientData.blockedUntil - now) / 1000 / 60);
        
        await SecurityLoggingService.logRateLimitEvent(
          req,
          `upload_${uploadType}_blocked`,
          clientData.requests,
          config.maxRequests,
          config.windowMs
        );

        throw new SecurityError(
          `Upload blocked due to rate limit violation. Try again in ${remainingTime} minutes.`,
          429,
          {
            code: 'UPLOAD_BLOCKED',
            securityRisk: 'Rate limit abuse detected',
            metadata: {
              uploadType,
              remainingTime,
              violations: clientData.violations
            }
          }
        );
      }

      // Reset or initialize if window expired
      if (!clientData || now > clientData.resetTime) {
        clientData = {
          requests: 0,
          totalSize: 0,
          firstRequest: now,
          resetTime: now + config.windowMs,
          violations: clientData?.violations || 0
        };
        rateLimitStore.set(clientId, clientData);
      }

      // Calculate file sizes
      const fileSize = calculateRequestFileSize(req);
      const newTotalSize = clientData.totalSize + fileSize;

      // Check request count limit
      if (clientData.requests >= config.maxRequests) {
        clientData.violations++;
        
        // Block client if too many violations
        if (clientData.violations >= 3) {
          clientData.blockedUntil = now + (config.blockDuration || 15 * 60 * 1000);
          
          await SecurityLoggingService.logRateLimitEvent(
            req,
            `upload_${uploadType}_abuse`,
            clientData.requests,
            config.maxRequests,
            config.windowMs
          );
        }

        throw new SecurityError(
          `Upload rate limit exceeded. Maximum ${config.maxRequests} requests per hour.`,
          429,
          {
            code: 'RATE_LIMIT_EXCEEDED',
            securityRisk: 'Upload rate limit exceeded',
            metadata: {
              uploadType,
              currentRequests: clientData.requests,
              maxRequests: config.maxRequests,
              violations: clientData.violations
            }
          }
        );
      }

      // Check total size limit
      if (newTotalSize > config.maxTotalSize) {
        clientData.violations++;
        
        await SecurityLoggingService.logRateLimitEvent(
          req,
          `upload_${uploadType}_size_exceeded`,
          newTotalSize,
          config.maxTotalSize,
          config.windowMs
        );

        throw new SecurityError(
          `Upload size limit exceeded. Maximum ${Math.round(config.maxTotalSize / 1024 / 1024)}MB per hour.`,
          429,
          {
            code: 'SIZE_LIMIT_EXCEEDED',
            securityRisk: 'Upload size limit exceeded',
            metadata: {
              uploadType,
              currentSize: newTotalSize,
              maxSize: config.maxTotalSize,
              fileSize
            }
          }
        );
      }

      // Check individual file size
      if (fileSize > config.maxFileSize) {
        await SecurityLoggingService.logFileUploadSecurityEvent(
          req,
          'FILE_UPLOAD_BLOCKED',
          {
            reason: 'File size exceeds limit',
            fileSize,
            maxFileSize: config.maxFileSize,
            uploadType
          },
          true
        );

        throw new SecurityError(
          `File size exceeds maximum allowed size of ${Math.round(config.maxFileSize / 1024 / 1024)}MB.`,
          400,
          {
            code: 'FILE_TOO_LARGE',
            securityRisk: 'Oversized file upload attempt',
            metadata: {
              uploadType,
              fileSize,
              maxFileSize: config.maxFileSize
            }
          }
        );
      }

      // Update counters
      clientData.requests++;
      clientData.totalSize = newTotalSize;

      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, config.maxRequests - clientData.requests).toString(),
        'X-RateLimit-Reset': Math.ceil(clientData.resetTime / 1000).toString(),
        'X-RateLimit-Size-Limit': config.maxTotalSize.toString(),
        'X-RateLimit-Size-Remaining': Math.max(0, config.maxTotalSize - clientData.totalSize).toString()
      });

      // Log suspicious activity if approaching limits
      if (clientData.requests > config.maxRequests * 0.8) {
        await SecurityLoggingService.logSuspiciousActivity(
          req,
          'high_upload_frequency',
          {
            uploadType,
            requests: clientData.requests,
            maxRequests: config.maxRequests,
            percentage: Math.round((clientData.requests / config.maxRequests) * 100)
          }
        );
      }

      next();

    } catch (error) {
      next(error);
    }
  };
}

/**
 * Adaptive rate limiting based on user behavior
 */
export function createAdaptiveUploadRateLimit(uploadType: keyof typeof RATE_LIMIT_CONFIGS) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clientId = getClientIdentifier(req);
      const suspiciousCheck = await SecurityLoggingService.checkSuspiciousIP(
        req.ip || 'unknown'
      );

      // Adjust rate limits based on risk score
      let config = { ...RATE_LIMIT_CONFIGS[uploadType] };
      
      if (suspiciousCheck.isSuspicious) {
        // Reduce limits for suspicious IPs
        config.maxRequests = Math.floor(config.maxRequests * 0.5);
        config.maxTotalSize = Math.floor(config.maxTotalSize * 0.5);
        config.blockDuration = (config.blockDuration || 15 * 60 * 1000) * 2;

        await SecurityLoggingService.logSuspiciousActivity(
          req,
          'suspicious_ip_upload_attempt',
          {
            riskScore: suspiciousCheck.riskScore,
            reasons: suspiciousCheck.reasons,
            adjustedLimits: {
              maxRequests: config.maxRequests,
              maxTotalSize: config.maxTotalSize
            }
          }
        );
      }

      // Apply the rate limit with adjusted config
      const rateLimitMiddleware = createCustomRateLimit(config);
      await rateLimitMiddleware(req, res, next);

    } catch (error) {
      next(error);
    }
  };
}

/**
 * Create custom rate limit with specific config
 */
function createCustomRateLimit(config: RateLimitConfig) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const clientId = getClientIdentifier(req);
    const now = Date.now();
    
    let clientData = rateLimitStore.get(clientId);
    
    if (!clientData || now > clientData.resetTime) {
      clientData = {
        requests: 0,
        totalSize: 0,
        firstRequest: now,
        resetTime: now + config.windowMs,
        violations: clientData?.violations || 0
      };
      rateLimitStore.set(clientId, clientData);
    }

    const fileSize = calculateRequestFileSize(req);
    
    if (clientData.requests >= config.maxRequests) {
      throw new SecurityError(
        'Rate limit exceeded',
        429,
        {
          code: 'RATE_LIMIT_EXCEEDED',
          metadata: { requests: clientData.requests, maxRequests: config.maxRequests }
        }
      );
    }

    if (clientData.totalSize + fileSize > config.maxTotalSize) {
      throw new SecurityError(
        'Size limit exceeded',
        429,
        {
          code: 'SIZE_LIMIT_EXCEEDED',
          metadata: { totalSize: clientData.totalSize + fileSize, maxSize: config.maxTotalSize }
        }
      );
    }

    clientData.requests++;
    clientData.totalSize += fileSize;

    next();
  };
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(req: Request): string {
  // Use user ID if authenticated, otherwise use IP + User-Agent hash
  const userId = (req as any).user?.id;
  if (userId) {
    return `user:${userId}`;
  }

  const ip = req.ip || (req as any).connection?.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  const hash = require('crypto')
    .createHash('md5')
    .update(`${ip}:${userAgent}`)
    .digest('hex')
    .substring(0, 8);
  
  return `ip:${ip}:${hash}`;
}

/**
 * Calculate total file size from request
 */
function calculateRequestFileSize(req: Request): number {
  let totalSize = 0;

  // Single file
  if (req.file) {
    totalSize += req.file.size;
  }

  // Multiple files
  if (req.files) {
    if (Array.isArray(req.files)) {
      totalSize += req.files.reduce((sum, file) => sum + file.size, 0);
    } else {
      // Files object with field names
      Object.values(req.files).forEach(files => {
        if (Array.isArray(files)) {
          totalSize += files.reduce((sum, file) => sum + file.size, 0);
        } else if (files && typeof files === 'object' && 'size' in files) {
          totalSize += (files as Express.Multer.File).size;
        }
      });
    }
  }

  return totalSize;
}

/**
 * Clean up expired rate limit entries
 */
export function cleanupExpiredRateLimits(): void {
  const now = Date.now();
  
  for (const [clientId, data] of rateLimitStore.entries()) {
    // Remove if window expired and not blocked
    if (now > data.resetTime && (!data.blockedUntil || now > data.blockedUntil)) {
      rateLimitStore.delete(clientId);
    }
  }
}

/**
 * Get rate limit status for a client
 */
export function getRateLimitStatus(
  req: Request,
  uploadType: keyof typeof RATE_LIMIT_CONFIGS
): {
  requests: number;
  maxRequests: number;
  totalSize: number;
  maxTotalSize: number;
  resetTime: number;
  isBlocked: boolean;
  blockedUntil?: number;
} {
  const clientId = getClientIdentifier(req);
  const config = RATE_LIMIT_CONFIGS[uploadType];
  const clientData = rateLimitStore.get(clientId);
  const now = Date.now();

  if (!clientData || now > clientData.resetTime) {
    return {
      requests: 0,
      maxRequests: config.maxRequests,
      totalSize: 0,
      maxTotalSize: config.maxTotalSize,
      resetTime: now + config.windowMs,
      isBlocked: false
    };
  }

  return {
    requests: clientData.requests,
    maxRequests: config.maxRequests,
    totalSize: clientData.totalSize,
    maxTotalSize: config.maxTotalSize,
    resetTime: clientData.resetTime,
    isBlocked: !!(clientData.blockedUntil && now < clientData.blockedUntil),
    blockedUntil: clientData.blockedUntil
  };
}

// Clean up expired entries every 5 minutes
setInterval(cleanupExpiredRateLimits, 5 * 60 * 1000);

// Predefined rate limiters for different upload types
export const uploadRateLimiters = {
  document: createUploadRateLimit('document'),
  profileImage: createUploadRateLimit('profileImage'),
  bulk: createUploadRateLimit('bulk'),
  adaptive: {
    document: createAdaptiveUploadRateLimit('document'),
    profileImage: createAdaptiveUploadRateLimit('profileImage'),
    bulk: createAdaptiveUploadRateLimit('bulk')
  }
};