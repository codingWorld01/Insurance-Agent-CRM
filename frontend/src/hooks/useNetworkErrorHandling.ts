import { useState, useCallback, useRef } from 'react';
import { 
  fetchWithRetryAndValidation, 
  parseApiError,
  PolicyTemplateValidationError,
  PolicyInstanceValidationError,
  NetworkRetryConfig
} from '@/utils/policyTemplateErrorHandling';

interface NetworkState {
  isOnline: boolean;
  isRetrying: boolean;
  retryCount: number;
  lastError: unknown | null;
}

interface UseNetworkErrorHandlingOptions {
  retryConfig?: Partial<NetworkRetryConfig>;
  onError?: (error: unknown) => void;
  onRetrySuccess?: () => void;
  onRetryFailed?: (error: unknown) => void;
}

/**
 * Hook for comprehensive network error handling with retry logic
 */
export function useNetworkErrorHandling(options: UseNetworkErrorHandlingOptions = {}) {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isRetrying: false,
    retryCount: 0,
    lastError: null
  });

  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Enhanced fetch with comprehensive error handling
  const fetchWithErrorHandling = useCallback(async (
    url: string,
    requestOptions: RequestInit = {}
  ): Promise<Response> => {
    try {
      // Clear any previous errors
      setNetworkState(prev => ({ ...prev, lastError: null }));

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();
      
      const response = await fetchWithRetryAndValidation(url, {
        ...requestOptions,
        signal: abortControllerRef.current.signal
      });

      // Reset retry count on success
      setNetworkState(prev => ({ ...prev, retryCount: 0 }));
      options.onRetrySuccess?.();

      return response;
    } catch (error) {
      const parsedError = parseApiError(error);
      
      setNetworkState(prev => ({
        ...prev,
        lastError: parsedError,
        retryCount: prev.retryCount + 1
      }));

      options.onError?.(parsedError);
      throw error;
    }
  }, [options.onError, options.onRetrySuccess]);

  // Manual retry function
  const retryLastRequest = useCallback(async (
    url: string,
    requestOptions: RequestInit = {}
  ) => {
    if (!networkState.lastError) {
      return;
    }

    setNetworkState(prev => ({ ...prev, isRetrying: true }));

    try {
      const response = await fetchWithErrorHandling(url, requestOptions);
      setNetworkState(prev => ({ 
        ...prev, 
        isRetrying: false, 
        lastError: null,
        retryCount: 0
      }));
      options.onRetrySuccess?.();
      return response;
    } catch (error) {
      setNetworkState(prev => ({ ...prev, isRetrying: false }));
      options.onRetryFailed?.(error);
      throw error;
    }
  }, [networkState.lastError, fetchWithErrorHandling, options]);

  // Cancel any ongoing requests
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    setNetworkState(prev => ({ ...prev, isRetrying: false }));
  }, []);

  // Clear error state
  const clearError = useCallback(() => {
    setNetworkState(prev => ({ 
      ...prev, 
      lastError: null, 
      retryCount: 0 
    }));
  }, []);

  // Check if error is retryable
  const isRetryable = useCallback((error: unknown): boolean => {
    const parsedError = parseApiError(error);
    return parsedError.retryable;
  }, []);

  // Get user-friendly error message
  const getErrorMessage = useCallback((error: unknown): string => {
    const parsedError = parseApiError(error);
    return parsedError.message;
  }, []);

  // Network status monitoring
  const updateOnlineStatus = useCallback(() => {
    setNetworkState(prev => ({ 
      ...prev, 
      isOnline: navigator.onLine 
    }));
  }, []);

  // Set up network status listeners
  useState(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', updateOnlineStatus);
      window.addEventListener('offline', updateOnlineStatus);
      
      return () => {
        window.removeEventListener('online', updateOnlineStatus);
        window.removeEventListener('offline', updateOnlineStatus);
      };
    }
  });

  return {
    networkState,
    fetchWithErrorHandling,
    retryLastRequest,
    cancelRequest,
    clearError,
    isRetryable,
    getErrorMessage
  };
}

/**
 * Hook for handling policy template API errors specifically
 */
