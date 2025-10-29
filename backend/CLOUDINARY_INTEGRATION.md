# Cloudinary Service Integration

This document outlines the comprehensive Cloudinary service integration implemented for the enhanced client management system.

## Overview

The Cloudinary integration provides secure file upload, storage, and management capabilities for client documents and profile images. The implementation includes robust validation, error handling, and security features.

## Components Implemented

### 1. Configuration (`src/config/cloudinary.ts`)
- Cloudinary SDK configuration with environment variables
- Secure connection setup with API credentials
- Configurable file size limits and allowed file types
- Default folder structure for organized file storage

### 2. Core Service (`src/services/cloudinaryService.ts`)
- **File Validation**: Comprehensive validation for file size, type, and security
- **File Upload**: Secure upload with automatic resource type detection
- **File Deletion**: Clean deletion with Cloudinary API integration
- **URL Generation**: Secure URL generation with transformation options
- **Thumbnail Generation**: Automatic thumbnail creation for images
- **Connection Testing**: Built-in connection validation
- **Configuration Validation**: Environment variable validation

### 3. Document Service (`src/services/documentService.ts`)
- **Document Upload**: Specialized document upload with client organization
- **Profile Image Upload**: Dedicated profile image handling
- **Document Management**: List, retrieve, and delete client documents
- **Document Type Validation**: Validation for allowed document types
- **Client Document Cleanup**: Bulk cleanup for client document removal

### 4. File Upload Middleware (`src/middleware/fileUpload.ts`)
- **Multer Integration**: Memory storage configuration for direct Cloudinary upload
- **File Filtering**: Real-time file validation during upload
- **Security Validation**: File content validation to prevent malicious uploads
- **Rate Limiting**: Upload rate limiting to prevent abuse
- **Error Handling**: Comprehensive error handling for all upload scenarios

### 5. Upload Routes (`src/routes/upload.ts`)
- **Document Upload**: Single and multiple document upload endpoints
- **Profile Image Upload**: Dedicated profile image upload endpoint
- **Document Management**: Delete, list, and retrieve document endpoints
- **URL Generation**: Secure URL generation endpoint
- **Configuration**: Upload configuration and connection testing endpoints

## API Endpoints

### Upload Endpoints
- `POST /api/upload/document` - Upload single document
- `POST /api/upload/documents` - Upload multiple documents
- `POST /api/upload/profile-image` - Upload profile image

### Management Endpoints
- `DELETE /api/upload/document/:publicId` - Delete document
- `GET /api/upload/document/:publicId/info` - Get document information
- `GET /api/upload/client/:clientId/documents` - List client documents

### Utility Endpoints
- `POST /api/upload/generate-url` - Generate secure URLs
- `GET /api/upload/test-connection` - Test Cloudinary connection
- `GET /api/upload/config` - Get upload configuration

## Security Features

### File Validation
- File size limits (configurable, default 10MB)
- File type validation (jpg, jpeg, png, gif, pdf, doc, docx)
- MIME type validation for additional security
- File signature validation to prevent executable uploads

### Upload Security
- Rate limiting (50 uploads per hour per IP)
- Secure upload presets
- Automatic file organization by client ID
- Malicious file detection and blocking

### Access Control
- Secure URL generation with signed access
- Document access control based on client ownership
- Automatic cleanup of orphaned files

## Environment Configuration

Required environment variables:
```env
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
CLOUDINARY_UPLOAD_PRESET=client_documents_preset
CLOUDINARY_FOLDER=client-documents
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,pdf,doc,docx
```

## File Organization

Files are organized in Cloudinary with the following structure:
```
client-documents/
├── {clientId}/
│   ├── IDENTITY_PROOF/
│   ├── ADDRESS_PROOF/
│   ├── INCOME_PROOF/
│   ├── MEDICAL_REPORT/
│   ├── POLICY_DOCUMENT/
│   └── OTHER/
└── profile-images/
    └── {clientId}/
```

## Error Handling

### Frontend Error Types
- `FILE_TOO_LARGE` - File exceeds size limit
- `INVALID_FILE_TYPE` - Unsupported file type
- `UPLOAD_FAILED` - General upload failure
- `RATE_LIMIT_EXCEEDED` - Too many uploads

### Backend Error Types
- `VALIDATION_ERROR` - File validation failed
- `CONNECTION_FAILED` - Cloudinary connection failed
- `DOCUMENT_NOT_FOUND` - Document doesn't exist
- `DELETE_FAILED` - Document deletion failed

## Testing

### Unit Tests
- File validation testing
- URL generation testing
- Configuration validation testing
- Document type validation testing

### Integration Tests
- Upload endpoint testing
- Document management testing
- Error handling testing
- Security validation testing

## Usage Examples

### Upload Document
```javascript
const formData = new FormData();
formData.append('document', file);
formData.append('clientId', 'client-123');
formData.append('documentType', 'IDENTITY_PROOF');

const response = await fetch('/api/upload/document', {
  method: 'POST',
  body: formData
});
```

### Upload Profile Image
```javascript
const formData = new FormData();
formData.append('profileImage', imageFile);
formData.append('clientId', 'client-123');

const response = await fetch('/api/upload/profile-image', {
  method: 'POST',
  body: formData
});
```

### Generate Secure URL
```javascript
const response = await fetch('/api/upload/generate-url', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    publicId: 'client-documents/client-123/document-id',
    resourceType: 'raw',
    width: 300,
    height: 200
  })
});
```

## Performance Considerations

### Upload Optimization
- Memory storage for direct Cloudinary upload (no disk I/O)
- Chunked upload support for large files
- Automatic image optimization and format conversion
- CDN delivery for fast file access

### Scalability
- Stateless upload handling
- Horizontal scaling support
- Connection pooling for API requests
- Efficient file organization for quick retrieval

## Monitoring and Maintenance

### Health Checks
- Connection testing endpoint
- Configuration validation
- Upload quota monitoring
- Error rate tracking

### Cleanup Operations
- Orphaned file cleanup
- Client document bulk deletion
- Storage usage monitoring
- Automatic file expiration (configurable)

## Requirements Satisfied

This implementation satisfies the following requirements from the enhanced client management specification:

- **4.1**: Document upload functionality using Cloudinary service ✅
- **4.4**: Secure file upload validation ✅
- **5.2**: Profile image upload with Cloudinary integration ✅
- **9.1**: Secure integration with Cloudinary for document storage ✅

## Next Steps

The Cloudinary service integration is complete and ready for use. The next task in the implementation plan is to create backend API endpoints for enhanced client management (Task 3).