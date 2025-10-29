import { CloudinaryService, FileUploadResult } from './cloudinaryService';

export interface DocumentUploadOptions {
  clientId: string;
  documentType: string;
  folder?: string;
}

export interface DocumentInfo {
  id: string;
  fileName: string;
  originalName: string;
  cloudinaryUrl: string;
  cloudinaryId: string;
  fileSize: number;
  mimeType: string;
  documentType: string;
  uploadedAt: Date;
}

export class DocumentService {
  /**
   * Uploads a document for a client
   */
  static async uploadDocument(
    file: Express.Multer.File,
    options: DocumentUploadOptions
  ): Promise<FileUploadResult> {
    try {
      // Determine resource type based on file type
      let resourceType: 'image' | 'raw' = 'raw';
      if (file.mimetype.startsWith('image/')) {
        resourceType = 'image';
      }

      // Upload to Cloudinary
      const uploadResult = await CloudinaryService.uploadFile(file, {
        clientId: options.clientId,
        documentType: options.documentType,
        folder: options.folder,
        resourceType
      });

      if (!uploadResult.success) {
        return uploadResult;
      }

      return {
        success: true,
        url: uploadResult.url,
        secureUrl: uploadResult.secureUrl,
        publicId: uploadResult.publicId,
        originalFilename: uploadResult.originalFilename,
        format: uploadResult.format,
        resourceType: uploadResult.resourceType,
        bytes: uploadResult.bytes
      };

    } catch (error) {
      console.error('Document upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Document upload failed'
      };
    }
  }

  /**
   * Uploads a profile image for a client
   */
  static async uploadProfileImage(
    file: Express.Multer.File,
    clientId: string
  ): Promise<FileUploadResult> {
    try {
      // Validate that it's an image
      if (!file.mimetype.startsWith('image/')) {
        return {
          success: false,
          error: 'Profile image must be an image file'
        };
      }

      // Upload to Cloudinary in profile-images folder
      const uploadResult = await CloudinaryService.uploadFile(file, {
        clientId,
        folder: 'profile-images',
        resourceType: 'image'
      });

      return uploadResult;

    } catch (error) {
      console.error('Profile image upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Profile image upload failed'
      };
    }
  }

  /**
   * Deletes a document from Cloudinary
   */
  static async deleteDocument(
    publicId: string,
    resourceType: 'image' | 'raw' = 'raw'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      return await CloudinaryService.deleteFile(publicId, resourceType);
    } catch (error) {
      console.error('Document deletion error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Document deletion failed'
      };
    }
  }

  /**
   * Generates a secure URL for document access
   */
  static generateDocumentUrl(
    publicId: string,
    options: {
      resourceType?: 'image' | 'raw';
      width?: number;
      height?: number;
      quality?: string;
    } = {}
  ): string {
    return CloudinaryService.generateSecureUrl(publicId, {
      resourceType: options.resourceType || 'raw',
      ...options
    });
  }

  /**
   * Generates a thumbnail URL for document preview
   */
  static generateDocumentThumbnail(
    publicId: string,
    size: number = 150
  ): string {
    return CloudinaryService.generateThumbnailUrl(publicId, size);
  }

  /**
   * Gets document information from Cloudinary
   */
  static async getDocumentInfo(
    publicId: string,
    resourceType: 'image' | 'raw' = 'raw'
  ) {
    return await CloudinaryService.getFileInfo(publicId, resourceType);
  }

  /**
   * Lists all documents for a client
   */
  static async listClientDocuments(clientId: string) {
    const folder = `client-documents/${clientId}`;
    return await CloudinaryService.listFiles(folder);
  }

  /**
   * Validates document type
   */
  static validateDocumentType(documentType: string): boolean {
    const allowedTypes = [
      'IDENTITY_PROOF',
      'ADDRESS_PROOF',
      'INCOME_PROOF',
      'MEDICAL_REPORT',
      'POLICY_DOCUMENT',
      'OTHER'
    ];
    
    return allowedTypes.includes(documentType.toUpperCase());
  }

  /**
   * Cleans up orphaned documents for a client
   */
  static async cleanupClientDocuments(clientId: string): Promise<{ success: boolean; deletedCount: number; errors: string[] }> {
    try {
      const listResult = await this.listClientDocuments(clientId);
      
      if (!listResult.success || !listResult.files) {
        return {
          success: false,
          deletedCount: 0,
          errors: [listResult.error || 'Failed to list client documents']
        };
      }

      const errors: string[] = [];
      let deletedCount = 0;

      // Delete all files for the client
      for (const file of listResult.files) {
        const resourceType = file.resourceType === 'image' ? 'image' : 'raw';
        const deleteResult = await this.deleteDocument(file.publicId, resourceType as 'image' | 'raw');
        
        if (deleteResult.success) {
          deletedCount++;
        } else {
          errors.push(`Failed to delete ${file.publicId}: ${deleteResult.error}`);
        }
      }

      return {
        success: errors.length === 0,
        deletedCount,
        errors
      };

    } catch (error) {
      console.error('Cleanup error:', error);
      return {
        success: false,
        deletedCount: 0,
        errors: [error instanceof Error ? error.message : 'Cleanup failed']
      };
    }
  }

  /**
   * Validates file upload configuration
   */
  static validateUploadConfiguration(): { isValid: boolean; errors: string[] } {
    return CloudinaryService.validateConfiguration();
  }

  /**
   * Tests document upload functionality
   */
  static async testUploadConnection(): Promise<{ success: boolean; error?: string }> {
    return await CloudinaryService.testConnection();
  }
}