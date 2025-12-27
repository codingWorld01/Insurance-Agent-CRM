import { CloudinaryService } from '../services/cloudinaryService';
import { DocumentService } from '../services/documentService';
import '../types/jest';

// Mock Cloudinary to avoid actual API calls during testing
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
    api: {
      ping: jest.fn(),
      resource: jest.fn(),
      resources: jest.fn(),
    },
    url: jest.fn(),
  },
}));

describe('CloudinaryService', () => {
  // Mock file for testing
  const mockFile: Express.Multer.File = {
    fieldname: 'document',
    originalname: 'test-document.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1024 * 1024, // 1MB
    buffer: Buffer.from('mock file content'),
    destination: '',
    filename: '',
    path: '',
    stream: {} as any,
  };

  const mockImageFile: Express.Multer.File = {
    fieldname: 'image',
    originalname: 'test-image.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 512 * 1024, // 512KB
    buffer: Buffer.from('\xFF\xD8\xFF\xE0mock image content'),
    destination: '',
    filename: '',
    path: '',
    stream: {} as any,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Set up environment variables for testing
    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
    process.env.CLOUDINARY_API_KEY = 'test-key';
    process.env.CLOUDINARY_API_SECRET = 'test-secret';
    process.env.MAX_FILE_SIZE = '10485760';
    process.env.ALLOWED_FILE_TYPES = 'jpg,jpeg,png,gif,pdf,doc,docx';
  });

  describe('validateFile', () => {
    it('should validate a valid PDF file', () => {
      const result = CloudinaryService.validateFile(mockFile);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate a valid image file', () => {
      const result = CloudinaryService.validateFile(mockImageFile);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject files that are too large', () => {
      const largeFile = { ...mockFile, size: 20 * 1024 * 1024 }; // 20MB
      const result = CloudinaryService.validateFile(largeFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('File size exceeds maximum');
    });

    it('should reject files with invalid extensions', () => {
      const invalidFile = { ...mockFile, originalname: 'test.exe' };
      const result = CloudinaryService.validateFile(invalidFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('File type not allowed');
    });

    it('should reject files with invalid MIME types', () => {
      const invalidFile = { ...mockFile, mimetype: 'application/x-executable' };
      const result = CloudinaryService.validateFile(invalidFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid file type detected');
    });
  });

  describe('generateSecureUrl', () => {
    it('should generate a secure URL for a document', () => {
      const mockUrl = 'https://res.cloudinary.com/test/secure/url';
      const cloudinary = require('cloudinary').v2;
      cloudinary.url.mockReturnValue(mockUrl);

      const url = CloudinaryService.generateSecureUrl('test-public-id');
      expect(url).toBe(mockUrl);
      expect(cloudinary.url).toHaveBeenCalledWith('test-public-id', {
        secure: true,
        resource_type: 'image',
      });
    });

    it('should generate a thumbnail URL', () => {
      const mockUrl = 'https://res.cloudinary.com/test/secure/thumbnail';
      const cloudinary = require('cloudinary').v2;
      cloudinary.url.mockReturnValue(mockUrl);

      const url = CloudinaryService.generateThumbnailUrl('test-public-id', 200);
      expect(url).toBe(mockUrl);
      expect(cloudinary.url).toHaveBeenCalledWith('test-public-id', {
        secure: true,
        resource_type: 'image',
        width: 200,
        height: 200,
        crop: 'fill',
        quality: 'auto:good',
        format: 'auto',
      });
    });
  });

  describe('validateConfiguration', () => {
    it('should validate complete configuration', () => {
      const result = CloudinaryService.validateConfiguration();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing configuration', () => {
      delete process.env.CLOUDINARY_CLOUD_NAME;
      const result = CloudinaryService.validateConfiguration();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('CLOUDINARY_CLOUD_NAME is required');
    });
  });

  describe('testConnection', () => {
    it('should test connection successfully', async () => {
      const cloudinary = require('cloudinary').v2;
      cloudinary.api.ping.mockResolvedValue({ status: 'ok' });

      const result = await CloudinaryService.testConnection();
      expect(result.success).toBe(true);
      expect(cloudinary.api.ping).toHaveBeenCalled();
    });

    it('should handle connection failure', async () => {
      const cloudinary = require('cloudinary').v2;
      cloudinary.api.ping.mockRejectedValue(new Error('Connection failed'));

      const result = await CloudinaryService.testConnection();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Connection failed');
    });

    it('should handle invalid configuration', async () => {
      delete process.env.CLOUDINARY_API_KEY;
      
      const result = await CloudinaryService.testConnection();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Configuration errors');
    });
  });
});

describe('DocumentService', () => {
  const mockFile: Express.Multer.File = {
    fieldname: 'document',
    originalname: 'test-document.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1024 * 1024,
    buffer: Buffer.from('mock file content'),
    destination: '',
    filename: '',
    path: '',
    stream: {} as any,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
    process.env.CLOUDINARY_API_KEY = 'test-key';
    process.env.CLOUDINARY_API_SECRET = 'test-secret';
  });

  describe('validateDocumentType', () => {
    it('should validate allowed document types', () => {
      expect(DocumentService.validateDocumentType('IDENTITY_PROOF')).toBe(true);
      expect(DocumentService.validateDocumentType('ADDRESS_PROOF')).toBe(true);
      expect(DocumentService.validateDocumentType('INCOME_PROOF')).toBe(true);
      expect(DocumentService.validateDocumentType('MEDICAL_REPORT')).toBe(true);
      expect(DocumentService.validateDocumentType('POLICY_DOCUMENT')).toBe(true);
      expect(DocumentService.validateDocumentType('OTHER')).toBe(true);
    });

    it('should reject invalid document types', () => {
      expect(DocumentService.validateDocumentType('INVALID_TYPE')).toBe(false);
      expect(DocumentService.validateDocumentType('')).toBe(false);
    });

    it('should handle case insensitive validation', () => {
      expect(DocumentService.validateDocumentType('identity_proof')).toBe(true);
      expect(DocumentService.validateDocumentType('Identity_Proof')).toBe(true);
    });
  });

  describe('uploadProfileImage', () => {
    it('should reject non-image files', async () => {
      const result = await DocumentService.uploadProfileImage(mockFile, 'client-123');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Profile image must be an image file');
    });

    it('should accept image files', async () => {
      const imageFile = { ...mockFile, mimetype: 'image/jpeg' };
      
      // Mock CloudinaryService.uploadFile
      jest.spyOn(CloudinaryService, 'uploadFile').mockResolvedValue({
        success: true,
        url: 'https://test.cloudinary.com/image.jpg',
        secureUrl: 'https://test.cloudinary.com/secure/image.jpg',
        publicId: 'test-public-id',
        originalFilename: 'test-image.jpg',
        format: 'jpg',
        resourceType: 'image',
        bytes: 512000,
      });

      const result = await DocumentService.uploadProfileImage(imageFile, 'client-123');
      expect(result.success).toBe(true);
      expect(result.secureUrl).toBe('https://test.cloudinary.com/secure/image.jpg');
    });
  });

  describe('generateDocumentUrl', () => {
    it('should generate document URL with default options', () => {
      jest.spyOn(CloudinaryService, 'generateSecureUrl').mockReturnValue('https://test.url');
      
      const url = DocumentService.generateDocumentUrl('test-public-id');
      expect(url).toBe('https://test.url');
      expect(CloudinaryService.generateSecureUrl).toHaveBeenCalledWith('test-public-id', {
        resourceType: 'raw',
      });
    });

    it('should generate document URL with custom options', () => {
      jest.spyOn(CloudinaryService, 'generateSecureUrl').mockReturnValue('https://test.url');
      
      const url = DocumentService.generateDocumentUrl('test-public-id', {
        resourceType: 'image',
        width: 300,
        height: 200,
        quality: 'auto:best',
      });
      
      expect(url).toBe('https://test.url');
      expect(CloudinaryService.generateSecureUrl).toHaveBeenCalledWith('test-public-id', {
        resourceType: 'image',
        width: 300,
        height: 200,
        quality: 'auto:best',
      });
    });
  });

  describe('validateUploadConfiguration', () => {
    it('should validate upload configuration', () => {
      jest.spyOn(CloudinaryService, 'validateConfiguration').mockReturnValue({
        isValid: true,
        errors: [],
      });

      const result = DocumentService.validateUploadConfiguration();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('testUploadConnection', () => {
    it('should test upload connection', async () => {
      jest.spyOn(CloudinaryService, 'testConnection').mockResolvedValue({
        success: true,
      });

      const result = await DocumentService.testUploadConnection();
      expect(result.success).toBe(true);
    });
  });
});