import { cloudinary, cloudinaryConfig } from '../config/cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

export interface FileUploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  secureUrl?: string;
  originalFilename?: string;
  format?: string;
  resourceType?: string;
  bytes?: number;
  error?: string;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export class CloudinaryService {
  /**
   * Validates file before upload
   */
  static validateFile(file: Express.Multer.File): FileValidationResult {
    // Check file size
    if (file.size > cloudinaryConfig.maxFileSize) {
      return {
        isValid: false,
        error: `File size exceeds maximum allowed size of ${cloudinaryConfig.maxFileSize / 1024 / 1024}MB`
      };
    }

    // Check file type
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
    if (!fileExtension || !cloudinaryConfig.allowedFileTypes.includes(fileExtension)) {
      return {
        isValid: false,
        error: `File type not allowed. Allowed types: ${cloudinaryConfig.allowedFileTypes.join(', ')}`
      };
    }

    // Check MIME type for additional security
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return {
        isValid: false,
        error: 'Invalid file type detected'
      };
    }

    return { isValid: true };
  }

  /**
   * Uploads a file to Cloudinary
   */
  static async uploadFile(
    file: Express.Multer.File,
    options: {
      folder?: string;
      clientId?: string;
      documentType?: string;
      resourceType?: 'image' | 'video' | 'raw' | 'auto';
    } = {}
  ): Promise<FileUploadResult> {
    try {
      // Validate file first
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Determine resource type based on file
      let resourceType: 'image' | 'video' | 'raw' | 'auto' = options.resourceType || 'auto';
      if (file.mimetype.startsWith('image/')) {
        resourceType = 'image';
      } else if (file.mimetype === 'application/pdf' || 
                 file.mimetype.includes('document') || 
                 file.mimetype.includes('word')) {
        resourceType = 'raw';
      }

      // Build folder path
      let folderPath = cloudinaryConfig.folder;
      if (options.clientId) {
        folderPath += `/${options.clientId}`;
        if (options.documentType) {
          folderPath += `/${options.documentType}`;
        }
      }
      if (options.folder) {
        folderPath += `/${options.folder}`;
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.originalname.split('.').pop();
      const publicId = `${folderPath}/${timestamp}_${randomString}`;

      // Upload to Cloudinary
      const result: UploadApiResponse = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: resourceType,
            public_id: publicId,
            folder: folderPath,
            use_filename: false,
            unique_filename: true,
            overwrite: false,
            // Security settings
            invalidate: true,
            // For documents, preserve original format
            ...(resourceType === 'raw' && {
              raw_convert: 'aspose',
              format: fileExtension
            }),
            // For images, apply basic optimizations
            ...(resourceType === 'image' && {
              quality: 'auto:good',
              fetch_format: 'auto'
            })
          },
          (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
            if (error) {
              reject(error);
            } else if (result) {
              resolve(result);
            } else {
              reject(new Error('Upload failed with no result'));
            }
          }
        );

        uploadStream.end(file.buffer);
      });

      return {
        success: true,
        url: result.url,
        secureUrl: result.secure_url,
        publicId: result.public_id,
        originalFilename: file.originalname,
        format: result.format,
        resourceType: result.resource_type,
        bytes: result.bytes
      };

    } catch (error) {
      console.error('Cloudinary upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Deletes a file from Cloudinary
   */
  static async deleteFile(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        invalidate: true
      });

      if (result.result === 'ok' || result.result === 'not found') {
        return { success: true };
      } else {
        return {
          success: false,
          error: `Failed to delete file: ${result.result}`
        };
      }
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed'
      };
    }
  }

  /**
   * Generates a secure URL for accessing a file
   */
  static generateSecureUrl(
    publicId: string, 
    options: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string;
      format?: string;
      resourceType?: 'image' | 'video' | 'raw';
    } = {}
  ): string {
    try {
      return cloudinary.url(publicId, {
        secure: true,
        resource_type: options.resourceType || 'image',
        ...options
      });
    } catch (error) {
      console.error('Error generating secure URL:', error);
      return '';
    }
  }

  /**
   * Generates a thumbnail URL for images
   */
  static generateThumbnailUrl(publicId: string, size: number = 150): string {
    return this.generateSecureUrl(publicId, {
      width: size,
      height: size,
      crop: 'fill',
      quality: 'auto:good',
      format: 'auto'
    });
  }

  /**
   * Gets file information from Cloudinary
   */
  static async getFileInfo(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image') {
    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: resourceType
      });
      
      return {
        success: true,
        data: {
          publicId: result.public_id,
          format: result.format,
          resourceType: result.resource_type,
          bytes: result.bytes,
          width: result.width,
          height: result.height,
          url: result.url,
          secureUrl: result.secure_url,
          createdAt: result.created_at
        }
      };
    } catch (error) {
      console.error('Error getting file info:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get file info'
      };
    }
  }

  /**
   * Lists files in a specific folder
   */
  static async listFiles(folder: string, maxResults: number = 50) {
    try {
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: folder,
        max_results: maxResults
      });

      return {
        success: true,
        files: result.resources.map((resource: any) => ({
          publicId: resource.public_id,
          format: resource.format,
          resourceType: resource.resource_type,
          bytes: resource.bytes,
          url: resource.url,
          secureUrl: resource.secure_url,
          createdAt: resource.created_at
        }))
      };
    } catch (error) {
      console.error('Error listing files:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list files'
      };
    }
  }

  /**
   * Validates Cloudinary configuration
   */
  static validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!cloudinaryConfig.cloudName) {
      errors.push('CLOUDINARY_CLOUD_NAME is required');
    }
    if (!cloudinaryConfig.apiKey) {
      errors.push('CLOUDINARY_API_KEY is required');
    }
    if (!cloudinaryConfig.apiSecret) {
      errors.push('CLOUDINARY_API_SECRET is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Tests the Cloudinary connection
   */
  static async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate configuration first
      const configValidation = this.validateConfiguration();
      if (!configValidation.isValid) {
        return {
          success: false,
          error: `Configuration errors: ${configValidation.errors.join(', ')}`
        };
      }

      // Test connection by getting account details
      const result = await cloudinary.api.ping();
      
      if (result.status === 'ok') {
        return { success: true };
      } else {
        return {
          success: false,
          error: 'Cloudinary connection test failed'
        };
      }
    } catch (error) {
      console.error('Cloudinary connection test error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }
}