import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';
import { AppError } from '../utils/errorHandler';

// Enhanced security error class
export class SecurityError extends AppError {
  public securityRisk?: string;
  public code?: string;
  public metadata?: Record<string, any>;

  constructor(
    message: string, 
    statusCode: number = 500, 
    options: {
      securityRisk?: string;
      code?: string;
      metadata?: Record<string, any>;
    } = {}
  ) {
    super(message, statusCode);
    this.securityRisk = options.securityRisk;
    this.code = options.code;
    this.metadata = options.metadata;
  }
}

// File type signatures for validation
const FILE_SIGNATURES = {
  // Images
  'FFD8FF': { type: 'image/jpeg', extension: 'jpg' },
  '89504E47': { type: 'image/png', extension: 'png' },
  '47494638': { type: 'image/gif', extension: 'gif' },
  
  // Documents
  '25504446': { type: 'application/pdf', extension: 'pdf' },
  'D0CF11E0': { type: 'application/msword', extension: 'doc' },
  '504B0304': { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', extension: 'docx' },
  '504B0506': { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', extension: 'docx' },
  '504B0708': { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', extension: 'docx' },
};

// Malicious file signatures to block
const MALICIOUS_SIGNATURES = [
  '4D5A',       // PE executable (.exe, .dll)
  '7F454C46',   // ELF executable (Linux)
  'CAFEBABE',   // Java class file
  'FEEDFACE',   // Mach-O executable (macOS)
  'CEFAEDFE',   // Mach-O executable (macOS)
  'FEEDFACF',   // Mach-O 64-bit executable
  'CFFAEDFE',   // Mach-O 64-bit executable
  '213C617263683E', // Unix archive
  '377ABCAF271C',   // 7-Zip archive
  '526172211A0700', // RAR archive
  '504B0304',       // ZIP archive (could contain executables)
];

// Dangerous file extensions
const DANGEROUS_EXTENSIONS = [
  'exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js', 'jar',
  'app', 'deb', 'pkg', 'rpm', 'dmg', 'iso', 'msi', 'run',
  'sh', 'bash', 'zsh', 'fish', 'ps1', 'psm1', 'psd1',
  'php', 'asp', 'aspx', 'jsp', 'py', 'rb', 'pl', 'cgi'
];

// Maximum file sizes by type (in bytes)
const MAX_FILE_SIZES = {
  'image/jpeg': 5 * 1024 * 1024,   // 5MB for images
  'image/png': 5 * 1024 * 1024,    // 5MB for images
  'image/gif': 5 * 1024 * 1024,    // 5MB for images
  'application/pdf': 10 * 1024 * 1024, // 10MB for PDFs
  'application/msword': 10 * 1024 * 1024, // 10MB for DOC
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 10 * 1024 * 1024, // 10MB for DOCX
};

interface FileValidationResult {
  isValid: boolean;
  error?: string;
  detectedType?: string;
  securityRisk?: string;
}

/**
 * Enhanced file validation with security checks
 */
export function validateFileContent(file: Express.Multer.File): FileValidationResult {
  if (!file || !file.buffer) {
    return { isValid: false, error: 'No file data provided' };
  }

  const buffer = file.buffer;
  const header = buffer.subarray(0, 16).toString('hex').toUpperCase();
  
  // Check for malicious file signatures
  for (const signature of MALICIOUS_SIGNATURES) {
    if (header.startsWith(signature)) {
      return {
        isValid: false,
        error: 'File type not allowed for security reasons',
        securityRisk: 'Potentially executable file detected'
      };
    }
  }

  // Check file extension against dangerous list
  const originalName = file.originalname.toLowerCase();
  const extension = originalName.split('.').pop();
  
  if (extension && DANGEROUS_EXTENSIONS.includes(extension)) {
    return {
      isValid: false,
      error: `File extension '.${extension}' is not allowed`,
      securityRisk: 'Dangerous file extension'
    };
  }

  // Validate file signature matches claimed MIME type
  let detectedType: string | undefined;
  for (const [signature, info] of Object.entries(FILE_SIGNATURES)) {
    if (header.startsWith(signature)) {
      detectedType = info.type;
      break;
    }
  }

  if (!detectedType) {
    return {
      isValid: false,
      error: 'Unsupported file type or corrupted file',
      securityRisk: 'Unknown file signature'
    };
  }

  // Check if detected type matches claimed MIME type
  if (detectedType !== file.mimetype) {
    return {
      isValid: false,
      error: 'File type mismatch - file content does not match extension',
      securityRisk: 'MIME type spoofing detected'
    };
  }

  // Check file size limits
  const maxSize = MAX_FILE_SIZES[detectedType as keyof typeof MAX_FILE_SIZES];
  if (maxSize && file.size > maxSize) {
    return {
      isValid: false,
      error: `File size exceeds maximum allowed size of ${Math.round(maxSize / 1024 / 1024)}MB`
    };
  }

  // Additional security checks for specific file types
  if (detectedType.startsWith('image/')) {
    const imageValidation = validateImageFile(buffer, detectedType);
    if (!imageValidation.isValid) {
      return imageValidation;
    }
  } else if (detectedType === 'application/pdf') {
    const pdfValidation = validatePDFFile(buffer);
    if (!pdfValidation.isValid) {
      return pdfValidation;
    }
  }

  return { isValid: true, detectedType };
}

/**
 * Validate image files for embedded threats
 */
function validateImageFile(buffer: Buffer, mimeType: string): FileValidationResult {
  // Check for embedded scripts or suspicious content
  const content = buffer.toString('ascii', 0, Math.min(buffer.length, 1024));
  
  // Look for script tags or suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i,
    /eval\(/i,
    /document\./i,
    /window\./i
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(content)) {
      return {
        isValid: false,
        error: 'Image file contains suspicious content',
        securityRisk: 'Potential script injection in image'
      };
    }
  }

  // Check for excessive metadata (potential data hiding)
  if (mimeType === 'image/jpeg') {
    // Look for EXIF data size - if too large, might contain hidden data
    const exifMarker = buffer.indexOf(Buffer.from([0xFF, 0xE1]));
    if (exifMarker !== -1 && exifMarker < 100) {
      const exifLength = buffer.readUInt16BE(exifMarker + 2);
      if (exifLength > 10000) { // 10KB of EXIF data is suspicious
        return {
          isValid: false,
          error: 'Image contains excessive metadata',
          securityRisk: 'Potential data hiding in EXIF'
        };
      }
    }
  }

  return { isValid: true };
}

/**
 * Validate PDF files for security threats
 */
function validatePDFFile(buffer: Buffer): FileValidationResult {
  const content = buffer.toString('ascii', 0, Math.min(buffer.length, 2048));
  
  // Check for JavaScript in PDF
  if (content.includes('/JavaScript') || content.includes('/JS')) {
    return {
      isValid: false,
      error: 'PDF contains JavaScript which is not allowed',
      securityRisk: 'JavaScript in PDF'
    };
  }

  // Check for form actions
  if (content.includes('/SubmitForm') || content.includes('/Launch')) {
    return {
      isValid: false,
      error: 'PDF contains form actions which are not allowed',
      securityRisk: 'Active content in PDF'
    };
  }

  // Check for embedded files
  if (content.includes('/EmbeddedFile')) {
    return {
      isValid: false,
      error: 'PDF contains embedded files which are not allowed',
      securityRisk: 'Embedded files in PDF'
    };
  }

  return { isValid: true };
}

/**
 * Generate file hash for duplicate detection and integrity checking
 */
export function generateFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Middleware for enhanced file upload security
 */
export const enhancedFileUploadSecurity = (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = req.files as Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] } | undefined;
    const file = req.file;

    // Validate single file
    if (file) {
      const validation = validateFileContent(file);
      if (!validation.isValid) {
        throw new SecurityError(validation.error || 'File validation failed', 400, {
          code: 'FILE_VALIDATION_ERROR',
          securityRisk: validation.securityRisk
        });
      }

      // Add file hash for integrity checking
      (file as any).hash = generateFileHash(file.buffer);
    }

    // Validate multiple files
    if (files) {
      const fileArray = Array.isArray(files) ? files : Object.values(files).flat();
      
      for (const file of fileArray) {
        const validation = validateFileContent(file);
        if (!validation.isValid) {
          throw new SecurityError(
            `${file.originalname}: ${validation.error}`,
            400,
            {
              code: 'FILE_VALIDATION_ERROR',
              securityRisk: validation.securityRisk,
              metadata: { fileName: file.originalname }
            }
          );
        }

        // Add file hash for integrity checking
        (file as any).hash = generateFileHash(file.buffer);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Rate limiting specifically for file uploads
 */
const uploadAttempts = new Map<string, { count: number; resetTime: number; blockedUntil?: number }>();

export const fileUploadRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const clientId = req.ip || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour window
  const maxUploads = 50; // Max uploads per hour
  const blockDuration = 15 * 60 * 1000; // 15 minutes block for abuse

  let clientData = uploadAttempts.get(clientId);

  // Check if client is currently blocked
  if (clientData?.blockedUntil && now < clientData.blockedUntil) {
    const remainingTime = Math.ceil((clientData.blockedUntil - now) / 1000 / 60);
    throw new SecurityError(
      `Upload blocked due to abuse. Try again in ${remainingTime} minutes.`,
      429,
      { 
        code: 'UPLOAD_BLOCKED', 
        metadata: { remainingTime }
      }
    );
  }

  // Reset or initialize counter
  if (!clientData || now > clientData.resetTime) {
    clientData = {
      count: 1,
      resetTime: now + windowMs
    };
    uploadAttempts.set(clientId, clientData);
  } else {
    clientData.count++;
  }

  // Check if limit exceeded
  if (clientData.count > maxUploads) {
    // Block client for abuse
    clientData.blockedUntil = now + blockDuration;
    
    // Log security event
    console.warn('File upload abuse detected:', {
      clientId,
      count: clientData.count,
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent'),
      url: req.url
    });

    throw new SecurityError(
      'Upload rate limit exceeded. Client blocked for 15 minutes.',
      429,
      { 
        code: 'RATE_LIMIT_EXCEEDED', 
        metadata: { blockDuration: 15 }
      }
    );
  }

  // Add rate limit headers
  res.set({
    'X-Upload-Limit': maxUploads.toString(),
    'X-Upload-Remaining': Math.max(0, maxUploads - clientData.count).toString(),
    'X-Upload-Reset': Math.ceil(clientData.resetTime / 1000).toString()
  });

  next();
};

/**
 * Virus scanning simulation (in production, integrate with actual antivirus)
 */
export const virusScanMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = req.files as Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] } | undefined;
    const file = req.file;

    const scanFile = async (file: Express.Multer.File): Promise<boolean> => {
      // Simulate virus scanning
      // In production, integrate with ClamAV, VirusTotal API, or similar
      
      // Basic heuristic checks
      const buffer = file.buffer;
      const content = buffer.toString('hex').toUpperCase();
      
      // Check for known malicious patterns
      const maliciousPatterns = [
        'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*', // EICAR test string
        '4D5A90000300000004000000FFFF0000', // Common PE header pattern
      ];

      for (const pattern of maliciousPatterns) {
        if (content.includes(pattern.replace(/[^A-F0-9]/g, ''))) {
          return false; // Virus detected
        }
      }

      return true; // Clean
    };

    // Scan single file
    if (file) {
      const isClean = await scanFile(file);
      if (!isClean) {
        throw new SecurityError('File failed virus scan', 400, {
          code: 'VIRUS_DETECTED',
          securityRisk: 'Potential malware detected',
          metadata: { fileName: file.originalname }
        });
      }
    }

    // Scan multiple files
    if (files) {
      const fileArray = Array.isArray(files) ? files : Object.values(files).flat();
      
      for (const file of fileArray) {
        const isClean = await scanFile(file);
        if (!isClean) {
          throw new SecurityError(`File failed virus scan: ${file.originalname}`, 400, {
            code: 'VIRUS_DETECTED',
            securityRisk: 'Potential malware detected',
            metadata: { fileName: file.originalname }
          });
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Clean up expired rate limit entries
 */
setInterval(() => {
  const now = Date.now();
  for (const [clientId, data] of uploadAttempts.entries()) {
    if (now > data.resetTime && (!data.blockedUntil || now > data.blockedUntil)) {
      uploadAttempts.delete(clientId);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes