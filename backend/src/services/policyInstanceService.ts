import { prisma } from './database';
import { ActivityService } from './activityService';
import { StatsService } from './statsService';
import { cacheService } from './cacheService';
import { 
  ValidationError,
  NotFoundError,
  ConflictError 
} from '../utils/errorHandler';

export interface CreatePolicyInstanceRequest {
  policyTemplateId: string;
  clientId: string;
  premiumAmount: number;
  startDate: string;
  durationMonths: number;
  commissionAmount: number;
}

export interface UpdatePolicyInstanceRequest {
  premiumAmount?: number;
  startDate?: string;
  durationMonths?: number;
  expiryDate?: string;
  commissionAmount?: number;
  status?: 'Active' | 'Expired';
}

export interface PolicyInstanceWithTemplate {
  id: string;
  premiumAmount: number;
  status: string;
  startDate: Date;
  expiryDate: Date;
  commissionAmount: number;
  createdAt: Date;
  updatedAt: Date;
  policyTemplate: {
    id: string;
    policyNumber: string;
    policyType: string;
    provider: string;
  };
}

export interface PolicyInstanceWithClient {
  id: string;
  premiumAmount: number;
  status: string;
  startDate: Date;
  expiryDate: Date;
  commissionAmount: number;
  createdAt: Date;
  updatedAt: Date;
  client: {
    id: string;
    name: string;
    email: string;
  };
}

