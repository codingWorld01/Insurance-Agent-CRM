import { Router } from 'express';
import { PolicyTemplatesController } from '../controllers/policyTemplatesController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest, uuidSchema } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import {
  validatePolicyTemplateRequest,
  createPolicyTemplateSchema,
  updatePolicyTemplateSchema,
  policyTemplateQuerySchema,
  policyTemplateSearchSchema,
  validateBusinessRules,
  validateSearchRateLimit
} from '../middleware/policyTemplateValidation';

const router = Router();

// All policy template routes require authentication
router.use(authenticateToken);

/**
 * GET /api/policy-templates/stats/overview
 * Get comprehensive policy template statistics
 */
router.get('/stats/overview', asyncHandler(PolicyTemplatesController.getPolicyTemplateStats));

/**
 * GET /api/policy-templates/stats/expiry-tracking
 * Get expiry tracking statistics across all policy instances
 */
router.get('/stats/expiry-tracking', asyncHandler(PolicyTemplatesController.getExpiryTrackingStats));

/**
 * GET /api/policy-templates/stats/system-metrics
 * Get comprehensive system-level metrics
 */
router.get('/stats/system-metrics', asyncHandler(PolicyTemplatesController.getSystemLevelMetrics));

/**
 * GET /api/policy-templates/stats/provider-performance
 * Get provider performance metrics
 */
router.get('/stats/provider-performance', asyncHandler(PolicyTemplatesController.getProviderPerformanceMetrics));

/**
 * GET /api/policy-templates/stats/policy-type-performance
 * Get policy type performance metrics
 */
router.get('/stats/policy-type-performance', asyncHandler(PolicyTemplatesController.getPolicyTypePerformanceMetrics));

/**
 * GET /api/policy-templates/search
 * Search policy templates by policy number or provider
 */
router.get('/search',
  validateSearchRateLimit,
  validatePolicyTemplateRequest({ query: policyTemplateSearchSchema }),
  asyncHandler(PolicyTemplatesController.searchPolicyTemplates)
);

/**
 * GET /api/policy-templates
 * Get all policy templates with advanced filtering and pagination
 */
router.get('/',
  validatePolicyTemplateRequest({ query: policyTemplateQuerySchema }),
  asyncHandler(PolicyTemplatesController.getPolicyTemplates)
);

/**
 * POST /api/policy-templates
 * Create a new policy template
 */
router.post('/',
  validatePolicyTemplateRequest({ body: createPolicyTemplateSchema }),
  validateBusinessRules.policyTemplate,
  asyncHandler(PolicyTemplatesController.createPolicyTemplate)
);

/**
 * GET /api/policy-templates/:id
 * Get a specific policy template with details
 */
router.get('/:id',
  validateRequest({ params: uuidSchema }),
  asyncHandler(PolicyTemplatesController.getPolicyTemplate)
);

/**
 * PUT /api/policy-templates/:id
 * Update a policy template
 */
router.put('/:id',
  validatePolicyTemplateRequest({ 
    params: uuidSchema,
    body: updatePolicyTemplateSchema 
  }),
  validateBusinessRules.policyTemplate,
  asyncHandler(PolicyTemplatesController.updatePolicyTemplate)
);

/**
 * DELETE /api/policy-templates/:id
 * Delete a policy template and all associated instances
 */
router.delete('/:id',
  validateRequest({ params: uuidSchema }),
  asyncHandler(PolicyTemplatesController.deletePolicyTemplate)
);

/**
 * GET /api/policy-templates/:id/clients
 * Get all clients associated with a policy template
 */
router.get('/:id/clients',
  validateRequest({ params: uuidSchema }),
  asyncHandler(PolicyTemplatesController.getPolicyTemplateClients)
);

/**
 * GET /api/policy-templates/:id/instances
 * Get all instances for a policy template
 */
router.get('/:id/instances',
  validateRequest({ params: uuidSchema }),
  asyncHandler(PolicyTemplatesController.getPolicyTemplateInstances)
);

/**
 * GET /api/policy-templates/:id/stats
 * Get detailed statistics for a specific policy template
 */
router.get('/:id/stats',
  validateRequest({ params: uuidSchema }),
  asyncHandler(PolicyTemplatesController.getPolicyTemplateDetailStats)
);

/**
 * GET /api/policy-templates/expiry/warnings
 * Get expiring policies with warning levels
 */
router.get('/expiry/warnings', asyncHandler(PolicyTemplatesController.getExpiryWarnings));

/**
 * GET /api/policy-templates/expiry/summary
 * Get expiry summary statistics
 */
router.get('/expiry/summary', asyncHandler(PolicyTemplatesController.getExpirySummary));

/**
 * POST /api/policy-templates/expiry/update-expired
 * Automatically update expired policy statuses
 */
router.post('/expiry/update-expired', asyncHandler(PolicyTemplatesController.updateExpiredPolicies));

/**
 * GET /api/policy-templates/:id/expiry/warnings
 * Get expiring policies for a specific template
 */
router.get('/:id/expiry/warnings',
  validateRequest({ params: uuidSchema }),
  asyncHandler(PolicyTemplatesController.getTemplateExpiryWarnings)
);

export default router;