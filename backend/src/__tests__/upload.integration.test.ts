import request from 'supertest';
import express from 'express';
import uploadRoutes from '../routes/upload';

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

// Mock DocumentService
jest.mock('../services/documentService', () => ({
  DocumentService: {
    uploadDocument: jest.fn(),
    uploadProfileImage: jest.fn(),
    deleteDocument: jest.fn(),
    getDocumentInfo: jest.fn(),
    listClientDocuments: jest.fn(),
    generateDocumentUrl: jest.fn(),
    validateDocumentType: jest.fn(),
    testUploadConnection: jest.fn(),
    validateUploadConfiguration: jest.fn(),
  },
}));

// Skip database setup for this test
jest.mock('../services/database', () => ({
  default: {
    connect: jest.fn(),
    disconnect: jest.fn(),
  },
}));

describe('Upload Routes Integration Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/upload', uploadRoutes);
    
    // Set up environment variables for testing
    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
    process.env.CLOUDINARY_API_KEY = 'test-key';
    process.env.CLOUDINARY_API_SECRET = 'test-secret';
    process.env.MAX_FILE_SIZE = '10485760';
    process.env.ALLOWED_FILE_TYPES = 'jpg,jpeg,png,gif,pdf,doc,docx';
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/upload/test-connection', () => {
    it('should test Cloudinary connection successfully', async () => {
      const { DocumentService } = require('../services/documentService');
      DocumentService.testUploadConnection.mockResolvedValue({
        success: true,
      });

      const response = await request(app)
        .get('/api/upload/test-connection');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Cloudinary connection successful');
      expect(DocumentService.testUploadConnection).toHaveBeenCalled();
    });

    it('should handle connection failure', async () => {
      const { DocumentService } = require('../services/documentService');
      DocumentService.testUploadConnection.mockResolvedValue({
        success: false,
        error: 'Connection failed',
      });

      const response = await request(app)
        .get('/api/upload/test-connection');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('CONNECTION_FAILED');
    });
  });

  describe('GET /api/upload/config', () => {
    it('should return upload configuration', async () => {
      const { DocumentService } = require('../services/documentService');
      DocumentService.validateUploadConfiguration.mockReturnValue({
        isValid: true,
        errors: [],
      });

      const response = await request(app)
        .get('/api/upload/config');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(true);
      expect(response.body.data.maxFileSize).toBe('10485760');
      expect(response.body.data.allowedFileTypes).toEqual(['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx']);
    });

    it('should return configuration errors', async () => {
      const { DocumentService } = require('../services/documentService');
      DocumentService.validateUploadConfiguration.mockReturnValue({
        isValid: false,
        errors: ['CLOUDINARY_CLOUD_NAME is required'],
      });

      const response = await request(app)
        .get('/api/upload/config');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.data.errors).toContain('CLOUDINARY_CLOUD_NAME is required');
    });
  });

  describe('POST /api/upload/generate-url', () => {
    it('should generate secure URL for document', async () => {
      const { DocumentService } = require('../services/documentService');
      DocumentService.generateDocumentUrl.mockReturnValue('https://secure.cloudinary.com/test-url');
      DocumentService.generateDocumentThumbnail.mockReturnValue('https://secure.cloudinary.com/thumbnail');

      const response = await request(app)
        .post('/api/upload/generate-url')
        .send({
          publicId: 'test-public-id',
          resourceType: 'image',
          width: 300,
          height: 200,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.secureUrl).toBe('https://secure.cloudinary.com/test-url');
      expect(response.body.data.thumbnailUrl).toBe('https://secure.cloudinary.com/thumbnail');
    });

    it('should return error for missing publicId', async () => {
      const response = await request(app)
        .post('/api/upload/generate-url')
        .send({
          resourceType: 'image',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('MISSING_PUBLIC_ID');
    });

    it('should handle URL generation failure', async () => {
      const { DocumentService } = require('../services/documentService');
      DocumentService.generateDocumentUrl.mockReturnValue('');

      const response = await request(app)
        .post('/api/upload/generate-url')
        .send({
          publicId: 'test-public-id',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('URL_GENERATION_FAILED');
    });
  });

  describe('GET /api/upload/client/:clientId/documents', () => {
    it('should list client documents successfully', async () => {
      const { DocumentService } = require('../services/documentService');
      const mockDocuments = [
        {
          publicId: 'client-123/document1',
          format: 'pdf',
          resourceType: 'raw',
          bytes: 1024,
          url: 'https://cloudinary.com/doc1',
          secureUrl: 'https://secure.cloudinary.com/doc1',
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];

      DocumentService.listClientDocuments.mockResolvedValue({
        success: true,
        files: mockDocuments,
      });

      const response = await request(app)
        .get('/api/upload/client/test-client-123/documents');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.documents).toEqual(mockDocuments);
      expect(response.body.data.count).toBe(1);
      expect(DocumentService.listClientDocuments).toHaveBeenCalledWith('test-client-123');
    });

    it('should handle listing failure', async () => {
      const { DocumentService } = require('../services/documentService');
      DocumentService.listClientDocuments.mockResolvedValue({
        success: false,
        error: 'Failed to list documents',
      });

      const response = await request(app)
        .get('/api/upload/client/test-client-123/documents');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('LIST_FAILED');
    });
  });

  describe('DELETE /api/upload/document/:publicId', () => {
    it('should delete document successfully', async () => {
      const { DocumentService } = require('../services/documentService');
      DocumentService.deleteDocument.mockResolvedValue({
        success: true,
      });

      const response = await request(app)
        .delete('/api/upload/document/test-public-id')
        .query({ resourceType: 'raw' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Document deleted successfully');
      expect(DocumentService.deleteDocument).toHaveBeenCalledWith('test-public-id', 'raw');
    });

    it('should handle deletion failure', async () => {
      const { DocumentService } = require('../services/documentService');
      DocumentService.deleteDocument.mockResolvedValue({
        success: false,
        error: 'Delete failed',
      });

      const response = await request(app)
        .delete('/api/upload/document/test-public-id');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('DELETE_FAILED');
    });
  });

  describe('GET /api/upload/document/:publicId/info', () => {
    it('should get document info successfully', async () => {
      const { DocumentService } = require('../services/documentService');
      const mockInfo = {
        publicId: 'test-public-id',
        format: 'pdf',
        resourceType: 'raw',
        bytes: 1024,
        url: 'https://cloudinary.com/doc',
        secureUrl: 'https://secure.cloudinary.com/doc',
        createdAt: '2024-01-01T00:00:00Z',
      };

      DocumentService.getDocumentInfo.mockResolvedValue({
        success: true,
        data: mockInfo,
      });

      const response = await request(app)
        .get('/api/upload/document/test-public-id/info');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockInfo);
      expect(DocumentService.getDocumentInfo).toHaveBeenCalledWith('test-public-id', 'raw');
    });

    it('should handle document not found', async () => {
      const { DocumentService } = require('../services/documentService');
      DocumentService.getDocumentInfo.mockResolvedValue({
        success: false,
        error: 'Document not found',
      });

      const response = await request(app)
        .get('/api/upload/document/test-public-id/info');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('DOCUMENT_NOT_FOUND');
    });
  });
});