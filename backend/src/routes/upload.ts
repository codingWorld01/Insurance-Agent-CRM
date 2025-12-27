import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { uploadSingle, uploadMultiple, validateFileContent } from '../middleware/fileUpload';
import { DocumentService } from '../services/documentService';
import { CloudinaryService } from '../services/cloudinaryService';
import { enhancedFileUploadSecurity, virusScanMiddleware } from '../middleware/enhancedFileUploadSecurity';
import { uploadRateLimiters } from '../middleware/enhancedUploadRateLimit';
import { comprehensiveErrorHandler, addRequestId } from '../middleware/comprehensiveErrorHandling';
import { SecurityLoggingService } from '../services/securityLoggingService';

const router = express.Router();

// Apply request ID to all routes
router.use(addRequestId);

/**
 * Generic upload endpoint for images and documents
 * POST /api/upload
 * This is used by useEnhancedFileUpload hook
 */
router.post('/',
  uploadRateLimiters.document,
  uploadSingle('file'),
  enhancedFileUploadSecurity,
  virusScanMiddleware,
  (req: Request, res: Response, next: NextFunction): void => {
    validateFileContent(req, res, next);
  },
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const file = req.file as Express.Multer.File;
      const { documentType, clientId, folder } = req.body;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
          error: 'NO_FILE'
        });
      }

      // Determine if it's an image or document
      if (!file || !file.mimetype) {
        return res.status(400).json({
          success: false,
          message: 'Invalid file format',
          error: 'INVALID_FILE'
        });
      }
      
      const isImage = file.mimetype.startsWith('image/');
      let uploadResult;

      if (isImage && clientId) {
        // Upload as profile image if clientId is provided
        uploadResult = await DocumentService.uploadProfileImage(file, clientId);
      } else if (clientId && documentType) {
        // Upload as document
        uploadResult = await DocumentService.uploadDocument(file, {
          clientId,
          documentType,
          folder
        });
      } else {
        // Generic upload to Cloudinary without client association
        uploadResult = await CloudinaryService.uploadFile(file, {
          folder: folder || 'uploads',
          resourceType: isImage ? 'image' : 'raw'
        });
      }

      if (!uploadResult.success) {
        // Log failed upload attempt
        await SecurityLoggingService.logFileUploadSecurityEvent(
          req,
          'FILE_UPLOAD_BLOCKED',
          {
            reason: 'Upload service failed',
            error: uploadResult.error,
            clientId,
            documentType,
            fileName: file.originalname,
            fileSize: file.size
          },
          true
        );

        return res.status(400).json({
          success: false,
          message: uploadResult.error || 'Upload failed',
          error: 'UPLOAD_FAILED'
        });
      }

      // Log successful upload
      await SecurityLoggingService.logFileUploadSecurityEvent(
        req,
        'SUSPICIOUS_ACTIVITY',
        {
          action: 'file_uploaded',
          clientId,
          documentType,
          fileName: file.originalname,
          fileSize: file.size,
          cloudinaryId: uploadResult.publicId
        },
        false
      );

      return res.json({
        success: true,
        message: 'File uploaded successfully',
        url: uploadResult.secureUrl,
        data: {
          url: uploadResult.secureUrl,
          publicId: uploadResult.publicId,
          originalFilename: uploadResult.originalFilename,
          format: uploadResult.format,
          bytes: uploadResult.bytes,
          resourceType: uploadResult.resourceType
        }
      });

    } catch (error) {
      console.error('File upload error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'SERVER_ERROR'
      });
    }
  }
);

/**
 * Upload a single document for a client
 * POST /api/upload/document
 */
