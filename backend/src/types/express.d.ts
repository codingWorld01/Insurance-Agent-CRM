import { Request } from 'express';
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

export interface AuthenticatedRequest extends Request {
  user: JWTPayload & {
    [key: string]: any;
  };
}