export function usePolicyTemplateErrorHandling() {
  const [errorState, setErrorState] = useState<{
    hasError: boolean;
    error: unknown | null;
    field?: string;
    isRetryable: boolean;
  }>({
    hasError: false,
    error: null,
    isRetryable: false
  });

  const handleError = useCallback((error: unknown, field?: string) => {
    const isRetryable = error instanceof PolicyTemplateValidationError ? 
      error.retryable : 
      false;

    setErrorState({
      hasError: true,
      error,
      field,
      isRetryable
    });
  }, []);

  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      error: null,
      isRetryable: false
    });
  }, []);

  const getErrorMessage = useCallback((): string => {
    if (!errorState.error) return '';
    
    if (errorState.error instanceof PolicyTemplateValidationError) {
      return errorState.error.message;
    }
    
    if (errorState.error instanceof PolicyInstanceValidationError) {
      return errorState.error.message;
    }

    const parsedError = parseApiError(errorState.error);
    return parsedError.message;
  }, [errorState.error]);

  return {
    errorState,
    handleError,
    clearError,
    getErrorMessage
  };
}

/**
 * Hook for handling form submission errors with validation
 */
export function useFormErrorHandling<T extends Record<string, unknown>>() {
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmissionError = useCallback((error: unknown) => {
    const parsedError = parseApiError(error);
    
    if (parsedError.details) {
      // Handle field-specific errors
      setFormErrors(parsedError.details);
      setSubmitError(null);
    } else {
      // Handle general submission error
      setFormErrors({});
      setSubmitError(parsedError.message);
    }
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setFormErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setFormErrors({});
    setSubmitError(null);
  }, []);

  const validateAndSubmit = useCallback(async (
    data: T,
    submitFn: (data: T) => Promise<unknown>,
    validationFn?: (data: T) => { isValid: boolean; errors: Record<string, string> }
  ) => {
    setIsSubmitting(true);
    clearAllErrors();

    try {
      // Run client-side validation if provided
      if (validationFn) {
        const validation = validationFn(data);
        if (!validation.isValid) {
          setFormErrors(validation.errors);
          return { success: false, errors: validation.errors };
        }
      }

      // Submit the form
      const result = await submitFn(data);
      return { success: true, data: result };
    } catch (error) {
      handleSubmissionError(error);
      return { success: false, error };
    } finally {
      setIsSubmitting(false);
    }
  }, [handleSubmissionError, clearAllErrors]);

  return {
    formErrors,
    isSubmitting,
    submitError,
    handleSubmissionError,
    clearFieldError,
    clearAllErrors,
    validateAndSubmit
  };
}

/**
 * Hook for handling bulk operation errors
 */
export function useBulkOperationErrorHandling() {
  const [bulkErrors, setBulkErrors] = useState<Array<{
    id: string;
    error: string;
  }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [failureCount, setFailureCount] = useState(0);

  const processBulkOperation = useCallback(async <T>(
    items: Array<{ id: string; data: T }>,
    operationFn: (item: T) => Promise<unknown>,
    onProgress?: (completed: number, total: number) => void
  ) => {
    setIsProcessing(true);
    setBulkErrors([]);
    setSuccessCount(0);
    setFailureCount(0);

    const errors: Array<{ id: string; error: string }> = [];
    let successCount = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      try {
        await operationFn(item.data);
        successCount++;
        setSuccessCount(successCount);
      } catch (error) {
        const parsedError = parseApiError(error);
        errors.push({
          id: item.id,
          error: parsedError.message
        });
        setFailureCount(errors.length);
      }

      onProgress?.(i + 1, items.length);
    }

    setBulkErrors(errors);
    setIsProcessing(false);

    return {
      successCount,
      failureCount: errors.length,
      errors
    };
  }, []);

  const clearBulkErrors = useCallback(() => {
    setBulkErrors([]);
    setSuccessCount(0);
    setFailureCount(0);
  }, []);

  return {
    bulkErrors,
    isProcessing,
    successCount,
    failureCount,
    processBulkOperation,
    clearBulkErrors
  };
}