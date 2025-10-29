import { Request } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SecurityEvent {
  eventType: 'FILE_UPLOAD_BLOCKED' | 'RATE_LIMIT_EXCEEDED' | 'VIRUS_DETECTED' | 
            'MALICIOUS_FILE_DETECTED' | 'SUSPICIOUS_ACTIVITY' | 'AUTHENTICATION_FAILURE' |
            'UNAUTHORIZED_ACCESS' | 'DATA_BREACH_ATTEMPT' | 'INJECTION_ATTEMPT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  clientId?: string;
  userId?: string;
  ipAddress: string;
  userAgent?: string;
  requestUrl: string;
  requestMethod: string;
  details: Record<string, any>;
  timestamp: Date;
  blocked: boolean;
  actionTaken?: string;
}

export interface SecurityMetrics {
  totalEvents: number;
  eventsBySeverity: Record<string, number>;
  eventsByType: Record<string, number>;
  blockedRequests: number;
  uniqueIpAddresses: number;
  topThreats: Array<{
    type: string;
    count: number;
    lastOccurrence: Date;
  }>;
}

export class SecurityLoggingService {
  /**
   * Log a security event
   */
  static async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // Log to console for immediate visibility
      console.warn('SECURITY EVENT:', {
        type: event.eventType,
        severity: event.severity,
        ip: event.ipAddress,
        url: event.requestUrl,
        blocked: event.blocked,
        timestamp: event.timestamp.toISOString(),
        details: event.details
      });

      // Store in database for analysis
      // Note: In production, consider using a dedicated security logging table
      // For now, we'll use the existing audit log structure
      await prisma.auditLog.create({
        data: {
          clientId: event.clientId || 'SECURITY_EVENT',
          action: event.eventType,
          fieldName: 'security_event',
          oldValue: null,
          newValue: JSON.stringify({
            severity: event.severity,
            ipAddress: event.ipAddress,
            userAgent: event.userAgent,
            requestUrl: event.requestUrl,
            requestMethod: event.requestMethod,
            blocked: event.blocked,
            actionTaken: event.actionTaken,
            details: event.details
          }),
          changedAt: event.timestamp
        }
      });

      // Send alerts for high severity events
      if (event.severity === 'HIGH' || event.severity === 'CRITICAL') {
        await this.sendSecurityAlert(event);
      }

