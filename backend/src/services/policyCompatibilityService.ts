import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface PolicyCompatibilityMode {
  useTemplateSystem: boolean;
  allowFallback: boolean;
  migrateOnRead: boolean;
}

export interface UnifiedPolicyData {
  id: string;
  policyNumber: string;
  policyType: string;
  provider: string;
  description?: string;
  premiumAmount: number;
  status: string;
  startDate: Date;
  expiryDate: Date;
  commissionAmount: number;
  clientId: string;
  clientName?: string;
  clientEmail?: string | null;
  createdAt: Date;
  updatedAt: Date;
  isFromTemplate: boolean;
  templateId?: string;
  instanceId?: string;
}

/**
 * Service to provide backward compatibility during policy system migration
 */
export class PolicyCompatibilityService {
  private mode: PolicyCompatibilityMode;

  constructor(mode: PolicyCompatibilityMode = {
    useTemplateSystem: true,
    allowFallback: true,
    migrateOnRead: false
  }) {
    this.mode = mode;
  }

  /**
   * Get all policies for a client using unified interface
   */
  async getClientPolicies(clientId: string): Promise<UnifiedPolicyData[]> {
    const policies: UnifiedPolicyData[] = [];

    try {
      // Try template system first if enabled
      if (this.mode.useTemplateSystem) {
        const instances = await prisma.policyInstance.findMany({
          where: { clientId },
          include: {
            policyTemplate: true,
            client: true
          },
          orderBy: { createdAt: 'desc' }
        });

        policies.push(...instances.map(instance => ({
          id: instance.id,
          policyNumber: instance.policyTemplate.policyNumber,
          policyType: instance.policyTemplate.policyType,
          provider: instance.policyTemplate.provider,
          description: instance.policyTemplate.description || undefined,
          premiumAmount: instance.premiumAmount,
          status: instance.status,
          startDate: instance.startDate,
          expiryDate: instance.expiryDate,
          commissionAmount: instance.commissionAmount,
          clientId: instance.clientId,
          clientName: `${instance.client.firstName} ${instance.client.lastName}`,
          clientEmail: instance.client.email,
          createdAt: instance.createdAt,
          updatedAt: instance.updatedAt,
          isFromTemplate: true,
          templateId: instance.policyTemplateId,
          instanceId: instance.id
        })));
      }

      // Fallback to old system if enabled and no template data found
      if (this.mode.allowFallback && (policies.length === 0 || !this.mode.useTemplateSystem)) {
        const oldPolicies = await prisma.policy.findMany({
          where: { clientId },
          include: { client: true },
          orderBy: { createdAt: 'desc' }
        });

        const oldPolicyData = oldPolicies.map(policy => ({
          id: policy.id,
          policyNumber: policy.policyNumber,
          policyType: policy.policyType,
          provider: policy.provider,
          description: undefined,
          premiumAmount: policy.premiumAmount,
          status: policy.status,
          startDate: policy.startDate,
          expiryDate: policy.expiryDate,
          commissionAmount: policy.commissionAmount,
          clientId: policy.clientId,
          clientName: `${policy.client.firstName} ${policy.client.lastName}`,
          clientEmail: policy.client.email,
          createdAt: policy.createdAt,
          updatedAt: policy.updatedAt,
          isFromTemplate: false,
          templateId: undefined,
          instanceId: undefined
        }));

        // If migrate on read is enabled, migrate these policies
        if (this.mode.migrateOnRead && oldPolicyData.length > 0) {
          await this.migrateClientPoliciesOnRead(clientId, oldPolicies);
          // Recursively call to get migrated data
          return this.getClientPolicies(clientId);
        }

        policies.push(...oldPolicyData);
      }

      return policies;

    } catch (error) {
      logger.error('Error getting client policies:', error);
      throw error;
    }
  }

