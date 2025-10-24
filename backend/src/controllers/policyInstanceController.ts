import { Request, Response } from 'express';
import { PolicyInstanceService } from '../services/policyInstanceService';
import { 
  sendErrorResponse, 
  ValidationError
} from '../utils/errorHandler';

export class PolicyInstanceController {
  /**
   * POST /api/clients/:clientId/policy-instances
   * Create a new policy instance for a client
   */
  static async createPolicyInstance(req: Request, res: Response): Promise<void> {
    try {
      const { clientId } = req.params;
      const { 
        policyTemplateId, 
        premiumAmount, 
        startDate, 
        durationMonths, 
        commissionAmount 
      } = req.body;

      // Validate required fields
      if (!policyTemplateId || !premiumAmount || !startDate || !durationMonths || commissionAmount === undefined) {
        throw new ValidationError('Missing required fields', [
          { field: 'policyTemplateId', message: 'Policy template ID is required' },
          { field: 'premiumAmount', message: 'Premium amount is required' },
          { field: 'startDate', message: 'Start date is required' },
          { field: 'durationMonths', message: 'Duration in months is required' },
          { field: 'commissionAmount', message: 'Commission amount is required' }
        ]);
      }

      const instance = await PolicyInstanceService.createInstance(clientId, {
        policyTemplateId,
        clientId,
        premiumAmount: Number(premiumAmount),
        startDate,
        durationMonths: Number(durationMonths),
        commissionAmount: Number(commissionAmount)
      });

      res.status(201).json({
        success: true,
        data: instance,
        message: 'Policy instance created successfully'
      });
    } catch (error) {
      console.error('Error creating policy instance:', error);
      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * GET /api/clients/:clientId/policy-instances
   * Get all policy instances for a client
   */
  static async getClientPolicyInstances(req: Request, res: Response): Promise<void> {
    try {
      const { clientId } = req.params;

      const instances = await PolicyInstanceService.getInstancesByClient(clientId);

      res.json({
        success: true,
        data: instances
      });
    } catch (error) {
      console.error('Error fetching client policy instances:', error);
      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * GET /api/policy-instances/:id
   * Get a specific policy instance
   */
  static async getPolicyInstance(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const instance = await PolicyInstanceService.getInstanceById(id);

      res.json({
        success: true,
        data: instance
      });
    } catch (error) {
      console.error('Error fetching policy instance:', error);
      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * PUT /api/policy-instances/:id
   * Update a policy instance
   */
  static async updatePolicyInstance(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { 
        premiumAmount, 
        startDate, 
        durationMonths, 
        expiryDate, 
        commissionAmount, 
        status 
      } = req.body;

      // Validate input data
      const validationErrors: Array<{ field: string; message: string }> = [];

      // Validate premium amount
      if (premiumAmount !== undefined) {
        const premium = Number(premiumAmount);
        if (isNaN(premium) || premium <= 0) {
          validationErrors.push({ field: 'premiumAmount', message: 'Premium amount must be a positive number' });
        } else if (premium > 1000000) {
          validationErrors.push({ field: 'premiumAmount', message: 'Premium amount seems unusually high' });
        }
      }

      // Validate commission amount
      if (commissionAmount !== undefined) {
        const commission = Number(commissionAmount);
        if (isNaN(commission) || commission < 0) {
          validationErrors.push({ field: 'commissionAmount', message: 'Commission amount must be a non-negative number' });
        }
        
        // Cross-validate commission vs premium
        if (premiumAmount !== undefined && commission > Number(premiumAmount)) {
          validationErrors.push({ field: 'commissionAmount', message: 'Commission cannot be greater than premium amount' });
        }
      }

      // Validate dates
      if (startDate !== undefined) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          validationErrors.push({ field: 'startDate', message: 'Start date must be a valid date' });
        }
      }

      if (expiryDate !== undefined) {
        const expiry = new Date(expiryDate);
        if (isNaN(expiry.getTime())) {
          validationErrors.push({ field: 'expiryDate', message: 'Expiry date must be a valid date' });
        }
        
        // Cross-validate dates if both are provided
        if (startDate !== undefined) {
          const start = new Date(startDate);
          if (!isNaN(start.getTime()) && !isNaN(expiry.getTime()) && expiry <= start) {
            validationErrors.push({ field: 'expiryDate', message: 'Expiry date must be after start date' });
          }
        }
      }

      // Validate duration
      if (durationMonths !== undefined) {
        const duration = Number(durationMonths);
        if (isNaN(duration) || duration <= 0 || duration > 120) {
          validationErrors.push({ field: 'durationMonths', message: 'Duration must be between 1 and 120 months' });
        }
      }

      // Validate status
      if (status !== undefined && !['Active', 'Expired'].includes(status)) {
        validationErrors.push({ field: 'status', message: 'Status must be either Active or Expired' });
      }

      // If there are validation errors, throw them
      if (validationErrors.length > 0) {
        throw new ValidationError('Validation failed', validationErrors);
      }

      // Prepare update data
      const updateData: any = {};
      
      if (premiumAmount !== undefined) updateData.premiumAmount = Number(premiumAmount);
      if (startDate !== undefined) updateData.startDate = startDate;
      if (durationMonths !== undefined) updateData.durationMonths = Number(durationMonths);
      if (expiryDate !== undefined) updateData.expiryDate = expiryDate;
      if (commissionAmount !== undefined) updateData.commissionAmount = Number(commissionAmount);
      if (status !== undefined) updateData.status = status;

      const updatedInstance = await PolicyInstanceService.updateInstance(id, updateData);

      res.json({
        success: true,
        data: updatedInstance,
        message: 'Policy instance updated successfully'
      });
    } catch (error) {
      console.error('Error updating policy instance:', error);
      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * DELETE /api/policy-instances/:id
   * Delete a policy instance
   */
  static async deletePolicyInstance(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await PolicyInstanceService.deleteInstance(id);

      res.json({
        success: true,
        message: 'Policy instance deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting policy instance:', error);
      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * PATCH /api/policy-instances/:id/status
   * Update policy instance status
   */
  static async updatePolicyInstanceStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['Active', 'Expired'].includes(status)) {
        throw new ValidationError('Invalid status', [
          { field: 'status', message: 'Status must be either Active or Expired' }
        ]);
      }

      await PolicyInstanceService.updateInstanceStatus(id, status);

      res.json({
        success: true,
        message: 'Policy instance status updated successfully'
      });
    } catch (error) {
      console.error('Error updating policy instance status:', error);
      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * GET /api/policy-instances/template/:id
   * Get all instances for a policy template
   */
  static async getTemplatePolicyInstances(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const instances = await PolicyInstanceService.getInstancesByTemplate(id);

      res.json({
        success: true,
        data: instances
      });
    } catch (error) {
      console.error('Error fetching template policy instances:', error);
      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * POST /api/policy-instances/validate-association
   * Validate if a client-template association is unique
   */
  static async validateAssociation(req: Request, res: Response): Promise<void> {
    try {
      const { clientId, policyTemplateId, excludeInstanceId } = req.body;

      if (!clientId || !policyTemplateId) {
        throw new ValidationError('Missing required fields', [
          { field: 'clientId', message: 'Client ID is required' },
          { field: 'policyTemplateId', message: 'Policy template ID is required' }
        ]);
      }

      const isUnique = await PolicyInstanceService.validateUniqueAssociation(
        clientId,
        policyTemplateId,
        excludeInstanceId
      );

      res.json({
        success: true,
        data: {
          isUnique,
          message: isUnique ? 'Association is valid' : 'Client already has this policy template'
        }
      });
    } catch (error) {
      console.error('Error validating association:', error);
      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * POST /api/policy-instances/calculate-expiry
   * Calculate expiry date from start date and duration
   */
  static async calculateExpiryDate(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, durationMonths } = req.body;

      if (!startDate || !durationMonths) {
        throw new ValidationError('Missing required fields', [
          { field: 'startDate', message: 'Start date is required' },
          { field: 'durationMonths', message: 'Duration in months is required' }
        ]);
      }

      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        throw new ValidationError('Invalid start date', [
          { field: 'startDate', message: 'Start date must be a valid date' }
        ]);
      }

      const duration = Number(durationMonths);
      if (duration <= 0 || duration > 120) {
        throw new ValidationError('Invalid duration', [
          { field: 'durationMonths', message: 'Duration must be between 1 and 120 months' }
        ]);
      }

      const expiryDate = PolicyInstanceService.calculateExpiryDate(start, duration);

      res.json({
        success: true,
        data: {
          startDate: start.toISOString(),
          durationMonths: duration,
          expiryDate: expiryDate.toISOString()
        }
      });
    } catch (error) {
      console.error('Error calculating expiry date:', error);
      sendErrorResponse(res, error as Error);
    }
  }
}