/**
 * Audit logging middleware for policy page operations
 */

import { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'
import { JWTPayload } from '../services/authService';

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: JWTPayload & {
    [key: string]: any
  };
}

const prisma = new PrismaClient()

export interface AuditLogEntry {
  userId: string
  action: string
  resourceType: string
  resourceId?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  timestamp: Date
  success: boolean
  errorMessage?: string
  duration?: number
}

/**
 * Create audit log entry
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    // In a real implementation, you would save to database
    // For now, we'll log to console and could save to a dedicated audit table
    console.log('AUDIT LOG:', {
      timestamp: entry.timestamp.toISOString(),
      userId: entry.userId,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      success: entry.success,
      duration: entry.duration,
      ipAddress: entry.ipAddress,
      details: entry.details,
      errorMessage: entry.errorMessage
    })

    // TODO: Implement actual database storage
    // await prisma.auditLog.create({
    //   data: {
    //     userId: entry.userId,
    //     action: entry.action,
    //     resourceType: entry.resourceType,
    //     resourceId: entry.resourceId,
    //     details: entry.details ? JSON.stringify(entry.details) : null,
    //     ipAddress: entry.ipAddress,
    //     userAgent: entry.userAgent,
    //     timestamp: entry.timestamp,
    //     success: entry.success,
    //     errorMessage: entry.errorMessage,
    //     duration: entry.duration
    //   }
    // })
  } catch (error) {
    console.error('Failed to create audit log:', error)
    // Don't throw error to avoid breaking the main operation
  }
}

/**
 * Middleware to automatically log policy page operations
 */
export function auditPolicyPageOperation(action: string, resourceType: string = 'policy') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const startTime = Date.now()
    const originalSend = res.send
    
    // Override res.send to capture response
    res.send = function(body: any) {
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Determine if operation was successful
      const success = res.statusCode >= 200 && res.statusCode < 400
      
      // Extract relevant details from request
      const details: Record<string, any> = {}
      
      // Add request details based on action type
      if (action.includes('search') || action.includes('filter')) {
        details.searchQuery = req.query.search
        details.filters = {
          types: req.query.types,
          status: req.query.status,
          providers: req.query.providers,
          dateRange: {
            start: req.query.expiryStart,
            end: req.query.expiryEnd
          }
        }
        details.pagination = {
          page: req.query.page,
          limit: req.query.limit
        }
      }
      
      if (action.includes('bulk')) {
        details.operationType = req.body.type
        details.policyCount = req.body.policyIds?.length
        details.bulkData = req.body.data
      }
      
      if (action.includes('export')) {
        details.format = req.body.format || req.query.format
        details.policyCount = req.body.policyIds?.length
        details.includeClient = req.body.includeClient
      }
      
      if (action.includes('created') || action.includes('updated')) {
        details.policyData = {
          policyNumber: req.body.policyNumber,
          policyType: req.body.policyType,
          provider: req.body.provider,
          premiumAmount: req.body.premiumAmount
        }
      }
      
      // Add resource ID if available
      let resourceId: string | undefined
      if (req.params.id) {
        resourceId = req.params.id
      } else if (req.body.policyIds?.length === 1) {
        resourceId = req.body.policyIds[0]
      }
      
      // Create audit log entry
      const userId = req.user?.id ?? req.user?.userId ?? 'anonymous';
      const auditEntry: AuditLogEntry = {
        userId,
        action,
        resourceType,
        resourceId,
        details,
        ipAddress: req.ip || (req.connection as any).remoteAddress,
        userAgent: req.get('User-Agent') || '',
        timestamp: new Date(startTime),
        success,
        duration,
        errorMessage: success ? undefined : extractErrorMessage(body)
      }
      
      // Log asynchronously to avoid blocking response
      setImmediate(() => {
        createAuditLog(auditEntry).catch(error => {
          console.error('Audit logging failed:', error)
        })
      })
      
      // Call original send method
      return originalSend.call(this, body)
    }
    
    next()
  }
}

/**
 * Extract error message from response body
 */
function extractErrorMessage(body: any): string | undefined {
  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body)
      return parsed.message || parsed.error
    } catch {
      return body
    }
  }
  
  if (typeof body === 'object' && body !== null) {
    return body.message || body.error
  }
  
  return undefined
}

/**
 * Predefined audit middleware for common policy page operations
 */
