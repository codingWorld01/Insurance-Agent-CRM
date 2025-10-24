import { Router } from 'express';
import { PolicyInstanceController } from '../controllers/policyInstanceController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest, uuidSchema } from '../middleware/validation';
import { asyncHandler } from '../utils/errorHandler';
import {
  validatePolicyTemplateRequest,
  createPolicyInstanceSchema,
  updatePolicyInstanceSchema as enhancedUpdateSchema,
  policyInstanceStatusSchema,
  validateAssociationSchema,
  calculateExpirySchema,
  validateBusinessRules
} from '../middleware/policyTemplateValidation';

const router = Router();

// All policy instance routes require authentication
router.use(authenticateToken);

// Policy instance CRUD operations
router.get('/:id',
  validateRequest({ params: uuidSchema }),
  asyncHandler(PolicyInstanceController.getPolicyInstance)
);

router.put('/:id',
  validatePolicyTemplateRequest({ 
    params: uuidSchema,
    body: enhancedUpdateSchema
  }),
  validateBusinessRules.policyInstance,
  asyncHandler(PolicyInstanceController.updatePolicyInstance)
);

router.delete('/:id',
  validateRequest({ params: uuidSchema }),
  asyncHandler(PolicyInstanceController.deletePolicyInstance)
);

router.patch('/:id/status',
  validatePolicyTemplateRequest({ 
    params: uuidSchema,
    body: policyInstanceStatusSchema
  }),
  asyncHandler(PolicyInstanceController.updatePolicyInstanceStatus)
);

// Utility endpoints
router.post('/validate-association',
  validatePolicyTemplateRequest({ body: validateAssociationSchema }),
  asyncHandler(PolicyInstanceController.validateAssociation)
);

router.post('/calculate-expiry',
  validatePolicyTemplateRequest({ body: calculateExpirySchema }),
  asyncHandler(PolicyInstanceController.calculateExpiryDate)
);

// Template-specific instances
router.get('/template/:id',
  validateRequest({ params: uuidSchema }),
  asyncHandler(PolicyInstanceController.getTemplatePolicyInstances)
);

export default router;