import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { documentSchema, fileUploadSchema, uuidParamSchema } from '../middleware/enhancedClientValidation';
import { uploadSingle, validateFileContent } from '../middleware/fileUpload';
import { asyncHandler } from '../middleware/errorHandler';
import { DocumentController } from '../controllers/documentController';

const router = Router();

// All document routes require authentication
router.use(authenticateToken);

/**
 * POST /api/clients/:id/documents
 * Upload a document for a client
 */
router.post('/clients/:id/documents',
  validateRequest({ params: uuidParamSchema }),
  uploadSingle('document'),
  validateFileContent,
  validateRequest({ body: fileUploadSchema }),
  asyncHandler(DocumentController.uploadDocument)
);

/**
 * GET /api/clients/:id/documents
 * Get all documents for a client
 */
router.get('/clients/:id/documents',
  validateRequest({ params: uuidParamSchema }),
  asyncHandler(DocumentController.getClientDocuments)
);

/**
 * POST /api/clients/:id/profile-image
 * Upload profile image for a client
 */
router.post('/clients/:id/profile-image',
  validateRequest({ params: uuidParamSchema }),
  uploadSingle('profileImage'),
  validateFileContent,
  asyncHandler(DocumentController.uploadProfileImage)
);

/**
 * DELETE /api/clients/:id/profile-image
 * Delete profile image for a client
 */
router.delete('/clients/:id/profile-image',
  validateRequest({ params: uuidParamSchema }),
  asyncHandler(DocumentController.deleteProfileImage)
);

/**
 * GET /api/documents/:id
 * Get a specific document
 */
router.get('/documents/:id',
  validateRequest({ params: uuidParamSchema }),
  asyncHandler(DocumentController.getDocument)
);

/**
 * DELETE /api/documents/:id
 * Delete a document
 */
router.delete('/documents/:id',
  validateRequest({ params: uuidParamSchema }),
  asyncHandler(DocumentController.deleteDocument)
);

/**
 * POST /api/documents/:id/generate-url
 * Generate secure URL for document access
 */
router.post('/documents/:id/generate-url',
  validateRequest({ params: uuidParamSchema }),
  asyncHandler(DocumentController.generateSecureUrl)
);

export default router;