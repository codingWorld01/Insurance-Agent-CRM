import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key";
const SALT_ROUNDS = 12;

export interface JWTPayload {
  id: string;
  userId: string;
  email: string;
  role?: string;
  isPremium?: boolean;
}

/**
 * Hash a password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare a plain text password with a hashed password
 */
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Generate a JWT token
 */
export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "24h",
    issuer: "insurance-crm",
  });
};

/**
 * Verify and decode a JWT token
 */
export const verifyToken = (token: string): JWTPayload => {
  try {
    if (token && token.startsWith("Bearer ")) {
      token = token.substring(7);
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (
  authHeader: string | undefined
): string | null => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7); // Remove 'Bearer ' prefix
};