router.post('/document', 
  uploadRateLimiters.document,
  uploadSingle('document'),
  enhancedFileUploadSecurity,
  virusScanMiddleware,
  validateFileContent,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const file = req.file as Express.Multer.File;
      const { clientId, documentType, folder } = req.body;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
          error: 'NO_FILE'
        });
      }

      if (!clientId) {
        return res.status(400).json({
          success: false,
          message: 'Client ID is required',
          error: 'MISSING_CLIENT_ID'
        });
      }

      if (!documentType) {
        return res.status(400).json({
          success: false,
          message: 'Document type is required',
          error: 'MISSING_DOCUMENT_TYPE'
        });
      }

      // Validate document type
      if (!DocumentService.validateDocumentType(documentType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid document type',
          error: 'INVALID_DOCUMENT_TYPE'
        });
      }

      // Upload document
      const uploadResult = await DocumentService.uploadDocument(file, {
        clientId,
        documentType,
        folder
      });

      if (!uploadResult.success) {
        // Log failed upload attempt
        await SecurityLoggingService.logFileUploadSecurityEvent(
          req,
          'FILE_UPLOAD_BLOCKED',
          {
            reason: 'Upload service failed',
            error: uploadResult.error,
            clientId,
            documentType,
            fileName: file.originalname,
            fileSize: file.size
          },
          true
        );

        return res.status(400).json({
          success: false,
          message: uploadResult.error || 'Upload failed',
          error: 'UPLOAD_FAILED'
        });
      }

      // Log successful upload
      await SecurityLoggingService.logFileUploadSecurityEvent(
        req,
        'SUSPICIOUS_ACTIVITY', // Using this as a general activity log
        {
          action: 'document_uploaded',
          clientId,
          documentType,
          fileName: file.originalname,
          fileSize: file.size,
          cloudinaryId: uploadResult.publicId
        },
        false
      );

      return res.json({
        success: true,
        message: 'Document uploaded successfully',
        data: {
          url: uploadResult.secureUrl,
          publicId: uploadResult.publicId,
          originalFilename: uploadResult.originalFilename,
          format: uploadResult.format,
          bytes: uploadResult.bytes,
          resourceType: uploadResult.resourceType
        }
      });

    } catch (error) {
      console.error('Document upload error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'SERVER_ERROR'
      });
    }
  }
);

/**
 * Upload multiple documents for a client
 * POST /api/upload/documents
 */
router.post('/documents',
  uploadRateLimiters.bulk,
  uploadMultiple('documents', 10),
  enhancedFileUploadSecurity,
  virusScanMiddleware,
  validateFileContent,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const files = req.files as Express.Multer.File[];
      const { clientId, documentType, folder } = req.body;

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded',
          error: 'NO_FILES'
        });
      }

      if (!clientId) {
        return res.status(400).json({
          success: false,
          message: 'Client ID is required',
          error: 'MISSING_CLIENT_ID'
        });
      }

      if (!documentType) {
        return res.status(400).json({
          success: false,
          message: 'Document type is required',
          error: 'MISSING_DOCUMENT_TYPE'
        });
      }

      // Validate document type
      if (!DocumentService.validateDocumentType(documentType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid document type',
          error: 'INVALID_DOCUMENT_TYPE'
        });
      }

      // Upload all documents
      const uploadResults = [];
      const errors = [];

      for (const file of files) {
        const uploadResult = await DocumentService.uploadDocument(file, {
          clientId,
          documentType,
          folder
        });

        if (uploadResult.success) {
          uploadResults.push({
            originalFilename: uploadResult.originalFilename,
            url: uploadResult.secureUrl,
            publicId: uploadResult.publicId,
            format: uploadResult.format,
            bytes: uploadResult.bytes,
            resourceType: uploadResult.resourceType
          });
        } else {
          errors.push({
            filename: file.originalname,
            error: uploadResult.error
          });
        }
      }

      return res.json({
        success: errors.length === 0,
        message: errors.length === 0 
          ? 'All documents uploaded successfully' 
          : `${uploadResults.length} documents uploaded, ${errors.length} failed`,
        data: {
          uploaded: uploadResults,
          errors: errors
        }
      });

    } catch (error) {
      console.error('Multiple documents upload error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'SERVER_ERROR'
      });
    }
  }
);

/**
 * Upload profile image for a client
 * POST /api/upload/profile-image
 */