export const auditMiddleware = {
  policySearch: auditPolicyPageOperation('policy_search', 'policies'),
  policyFilter: auditPolicyPageOperation('policy_filter', 'policies'),
  policyCreated: auditPolicyPageOperation('policy_created', 'policy'),
  policyUpdated: auditPolicyPageOperation('policy_updated', 'policy'),
  policyDeleted: auditPolicyPageOperation('policy_deleted', 'policy'),
  bulkDelete: auditPolicyPageOperation('bulk_delete', 'policies'),
  bulkUpdate: auditPolicyPageOperation('bulk_update', 'policies'),
  bulkExport: auditPolicyPageOperation('bulk_export', 'policies'),
  policyExport: auditPolicyPageOperation('policy_export', 'policies'),
  policyView: auditPolicyPageOperation('policy_view', 'policies')
}

/**
 * Middleware to log sensitive operations with additional details
 */
export function auditSensitiveOperation(action: string, options: {
  captureRequestBody?: boolean
  captureResponseBody?: boolean
  requiresApproval?: boolean
} = {}) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const startTime = Date.now()
    const originalSend = res.send
    
    res.send = function(body: any) {
      const endTime = Date.now()
      const duration = endTime - startTime
      const success = res.statusCode >= 200 && res.statusCode < 400
      
      const details: Record<string, any> = {
        sensitive: true,
        requiresApproval: options.requiresApproval
      }
      
      if (options.captureRequestBody) {
        details.requestBody = sanitizeRequestBody(req.body)
      }
      
      if (options.captureResponseBody && success) {
        details.responseBody = sanitizeResponseBody(body)
      }
      
      const userId = req.user?.userId || req.user?.id || 'anonymous';
      
      const auditEntry: AuditLogEntry = {
        userId,
        action,
        resourceType: 'policy',
        details,
        ipAddress: req.ip || (req.connection as any).remoteAddress,
        userAgent: req.get('User-Agent') || '',
        timestamp: new Date(startTime),
        success,
        duration,
        errorMessage: success ? undefined : extractErrorMessage(body)
      }
      
      // Log immediately for sensitive operations
      createAuditLog(auditEntry).catch(error => {
        console.error('Sensitive operation audit logging failed:', error)
      })
      
      return originalSend.call(this, body)
    }
    
    next()
  }
}

/**
 * Sanitize request body for logging (remove sensitive data)
 */
function sanitizeRequestBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body
  }
  
  const sanitized = { ...body }
  
  // Remove or mask sensitive fields
  const sensitiveFields = ['password', 'token', 'secret', 'key']
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]'
    }
  })
  
  return sanitized
}

/**
 * Sanitize response body for logging
 */
function sanitizeResponseBody(body: any): any {
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      return '[UNPARSEABLE]'
    }
  }
  
  if (!body || typeof body !== 'object') {
    return body
  }
  
  // Only log success status and count for bulk operations
  if (body.data && Array.isArray(body.data.policies)) {
    return {
      success: body.success,
      policyCount: body.data.policies.length,
      hasStats: !!body.data.stats
    }
  }
  
  return {
    success: body.success,
    message: body.message
  }
}

/**
 * Middleware to track user activity patterns
 */
export function trackUserActivity() {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id || req.user?.userId;
    
    if (userId) {
      // Track activity patterns (in production, use Redis or database)
      const activity = {
        userId,
        endpoint: req.path,
        method: req.method,
        timestamp: new Date(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
      
      // Log activity for analysis
      console.log('USER ACTIVITY:', activity)
      
      // TODO: Implement activity pattern analysis
      // - Detect unusual access patterns
      // - Track feature usage
      // - Monitor for potential security issues
    }
    
    next()
  }
}

/**
 * Get audit logs for a specific user or resource
 */
export async function getAuditLogs(filters: {
  userId?: string
  resourceId?: string
  action?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}): Promise<AuditLogEntry[]> {
  try {
    // TODO: Implement actual database query
    // const logs = await prisma.auditLog.findMany({
    //   where: {
    //     userId: filters.userId,
    //     resourceId: filters.resourceId,
    //     action: filters.action,
    //     timestamp: {
    //       gte: filters.startDate,
    //       lte: filters.endDate
    //     }
    //   },
    //   orderBy: { timestamp: 'desc' },
    //   take: filters.limit || 100,
    //   skip: filters.offset || 0
    // })
    
    // Return empty array for now
    return []
  } catch (error) {
    console.error('Failed to retrieve audit logs:', error)
    return []
  }
}

/**
 * Generate audit report for compliance
 */
export async function generateAuditReport(filters: {
  startDate: Date
  endDate: Date
  userId?: string
  actions?: string[]
}): Promise<{
  totalOperations: number
  successfulOperations: number
  failedOperations: number
  operationsByType: Record<string, number>
  userActivity: Record<string, number>
  timeDistribution: Record<string, number>
}> {
  try {
    // TODO: Implement actual report generation
    return {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      operationsByType: {},
      userActivity: {},
      timeDistribution: {}
    }
  } catch (error) {
    console.error('Failed to generate audit report:', error)
    throw error
  }
}