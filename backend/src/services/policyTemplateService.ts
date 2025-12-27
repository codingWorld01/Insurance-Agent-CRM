import { prisma } from './database';
import { ActivityService } from './activityService';
import { StatsService } from './statsService';
import { PolicyTemplateStatsService } from './policyTemplateStatsService';
import { cacheService } from './cacheService';
import { Prisma } from '@prisma/client';
import { 
  ValidationError,
  NotFoundError,
  ConflictError 
} from '../utils/errorHandler';

export interface PolicyTemplateFilters {
  search?: string;
  policyTypes?: string[];
  providers?: string[];
  hasInstances?: boolean;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface PolicyTemplateSearchResult {
  id: string;
  policyNumber: string;
  policyType: string;
  provider: string;
  description?: string;
  instanceCount: number;
}

export interface CreatePolicyTemplateRequest {
  policyNumber: string;
  policyType: string;
  provider: string;
  description?: string;
}

export interface UpdatePolicyTemplateRequest {
  policyNumber?: string;
  policyType?: string;
  provider?: string;
  description?: string;
}

export class PolicyTemplateService {
  /**
   * Get policy templates with advanced filtering and pagination
   */
  static async getTemplatesWithFilters(
    filters: PolicyTemplateFilters,
    pagination: PaginationOptions
  ) {
    // Create cache key from filters and pagination
    const filtersKey = JSON.stringify(filters);
    const sortKey = `${pagination.sortField || 'policyNumber'}_${pagination.sortDirection || 'asc'}`;
    
    // Try to get from cache first
    const cachedResult = cacheService.getPolicyTemplatesList(
      filtersKey, 
      sortKey, 
      pagination.page, 
      pagination.limit
    );
    
    if (cachedResult) {
      return cachedResult;
    }
    // Build where clause
    const where: Prisma.PolicyTemplateWhereInput = {};
    
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.trim();
      where.OR = [
        { policyNumber: { contains: searchTerm, mode: 'insensitive' } },
        { provider: { contains: searchTerm, mode: 'insensitive' } },
        { policyType: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }

    // Policy types filter
    if (filters.policyTypes && filters.policyTypes.length > 0) {
      where.policyType = { in: filters.policyTypes };
    }

    // Providers filter
    if (filters.providers && filters.providers.length > 0) {
      where.provider = { in: filters.providers };
    }

    // Has instances filter
    if (filters.hasInstances !== undefined) {
      if (filters.hasInstances) {
        where.instances = { some: {} };
      } else {
        where.instances = { none: {} };
      }
    }

    // Build sort order
    const validSortFields = ['policyNumber', 'policyType', 'provider', 'createdAt'];
    let orderBy: any = { policyNumber: 'asc' };
    
    if (pagination.sortField && validSortFields.includes(pagination.sortField)) {
      const direction = pagination.sortDirection === 'desc' ? 'desc' : 'asc';
      orderBy = { [pagination.sortField]: direction };
    }

    const skip = (pagination.page - 1) * pagination.limit;

    // Get templates and total count
    const [templates, total] = await Promise.all([
      prisma.policyTemplate.findMany({
        where,
        include: {
          _count: {
            select: {
              instances: true
            }
          },
          instances: {
            select: {
              status: true
            }
          }
        },
        orderBy,
        skip,
        take: pagination.limit
      }),
      prisma.policyTemplate.count({ where })
    ]);

    // Transform templates to include computed fields
    const templatesWithCounts = templates.map(template => ({
      id: template.id,
      policyNumber: template.policyNumber,
      policyType: template.policyType,
      provider: template.provider,
      description: template.description,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
      instanceCount: template._count.instances,
      activeInstanceCount: template.instances.filter(instance => instance.status === 'Active').length
    }));

    // Calculate statistics using the dedicated stats service
    const stats = await PolicyTemplateStatsService.calculatePolicyTemplateStats(where);

    const result = {
      templates: templatesWithCounts,
      stats,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit)
      }
    };



    // Cache the result
    cacheService.setPolicyTemplatesList(filtersKey, sortKey, pagination.page, pagination.limit, result);

    return result;
  }