router.post('/profile-image',
  uploadRateLimiters.profileImage,
  uploadSingle('profileImage'),
  enhancedFileUploadSecurity,
  virusScanMiddleware,
  validateFileContent,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const file = req.file as Express.Multer.File;
      const { clientId } = req.body;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
          error: 'NO_FILE'
        });
      }

      if (!clientId) {
        return res.status(400).json({
          success: false,
          message: 'Client ID is required',
          error: 'MISSING_CLIENT_ID'
        });
      }

      // Upload profile image
      const uploadResult = await DocumentService.uploadProfileImage(file, clientId);

      if (!uploadResult.success) {
        return res.status(400).json({
          success: false,
          message: uploadResult.error || 'Upload failed',
          error: 'UPLOAD_FAILED'
        });
      }

      return res.json({
        success: true,
        message: 'Profile image uploaded successfully',
        data: {
          url: uploadResult.secureUrl,
          publicId: uploadResult.publicId,
          thumbnailUrl: DocumentService.generateDocumentThumbnail(uploadResult.publicId || '', 150),
          originalFilename: uploadResult.originalFilename,
          format: uploadResult.format,
          bytes: uploadResult.bytes
        }
      });

    } catch (error) {
      console.error('Profile image upload error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'SERVER_ERROR'
      });
    }
  }
);

/**
 * Delete a document from Cloudinary
 * DELETE /api/upload/document/:publicId
 */
router.delete('/document/:publicId', async (req: Request, res: Response): Promise<Response> => {
  try {
    const { publicId } = req.params;
    const { resourceType = 'raw' } = req.query;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'Public ID is required',
        error: 'MISSING_PUBLIC_ID'
      });
    }

    // Decode the public ID (it might be URL encoded)
    const decodedPublicId = decodeURIComponent(publicId);

    const deleteResult = await DocumentService.deleteDocument(
      decodedPublicId, 
      resourceType as 'image' | 'raw'
    );

    if (!deleteResult.success) {
      return res.status(400).json({
        success: false,
        message: deleteResult.error || 'Delete failed',
        error: 'DELETE_FAILED'
      });
    }

    return res.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Document deletion error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'SERVER_ERROR'
    });
  }
});

/**
 * Get document information
 * GET /api/upload/document/:publicId/info
 */
router.get('/document/:publicId/info', async (req: Request, res: Response): Promise<Response> => {
  try {
    const { publicId } = req.params;
    const { resourceType = 'raw' } = req.query;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'Public ID is required',
        error: 'MISSING_PUBLIC_ID'
      });
    }

    const decodedPublicId = decodeURIComponent(publicId);

    const infoResult = await DocumentService.getDocumentInfo(
      decodedPublicId,
      resourceType as 'image' | 'raw'
    );

    if (!infoResult.success) {
      return res.status(404).json({
        success: false,
        message: infoResult.error || 'Document not found',
        error: 'DOCUMENT_NOT_FOUND'
      });
    }

    return res.json({
      success: true,
      data: infoResult.data
    });

  } catch (error) {
    console.error('Get document info error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'SERVER_ERROR'
    });
  }
});

/**
 * List all documents for a client
 * GET /api/upload/client/:clientId/documents
 */
router.get('/client/:clientId/documents', async (req: Request, res: Response): Promise<Response> => {
  try {
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client ID is required',
        error: 'MISSING_CLIENT_ID'
      });
    }

    const listResult = await DocumentService.listClientDocuments(clientId);

    if (!listResult.success) {
      return res.status(400).json({
        success: false,
        message: listResult.error || 'Failed to list documents',
        error: 'LIST_FAILED'
      });
    }

    return res.json({
      success: true,
      data: {
        documents: listResult.files || [],
        count: listResult.files?.length || 0
      }
    });

  } catch (error) {
    console.error('List client documents error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'SERVER_ERROR'
    });
  }
});

/**
 * Generate secure URL for document access
 * POST /api/upload/generate-url
 */
router.post('/generate-url', async (req: Request, res: Response): Promise<Response> => {
  try {
    const { publicId, resourceType = 'raw', width, height, quality } = req.body;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'Public ID is required',
        error: 'MISSING_PUBLIC_ID'
      });
    }

    const secureUrl = DocumentService.generateDocumentUrl(publicId, {
      resourceType: resourceType as 'image' | 'raw',
      width,
      height,
      quality
    });

    if (!secureUrl) {
      return res.status(400).json({
        success: false,
        message: 'Failed to generate secure URL',
        error: 'URL_GENERATION_FAILED'
      });
    }

    return res.json({
      success: true,
      data: {
        secureUrl,
        thumbnailUrl: resourceType === 'image' 
          ? DocumentService.generateDocumentThumbnail(publicId, 150)
          : null
      }
    });

  } catch (error) {
    console.error('Generate URL error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'SERVER_ERROR'
    });
  }
});

