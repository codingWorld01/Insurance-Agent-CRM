/**
 * Authentication error handling utilities
 */

export interface AuthError {
  message: string;
  code: 'TOKEN_EXPIRED' | 'TOKEN_INVALID' | 'UNAUTHORIZED' | 'NETWORK_ERROR';
  shouldRedirect?: boolean;
}

/**
 * Parse authentication error from API response
 */
export function parseAuthError(error: unknown): AuthError {
  if (typeof error === 'string') {
    if (error.toLowerCase().includes('expired')) {
      return {
        message: 'Your session has expired. Please log in again.',
        code: 'TOKEN_EXPIRED',
        shouldRedirect: true
      };
    }
    
    if (error.toLowerCase().includes('invalid') || error.toLowerCase().includes('token')) {
      return {
        message: 'Invalid authentication. Please log in again.',
        code: 'TOKEN_INVALID',
        shouldRedirect: true
      };
    }
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return parseAuthError((error as { message: string }).message);
  }

  return {
    message: 'Authentication failed. Please try again.',
    code: 'UNAUTHORIZED',
    shouldRedirect: true
  };
}

/**
 * Handle authentication errors consistently across the app
 */
export function handleAuthError(error: unknown, router?: { push: (path: string) => void }) {
  const authError = parseAuthError(error);
  
  console.error('Authentication error:', authError);
  
  if (authError.shouldRedirect && router) {
    // Clear any stored tokens
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
    }
    
    // Redirect to login
    router.push('/login?error=session_expired');
  }
  
  return authError;
}

/**
 * Check if an error is authentication-related
 */
export function isAuthError(error: unknown): boolean {
  if (typeof error === 'string') {
    return error.toLowerCase().includes('token') || 
           error.toLowerCase().includes('unauthorized') ||
           error.toLowerCase().includes('expired') ||
           error.toLowerCase().includes('invalid');
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return isAuthError((error as { message: string }).message);
  }
  
  if (error && typeof error === 'object') {
    const errorObj = error as { status?: number; statusCode?: number };
    if (errorObj.status === 401 || errorObj.statusCode === 401) {
      return true;
    }
  }
  
  return false;
}