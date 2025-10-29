import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { 
  unifiedClientValidationSchema, 
  updateUnifiedClientSchema, 
  clientQuerySchema, 
  uuidParamSchema 
} from '../middleware/enhancedClientValidation';
import { asyncHandler } from '../middleware/errorHandler';
import { EnhancedClientController } from '../controllers/enhancedClientController';

const router = Router();

// All enhanced client routes require authentication
router.use(authenticateToken);

/**
 * GET /api/enhanced-clients
 * Get all enhanced clients with filtering and search
 */
router.get('/',
  validateRequest({ query: clientQuerySchema }),
  asyncHandler(EnhancedClientController.getClients)
);

/**
 * POST /api/enhanced-clients
 * Create a new enhanced client
 */
router.post('/',
  validateRequest({ body: unifiedClientValidationSchema }),
  asyncHandler(EnhancedClientController.createClient)
);

/**
 * GET /api/enhanced-clients/:id
 * Get a specific enhanced client by ID with all details
 */
router.get('/:id',
  validateRequest({ params: uuidParamSchema }),
  asyncHandler(EnhancedClientController.getClientById)
);

/**
 * PUT /api/enhanced-clients/:id
 * Update a specific enhanced client
 */
router.put('/:id',
  validateRequest({ 
    params: uuidParamSchema,
    body: updateUnifiedClientSchema
  }),
  asyncHandler(EnhancedClientController.updateClient)
);

/**
 * DELETE /api/enhanced-clients/:id
 * Delete a specific enhanced client and cleanup associated files
 */
router.delete('/:id',
  validateRequest({ params: uuidParamSchema }),
  asyncHandler(EnhancedClientController.deleteClient)
);

/**
 * GET /api/enhanced-clients/:id/audit-logs
 * Get audit logs for a specific client
 */
router.get('/:id/audit-logs',
  validateRequest({ params: uuidParamSchema }),
  asyncHandler(EnhancedClientController.getClientAuditLogs)
);

/**
 * GET /api/enhanced-clients/:id/audit-stats
 * Get audit statistics for a specific client
 */
router.get('/:id/audit-stats',
  validateRequest({ params: uuidParamSchema }),
  asyncHandler(EnhancedClientController.getClientAuditStats)
);

/**
 * GET /api/enhanced-clients/audit-report
 * Generate audit report for a date range
 */
router.get('/audit-report',
  asyncHandler(EnhancedClientController.generateAuditReport)
);

export default router;