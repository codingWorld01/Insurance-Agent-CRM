import { prisma } from './database';
import { Prisma } from '@prisma/client';

export interface AuditLogData {
  clientId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW';
  fieldName?: string;
  oldValue?: string | null;
  newValue?: string | null;
  metadata?: Record<string, any>;
}

export interface AuditLogFilters {
  clientId?: string;
  action?: string;
  fieldName?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export class AuditService {
  /**
   * Create a single audit log entry
   */
  static async createAuditLog(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          clientId: data.clientId,
          action: data.action,
          fieldName: data.fieldName || null,
          oldValue: data.oldValue || null,
          newValue: data.newValue || null,
          changedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  /**
   * Create multiple audit log entries in a transaction
   */
  static async createMultipleAuditLogs(logs: AuditLogData[]): Promise<void> {
    if (logs.length === 0) return;

    try {
      await prisma.auditLog.createMany({
        data: logs.map(log => ({
          clientId: log.clientId,
          action: log.action,
          fieldName: log.fieldName || null,
          oldValue: log.oldValue || null,
          newValue: log.newValue || null,
          changedAt: new Date()
        }))
      });
    } catch (error) {
      console.error('Failed to create multiple audit logs:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  /**
   * Log client creation
   */
  static async logClientCreation(clientId: string, clientData: any): Promise<void> {
    const auditLogs: AuditLogData[] = [];

    // Log main client fields
    Object.entries(clientData).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        auditLogs.push({
          clientId,
          action: 'CREATE',
          fieldName: key,
          oldValue: null,
          newValue: String(value)
        });
      }
    });

    await this.createMultipleAuditLogs(auditLogs);
  }

  /**
   * Log client updates by comparing old and new values
   */
  static async logClientUpdate(
    clientId: string, 
    oldData: any, 
    newData: any, 
    section?: 'client' | 'personal' | 'family' | 'corporate'
  ): Promise<void> {
    const auditLogs: AuditLogData[] = [];

    // Compare each field and log changes
    Object.keys(newData).forEach(key => {
      const oldValue = oldData[key];
      const newValue = newData[key];

      // Skip if values are the same
      if (oldValue === newValue) return;

      // Handle null/undefined comparisons
      const oldStr = oldValue === null || oldValue === undefined ? null : String(oldValue);
      const newStr = newValue === null || newValue === undefined ? null : String(newValue);

      if (oldStr !== newStr) {
        const fieldName = section ? `${section}.${key}` : key;
        auditLogs.push({
          clientId,
          action: 'UPDATE',
          fieldName,
          oldValue: oldStr,
          newValue: newStr
        });
      }
    });

    await this.createMultipleAuditLogs(auditLogs);
  }

  /**
   * Log client deletion
   */
  static async logClientDeletion(clientId: string, clientData: any): Promise<void> {
    await this.createAuditLog({
      clientId,
      action: 'DELETE',
      fieldName: 'client_deleted',
      oldValue: JSON.stringify({
        name: `${clientData.firstName || ''} ${clientData.lastName || ''}`.trim(),
        email: clientData.email,
        phone: clientData.phone,
        clientType: clientData.clientType
      }),
      newValue: null
    });
  }

  /**
   * Log document operations
   */
  static async logDocumentOperation(
    clientId: string, 
    action: 'CREATE' | 'DELETE', 
    documentData: any
  ): Promise<void> {
    await this.createAuditLog({
      clientId,
      action,
      fieldName: 'document',
      oldValue: action === 'DELETE' ? JSON.stringify({
        fileName: documentData.fileName,
        documentType: documentData.documentType
      }) : null,
      newValue: action === 'CREATE' ? JSON.stringify({
        fileName: documentData.fileName,
        documentType: documentData.documentType
      }) : null
    });
  }

  /**
   * Log profile image operations
   */
  static async logProfileImageOperation(
    clientId: string, 
    action: 'CREATE' | 'UPDATE' | 'DELETE', 
    oldImageUrl?: string,
    newImageUrl?: string
  ): Promise<void> {
    await this.createAuditLog({
      clientId,
      action,
      fieldName: 'profile_image',
      oldValue: oldImageUrl || null,
      newValue: newImageUrl || null
    });
  }

  /**
   * Get audit logs for a specific client
   */
  static async getClientAuditLogs(
    clientId: string, 
    options: { page?: number; limit?: number } = {}
  ): Promise<{
    logs: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const skip = (page - 1) * limit;

    try {
      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where: { clientId },
          orderBy: { changedAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.auditLog.count({
          where: { clientId }
        })
      ]);

      return {
        logs,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      return {
        logs: [],
        total: 0,
        page: 1,
        totalPages: 0
      };
    }
  }

  /**
   * Get audit logs with advanced filtering
   */
  static async getAuditLogs(filters: AuditLogFilters): Promise<{
    logs: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.AuditLogWhereInput = {};

    if (filters.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.fieldName) {
      where.fieldName = {
        contains: filters.fieldName,
        mode: 'insensitive'
      };
    }

    if (filters.startDate || filters.endDate) {
      where.changedAt = {};
      if (filters.startDate) {
        where.changedAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.changedAt.lte = filters.endDate;
      }
    }

    try {
      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            client: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                clientType: true
              }
            }
          },
          orderBy: { changedAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.auditLog.count({ where })
      ]);

