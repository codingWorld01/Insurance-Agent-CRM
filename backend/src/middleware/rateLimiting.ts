/**
 * Rate limiting middleware for policy page operations
 */

import { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/errorHandler'

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  message?: string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore: RateLimitStore = {}

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  Object.keys(rateLimitStore).forEach(key => {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key]
    }
  })
}, 60000) // Clean up every minute

/**
 * Create a rate limiting middleware
 */
export function createRateLimit(config: RateLimitConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    const identifier = getIdentifier(req)
    const now = Date.now()
    const windowStart = now - config.windowMs
    
    // Get or create rate limit entry
    let entry = rateLimitStore[identifier]
    
    if (!entry || entry.resetTime < now) {
      // Create new entry or reset expired entry
      entry = {
        count: 0,
        resetTime: now + config.windowMs
      }
      rateLimitStore[identifier] = entry
    }
    
    // Check if limit exceeded
    if (entry.count >= config.maxRequests) {
      const resetTimeSeconds = Math.ceil((entry.resetTime - now) / 1000)
      
      res.status(429).json({
        success: false,
        message: config.message || 'Too many requests, please try again later',
        statusCode: 429,
        retryAfter: resetTimeSeconds
      })
      return
    }
    
    // Increment counter
    entry.count++
    
    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': config.maxRequests.toString(),
      'X-RateLimit-Remaining': (config.maxRequests - entry.count).toString(),
      'X-RateLimit-Reset': Math.ceil(entry.resetTime / 1000).toString()
    })
    
    next()
  }
}

/**
 * Get unique identifier for rate limiting
 */
function getIdentifier(req: Request): string {
  // Use user ID if authenticated, otherwise use IP address
  const userId = req.user?.id
  const ip = req.ip || req.connection.remoteAddress || 'unknown'
  
  return userId ? `user:${userId}` : `ip:${ip}`
}

// Predefined rate limiters for different operations
export const policyPageRateLimiters = {
  // General policy page requests
  general: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: 'Too many requests to policy page, please slow down'
  }),
  
  // Search operations
  search: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    message: 'Too many search requests, please wait before searching again'
  }),
  
  // Bulk operations
  bulkOperations: createRateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 10,
    message: 'Too many bulk operations, please wait before trying again'
  }),
  
  // Export operations
  export: createRateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxRequests: 5,
    message: 'Too many export requests, please wait before exporting again'
  }),
  
  // Policy creation/updates
  modifications: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
    message: 'Too many policy modifications, please slow down'
  })
}

/**
 * Advanced rate limiter with different limits for different user types
 */
export function createAdvancedRateLimit(configs: {
  default: RateLimitConfig
  premium?: RateLimitConfig
  admin?: RateLimitConfig
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userType = getUserType(req)
    let config = configs.default
    
    if (userType === 'admin' && configs.admin) {
      config = configs.admin
    } else if (userType === 'premium' && configs.premium) {
      config = configs.premium
    }
    
    return createRateLimit(config)(req, res, next)
  }
}

/**
 * Get user type for advanced rate limiting
 */
function getUserType(req: Request): 'default' | 'premium' | 'admin' {
  const user = req.user
  
  if (!user) return 'default'
  
  // Check user role/type (adjust based on your user model)
  if (user.role === 'admin') return 'admin'
  if (user.isPremium) return 'premium'
  
  return 'default'
}

/**
 * Rate limiter specifically for bulk operations with dynamic limits
 */
