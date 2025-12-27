import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { cloudinaryConfig } from '../config/cloudinary';
import { CloudinaryService } from '../services/cloudinaryService';

// Configure multer for memory storage (we'll upload to Cloudinary directly)
const storage = multer.memoryStorage();

// File filter function using proper types
const fileFilter = (req: Request, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void) => {
  // Validate file using CloudinaryService
  const validation = CloudinaryService.validateFile(file);
  
  if (validation.isValid) {
    cb(null, true);
  } else {
    // For Multer, we pass null as error and false to reject the file
    // The error message will be handled in the upload middleware
    cb(null, false);
  }
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: cloudinaryConfig.maxFileSize,
    files: 10, // Maximum 10 files per request
  },
});

// Middleware for single file upload
export const uploadSingle = (fieldName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const uploadMiddleware = upload.single(fieldName);
    
    uploadMiddleware(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: `File size exceeds maximum allowed size of ${cloudinaryConfig.maxFileSize / 1024 / 1024}MB`,
            error: 'FILE_TOO_LARGE'
          });
        } else if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            message: 'Too many files uploaded',
            error: 'TOO_MANY_FILES'
          });
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            message: `Unexpected field name. Expected: ${fieldName}`,
            error: 'UNEXPECTED_FIELD'
          });
        }
        
        return res.status(400).json({
          success: false,
          message: err.message,
          error: 'UPLOAD_ERROR'
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
          error: 'VALIDATION_ERROR'
        });
      }
      
      return next();
    });
  };
};

// Middleware for multiple file upload
export const uploadMultiple = (fieldName: string, maxCount: number = 5) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const uploadMiddleware = upload.array(fieldName, maxCount);
    
    uploadMiddleware(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: `File size exceeds maximum allowed size of ${cloudinaryConfig.maxFileSize / 1024 / 1024}MB`,
            error: 'FILE_TOO_LARGE'
          });
        } else if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            message: `Too many files uploaded. Maximum allowed: ${maxCount}`,
            error: 'TOO_MANY_FILES'
          });
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            message: `Unexpected field name. Expected: ${fieldName}`,
            error: 'UNEXPECTED_FIELD'
          });
        }
        
        return res.status(400).json({
          success: false,
          message: err.message,
          error: 'UPLOAD_ERROR'
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
          error: 'VALIDATION_ERROR'
        });
      }
      
      return next();
    });
  };
};

// Middleware for fields with mixed file types
export const uploadFields = (fields: { name: string; maxCount: number }[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const uploadMiddleware = upload.fields(fields);
    
    uploadMiddleware(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: `File size exceeds maximum allowed size of ${cloudinaryConfig.maxFileSize / 1024 / 1024}MB`,
            error: 'FILE_TOO_LARGE'
          });
        } else if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            message: 'Too many files uploaded',
            error: 'TOO_MANY_FILES'
          });
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            message: 'Unexpected field name',
            error: 'UNEXPECTED_FIELD'
          });
        }
        
        return res.status(400).json({
          success: false,
          message: err.message,
          error: 'UPLOAD_ERROR'
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
          error: 'VALIDATION_ERROR'
        });
      }
      
      return next();
    });
  };
};

// Security middleware to validate file content
export const validateFileContent = (req: Request, res: Response, next: NextFunction): Response | void => {
  const files = req.files as Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] } | undefined;
  const file = req.file;

  // Function to validate individual file
  const validateFile = (file: Express.Multer.File): string | null => {
    if (!file || !file.buffer) {
      return 'Invalid file format';
    }
    
    // Check for malicious file signatures
    const buffer = file.buffer;
    const header = buffer.subarray(0, 10).toString('hex').toUpperCase();
    
    // Check for executable file signatures (basic security check)
    const maliciousSignatures = [
      '4D5A', // PE executable
      '7F454C46', // ELF executable
      'CAFEBABE', // Java class file
      'FEEDFACE', // Mach-O executable
    ];
    
    for (const signature of maliciousSignatures) {
      if (header.startsWith(signature)) {
        return 'Executable files are not allowed';
      }
    }
    
    // Validate image files have proper headers
    if (file.mimetype.startsWith('image/')) {
      const imageSignatures = {
        'FFD8FF': 'jpeg',
        '89504E47': 'png',
        '47494638': 'gif',
      };
      
      let validImage = false;
      for (const [signature] of Object.entries(imageSignatures)) {
        if (header.startsWith(signature)) {
          validImage = true;
          break;
        }
      }
      
      if (!validImage) {
        return 'Invalid image file format';
      }
    }
    
    // Validate PDF files
    if (file.mimetype === 'application/pdf') {
      const pdfHeader = buffer.subarray(0, 4).toString();
      if (!pdfHeader.startsWith('%PDF')) {
        return 'Invalid PDF file format';
      }
    }
    
    return null;
  };

  try {
    // Validate single file
    if (file) {
      const error = validateFile(file);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error,
          error: 'INVALID_FILE_CONTENT'
        });
      }
    }
    
    // Validate multiple files
    if (files) {
      const fileArray = Array.isArray(files) ? files : Object.values(files).flat();
      
      for (const file of fileArray) {
        const error = validateFile(file);
        if (error) {
          return res.status(400).json({
            success: false,
            message: `${file.originalname}: ${error}`,
            error: 'INVALID_FILE_CONTENT'
          });
        }
      }
    }
    
    return next();
  } catch (error) {
    console.error('File content validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'File validation failed',
      error: 'VALIDATION_ERROR'
    });
  }
};

// Rate limiting middleware for file uploads
// Note: This is a simple in-memory rate limiter
// In production, you should use Redis or a proper rate limiting solution
const uploadCounts = new Map<string, { count: number; resetTime: number }>();

export const uploadRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const maxUploadsPerHour = 50;
  const windowMs = 60 * 60 * 1000; // 1 hour
  
  const clientId = req.ip || 'unknown';
  const now = Date.now();
  
  const clientData = uploadCounts.get(clientId);
  
  if (!clientData || now > clientData.resetTime) {
    // Reset or initialize counter
    uploadCounts.set(clientId, {
      count: 1,
      resetTime: now + windowMs
    });
    return next();
  } else if (clientData.count < maxUploadsPerHour) {
    // Increment counter
    clientData.count++;
    return next();
  } else {
    // Rate limit exceeded
    return res.status(429).json({
      success: false,
      message: 'Upload rate limit exceeded. Please try again later.',
      error: 'RATE_LIMIT_EXCEEDED'
    });
  }
};