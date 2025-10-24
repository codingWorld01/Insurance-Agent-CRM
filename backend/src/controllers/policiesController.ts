import { Request, Response } from 'express';
import { prisma } from '../services/database';
import { ActivityService } from '../services/activityService';
import { StatsService } from '../services/statsService';
import { Prisma } from '@prisma/client';
import { 
  sendErrorResponse, 
  PolicyErrors, 
  AppError, 
  ValidationError,
  NotFoundError,
  ConflictError 
} from '../utils/errorHandler';

export class PoliciesController {
  /**
   * GET /api/policies
   * Get all policies with advanced filtering and sorting
   */
  static async getPolicies(req: Request, res: Response): Promise<void> {
    try {
      const { 
        page = 1, 
        limit = 50, 
        clientId, 
        status,
        search,
        types,
        providers,
        expiryStart,
        expiryEnd,
        premiumMin,
        premiumMax,
        commissionMin,
        commissionMax,
        sortField = 'createdAt',
        sortDirection = 'desc',
        includeClient = 'true',
        includeStats = 'false'
      } = req.query;
      
      // Validate pagination parameters
      const pageNum = Number(page);
      const limitNum = Number(limit);
      
      if (pageNum < 1) {
        throw new ValidationError('Invalid pagination', [
          { field: 'page', message: 'Page must be greater than 0' }
        ]);
      }
      
      if (limitNum < 1 || limitNum > 100) {
        throw new ValidationError('Invalid pagination', [
          { field: 'limit', message: 'Limit must be between 1 and 100' }
        ]);
      }

      const skip = (pageNum - 1) * limitNum;

      // Build advanced where clause for filtering
      const where: Prisma.PolicyWhereInput = {};
      
      // Legacy client filter
      if (clientId) {
        const clientExists = await prisma.client.findUnique({
          where: { id: String(clientId) },
          select: { id: true }
        });
        
        if (!clientExists) {
          throw PolicyErrors.CLIENT_NOT_FOUND();
        }
        
        where.clientId = String(clientId);
      }
      
      // Status filter
      if (status && status !== 'All') {
        const validStatuses = ['Active', 'Expired'];
        if (!validStatuses.includes(String(status))) {
          throw new ValidationError('Invalid status filter', [
            { field: 'status', message: 'Status must be either Active or Expired' }
          ]);
        }
        where.status = String(status);
      }

      // Search filter (policy number, client name, provider)
      if (search) {
        const searchTerm = String(search).trim();
        where.OR = [
          { policyNumber: { contains: searchTerm, mode: 'insensitive' } },
          { provider: { contains: searchTerm, mode: 'insensitive' } },
          { 
            client: { 
              name: { contains: searchTerm, mode: 'insensitive' } 
            } 
          }
        ];
      }

      // Policy types filter
      if (types) {
        const typeArray = String(types).split(',').filter(Boolean);
        const validTypes = ['Life', 'Health', 'Auto', 'Home', 'Business'];
        const invalidTypes = typeArray.filter(type => !validTypes.includes(type));
        
        if (invalidTypes.length > 0) {
          throw new ValidationError('Invalid policy types', [
            { field: 'types', message: `Invalid types: ${invalidTypes.join(', ')}` }
          ]);
        }
        
        where.policyType = { in: typeArray };
      }

      // Providers filter
      if (providers) {
        const providerArray = String(providers).split(',').filter(Boolean);
        where.provider = { in: providerArray };
      }

      // Expiry date range filter
      if (expiryStart || expiryEnd) {
        where.expiryDate = {};
        
        if (expiryStart) {
          const startDate = new Date(String(expiryStart));
          if (isNaN(startDate.getTime())) {
            throw new ValidationError('Invalid date format', [
              { field: 'expiryStart', message: 'Invalid date format' }
            ]);
          }
          where.expiryDate.gte = startDate;
        }
        
        if (expiryEnd) {
          const endDate = new Date(String(expiryEnd));
          if (isNaN(endDate.getTime())) {
            throw new ValidationError('Invalid date format', [
              { field: 'expiryEnd', message: 'Invalid date format' }
            ]);
          }
          where.expiryDate.lte = endDate;
        }
      }

      // Premium amount range filter
      if (premiumMin !== undefined || premiumMax !== undefined) {
        where.premiumAmount = {};
        
        if (premiumMin !== undefined) {
          const minAmount = Number(premiumMin);
          if (isNaN(minAmount) || minAmount < 0) {
            throw new ValidationError('Invalid premium range', [
              { field: 'premiumMin', message: 'Premium minimum must be a positive number' }
            ]);
          }
          where.premiumAmount.gte = minAmount;
        }
        
        if (premiumMax !== undefined) {
          const maxAmount = Number(premiumMax);
          if (isNaN(maxAmount) || maxAmount < 0) {
            throw new ValidationError('Invalid premium range', [
              { field: 'premiumMax', message: 'Premium maximum must be a positive number' }
            ]);
          }
          where.premiumAmount.lte = maxAmount;
        }
      }

      // Commission amount range filter
      if (commissionMin !== undefined || commissionMax !== undefined) {
        where.commissionAmount = {};
        
        if (commissionMin !== undefined) {
          const minAmount = Number(commissionMin);
          if (isNaN(minAmount) || minAmount < 0) {
            throw new ValidationError('Invalid commission range', [
              { field: 'commissionMin', message: 'Commission minimum must be a positive number' }
            ]);
          }
          where.commissionAmount.gte = minAmount;
        }
        
        if (commissionMax !== undefined) {
          const maxAmount = Number(commissionMax);
          if (isNaN(maxAmount) || maxAmount < 0) {
            throw new ValidationError('Invalid commission range', [
              { field: 'commissionMax', message: 'Commission maximum must be a positive number' }
            ]);
          }
          where.commissionAmount.lte = maxAmount;
        }
      }

      // Build sort order
      const validSortFields = [
        'policyNumber', 'policyType', 'provider', 'premiumAmount', 
        'commissionAmount', 'status', 'startDate', 'expiryDate', 'createdAt'
      ];
      
      let orderBy: any = { createdAt: 'desc' };
      
      if (sortField && validSortFields.includes(String(sortField))) {
        const direction = sortDirection === 'asc' ? 'asc' : 'desc';
        
        if (String(sortField) === 'clientName') {
          orderBy = { client: { name: direction } };
        } else {
          orderBy = { [String(sortField)]: direction };
        }
      }

      // Determine what to include
      const shouldIncludeClient = includeClient === 'true';
      const shouldIncludeStats = includeStats === 'true';

      // Get policies with pagination and optional client information
      const [policies, total] = await Promise.all([
        prisma.policy.findMany({
          where,
          include: shouldIncludeClient ? {
            client: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          } : undefined,
          orderBy,
          skip,
          take: limitNum
        }),
        prisma.policy.count({ where })
      ]);

      // Calculate statistics if requested
      let stats = undefined;
      if (shouldIncludeStats) {
        stats = await PoliciesController.calculateEnhancedPolicyStats(where);
      }

      res.json({
        success: true,
        data: {
          policies,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum)
          },
          ...(stats && { stats })
        }
      });
    } catch (error) {
      console.error('Error fetching policies:', error);
      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * POST /api/clients/:id/policies
   * Create a new policy for a specific client
   */
  static async createPolicy(req: Request, res: Response): Promise<void> {
    try {
      const { id: clientId } = req.params;

      // Check if client exists
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: { id: true, name: true }
      });

      if (!client) {
        throw PolicyErrors.CLIENT_NOT_FOUND();
      }

      // Additional business validation
      const { startDate, expiryDate, premiumAmount, commissionAmount, policyNumber } = req.body;

      // Validate date range (additional check beyond schema validation)
      const start = new Date(startDate);
      const expiry = new Date(expiryDate);
      
      if (start >= expiry) {
        throw PolicyErrors.INVALID_DATE_RANGE();
      }

      // Validate amounts are positive
      if (premiumAmount <= 0) {
        throw PolicyErrors.INVALID_PREMIUM();
      }

      if (commissionAmount <= 0) {
        throw PolicyErrors.INVALID_COMMISSION();
      }

      // Check for duplicate policy number
      const existingPolicy = await prisma.policy.findUnique({
        where: { policyNumber },
        select: { id: true }
      });

      if (existingPolicy) {
        throw PolicyErrors.DUPLICATE_POLICY_NUMBER();
      }

      // Prepare policy data
      const policyData = {
        ...req.body,
        clientId,
        startDate: start,
        expiryDate: expiry
      };

      const policy = await prisma.policy.create({
        data: policyData,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      // Log activity
      await ActivityService.logPolicyCreated(policy.policyNumber, client.name);

      // Trigger dashboard statistics refresh
      await StatsService.refreshDashboardStats();

      res.status(201).json({
        success: true,
        data: policy,
        message: 'Policy created successfully'
      });
    } catch (error) {
      console.error('Error creating policy:', error);
      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * PUT /api/policies/:id
   * Update a specific policy
   */
  static async updatePolicy(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if policy exists
      const existingPolicy = await prisma.policy.findUnique({
        where: { id },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      if (!existingPolicy) {
        throw PolicyErrors.NOT_FOUND();
      }

      // Additional business validation for updates
      const { startDate, expiryDate, premiumAmount, commissionAmount, policyNumber, status } = req.body;

      // Validate date range if both dates are provided
      if (startDate && expiryDate) {
        const start = new Date(startDate);
        const expiry = new Date(expiryDate);
        
        if (start >= expiry) {
          throw PolicyErrors.INVALID_DATE_RANGE();
        }
      } else if (startDate && !expiryDate) {
        // Check against existing expiry date
        const start = new Date(startDate);
        if (start >= existingPolicy.expiryDate) {
          throw PolicyErrors.INVALID_DATE_RANGE();
        }
      } else if (!startDate && expiryDate) {
        // Check against existing start date
        const expiry = new Date(expiryDate);
        if (existingPolicy.startDate >= expiry) {
          throw PolicyErrors.INVALID_DATE_RANGE();
        }
      }

      // Validate amounts if provided
      if (premiumAmount !== undefined && premiumAmount <= 0) {
        throw PolicyErrors.INVALID_PREMIUM();
      }

      if (commissionAmount !== undefined && commissionAmount <= 0) {
        throw PolicyErrors.INVALID_COMMISSION();
      }

      // Check for duplicate policy number if it's being changed
      if (policyNumber && policyNumber !== existingPolicy.policyNumber) {
        const duplicatePolicy = await prisma.policy.findUnique({
          where: { policyNumber },
          select: { id: true }
        });

        if (duplicatePolicy) {
          throw PolicyErrors.DUPLICATE_POLICY_NUMBER();
        }
      }

      // Validate status transitions
      if (status && status !== existingPolicy.status) {
        // Business rule: Can't reactivate expired policies
        if (existingPolicy.status === 'Expired' && status === 'Active') {
          throw PolicyErrors.INVALID_STATUS_TRANSITION(existingPolicy.status, status);
        }
      }

      // Prepare update data
      const updateData: any = { ...req.body };
      if (startDate) {
        updateData.startDate = new Date(startDate);
      }
      if (expiryDate) {
        updateData.expiryDate = new Date(expiryDate);
      }

      const updatedPolicy = await prisma.policy.update({
        where: { id },
        data: updateData,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      // Log activity for policy update
      await ActivityService.logPolicyUpdated(updatedPolicy.policyNumber, existingPolicy.client.name);

      // Log status change if status was updated
      if (status && status !== existingPolicy.status) {
        await ActivityService.logPolicyStatusChanged(
          updatedPolicy.policyNumber, 
          existingPolicy.client.name, 
          status
        );
      }

      // Trigger dashboard statistics refresh
      await StatsService.refreshDashboardStats();

      res.json({
        success: true,
        data: updatedPolicy,
        message: 'Policy updated successfully'
      });
    } catch (error) {
      console.error('Error updating policy:', error);
      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * DELETE /api/policies/:id
   * Delete a specific policy
   */
  static async deletePolicy(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if policy exists
      const existingPolicy = await prisma.policy.findUnique({
        where: { id },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      if (!existingPolicy) {
        throw PolicyErrors.NOT_FOUND();
      }

      // Business rule: Check if policy has dependencies (future enhancement)
      // For now, we'll allow deletion but this is where you'd check for claims, etc.
      
      // Additional validation: Don't allow deletion of policies with recent activities
      // This is a business rule that could be implemented
      const recentActivities = await prisma.activity.count({
        where: {
          description: {
            contains: existingPolicy.policyNumber
          },
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      });

      // For demonstration - in a real system you might have stricter rules
      if (recentActivities > 10) {
        throw new ConflictError('Cannot delete policy with recent activity. Please contact administrator.');
      }

      // Delete policy
      await prisma.policy.delete({
        where: { id }
      });

      // Log activity
      await ActivityService.logPolicyDeleted(existingPolicy.policyNumber, existingPolicy.client.name);

      // Trigger dashboard statistics refresh
      await StatsService.refreshDashboardStats();

      res.json({
        success: true,
        message: 'Policy deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting policy:', error);
      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * POST /api/policies/bulk
   * Handle bulk operations on policies
   */
  static async bulkOperations(req: Request, res: Response): Promise<void> {
    try {
      const { type, policyIds, data } = req.body;

      // Validate request
      if (!type || !policyIds || !Array.isArray(policyIds)) {
        throw new ValidationError('Invalid bulk operation request', [
          { field: 'type', message: 'Operation type is required' },
          { field: 'policyIds', message: 'Policy IDs array is required' }
        ]);
      }

      if (policyIds.length === 0) {
        throw new ValidationError('Invalid bulk operation request', [
          { field: 'policyIds', message: 'At least one policy ID is required' }
        ]);
      }

      // Validate operation type
      const validTypes = ['delete', 'updateStatus'];
      if (!validTypes.includes(type)) {
        throw new ValidationError('Invalid operation type', [
          { field: 'type', message: `Type must be one of: ${validTypes.join(', ')}` }
        ]);
      }

      let result;
      
      switch (type) {
        case 'delete':
          result = await PoliciesController.bulkDelete(policyIds);
          break;
        case 'updateStatus':
          if (!data?.status || !['Active', 'Expired'].includes(data.status)) {
            throw new ValidationError('Invalid status for bulk update', [
              { field: 'status', message: 'Status must be either Active or Expired' }
            ]);
          }
          result = await PoliciesController.bulkUpdateStatus(policyIds, data.status);
          break;
        default:
          throw new ValidationError('Unsupported operation type', [
            { field: 'type', message: 'Operation type not supported' }
          ]);
      }

      // Log bulk operation activity
      await ActivityService.logBulkPolicyOperation(
        type,
        result.totalProcessed,
        result.successCount
      );

      // Trigger dashboard statistics refresh
      await StatsService.refreshDashboardStats();

      res.json({
        success: true,
        data: result,
        message: `Bulk ${type} operation completed`
      });
    } catch (error) {
      console.error('Error in bulk operation:', error);
      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * POST /api/policies/export
   * Export policies to CSV
   */
  static async exportPolicies(req: Request, res: Response): Promise<void> {
    try {
      const { policyIds, format = 'csv', includeClient = true, fields } = req.body;

      if (!policyIds || !Array.isArray(policyIds) || policyIds.length === 0) {
        throw new ValidationError('Invalid export request', [
          { field: 'policyIds', message: 'Policy IDs array is required' }
        ]);
      }

      if (format !== 'csv') {
        throw new ValidationError('Invalid export format', [
          { field: 'format', message: 'Only CSV format is currently supported' }
        ]);
      }

      // Get policies for export
      const policies = await prisma.policy.findMany({
        where: {
          id: { in: policyIds }
        },
        include: includeClient ? {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        } : undefined,
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Generate CSV
      const csvData = PoliciesController.generateCSV(policies, fields, includeClient);

      // Log export activity
      await ActivityService.logPolicyExport(policies.length, format.toUpperCase());

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="policies-export-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvData);
    } catch (error) {
      console.error('Error exporting policies:', error);
      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * Bulk delete policies
   */
  private static async bulkDelete(policyIds: string[]) {
    const results = {
      totalProcessed: policyIds.length,
      successCount: 0,
      failureCount: 0,
      failures: [] as { policyId: string; error: string }[]
    };

    // Use transaction for bulk operations
    await prisma.$transaction(async (tx) => {
      for (const policyId of policyIds) {
        try {
          // Check if policy exists
          const policy = await tx.policy.findUnique({
            where: { id: policyId },
            include: {
              client: {
                select: { name: true }
              }
            }
          });

          if (!policy) {
            results.failures.push({
              policyId,
              error: 'Policy not found'
            });
            results.failureCount++;
            continue;
          }

          // Delete policy
          await tx.policy.delete({
            where: { id: policyId }
          });

          // Log activity
          await ActivityService.logPolicyDeleted(policy.policyNumber, policy.client.name);
          
          results.successCount++;
        } catch (error) {
          results.failures.push({
            policyId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          results.failureCount++;
        }
      }
    });

    return results;
  }

  /**
   * Bulk update policy status
   */
  private static async bulkUpdateStatus(policyIds: string[], status: string) {
    const results = {
      totalProcessed: policyIds.length,
      successCount: 0,
      failureCount: 0,
      failures: [] as { policyId: string; error: string }[]
    };

    // Use transaction for bulk operations
    await prisma.$transaction(async (tx) => {
      for (const policyId of policyIds) {
        try {
          // Check if policy exists
          const policy = await tx.policy.findUnique({
            where: { id: policyId },
            include: {
              client: {
                select: { name: true }
              }
            }
          });

          if (!policy) {
            results.failures.push({
              policyId,
              error: 'Policy not found'
            });
            results.failureCount++;
            continue;
          }

          // Business rule validation
          if (policy.status === 'Expired' && status === 'Active') {
            results.failures.push({
              policyId,
              error: 'Cannot reactivate expired policy'
            });
            results.failureCount++;
            continue;
          }

          // Update policy status
          await tx.policy.update({
            where: { id: policyId },
            data: { status }
          });

          // Log activity
          await ActivityService.logPolicyStatusChanged(
            policy.policyNumber, 
            policy.client.name, 
            status
          );
          
          results.successCount++;
        } catch (error) {
          results.failures.push({
            policyId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          results.failureCount++;
        }
      }
    });

    return results;
  }

  /**
   * Generate CSV from policies data
   */
  private static generateCSV(policies: any[], fields?: string[], includeClient = true): string {
    if (policies.length === 0) {
      return 'No policies to export';
    }

    // Default fields
    const defaultFields = [
      'policyNumber',
      'policyType',
      'provider',
      'premiumAmount',
      'commissionAmount',
      'status',
      'startDate',
      'expiryDate',
      'createdAt'
    ];

    if (includeClient) {
      defaultFields.unshift('clientName', 'clientEmail', 'clientPhone');
    }

    const exportFields = fields || defaultFields;
    
    // Create CSV header
    const headers = exportFields.map(field => {
      switch (field) {
        case 'clientName': return 'Client Name';
        case 'clientEmail': return 'Client Email';
        case 'clientPhone': return 'Client Phone';
        case 'policyNumber': return 'Policy Number';
        case 'policyType': return 'Policy Type';
        case 'provider': return 'Provider';
        case 'premiumAmount': return 'Premium Amount';
        case 'commissionAmount': return 'Commission Amount';
        case 'status': return 'Status';
        case 'startDate': return 'Start Date';
        case 'expiryDate': return 'Expiry Date';
        case 'createdAt': return 'Created At';
        default: return field;
      }
    });

    // Create CSV rows
    const rows = policies.map(policy => {
      return exportFields.map(field => {
        let value: any;
        
        switch (field) {
          case 'clientName':
            value = policy.client?.name || '';
            break;
          case 'clientEmail':
            value = policy.client?.email || '';
            break;
          case 'clientPhone':
            value = policy.client?.phone || '';
            break;
          case 'startDate':
          case 'expiryDate':
          case 'createdAt':
            value = policy[field] ? new Date(policy[field]).toISOString().split('T')[0] : '';
            break;
          case 'premiumAmount':
          case 'commissionAmount':
            value = policy[field] ? policy[field].toFixed(2) : '0.00';
            break;
          default:
            value = policy[field] || '';
        }
        
        // Escape CSV values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        
        return value;
      });
    });

    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    
    return csvContent;
  }

  /**
   * Calculate enhanced policy statistics for policy page
   */
  private static async calculateEnhancedPolicyStats(where: Prisma.PolicyWhereInput = {}) {
    const [
      basicStats,
      topProviders,
      monthlyTrends,
      expiringCounts
    ] = await Promise.all([
      // Basic statistics
      PoliciesController.calculatePolicyStats(where),
      
      // Top providers
      prisma.policy.groupBy({
        by: ['provider'],
        where,
        _count: { provider: true },
        _sum: {
          premiumAmount: true,
          commissionAmount: true
        },
        orderBy: {
          _count: {
            provider: 'desc'
          }
        },
        take: 10
      }),
      
      // Monthly trends (last 12 months)
      PoliciesController.getMonthlyTrends(where),
      
      // Expiring policies counts
      Promise.all([
        // This month
        prisma.policy.count({
          where: {
            ...where,
            status: 'Active',
            expiryDate: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
              lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
            }
          }
        }),
        // Next 30 days
        prisma.policy.count({
          where: {
            ...where,
            status: 'Active',
            expiryDate: {
              gte: new Date(),
              lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
          }
        })
      ])
    ]);

    return {
      ...basicStats,
      topProviders: topProviders.map(provider => ({
        provider: provider.provider,
        count: provider._count.provider,
        totalPremium: provider._sum.premiumAmount || 0,
        totalCommission: provider._sum.commissionAmount || 0
      })),
      monthlyTrends,
      expiringThisMonth: expiringCounts[0],
      expiringNext30Days: expiringCounts[1]
    };
  }

  /**
   * Get monthly trends for the last 12 months
   */
  private static async getMonthlyTrends(where: Prisma.PolicyWhereInput = {}) {
    const trends = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const [newPolicies, expiredPolicies, aggregations] = await Promise.all([
        prisma.policy.count({
          where: {
            ...where,
            createdAt: {
              gte: monthStart,
              lt: monthEnd
            }
          }
        }),
        prisma.policy.count({
          where: {
            ...where,
            status: 'Expired',
            expiryDate: {
              gte: monthStart,
              lt: monthEnd
            }
          }
        }),
        prisma.policy.aggregate({
          where: {
            ...where,
            createdAt: {
              gte: monthStart,
              lt: monthEnd
            }
          },
          _sum: {
            premiumAmount: true,
            commissionAmount: true
          }
        })
      ]);
      
      trends.push({
        month: monthStart.toISOString().slice(0, 7), // YYYY-MM format
        newPolicies,
        expiredPolicies,
        totalPremium: aggregations._sum.premiumAmount || 0,
        totalCommission: aggregations._sum.commissionAmount || 0
      });
    }
    
    return trends;
  }

  /**
   * Calculate basic policy statistics
   */
  private static async calculatePolicyStats(where: Prisma.PolicyWhereInput = {}) {
    const [
      totalPolicies,
      activePolicies,
      expiredPolicies,
      aggregations,
      policiesByType,
      expiringPolicies
    ] = await Promise.all([
      // Total policies count
      prisma.policy.count({ where }),
      
      // Active policies count
      prisma.policy.count({ 
        where: { 
          ...where, 
          status: 'Active' 
        } 
      }),
      
      // Expired policies count
      prisma.policy.count({ 
        where: { 
          ...where, 
          status: 'Expired' 
        } 
      }),
      
      // Sum of premiums and commissions
      prisma.policy.aggregate({
        where,
        _sum: {
          premiumAmount: true,
          commissionAmount: true
        }
      }),
      
      // Policies by type
      prisma.policy.groupBy({
        by: ['policyType'],
        where,
        _count: {
          policyType: true
        }
      }),
      
      // Policies expiring within 30 days
      prisma.policy.findMany({
        where: {
          ...where,
          status: 'Active',
          expiryDate: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
          }
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          expiryDate: 'asc'
        }
      })
    ]);

    // Transform policies by type into a record
    const policiesByTypeRecord: Record<string, number> = {};
    policiesByType.forEach(item => {
      policiesByTypeRecord[item.policyType] = item._count.policyType;
    });

    return {
      totalPolicies,
      activePolicies,
      expiredPolicies,
      totalPremium: aggregations._sum.premiumAmount || 0,
      totalCommission: aggregations._sum.commissionAmount || 0,
      policiesByType: policiesByTypeRecord,
      expiringPolicies
    };
  }
}