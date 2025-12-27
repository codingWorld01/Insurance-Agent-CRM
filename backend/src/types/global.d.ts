// Global type augmentations

// JWT Payload interface
export interface JWTPayload {
  id: string;
  userId: string;
  email: string;
  role?: string;
  isPremium?: boolean;
  iat?: number;
  exp?: number;
}

// Augment Express Request interface globally
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
    
    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
      }
    }
  }
}

// AuthenticatedRequest interface that extends Express Request
import { Request as ExpressRequest } from 'express';

export interface AuthenticatedRequest extends ExpressRequest {
  user: JWTPayload;
}