  /**
   * Get all policies across the system using unified interface
   */
  async getAllPolicies(options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    policyType?: string;
    provider?: string;
  } = {}): Promise<{
    policies: UnifiedPolicyData[];
    total: number;
    hasMore: boolean;
  }> {
    const { page = 1, limit = 50, search, status, policyType, provider } = options;
    const offset = (page - 1) * limit;
    
    let policies: UnifiedPolicyData[] = [];
    let total = 0;

    try {
      // Build where clause for filtering
      const buildWhereClause = () => {
        const where: any = {};
        
        if (status) where.status = status;
        
        if (search) {
          where.OR = [
            { policyNumber: { contains: search, mode: 'insensitive' } },
            { provider: { contains: search, mode: 'insensitive' } }
          ];
        }
        
        if (policyType) where.policyType = policyType;
        if (provider) where.provider = provider;
        
        return where;
      };

      // Try template system first
      if (this.mode.useTemplateSystem) {
        const instanceWhere = buildWhereClause();
        
        // For template system, we need to filter on both template and instance fields
        const templateWhere: any = {};
        if (search) {
          templateWhere.OR = [
            { policyNumber: { contains: search, mode: 'insensitive' } },
            { provider: { contains: search, mode: 'insensitive' } }
          ];
        }
        if (policyType) templateWhere.policyType = policyType;
        if (provider) templateWhere.provider = provider;

        const instances = await prisma.policyInstance.findMany({
          where: {
            ...instanceWhere,
            policyTemplate: Object.keys(templateWhere).length > 0 ? templateWhere : undefined
          },
          include: {
            policyTemplate: true,
            client: true
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit
        });

        const instanceCount = await prisma.policyInstance.count({
          where: {
            ...instanceWhere,
            policyTemplate: Object.keys(templateWhere).length > 0 ? templateWhere : undefined
          }
        });

        policies = instances.map(instance => ({
          id: instance.id,
          policyNumber: instance.policyTemplate.policyNumber,
          policyType: instance.policyTemplate.policyType,
          provider: instance.policyTemplate.provider,
          description: instance.policyTemplate.description || undefined,
          premiumAmount: instance.premiumAmount,
          status: instance.status,
          startDate: instance.startDate,
          expiryDate: instance.expiryDate,
          commissionAmount: instance.commissionAmount,
          clientId: instance.clientId,
          clientName: `${instance.client.firstName} ${instance.client.lastName}`,
          clientEmail: instance.client.email,
          createdAt: instance.createdAt,
          updatedAt: instance.updatedAt,
          isFromTemplate: true,
          templateId: instance.policyTemplateId,
          instanceId: instance.id
        }));

        total = instanceCount;
      }

      // Fallback to old system if needed
      if (this.mode.allowFallback && (policies.length === 0 || !this.mode.useTemplateSystem)) {
        const where = buildWhereClause();
        
        const oldPolicies = await prisma.policy.findMany({
          where,
          include: { client: true },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit
        });

        const oldPolicyCount = await prisma.policy.count({ where });

        const oldPolicyData = oldPolicies.map(policy => ({
          id: policy.id,
          policyNumber: policy.policyNumber,
          policyType: policy.policyType,
          provider: policy.provider,
          description: undefined,
          premiumAmount: policy.premiumAmount,
          status: policy.status,
          startDate: policy.startDate,
          expiryDate: policy.expiryDate,
          commissionAmount: policy.commissionAmount,
          clientId: policy.clientId,
          clientName: `${policy.client.firstName} ${policy.client.lastName}`,
          clientEmail: policy.client.email,
          createdAt: policy.createdAt,
          updatedAt: policy.updatedAt,
          isFromTemplate: false,
          templateId: undefined,
          instanceId: undefined
        }));

        if (this.mode.useTemplateSystem) {
          // Combine with template system results
          policies.push(...oldPolicyData);
          total += oldPolicyCount;
        } else {
          policies = oldPolicyData;
          total = oldPolicyCount;
        }
      }

      return {
        policies,
        total,
        hasMore: offset + policies.length < total
      };

    } catch (error) {
      logger.error('Error getting all policies:', error);
      throw error;
    }
  }

  /**
   * Create a new policy using the appropriate system
   */
  async createPolicy(data: {
    policyNumber: string;
    policyType: string;
    provider: string;
    description?: string;
    premiumAmount: number;
    startDate: Date;
    expiryDate: Date;
    commissionAmount: number;
    clientId: string;
  }): Promise<UnifiedPolicyData> {
    try {
      if (this.mode.useTemplateSystem) {
        // Create or find template
        let template = await prisma.policyTemplate.findFirst({
          where: {
            policyNumber: data.policyNumber,
            policyType: data.policyType,
            provider: data.provider
          }
        });

        if (!template) {
          template = await prisma.policyTemplate.create({
            data: {
              policyNumber: data.policyNumber,
              policyType: data.policyType,
              provider: data.provider,
              description: data.description
            }
          });
        }

        // Create instance
        const instance = await prisma.policyInstance.create({
          data: {
            policyTemplateId: template.id,
            clientId: data.clientId,
            premiumAmount: data.premiumAmount,
            startDate: data.startDate,
            expiryDate: data.expiryDate,
            commissionAmount: data.commissionAmount,
            status: 'Active'
          },
          include: {
            policyTemplate: true,
            client: true
          }
        });

        return {
          id: instance.id,
          policyNumber: instance.policyTemplate.policyNumber,
          policyType: instance.policyTemplate.policyType,
          provider: instance.policyTemplate.provider,
          description: instance.policyTemplate.description || undefined,
          premiumAmount: instance.premiumAmount,
          status: instance.status,
          startDate: instance.startDate,
          expiryDate: instance.expiryDate,
          commissionAmount: instance.commissionAmount,
          clientId: instance.clientId,
          clientName: `${instance.client.firstName} ${instance.client.lastName}`,
          clientEmail: instance.client.email,
          createdAt: instance.createdAt,
          updatedAt: instance.updatedAt,
          isFromTemplate: true,
          templateId: instance.policyTemplateId,
          instanceId: instance.id
        };

      } else {
        // Use old system
        const policy = await prisma.policy.create({
          data: {
            policyNumber: data.policyNumber,
            policyType: data.policyType,
            provider: data.provider,
            premiumAmount: data.premiumAmount,
            startDate: data.startDate,
            expiryDate: data.expiryDate,
            commissionAmount: data.commissionAmount,
            clientId: data.clientId,
            status: 'Active'
          },
          include: { client: true }
        });

        return {
          id: policy.id,
          policyNumber: policy.policyNumber,
          policyType: policy.policyType,
          provider: policy.provider,
          description: undefined,
          premiumAmount: policy.premiumAmount,
          status: policy.status,
          startDate: policy.startDate,
          expiryDate: policy.expiryDate,
          commissionAmount: policy.commissionAmount,
          clientId: policy.clientId,
          clientName: `${policy.client.firstName} ${policy.client.lastName}`,
          clientEmail: policy.client.email,
          createdAt: policy.createdAt,
          updatedAt: policy.updatedAt,
          isFromTemplate: false,
          templateId: undefined,
          instanceId: undefined
        };
      }

    } catch (error) {
      logger.error('Error creating policy:', error);
      throw error;
    }
  }

  /**
   * Update a policy using the appropriate system
   */
  async updatePolicy(id: string, data: Partial<{
    premiumAmount: number;
    startDate: Date;
    expiryDate: Date;
    commissionAmount: number;
    status: string;
  }>): Promise<UnifiedPolicyData> {
    try {
      // Try to find in template system first
      const instance = await prisma.policyInstance.findUnique({
        where: { id },
        include: {
          policyTemplate: true,
          client: true
        }
      });

      if (instance) {
        const updated = await prisma.policyInstance.update({
          where: { id },
          data,
          include: {
            policyTemplate: true,
            client: true
          }
        });

        return {
          id: updated.id,
          policyNumber: updated.policyTemplate.policyNumber,
          policyType: updated.policyTemplate.policyType,
          provider: updated.policyTemplate.provider,
          description: updated.policyTemplate.description || undefined,
          premiumAmount: updated.premiumAmount,
          status: updated.status,
          startDate: updated.startDate,
          expiryDate: updated.expiryDate,
          commissionAmount: updated.commissionAmount,
          clientId: updated.clientId,
          clientName: `${updated.client.firstName} ${updated.client.lastName}`,
          clientEmail: updated.client.email,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
          isFromTemplate: true,
          templateId: updated.policyTemplateId,
          instanceId: updated.id
        };
      }

      // Fallback to old system
      if (this.mode.allowFallback) {
        const policy = await prisma.policy.findUnique({
          where: { id },
          include: { client: true }
        });

        if (policy) {
          const updated = await prisma.policy.update({
            where: { id },
            data,
            include: { client: true }
          });

          return {
            id: updated.id,
            policyNumber: updated.policyNumber,
            policyType: updated.policyType,
            provider: updated.provider,
            description: undefined,
            premiumAmount: updated.premiumAmount,
            status: updated.status,
            startDate: updated.startDate,
            expiryDate: updated.expiryDate,
            commissionAmount: updated.commissionAmount,
            clientId: updated.clientId,
            clientName: `${updated.client.firstName} ${updated.client.lastName}`,
            clientEmail: updated.client.email,
            createdAt: updated.createdAt,
            updatedAt: updated.updatedAt,
            isFromTemplate: false,
            templateId: undefined,
            instanceId: undefined
          };
        }
      }

      throw new Error(`Policy with id ${id} not found`);

    } catch (error) {
      logger.error('Error updating policy:', error);
      throw error;
    }
  }

  /**
   * Delete a policy using the appropriate system
   */
  async deletePolicy(id: string): Promise<void> {
    try {
      // Try template system first
      const instance = await prisma.policyInstance.findUnique({ where: { id } });
      
      if (instance) {
        await prisma.policyInstance.delete({ where: { id } });
        return;
      }

      // Fallback to old system
      if (this.mode.allowFallback) {
        const policy = await prisma.policy.findUnique({ where: { id } });
        
        if (policy) {
          await prisma.policy.delete({ where: { id } });
          return;
        }
      }

      throw new Error(`Policy with id ${id} not found`);

    } catch (error) {
      logger.error('Error deleting policy:', error);
      throw error;
    }
  }

  /**
   * Migrate specific client policies on read
   */
  private async migrateClientPoliciesOnRead(clientId: string, policies: any[]): Promise<void> {
    try {
      logger.info(`Migrating ${policies.length} policies for client ${clientId} on read`);

      for (const policy of policies) {
        // Create or find template
        let template = await prisma.policyTemplate.findFirst({
          where: {
            policyNumber: policy.policyNumber,
            policyType: policy.policyType,
            provider: policy.provider
          }
        });

        if (!template) {
          template = await prisma.policyTemplate.create({
            data: {
              policyNumber: policy.policyNumber,
              policyType: policy.policyType,
              provider: policy.provider,
              description: `Migrated from policy ${policy.policyNumber}`,
              createdAt: policy.createdAt,
              updatedAt: policy.updatedAt
            }
          });
        }

        // Create instance
        await prisma.policyInstance.create({
          data: {
            policyTemplateId: template.id,
            clientId: policy.clientId,
            premiumAmount: policy.premiumAmount,
            status: policy.status,
            startDate: policy.startDate,
            expiryDate: policy.expiryDate,
            commissionAmount: policy.commissionAmount,
            createdAt: policy.createdAt,
            updatedAt: policy.updatedAt
          }
        });

        // Delete old policy
        await prisma.policy.delete({ where: { id: policy.id } });
      }

      logger.info(`Successfully migrated ${policies.length} policies for client ${clientId}`);

    } catch (error) {
      logger.error('Error migrating client policies on read:', error);
      throw error;
    }
  }

  /**
   * Get system status and compatibility mode
   */
  getSystemStatus(): {
    mode: PolicyCompatibilityMode;
    description: string;
  } {
    let description = '';
    
    if (this.mode.useTemplateSystem && this.mode.allowFallback) {
      description = 'Hybrid mode: Using template system with old system fallback';
    } else if (this.mode.useTemplateSystem) {
      description = 'Template mode: Using new PolicyTemplate/PolicyInstance system only';
    } else {
      description = 'Legacy mode: Using old Policy system only';
    }

    if (this.mode.migrateOnRead) {
      description += ' (with automatic migration on read)';
    }

    return {
      mode: this.mode,
      description
    };
  }
}