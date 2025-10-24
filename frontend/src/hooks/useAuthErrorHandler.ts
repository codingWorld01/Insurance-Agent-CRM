import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { handleAuthError, isAuthError } from '@/utils/authErrorHandler';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook for handling authentication errors consistently
 */
export function useAuthErrorHandler() {
  const router = useRouter();
  const { toast } = useToast();

  const handleError = useCallback((error: unknown) => {
    if (isAuthError(error)) {
      const authError = handleAuthError(error, router);
      
      toast({
        title: 'Authentication Error',
        description: authError.message,
        variant: 'destructive',
      });
      
      return true; // Indicates error was handled
    }
    
    return false; // Not an auth error
  }, [router, toast]);

  return { handleAuthError: handleError };
}