export class PolicyInstanceService {
  /**
   * Create a new policy instance for a client
   */
  static async createInstance(
    clientId: string,
    data: CreatePolicyInstanceRequest
  ): Promise<PolicyInstanceWithTemplate> {
    // Validate that client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, name: true }
    });

    if (!client) {
      throw new NotFoundError('Client not found');
    }

    // Validate that policy template exists
    const policyTemplate = await prisma.policyTemplate.findUnique({
      where: { id: data.policyTemplateId },
      select: { id: true, policyNumber: true, policyType: true, provider: true }
    });

    if (!policyTemplate) {
      throw new NotFoundError('Policy template not found');
    }

    // Check for duplicate client-template association
    const existingInstance = await prisma.policyInstance.findUnique({
      where: {
        policyTemplateId_clientId: {
          policyTemplateId: data.policyTemplateId,
          clientId: clientId
        }
      }
    });

    if (existingInstance) {
      throw new ConflictError('Client already has this policy template');
    }

    // Validate amounts
    if (data.premiumAmount <= 0) {
      throw new ValidationError('Invalid premium amount', [
        { field: 'premiumAmount', message: 'Premium amount must be greater than 0' }
      ]);
    }

    if (data.commissionAmount < 0) {
      throw new ValidationError('Invalid commission amount', [
        { field: 'commissionAmount', message: 'Commission amount cannot be negative' }
      ]);
    }

    // Validate duration
    if (data.durationMonths <= 0 || data.durationMonths > 120) {
      throw new ValidationError('Invalid duration', [
        { field: 'durationMonths', message: 'Duration must be between 1 and 120 months' }
      ]);
    }

    // Parse and validate start date
    const startDate = new Date(data.startDate);
    if (isNaN(startDate.getTime())) {
      throw new ValidationError('Invalid start date', [
        { field: 'startDate', message: 'Start date must be a valid date' }
      ]);
    }

    // Calculate expiry date
    const expiryDate = new Date(startDate);
    expiryDate.setMonth(expiryDate.getMonth() + data.durationMonths);

    // Validate that expiry date is after start date
    if (expiryDate <= startDate) {
      throw new ValidationError('Invalid date range', [
        { field: 'expiryDate', message: 'Expiry date must be after start date' }
      ]);
    }

    // Create policy instance
    const instance = await prisma.policyInstance.create({
      data: {
        policyTemplateId: data.policyTemplateId,
        clientId: clientId,
        premiumAmount: data.premiumAmount,
        startDate: startDate,
        expiryDate: expiryDate,
        commissionAmount: data.commissionAmount,
        status: 'Active'
      },
      include: {
        policyTemplate: {
          select: {
            id: true,
            policyNumber: true,
            policyType: true,
            provider: true
          }
        }
      }
    });

    // Log activity
    await ActivityService.logPolicyInstanceCreated(
      policyTemplate.policyNumber,
      client.name
    );

    // Invalidate caches
    cacheService.invalidatePolicyTemplateCache();
    cacheService.invalidatePolicyDetailCache(data.policyTemplateId);

    // Update dashboard statistics
    await StatsService.refreshDashboardStats();

    return instance;
  }

  /**
   * Update a policy instance
   */
  static async updateInstance(
    id: string,
    data: UpdatePolicyInstanceRequest
  ): Promise<PolicyInstanceWithTemplate> {
    // Check if instance exists
    const existingInstance = await prisma.policyInstance.findUnique({
      where: { id },
      include: {
        policyTemplate: {
          select: {
            id: true,
            policyNumber: true,
            policyType: true,
            provider: true
          }
        },
        client: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!existingInstance) {
      throw new NotFoundError('Policy instance not found');
    }

    // Prepare update data
    const updateData: any = {};

    // Validate and set premium amount
    if (data.premiumAmount !== undefined) {
      if (data.premiumAmount <= 0) {
        throw new ValidationError('Invalid premium amount', [
          { field: 'premiumAmount', message: 'Premium amount must be greater than 0' }
        ]);
      }
      updateData.premiumAmount = data.premiumAmount;
    }

    // Validate and set commission amount
    if (data.commissionAmount !== undefined) {
      if (data.commissionAmount < 0) {
        throw new ValidationError('Invalid commission amount', [
          { field: 'commissionAmount', message: 'Commission amount cannot be negative' }
        ]);
      }
      updateData.commissionAmount = data.commissionAmount;
    }

    // Handle date updates
    let newStartDate = existingInstance.startDate;
    let newExpiryDate = existingInstance.expiryDate;

    // Update start date if provided
    if (data.startDate) {
      newStartDate = new Date(data.startDate);
      if (isNaN(newStartDate.getTime())) {
        throw new ValidationError('Invalid start date', [
          { field: 'startDate', message: 'Start date must be a valid date' }
        ]);
      }
      updateData.startDate = newStartDate;
    }

    // Handle duration-based expiry calculation or direct expiry date
    if (data.durationMonths !== undefined) {
      if (data.durationMonths <= 0 || data.durationMonths > 120) {
        throw new ValidationError('Invalid duration', [
          { field: 'durationMonths', message: 'Duration must be between 1 and 120 months' }
        ]);
      }
      
      // Calculate new expiry date from start date and duration
      newExpiryDate = new Date(newStartDate);
      newExpiryDate.setMonth(newExpiryDate.getMonth() + data.durationMonths);
      updateData.expiryDate = newExpiryDate;
    } else if (data.expiryDate) {
      // Direct expiry date update
      newExpiryDate = new Date(data.expiryDate);
      if (isNaN(newExpiryDate.getTime())) {
        throw new ValidationError('Invalid expiry date', [
          { field: 'expiryDate', message: 'Expiry date must be a valid date' }
        ]);
      }
      updateData.expiryDate = newExpiryDate;
    }

    // Validate date range
    if (newExpiryDate <= newStartDate) {
      throw new ValidationError('Invalid date range', [
        { field: 'expiryDate', message: 'Expiry date must be after start date' }
      ]);
    }

    // Update status if provided
    if (data.status !== undefined) {
      const validStatuses = ['Active', 'Expired'];
      if (!validStatuses.includes(data.status)) {
        throw new ValidationError('Invalid status', [
          { field: 'status', message: `Status must be one of: ${validStatuses.join(', ')}` }
        ]);
      }
      updateData.status = data.status;
    }

    // Update instance
    const updatedInstance = await prisma.policyInstance.update({
      where: { id },
      data: updateData,
      include: {
        policyTemplate: {
          select: {
            id: true,
            policyNumber: true,
            policyType: true,
            provider: true
          }
        }
      }
    });

    // Log activity
    await ActivityService.logPolicyInstanceUpdated(
      existingInstance.policyTemplate.policyNumber,
      existingInstance.client.name
    );

    // Invalidate caches
    cacheService.invalidatePolicyDetailCache(existingInstance.policyTemplateId);
    if (data.status !== undefined) {
      cacheService.invalidatePolicyTemplateCache();
    }

    // Update dashboard statistics if status changed
    if (data.status !== undefined) {
      await StatsService.refreshDashboardStats();
    }

    return updatedInstance;
  }

  /**
   * Delete a policy instance
   */
  static async deleteInstance(id: string): Promise<void> {
    // Check if instance exists and get related data for logging
    const existingInstance = await prisma.policyInstance.findUnique({
      where: { id },
      include: {
        policyTemplate: {
          select: {
            policyNumber: true
          }
        },
        client: {
          select: {
            name: true
          }
        }
      }
    });

    if (!existingInstance) {
      throw new NotFoundError('Policy instance not found');
    }

    // Delete instance
    await prisma.policyInstance.delete({
      where: { id }
    });

    // Log activity
    await ActivityService.logPolicyInstanceDeleted(
      existingInstance.policyTemplate.policyNumber,
      existingInstance.client.name
    );

    // Invalidate caches
    cacheService.invalidatePolicyTemplateCache();
    cacheService.invalidatePolicyDetailCache(existingInstance.policyTemplateId);

    // Update dashboard statistics
    await StatsService.refreshDashboardStats();
  }

  /**
   * Get policy instances by template ID
   */
  static async getInstancesByTemplate(templateId: string): Promise<PolicyInstanceWithClient[]> {
    const instances = await prisma.policyInstance.findMany({
      where: { policyTemplateId: templateId },
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
        startDate: 'desc'
      }
    });

    return instances;
  }

  /**
   * Get policy instances by client ID
   */
  static async getInstancesByClient(clientId: string): Promise<PolicyInstanceWithTemplate[]> {
    const instances = await prisma.policyInstance.findMany({
      where: { clientId },
      include: {
        policyTemplate: {
          select: {
            id: true,
            policyNumber: true,
            policyType: true,
            provider: true
          }
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    return instances;
  }

  /**
   * Get a single policy instance by ID
   */
  static async getInstanceById(id: string): Promise<PolicyInstanceWithTemplate> {
    const instance = await prisma.policyInstance.findUnique({
      where: { id },
      include: {
        policyTemplate: {
          select: {
            id: true,
            policyNumber: true,
            policyType: true,
            provider: true
          }
        }
      }
    });

    if (!instance) {
      throw new NotFoundError('Policy instance not found');
    }

    return instance;
  }

  /**
   * Update policy instance status (for expiry management)
   */
  static async updateInstanceStatus(id: string, status: 'Active' | 'Expired'): Promise<void> {
    const existingInstance = await prisma.policyInstance.findUnique({
      where: { id },
      include: {
        policyTemplate: {
          select: {
            policyNumber: true
          }
        },
        client: {
          select: {
            name: true
          }
        }
      }
    });

    if (!existingInstance) {
      throw new NotFoundError('Policy instance not found');
    }

    await prisma.policyInstance.update({
      where: { id },
      data: { status }
    });

    // Log status change activity
    await ActivityService.logPolicyInstanceStatusChanged(
      existingInstance.policyTemplate.policyNumber,
      existingInstance.client.name,
      status
    );

    // Invalidate caches
    cacheService.invalidatePolicyTemplateCache();
    cacheService.invalidatePolicyDetailCache(existingInstance.policyTemplateId);

    // Update dashboard statistics
    await StatsService.refreshDashboardStats();
  }

  /**
   * Calculate expiry date from start date and duration
   */
  static calculateExpiryDate(startDate: Date, durationMonths: number): Date {
    const expiryDate = new Date(startDate);
    expiryDate.setMonth(expiryDate.getMonth() + durationMonths);
    return expiryDate;
  }

  /**
   * Validate unique client-template association
   */
  static async validateUniqueAssociation(
    clientId: string, 
    policyTemplateId: string, 
    excludeInstanceId?: string
  ): Promise<boolean> {
    const where: any = {
      policyTemplateId,
      clientId
    };

    if (excludeInstanceId) {
      where.id = { not: excludeInstanceId };
    }

    const existingInstance = await prisma.policyInstance.findFirst({
      where
    });

    return !existingInstance;
  }
}