  /**
   * Create a new policy template
   */
  static async createTemplate(data: CreatePolicyTemplateRequest) {
    // Validate policy type
    const validTypes = ['Life', 'Health', 'Auto', 'Home', 'Business'];
    if (!validTypes.includes(data.policyType)) {
      throw new ValidationError('Invalid policy type', [
        { field: 'policyType', message: `Policy type must be one of: ${validTypes.join(', ')}` }
      ]);
    }

    // Check for duplicate policy number
    const existingTemplate = await prisma.policyTemplate.findUnique({
      where: { policyNumber: data.policyNumber }
    });

    if (existingTemplate) {
      throw new ConflictError('Policy template with this number already exists');
    }

    // Create template
    const template = await prisma.policyTemplate.create({
      data: {
        policyNumber: data.policyNumber.trim(),
        policyType: data.policyType,
        provider: data.provider.trim(),
        description: data.description?.trim() || null
      }
    });

    // Log activity
    await ActivityService.logPolicyTemplateCreated(template.policyNumber, template.provider);

    // Invalidate caches
    cacheService.invalidatePolicyTemplateCache();

    // Trigger dashboard statistics refresh
    await StatsService.refreshDashboardStats();

    return template;
  }

  /**
   * Update a policy template
   */
  static async updateTemplate(id: string, data: UpdatePolicyTemplateRequest) {
    // Check if template exists
    const existingTemplate = await prisma.policyTemplate.findUnique({
      where: { id }
    });

    if (!existingTemplate) {
      throw new NotFoundError('Policy template not found');
    }

    // Validate policy type if provided
    if (data.policyType) {
      const validTypes = ['Life', 'Health', 'Auto', 'Home', 'Business'];
      if (!validTypes.includes(data.policyType)) {
        throw new ValidationError('Invalid policy type', [
          { field: 'policyType', message: `Policy type must be one of: ${validTypes.join(', ')}` }
        ]);
      }
    }

    // Check for duplicate policy number if it's being changed
    if (data.policyNumber && data.policyNumber !== existingTemplate.policyNumber) {
      const duplicateTemplate = await prisma.policyTemplate.findUnique({
        where: { policyNumber: data.policyNumber }
      });

      if (duplicateTemplate) {
        throw new ConflictError('Policy template with this number already exists');
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (data.policyNumber) updateData.policyNumber = data.policyNumber.trim();
    if (data.policyType) updateData.policyType = data.policyType;
    if (data.provider) updateData.provider = data.provider.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;

    // Update template
    const updatedTemplate = await prisma.policyTemplate.update({
      where: { id },
      data: updateData
    });

    // Log activity
    await ActivityService.logPolicyTemplateUpdated(
      updatedTemplate.policyNumber, 
      updatedTemplate.provider
    );

    // Invalidate caches
    cacheService.invalidatePolicyTemplateCache();

    // Trigger dashboard statistics refresh
    await StatsService.refreshDashboardStats();

    return updatedTemplate;
  }

  /**
   * Delete a policy template
   */
  static async deleteTemplate(id: string) {
    // Check if template exists and get instance count
    const existingTemplate = await prisma.policyTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            instances: true
          }
        }
      }
    });

    if (!existingTemplate) {
      throw new NotFoundError('Policy template not found');
    }

    const affectedClients = existingTemplate._count.instances;

    // Delete template (instances will be cascade deleted)
    await prisma.policyTemplate.delete({
      where: { id }
    });

    // Log activity
    await ActivityService.logPolicyTemplateDeleted(
      existingTemplate.policyNumber, 
      existingTemplate.provider,
      affectedClients
    );

    // Invalidate caches
    cacheService.invalidatePolicyTemplateCache();

    // Trigger dashboard statistics refresh
    await StatsService.refreshDashboardStats();

    return {
      success: true,
      affectedClients
    };
  }

  /**
   * Search policy templates
   */
  static async searchTemplates(
    query: string,
    excludeClientId?: string,
    limit: number = 20
  ): Promise<PolicyTemplateSearchResult[]> {
    // Try to get from cache first
    const cachedResults = cacheService.getPolicyTemplateSearch(query, excludeClientId);
    if (cachedResults) {
      return cachedResults.slice(0, limit);
    }
    // Build where clause
    const where: Prisma.PolicyTemplateWhereInput = {
      OR: [
        {
          policyNumber: {
            contains: query,
            mode: 'insensitive'
          }
        },
        {
          provider: {
            contains: query,
            mode: 'insensitive'
          }
        },
        {
          policyType: {
            contains: query,
            mode: 'insensitive'
          }
        }
      ]
    };

    // Exclude templates already associated with a specific client
    if (excludeClientId) {
      where.instances = {
        none: {
          clientId: excludeClientId
        }
      };
    }
    
    const templates = await prisma.policyTemplate.findMany({
      where,
      include: {
        _count: {
          select: {
            instances: true
          }
        }
      },
      orderBy: {
        policyNumber: 'asc'
      },
      take: Math.min(limit, 50)
    });

    // Transform to search result format
    const results = templates.map(template => ({
      id: template.id,
      policyNumber: template.policyNumber,
      policyType: template.policyType,
      provider: template.provider,
      description: template.description || undefined,
      instanceCount: template._count.instances
    }));

    // Cache the results
    cacheService.setPolicyTemplateSearch(query, results, excludeClientId);

    return results;
  }

  /**
   * Get template with details
   */
  static async getTemplateById(id: string) {
    const template = await prisma.policyTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            instances: true
          }
        },
        instances: {
          select: {
            status: true
          }
        }
      }
    });

    if (!template) {
      throw new NotFoundError('Policy template not found');
    }

    // Transform to include computed fields
    return {
      id: template.id,
      policyNumber: template.policyNumber,
      policyType: template.policyType,
      provider: template.provider,
      description: template.description,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
      instanceCount: template._count.instances,
      activeInstanceCount: template.instances.filter(instance => instance.status === 'Active').length
    };
  }

  /**
   * Get template clients with statistics
   */
  static async getTemplateClients(id: string) {
    const template = await prisma.policyTemplate.findUnique({
      where: { id },
      include: {
        instances: {
          include: {
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true
              }
            }
          },
          orderBy: {
            startDate: 'desc'
          }
        }
      }
    });

    if (!template) {
      throw new NotFoundError('Policy template not found');
    }

    // Calculate template-specific statistics using the dedicated stats service
    const stats = await PolicyTemplateStatsService.calculatePolicyDetailStats(id);

    // Transform instances
    const instances = template.instances.map(instance => ({
      id: instance.id,
      premiumAmount: instance.premiumAmount,
      status: instance.status,
      startDate: instance.startDate,
      expiryDate: instance.expiryDate,
      commissionAmount: instance.commissionAmount,
      createdAt: instance.createdAt,
      updatedAt: instance.updatedAt,
      client: {
        id: instance.client.id,
        firstName: instance.client.firstName,
        lastName: instance.client.lastName,
        email: instance.client.email,
        phone: instance.client.phoneNumber
      }
    }));

    return {
      template: {
        id: template.id,
        policyNumber: template.policyNumber,
        policyType: template.policyType,
        provider: template.provider,
        description: template.description,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt
      },
      instances,
      stats
    };
  }

  /**
   * Get available filter options
   */
  static async getAvailableFilters() {
    // Try to get from cache first
    const cachedFilters = cacheService.getPolicyTemplateFilters();
    if (cachedFilters) {
      return cachedFilters;
    }
    const [providers, policyTypes] = await Promise.all([
      // Available providers
      prisma.policyTemplate.findMany({
        select: { provider: true },
        distinct: ['provider'],
        orderBy: { provider: 'asc' }
      }).then(results => results.map(r => r.provider)),
      
      // Available policy types
      prisma.policyTemplate.findMany({
        select: { policyType: true },
        distinct: ['policyType'],
        orderBy: { policyType: 'asc' }
      }).then(results => results.map(r => r.policyType))
    ]);

    const filters = {
      availableProviders: providers,
      availablePolicyTypes: policyTypes
    };

    // Cache the filters
    cacheService.setPolicyTemplateFilters(filters);

    return filters;
  }


}