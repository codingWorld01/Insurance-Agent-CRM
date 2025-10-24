import { Request, Response, NextFunction } from "express";
import {
  verifyToken,
  extractTokenFromHeader,
  JWTPayload,
} from "../services/authService";

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Authentication middleware to protect routes
 */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    if (!token) {
      res.status(401).json({
        success: false,
        message: "Access token is required",
        statusCode: 401,
      });
      return;
    }
    
    console.log("token ", token);
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    console.log("Error in authenticate Token : ", error);
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
      statusCode: 401,
    });
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (token) {
      const decoded = verifyToken(token);
      req.user = decoded;
    }

    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};