export function createBulkOperationRateLimit() {
  return (req: Request, res: Response, next: NextFunction) => {
    const { type, policyIds } = req.body
    const policyCount = policyIds?.length || 0
    
    // Adjust rate limit based on operation size
    let config: RateLimitConfig
    
    if (policyCount > 500) {
      // Large operations - very restrictive
      config = {
        windowMs: 30 * 60 * 1000, // 30 minutes
        maxRequests: 2,
        message: 'Large bulk operations are limited to 2 per 30 minutes'
      }
    } else if (policyCount > 100) {
      // Medium operations - moderately restrictive
      config = {
        windowMs: 10 * 60 * 1000, // 10 minutes
        maxRequests: 5,
        message: 'Medium bulk operations are limited to 5 per 10 minutes'
      }
    } else {
      // Small operations - less restrictive
      config = {
        windowMs: 5 * 60 * 1000, // 5 minutes
        maxRequests: 10,
        message: 'Small bulk operations are limited to 10 per 5 minutes'
      }
    }
    
    return createRateLimit(config)(req, res, next)
  }
}

/**
 * Rate limiter for search operations with query complexity consideration
 */
export function createSearchRateLimit() {
  return (req: Request, res: Response, next: NextFunction) => {
    const query = req.query
    let complexity = 1
    
    // Calculate query complexity
    if (query.search) complexity += 1
    if (query.types) complexity += 1
    if (query.providers) complexity += 1
    if (query.expiryStart || query.expiryEnd) complexity += 1
    if (query.premiumMin || query.premiumMax) complexity += 1
    if (query.commissionMin || query.commissionMax) complexity += 1
    
    // Adjust rate limit based on complexity
    let config: RateLimitConfig
    
    if (complexity > 4) {
      // Complex queries - more restrictive
      config = {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 10,
        message: 'Complex search queries are limited to 10 per minute'
      }
    } else {
      // Simple queries - less restrictive
      config = {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 30,
        message: 'Search queries are limited to 30 per minute'
      }
    }
    
    return createRateLimit(config)(req, res, next)
  }
}

/**
 * Middleware to check if user has exceeded daily limits
 */
export function checkDailyLimits() {
  return (req: Request, res: Response, next: NextFunction) => {
    const identifier = getIdentifier(req)
    const today = new Date().toDateString()
    const dailyKey = `daily:${identifier}:${today}`
    
    // Get daily usage (in production, use Redis with TTL)
    const dailyUsage = getDailyUsage(dailyKey)
    
    // Define daily limits
    const dailyLimits = {
      policyCreations: 100,
      bulkOperations: 50,
      exports: 20,
      searches: 1000
    }
    
    // Check operation type and corresponding limit
    const operation = getOperationType(req)
    const limit = dailyLimits[operation as keyof typeof dailyLimits]
    
    if (limit && dailyUsage >= limit) {
      res.status(429).json({
        success: false,
        message: `Daily limit of ${limit} ${operation} exceeded`,
        statusCode: 429,
        resetTime: getNextMidnight()
      })
      return
    }
    
    // Increment daily usage
    incrementDailyUsage(dailyKey)
    
    next()
  }
}

/**
 * Get operation type from request
 */
function getOperationType(req: Request): string {
  const path = req.path
  const method = req.method
  
  if (path.includes('/bulk')) return 'bulkOperations'
  if (path.includes('/export')) return 'exports'
  if (method === 'POST' && path.includes('/policies')) return 'policyCreations'
  if (method === 'GET' && req.query.search) return 'searches'
  
  return 'general'
}

/**
 * Get daily usage count (mock implementation)
 */
function getDailyUsage(key: string): number {
  // In production, use Redis or database
  return 0
}

/**
 * Increment daily usage count (mock implementation)
 */
function incrementDailyUsage(key: string): void {
  // In production, use Redis INCR with TTL
}

/**
 * Get next midnight timestamp
 */
function getNextMidnight(): number {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  return tomorrow.getTime()
}

/**
 * Middleware to add rate limit information to response headers
 */
export function addRateLimitHeaders() {
  return (req: Request, res: Response, next: NextFunction) => {
    const identifier = getIdentifier(req)
    const entry = rateLimitStore[identifier]
    
    if (entry) {
      res.set({
        'X-RateLimit-Remaining': Math.max(0, 100 - entry.count).toString(),
        'X-RateLimit-Reset': Math.ceil(entry.resetTime / 1000).toString()
      })
    }
    
    next()
  }
}