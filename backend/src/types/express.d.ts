// Express type definitions
import { Request as ExpressRequest, Response, NextFunction, Router, Application } from 'express';
import { JWTPayload } from '../services/authService';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload & {
        [key: string]: any;
      };
    }
  }
}

export interface AuthenticatedRequest extends ExpressRequest {
  user: JWTPayload & {
    [key: string]: any;
  };
}

// Re-export Express types for convenience
export { Response, NextFunction, Router, Application };
export { Request } from 'express';