/**
 * Enhanced network retry utilities with comprehensive error handling
 */

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryCondition?: (error: Error, attempt: number) => boolean;
  onRetry?: (error: Error, attempt: number) => void;
  onMaxRetriesReached?: (error: Error) => void;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryCondition: (error: Error) => {
    // Retry on network errors, timeouts, and server errors
    return error.name === 'TypeError' || 
           error.message.includes('fetch') ||
           error.message.includes('timeout') ||
           (error as any).status >= 500;
  }
};

/**
 * Enhanced fetch with exponential backoff retry logic
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryConfig: Partial<RetryConfig> = {}
): Promise<Response> {
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  let lastError: Error;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return response;
      }

      // Create error from response
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      (error as any).status = response.status;
      (error as any).response = response;
      
      lastError = error;

      // Check if we should retry
      if (attempt === config.maxAttempts || !config.retryCondition?.(error, attempt)) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
        config.maxDelay
      );

      config.onRetry?.(error, attempt);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));

    } catch (error) {
      lastError = error as Error;

      // Handle AbortError (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = new Error('Request timeout');
        timeoutError.name = 'TimeoutError';
        lastError = timeoutError;
      }

      // Check if we should retry
      if (attempt === config.maxAttempts || !config.retryCondition?.(lastError, attempt)) {
        config.onMaxRetriesReached?.(lastError);
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
        config.maxDelay
      );

      config.onRetry?.(lastError, attempt);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Retry wrapper for any async operation
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  retryConfig: Partial<RetryConfig> = {}
): Promise<RetryResult<T>> {
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  let lastError: Error;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      const result = await operation();
      return {
        success: true,
        data: result,
        attempts: attempt
      };
    } catch (error) {
      lastError = error as Error;

      // Check if we should retry
      if (attempt === config.maxAttempts || !config.retryCondition?.(lastError, attempt)) {
        config.onMaxRetriesReached?.(lastError);
        return {
          success: false,
          error: lastError,
          attempts: attempt
        };
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
        config.maxDelay
      );

      config.onRetry?.(lastError, attempt);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return {
    success: false,
    error: lastError!,
    attempts: config.maxAttempts
  };
}

/**
 * Create a retry-enabled fetch function with default configuration
 */
export function createRetryFetch(defaultConfig: Partial<RetryConfig> = {}) {
  return (url: string, options: RequestInit = {}, retryConfig: Partial<RetryConfig> = {}) => {
    return fetchWithRetry(url, options, { ...defaultConfig, ...retryConfig });
  };
}

/**
 * Utility to check if an error is retryable
 */
export function isRetryableError(error: Error): boolean {
  // Network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return true;
  }

  // Timeout errors
  if (error.name === 'TimeoutError' || error.name === 'AbortError') {
    return true;
  }

  // Server errors (5xx)
  const status = (error as unknown).status;
  if (typeof status === 'number' && status >= 500) {
    return true;
  }

  // Rate limiting
  if (status === 429) {
    return true;
  }

  // Request timeout
  if (status === 408) {
    return true;
  }

  return false;}


/**
 * Create a circuit breaker for network operations
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private failureThreshold = 5,
    private recoveryTimeout = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState() {
    return this.state;
  }

  reset() {
    this.failures = 0;
    this.lastFailureTime = 0;
    this.state = 'CLOSED';
  }
}