      return {
        logs,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Failed to fetch audit logs with filters:', error);
      return {
        logs: [],
        total: 0,
        page: 1,
        totalPages: 0
      };
    }
  }

  /**
   * Get audit statistics for a client
   */
  static async getClientAuditStats(clientId: string): Promise<{
    totalChanges: number;
    recentChanges: number;
    changesByAction: Record<string, number>;
    changesByField: Record<string, number>;
    lastModified: Date | null;
  }> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [totalChanges, recentChanges, allLogs, lastLog] = await Promise.all([
        prisma.auditLog.count({
          where: { clientId }
        }),
        prisma.auditLog.count({
          where: {
            clientId,
            changedAt: { gte: thirtyDaysAgo }
          }
        }),
        prisma.auditLog.findMany({
          where: { clientId },
          select: {
            action: true,
            fieldName: true
          }
        }),
        prisma.auditLog.findFirst({
          where: { clientId },
          orderBy: { changedAt: 'desc' },
          select: { changedAt: true }
        })
      ]);

      // Group by action
      const changesByAction: Record<string, number> = {};
      allLogs.forEach(log => {
        changesByAction[log.action] = (changesByAction[log.action] || 0) + 1;
      });

      // Group by field
      const changesByField: Record<string, number> = {};
      allLogs.forEach(log => {
        if (log.fieldName) {
          changesByField[log.fieldName] = (changesByField[log.fieldName] || 0) + 1;
        }
      });

      return {
        totalChanges,
        recentChanges,
        changesByAction,
        changesByField,
        lastModified: lastLog?.changedAt || null
      };
    } catch (error) {
      console.error('Failed to fetch audit stats:', error);
      return {
        totalChanges: 0,
        recentChanges: 0,
        changesByAction: {},
        changesByField: {},
        lastModified: null
      };
    }
  }

  /**
   * Clean up old audit logs (for maintenance)
   */
  static async cleanupOldAuditLogs(daysToKeep: number = 365): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await prisma.auditLog.deleteMany({
        where: {
          changedAt: {
            lt: cutoffDate
          }
        }
      });

      console.log(`Cleaned up ${result.count} old audit log entries`);
      return result.count;
    } catch (error) {
      console.error('Failed to cleanup old audit logs:', error);
      return 0;
    }
  }

  /**
   * Generate audit report for a date range
   */
  static async generateAuditReport(
    startDate: Date,
    endDate: Date,
    clientId?: string
  ): Promise<{
    totalOperations: number;
    operationsByAction: Record<string, number>;
    operationsByClient: Record<string, number>;
    operationsByField: Record<string, number>;
    dailyActivity: Record<string, number>;
  }> {
    try {
      const where: Prisma.AuditLogWhereInput = {
        changedAt: {
          gte: startDate,
          lte: endDate
        }
      };

      if (clientId) {
        where.clientId = clientId;
      }

      const logs = await prisma.auditLog.findMany({
        where,
        include: {
          client: {
            select: {
              firstName: true,
              lastName: true,
              clientType: true
            }
          }
        }
      });

      const totalOperations = logs.length;
      const operationsByAction: Record<string, number> = {};
      const operationsByClient: Record<string, number> = {};
      const operationsByField: Record<string, number> = {};
      const dailyActivity: Record<string, number> = {};

      logs.forEach(log => {
        // By action
        operationsByAction[log.action] = (operationsByAction[log.action] || 0) + 1;

        // By client
        const clientName = `${log.client.firstName || ''} ${log.client.lastName || ''}`.trim() || 'Unknown';
        operationsByClient[clientName] = (operationsByClient[clientName] || 0) + 1;

        // By field
        if (log.fieldName) {
          operationsByField[log.fieldName] = (operationsByField[log.fieldName] || 0) + 1;
        }

        // By day
        const day = log.changedAt.toISOString().split('T')[0];
        dailyActivity[day] = (dailyActivity[day] || 0) + 1;
      });

      return {
        totalOperations,
        operationsByAction,
        operationsByClient,
        operationsByField,
        dailyActivity
      };
    } catch (error) {
      console.error('Failed to generate audit report:', error);
      throw error;
    }
  }
}