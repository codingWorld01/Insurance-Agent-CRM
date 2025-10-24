import { Router } from 'express';
import { PolicyInstanceController } from '../controllers/policyInstanceController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest, uuidSchema } from '../middleware/validation';
import { asyncHandler } from '../utils/errorHandler';
import {
  validatePolicyTemplateRequest,
  createPolicyInstanceSchema,
  validateBusinessRules
} from '../middleware/policyTemplateValidation';

const router = Router();

// All client policy instance routes require authentication
router.use(authenticateToken);

/**
 * GET /api/clients/:clientId/policy-instances
 * Get all policy instances for a client
 */
router.get('/:clientId/policy-instances',
  validateRequest({ params: uuidSchema }),
  asyncHandler(PolicyInstanceController.getClientPolicyInstances)
);

/**
 * POST /api/clients/:clientId/policy-instances
 * Create a new policy instance for a client
 */
router.post('/:clientId/policy-instances',
  validatePolicyTemplateRequest({ 
    params: uuidSchema,
    body: createPolicyInstanceSchema
  }),
  validateBusinessRules.policyInstance,
  asyncHandler(PolicyInstanceController.createPolicyInstance)
);

export default router;