      // Update threat intelligence
      await this.updateThreatIntelligence(event);

    } catch (error) {
      console.error('Failed to log security event:', error);
      // Don't throw to avoid breaking the main operation
    }
  }

  /**
   * Log file upload security event
   */
  static async logFileUploadSecurityEvent(
    req: Request,
    eventType: SecurityEvent['eventType'],
    details: Record<string, any>,
    blocked: boolean = true
  ): Promise<void> {
    const event: SecurityEvent = {
      eventType,
      severity: this.determineSeverity(eventType),
      clientId: req.body?.clientId,
      userId: (req as any).user?.id,
      ipAddress: req.ip || (req as any).connection?.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent'),
      requestUrl: req.originalUrl,
      requestMethod: req.method,
      details,
      timestamp: new Date(),
      blocked,
      actionTaken: blocked ? 'Request blocked' : 'Request allowed with warning'
    };

    await this.logSecurityEvent(event);
  }

  /**
   * Log rate limiting event
   */
  static async logRateLimitEvent(
    req: Request,
    limitType: string,
    currentCount: number,
    maxAllowed: number,
    windowMs: number
  ): Promise<void> {
    await this.logFileUploadSecurityEvent(
      req,
      'RATE_LIMIT_EXCEEDED',
      {
        limitType,
        currentCount,
        maxAllowed,
        windowMs,
        resetTime: new Date(Date.now() + windowMs).toISOString()
      },
      true
    );
  }

  /**
   * Log suspicious activity
   */
  static async logSuspiciousActivity(
    req: Request,
    activityType: string,
    details: Record<string, any>
  ): Promise<void> {
    await this.logFileUploadSecurityEvent(
      req,
      'SUSPICIOUS_ACTIVITY',
      {
        activityType,
        ...details
      },
      false
    );
  }

  /**
   * Get security metrics for dashboard
   */
  static async getSecurityMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<SecurityMetrics> {
    try {
      const events = await prisma.auditLog.findMany({
        where: {
          fieldName: 'security_event',
          changedAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          action: true,
          newValue: true,
          changedAt: true
        }
      });

      const metrics: SecurityMetrics = {
        totalEvents: events.length,
        eventsBySeverity: {},
        eventsByType: {},
        blockedRequests: 0,
        uniqueIpAddresses: 0,
        topThreats: []
      };

      const ipAddresses = new Set<string>();
      const threatCounts: Record<string, { count: number; lastOccurrence: Date }> = {};

      for (const event of events) {
        try {
          const eventData = JSON.parse(event.newValue || '{}');
          
          // Count by severity
          const severity = eventData.severity || 'UNKNOWN';
          metrics.eventsBySeverity[severity] = (metrics.eventsBySeverity[severity] || 0) + 1;

          // Count by type
          const eventType = event.action;
          metrics.eventsByType[eventType] = (metrics.eventsByType[eventType] || 0) + 1;

          // Count blocked requests
          if (eventData.blocked) {
            metrics.blockedRequests++;
          }

          // Track unique IP addresses
          if (eventData.ipAddress) {
            ipAddresses.add(eventData.ipAddress);
          }

          // Track threat types
          if (!threatCounts[eventType]) {
            threatCounts[eventType] = { count: 0, lastOccurrence: event.changedAt };
          }
          threatCounts[eventType].count++;
          if (event.changedAt > threatCounts[eventType].lastOccurrence) {
            threatCounts[eventType].lastOccurrence = event.changedAt;
          }

        } catch (parseError) {
          console.error('Failed to parse security event data:', parseError);
        }
      }

      metrics.uniqueIpAddresses = ipAddresses.size;

      // Get top threats
      metrics.topThreats = Object.entries(threatCounts)
        .map(([type, data]) => ({
          type,
          count: data.count,
          lastOccurrence: data.lastOccurrence
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return metrics;

    } catch (error) {
      console.error('Failed to get security metrics:', error);
      return {
        totalEvents: 0,
        eventsBySeverity: {},
        eventsByType: {},
        blockedRequests: 0,
        uniqueIpAddresses: 0,
        topThreats: []
      };
    }
  }

  /**
   * Get recent security events
   */
  static async getRecentSecurityEvents(
    limit: number = 50,
    severity?: SecurityEvent['severity']
  ): Promise<Array<SecurityEvent & { id: string }>> {
    try {
      const whereClause: any = {
        fieldName: 'security_event'
      };

      if (severity) {
        // This is a simplified approach - in production, you'd want proper JSON querying
        whereClause.newValue = {
          contains: `"severity":"${severity}"`
        };
      }

      const events = await prisma.auditLog.findMany({
        where: whereClause,
        orderBy: { changedAt: 'desc' },
        take: limit,
        select: {
          id: true,
          action: true,
          newValue: true,
          changedAt: true,
          clientId: true
        }
      });

      return events.map(event => {
        try {
          const eventData = JSON.parse(event.newValue || '{}');
          return {
            id: event.id,
            eventType: event.action as SecurityEvent['eventType'],
            severity: eventData.severity,
            clientId: event.clientId === 'SECURITY_EVENT' ? undefined : event.clientId,
            userId: eventData.userId,
            ipAddress: eventData.ipAddress,
            userAgent: eventData.userAgent,
            requestUrl: eventData.requestUrl,
            requestMethod: eventData.requestMethod,
            details: eventData.details,
            timestamp: event.changedAt,
            blocked: eventData.blocked,
            actionTaken: eventData.actionTaken
          };
        } catch (parseError) {
          console.error('Failed to parse security event:', parseError);
          return null;
        }
      }).filter(Boolean) as Array<SecurityEvent & { id: string }>;

    } catch (error) {
      console.error('Failed to get recent security events:', error);
      return [];
    }
  }

  /**
   * Check if IP address is suspicious
   */
  static async checkSuspiciousIP(ipAddress: string): Promise<{
    isSuspicious: boolean;
    riskScore: number;
    reasons: string[];
  }> {
    try {
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const recentEvents = await prisma.auditLog.findMany({
        where: {
          fieldName: 'security_event',
          changedAt: { gte: last24Hours },
          newValue: { contains: ipAddress }
        }
      });

      let riskScore = 0;
      const reasons: string[] = [];

      // High frequency of events
      if (recentEvents.length > 10) {
        riskScore += 30;
        reasons.push(`High activity: ${recentEvents.length} security events in 24h`);
      }

      // Check for blocked requests
      const blockedEvents = recentEvents.filter(event => {
        try {
          const data = JSON.parse(event.newValue || '{}');
          return data.blocked;
        } catch {
          return false;
        }
      });

      if (blockedEvents.length > 5) {
        riskScore += 40;
        reasons.push(`Multiple blocked requests: ${blockedEvents.length}`);
      }

      // Check for high severity events
      const highSeverityEvents = recentEvents.filter(event => {
        try {
          const data = JSON.parse(event.newValue || '{}');
          return data.severity === 'HIGH' || data.severity === 'CRITICAL';
        } catch {
          return false;
        }
      });

      if (highSeverityEvents.length > 0) {
        riskScore += 50;
        reasons.push(`High severity events: ${highSeverityEvents.length}`);
      }

      return {
        isSuspicious: riskScore > 50,
        riskScore,
        reasons
      };

    } catch (error) {
      console.error('Failed to check suspicious IP:', error);
      return {
        isSuspicious: false,
        riskScore: 0,
        reasons: []
      };
    }
  }

  /**
   * Determine event severity based on type
   */
  private static determineSeverity(eventType: SecurityEvent['eventType']): SecurityEvent['severity'] {
    switch (eventType) {
      case 'VIRUS_DETECTED':
      case 'DATA_BREACH_ATTEMPT':
      case 'INJECTION_ATTEMPT':
        return 'CRITICAL';
      
      case 'MALICIOUS_FILE_DETECTED':
      case 'UNAUTHORIZED_ACCESS':
        return 'HIGH';
      
      case 'FILE_UPLOAD_BLOCKED':
      case 'RATE_LIMIT_EXCEEDED':
      case 'AUTHENTICATION_FAILURE':
        return 'MEDIUM';
      
      case 'SUSPICIOUS_ACTIVITY':
      default:
        return 'LOW';
    }
  }

  /**
   * Send security alert for high severity events
   */
  private static async sendSecurityAlert(event: SecurityEvent): Promise<void> {
    try {
      // In production, integrate with alerting systems like:
      // - Email notifications
      // - Slack/Teams webhooks
      // - PagerDuty
      // - SMS alerts
      
      console.error('SECURITY ALERT:', {
        severity: event.severity,
        type: event.eventType,
        ip: event.ipAddress,
        url: event.requestUrl,
        details: event.details,
        timestamp: event.timestamp.toISOString()
      });

      // TODO: Implement actual alerting mechanism
      // await sendEmailAlert(event);
      // await sendSlackAlert(event);

    } catch (error) {
      console.error('Failed to send security alert:', error);
    }
  }

  /**
   * Update threat intelligence data
   */
  private static async updateThreatIntelligence(event: SecurityEvent): Promise<void> {
    try {
      // In production, update threat intelligence databases
      // Track patterns, IP reputation, file hashes, etc.
      
      // For now, just log for analysis
      console.log('THREAT INTELLIGENCE UPDATE:', {
        type: event.eventType,
        ip: event.ipAddress,
        patterns: event.details
      });

    } catch (error) {
      console.error('Failed to update threat intelligence:', error);
    }
  }

  /**
   * Clean up old security events
   */
  static async cleanupOldSecurityEvents(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await prisma.auditLog.deleteMany({
        where: {
          fieldName: 'security_event',
          changedAt: { lt: cutoffDate }
        }
      });

      console.log(`Cleaned up ${result.count} old security events`);
      return result.count;

    } catch (error) {
      console.error('Failed to cleanup old security events:', error);
      return 0;
    }
  }
}