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
  }
}

export interface AuthenticatedRequest extends ExpressRequest {
  user: JWTPayload;
}

// Re-export Express types for convenience
export { Response, NextFunction, Router, Application };
export { Request } from 'express';