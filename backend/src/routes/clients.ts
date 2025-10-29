import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { validateRequest, unifiedClientSchema, uuidSchema, paginationSchema, policySchema, policyInstanceSchema } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { ClientsController } from '../controllers/clientsController';
import { PoliciesController } from '../controllers/policiesController';

const router = Router();

// All clients routes require authentication
router.use(authenticateToken);

/**
 * GET /api/clients
 * Get all clients with optional search
 */
router.get('/',
  validateRequest({ query: paginationSchema }),
  asyncHandler(ClientsController.getClients)
);

/**
 * POST /api/clients
 * Create a new client
 */
router.post('/',
  validateRequest({ body: unifiedClientSchema }),
  asyncHandler(ClientsController.createClient)
);

/**
 * GET /api/clients/:id
 * Get a specific client by ID with their policies
 */
router.get('/:id',
  validateRequest({ params: uuidSchema }),
  asyncHandler(ClientsController.getClientById)
);

/**
 * PUT /api/clients/:id
 * Update a specific client
 */
router.put('/:id',
  validateRequest({ 
    params: uuidSchema,
    body: unifiedClientSchema.partial()
  }),
  asyncHandler(ClientsController.updateClient)
);

/**
 * DELETE /api/clients/:id
 * Delete a specific client and cascade delete their policies
 */
router.delete('/:id',
  validateRequest({ params: uuidSchema }),
  asyncHandler(ClientsController.deleteClient)
);

/**
 * POST /api/clients/:id/policies
 * Create a new policy for a specific client
 */
router.post('/:id/policies',
  validateRequest({ 
    params: uuidSchema,
    body: policySchema
  }),
  asyncHandler(PoliciesController.createPolicy)
);

/**
 * GET /api/clients/:id/policy-instances
 * Get all policy instances for a specific client
 */
router.get('/:id/policy-instances',
  validateRequest({ params: uuidSchema }),
  asyncHandler(ClientsController.getClientPolicyInstances)
);

/**
 * POST /api/clients/:id/policy-instances
 * Create a new policy instance for a specific client
 */
router.post('/:id/policy-instances',
  validateRequest({ 
    params: uuidSchema,
    body: policyInstanceSchema
  }),
  asyncHandler(ClientsController.createPolicyInstance)
);

export default router;