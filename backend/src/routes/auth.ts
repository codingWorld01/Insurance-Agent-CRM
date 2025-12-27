import { Router, Request, Response } from "express";
import { validateRequest, loginSchema } from "../middleware/validation";
import { asyncHandler } from "../middleware/errorHandler";
import { authenticateToken } from "../middleware/auth";
import { comparePassword, generateToken } from "../services/authService";
import { prisma } from "../services/database";
import { LoginCredentials, AuthResponse } from "../types";

const router = Router();

/**
 * POST /api/auth/login
 * Authenticate user with email and password
 */
router.post(
  "/login",
  validateRequest({ body: loginSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password }: LoginCredentials = req.body;

    try {
      // Get the settings record (single user system)
      const settings = await prisma.settings.findFirst();

      if (!settings) {
        res.status(401).json({
          success: false,
          message: "Invalid credentials",
          statusCode: 401,
        } as AuthResponse);
        return;
      }

      // Verify the email matches
      if (email !== settings.agentEmail) {
        res.status(401).json({
          success: false,
          message: "Invalid credentials",
          statusCode: 401,
        } as AuthResponse);
        return;
      }

      // Verify the password
      const isPasswordValid = await comparePassword(
        password,
        settings.passwordHash
      );

      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: "Invalid credentials",
          statusCode: 401,
        } as AuthResponse);
        return;
      }

      // Generate JWT token
      const token = generateToken({
        id: settings.id,  // Required by JWTPayload interface
        userId: settings.id,
        email: settings.agentEmail,
      });

      res.status(200).json({
        success: true,
        token,
        message: "Login successful",
        user: {
          id: settings.id,
          email: settings.agentEmail,
          name: settings.agentName,
        },
      } as AuthResponse);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error during authentication",
        statusCode: 500,
      } as AuthResponse);
    }
  })
);

/**
 * GET /api/auth/verify
 * Verify JWT token validity
 */
router.get(
  "/verify",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      // If we reach here, the token is valid (middleware passed)
      const user = req.user!;

      // Get fresh user data from database
      const settings = await prisma.settings.findUnique({
        where: { id: user.userId },
      });

      if (!settings) {
        res.status(401).json({
          success: false,
          message: "User not found",
          statusCode: 401,
        } as AuthResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: "Token is valid",
        user: {
          id: settings.id,
          email: settings.agentEmail,
          name: settings.agentName,
        },
      } as AuthResponse);
    } catch (error) {
      console.error("Token verification error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error during token verification",
        statusCode: 500,
      } as AuthResponse);
    }
  })
);

export default router;
