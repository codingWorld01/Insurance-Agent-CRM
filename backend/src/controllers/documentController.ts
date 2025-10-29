import { Request, Response } from 'express';
import { prisma } from '../services/database';
import { DocumentService } from '../services/documentService';
import { CloudinaryService } from '../services/cloudinaryService';
import { AuditService } from '../services/auditService';
import { sendErrorResponse } from '../utils/errorHandler';

export class DocumentController {
  /**
   * POST /api/clients/:id/documents
   * Upload a document for a client
   */
  static async uploadDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id: clientId } = req.params;
      const { documentType } = req.body;
      const file = req.file;

      if (!file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded',
          statusCode: 400
        });
        return;
      }

      // Verify client exists
      const client = await prisma.client.findUnique({
        where: { id: clientId }
      });

      if (!client) {
        res.status(404).json({
          success: false,
          message: 'Client not found',
          statusCode: 404
        });
        return;
      }

      // Upload to Cloudinary
      const uploadResult = await DocumentService.uploadDocument(file, {
        clientId,
        documentType,
        folder: 'client-documents'
      });

      if (!uploadResult.success) {
        res.status(400).json({
          success: false,
          message: uploadResult.error || 'Upload failed',
          statusCode: 400
        });
        return;
      }

      // Save document record to database
      const document = await prisma.document.create({
        data: {
          clientId,
          documentType: documentType as any,
          fileName: uploadResult.publicId || '',
          originalName: uploadResult.originalFilename || '',
          cloudinaryUrl: uploadResult.secureUrl || '',
          cloudinaryId: uploadResult.publicId || '',
          fileSize: uploadResult.bytes || 0,
          mimeType: file.mimetype
        }
      });

      // Log document upload in audit trail
      await AuditService.logDocumentOperation(clientId, 'CREATE', {
        fileName: document.originalName,
        documentType: document.documentType
      });

      res.status(201).json({
        success: true,
        data: document,
        message: 'Document uploaded successfully'
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * GET /api/clients/:id/documents
   * Get all documents for a client
   */
  static async getClientDocuments(req: Request, res: Response): Promise<void> {
    try {
      const { id: clientId } = req.params;
      const { documentType } = req.query;

      // Verify client exists
      const client = await prisma.client.findUnique({
        where: { id: clientId }
      });

      if (!client) {
        res.status(404).json({
          success: false,
          message: 'Client not found',
          statusCode: 404
        });
        return;
      }

      // Build where clause
      const where: any = { clientId };
      if (documentType) {
        where.documentType = documentType;
      }

      const documents = await prisma.document.findMany({
        where,
        orderBy: {
          uploadedAt: 'desc'
        }
      });

      res.json({
        success: true,
        data: documents
      });
    } catch (error) {
      console.error('Error fetching client documents:', error);
      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * GET /api/documents/:id
   * Get a specific document
   */
  static async getDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const document = await prisma.document.findUnique({
        where: { id },
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              clientType: true
            }
          }
        }
      });

      if (!document) {
        res.status(404).json({
          success: false,
          message: 'Document not found',
          statusCode: 404
        });
        return;
      }

      res.json({
        success: true,
        data: document
      });
    } catch (error) {
      console.error('Error fetching document:', error);
      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * DELETE /api/documents/:id
   * Delete a document
   */
  static async deleteDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const document = await prisma.document.findUnique({
        where: { id }
      });

      if (!document) {
        res.status(404).json({
          success: false,
          message: 'Document not found',
          statusCode: 404
        });
        return;
      }

      // Delete from Cloudinary first
      const resourceType = document.mimeType.startsWith('image/') ? 'image' : 'raw';
      const deleteResult = await DocumentService.deleteDocument(
        document.cloudinaryId,
        resourceType
      );

      if (!deleteResult.success) {
        console.warn(`Failed to delete from Cloudinary: ${deleteResult.error}`);
        // Continue with database deletion even if Cloudinary deletion fails
      }

      // Log document deletion in audit trail
      await AuditService.logDocumentOperation(document.clientId, 'DELETE', {
        fileName: document.originalName,
        documentType: document.documentType
      });

      // Delete from database
      await prisma.document.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'Document deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * POST /api/clients/:id/profile-image
   * Upload profile image for a client
   */
  static async uploadProfileImage(req: Request, res: Response): Promise<void> {
    try {
      const { id: clientId } = req.params;
      const file = req.file;

      if (!file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded',
          statusCode: 400
        });
        return;
      }

      // Verify client exists
      const client = await prisma.client.findUnique({
        where: { id: clientId }
      });

      if (!client) {
        res.status(404).json({
          success: false,
          message: 'Client not found',
          statusCode: 404
        });
        return;
      }

      // Delete old profile image if exists
      if (client.profileImage) {
        try {
          // Extract public ID from URL
          const urlParts = client.profileImage.split('/');
          const publicIdWithExtension = urlParts.slice(-2).join('/');
          const publicId = publicIdWithExtension.split('.')[0];
          await DocumentService.deleteDocument(publicId, 'image');
        } catch (error) {
          console.warn('Failed to delete old profile image:', error);
        }
      }

      // Upload new profile image
      const uploadResult = await DocumentService.uploadProfileImage(file, clientId);

      if (!uploadResult.success) {
        res.status(400).json({
          success: false,
          message: uploadResult.error || 'Upload failed',
          statusCode: 400
        });
        return;
      }

      // Update client with new profile image URL
      const updatedClient = await prisma.client.update({
        where: { id: clientId },
        data: {
          profileImage: uploadResult.secureUrl
        }
      });

      // Log profile image operation in audit trail
      const action = client.profileImage ? 'UPDATE' : 'CREATE';
      await AuditService.logProfileImageOperation(
        clientId,
        action,
        client.profileImage || undefined,
        uploadResult.secureUrl
      );

      res.json({
        success: true,
        data: {
          profileImage: updatedClient.profileImage,
          thumbnailUrl: DocumentService.generateDocumentThumbnail(uploadResult.publicId || '', 150)
        },
        message: 'Profile image uploaded successfully'
      });
    } catch (error) {
      console.error('Error uploading profile image:', error);
      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * DELETE /api/clients/:id/profile-image
   * Delete profile image for a client
   */
  static async deleteProfileImage(req: Request, res: Response): Promise<void> {
    try {
      const { id: clientId } = req.params;

      const client = await prisma.client.findUnique({
        where: { id: clientId }
      });

      if (!client) {
        res.status(404).json({
          success: false,
          message: 'Client not found',
          statusCode: 404
        });
        return;
      }

      if (!client.profileImage) {
        res.status(404).json({
          success: false,
          message: 'No profile image found',
          statusCode: 404
        });
        return;
      }

      // Extract public ID from URL and delete from Cloudinary
      try {
        const urlParts = client.profileImage.split('/');
        const publicIdWithExtension = urlParts.slice(-2).join('/');
        const publicId = publicIdWithExtension.split('.')[0];
        await DocumentService.deleteDocument(publicId, 'image');
      } catch (error) {
        console.warn('Failed to delete from Cloudinary:', error);
      }

      // Log profile image deletion in audit trail
      await AuditService.logProfileImageOperation(
        clientId,
        'DELETE',
        client.profileImage,
        undefined
      );

      // Remove profile image URL from client
      await prisma.client.update({
        where: { id: clientId },
        data: {
          profileImage: null
        }
      });

      res.json({
        success: true,
        message: 'Profile image deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting profile image:', error);
      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * POST /api/documents/:id/generate-url
   * Generate secure URL for document access
   */
  static async generateSecureUrl(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { width, height, quality } = req.body;

      const document = await prisma.document.findUnique({
        where: { id }
      });

      if (!document) {
        res.status(404).json({
          success: false,
          message: 'Document not found',
          statusCode: 404
        });
        return;
      }

      const resourceType = document.mimeType.startsWith('image/') ? 'image' : 'raw';
      const secureUrl = DocumentService.generateDocumentUrl(document.cloudinaryId, {
        resourceType,
        width,
        height,
        quality
      });

      res.json({
        success: true,
        data: {
          secureUrl,
          thumbnailUrl: resourceType === 'image' 
            ? DocumentService.generateDocumentThumbnail(document.cloudinaryId, 150)
            : null
        }
      });
    } catch (error) {
      console.error('Error generating secure URL:', error);
      sendErrorResponse(res, error as Error);
    }
  }
}