/**
 * Test Cloudinary connection
 * GET /api/upload/test-connection
 */
router.get('/test-connection', async (req: Request, res: Response): Promise<Response> => {
  try {
    const testResult = await DocumentService.testUploadConnection();

    if (!testResult.success) {
      return res.status(500).json({
        success: false,
        message: testResult.error || 'Connection test failed',
        error: 'CONNECTION_FAILED'
      });
    }

    return res.json({
      success: true,
      message: 'Cloudinary connection successful'
    });

  } catch (error) {
    console.error('Connection test error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'SERVER_ERROR'
    });
  }
});

/**
 * Get upload configuration info
 * GET /api/upload/config
 */
router.get('/config', async (req: Request, res: Response): Promise<Response> => {
  try {
    const configValidation = DocumentService.validateUploadConfiguration();

    return res.json({
      success: configValidation.isValid,
      message: configValidation.isValid 
        ? 'Upload configuration is valid' 
        : 'Upload configuration has errors',
      data: {
        isValid: configValidation.isValid,
        errors: configValidation.errors,
        maxFileSize: process.env.MAX_FILE_SIZE || '10485760',
        allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,gif,pdf,doc,docx').split(','),
        cloudinaryConfigured: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY)
      }
    });

  } catch (error) {
    console.error('Get config error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'SERVER_ERROR'
    });
  }
});

/**
 * Get security metrics for upload operations
 * GET /api/upload/security/metrics
 */
router.get('/security/metrics', async (req: Request, res: Response): Promise<Response> => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const metrics = await SecurityLoggingService.getSecurityMetrics(start, end);

    return res.json({
      success: true,
      data: {
        ...metrics,
        period: {
          startDate: start.toISOString(),
          endDate: end.toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Get security metrics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve security metrics',
      error: 'METRICS_ERROR'
    });
  }
});

/**
 * Get recent security events
 * GET /api/upload/security/events
 */
router.get('/security/events', async (req: Request, res: Response): Promise<Response> => {
  try {
    const { limit = 50, severity } = req.query;

    const events = await SecurityLoggingService.getRecentSecurityEvents(
      parseInt(limit as string),
      severity as any
    );

    return res.json({
      success: true,
      data: {
        events,
        count: events.length
      }
    });

  } catch (error) {
    console.error('Get security events error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve security events',
      error: 'EVENTS_ERROR'
    });
  }
});

/**
 * Check IP reputation
 * GET /api/upload/security/ip-check/:ip
 */
router.get('/security/ip-check/:ip', async (req: Request, res: Response): Promise<Response> => {
  try {
    const { ip } = req.params;

    if (!ip || ip === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'IP address is required',
        error: 'MISSING_IP'
      });
    }

    const suspiciousCheck = await SecurityLoggingService.checkSuspiciousIP(ip);

    return res.json({
      success: true,
      data: {
        ipAddress: ip,
        ...suspiciousCheck
      }
    });

  } catch (error) {
    console.error('IP check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check IP reputation',
      error: 'IP_CHECK_ERROR'
    });
  }
});

/**
 * Get rate limit status for current client
 * @route GET /api/upload/rate-limit-status/:uploadType
 */
router.get('/rate-limit-status/:uploadType', async (req: Request, res: Response): Promise<Response> => {
  try {
    const { uploadType } = req.params;

    if (!['document', 'profileImage', 'bulk'].includes(uploadType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid upload type',
        error: 'INVALID_UPLOAD_TYPE'
      });
    }

    const { getRateLimitStatus } = await import('../middleware/enhancedUploadRateLimit');
    const status = getRateLimitStatus(req, uploadType as any);

    return res.json({
      success: true,
      data: {
        uploadType,
        ...status
      }
    });

  } catch (error) {
    console.error('Rate limit status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get rate limit status',
      error: 'RATE_LIMIT_STATUS_ERROR'
    });
  }
});

// Apply comprehensive error handling to all routes
router.use(comprehensiveErrorHandler);

export default router;