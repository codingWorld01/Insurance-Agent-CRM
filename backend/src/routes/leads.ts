import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { validateRequest, leadSchema, uuidSchema, paginationSchema } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { LeadsController } from '../controllers/leadsController';

const router = Router();

// All leads routes require authentication
router.use(authenticateToken);

/**
 * GET /api/leads
 * Get all leads with optional search and filtering
 */
router.get('/',
  validateRequest({ query: paginationSchema }),
  asyncHandler(LeadsController.getLeads)
);

/**
 * POST /api/leads
 * Create a new lead
 */
router.post('/',
  validateRequest({ body: leadSchema }),
  asyncHandler(LeadsController.createLead)
);

/**
 * GET /api/leads/:id
 * Get a specific lead by ID
 */
router.get('/:id',
  validateRequest({ params: uuidSchema }),
  asyncHandler(LeadsController.getLeadById)
);

/**
 * PUT /api/leads/:id
 * Update a specific lead
 */
router.put('/:id',
  validateRequest({ 
    params: uuidSchema,
    body: leadSchema.partial()
  }),
  asyncHandler(LeadsController.updateLead)
);

/**
 * DELETE /api/leads/:id
 * Delete a specific lead
 */
router.delete('/:id',
  validateRequest({ params: uuidSchema }),
  asyncHandler(LeadsController.deleteLead)
);

/**
 * POST /api/leads/:id/convert
 * Convert a lead to a client
 */
router.post('/:id/convert',
  validateRequest({ params: uuidSchema }),
  asyncHandler(LeadsController.convertLeadToClient)
);

export default router;