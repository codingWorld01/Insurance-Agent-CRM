import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { validateRequest, uuidSchema, policySchema, updatePolicySchema, policyQuerySchema } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { PoliciesController } from '../controllers/policiesController';

const router = Router();

// All policies routes require authentication
router.use(authenticateToken);

/**
 * GET /api/policies
 * Get all policies with optional filtering
 */
router.get('/',
  validateRequest({ query: policyQuerySchema }),
  asyncHandler(PoliciesController.getPolicies)
);

/**
 * PUT /api/policies/:id
 * Update a specific policy
 */
router.put('/:id',
  validateRequest({ 
    params: uuidSchema,
    body: updatePolicySchema
  }),
  asyncHandler(PoliciesController.updatePolicy)
);

/**
 * DELETE /api/policies/:id
 * Delete a specific policy
 */
router.delete('/:id',
  validateRequest({ params: uuidSchema }),
  asyncHandler(PoliciesController.deletePolicy)
);

/**
 * POST /api/policies/bulk
 * Handle bulk operations on policies
 */
router.post('/bulk',
  asyncHandler(PoliciesController.bulkOperations)
);

/**
 * POST /api/policies/export
 * Export policies to CSV
 */
router.post('/export',
  asyncHandler(PoliciesController.exportPolicies)
);

export default router;