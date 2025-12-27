// Express type definitions
import { Request as ExpressRequest, Response, NextFunction, Router, Application } from 'express';

// JWT Payload interface - matches the one in authService
export interface JWTPayload {
  id: string;
  userId: string;
  email: string;
  role?: string;
  isPremium?: boolean;
  iat?: number;
  exp?: number;
}

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

// AuthenticatedRequest extends ExpressRequest with all its properties
export interface AuthenticatedRequest extends ExpressRequest {
  user: JWTPayload;
}