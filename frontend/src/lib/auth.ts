import { NextRequest } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
  };
  message?: string;
}

export async function verifyToken(request: NextRequest): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return {
        success: false,
        message: 'No authorization header provided'
      };
    }

    const response = await fetch(`${BACKEND_URL}/api/auth/verify`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    const data = await response.json();
    
    if (data.success && data.user) {
      return {
        success: true,
        user: data.user
      };
    } else {
      return {
        success: false,
        message: data.message || 'Token verification failed'
      };
    }
  } catch (error) {
    console.error('Token verification error:', error);
    return {
      success: false,
      message: 'Internal server error during token verification'
    };
  }
}