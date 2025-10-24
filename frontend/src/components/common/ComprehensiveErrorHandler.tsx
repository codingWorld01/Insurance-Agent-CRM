"use client";

import { useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useNetworkErrorHandling } from '@/hooks/useNetworkErrorHandling';
import { parseApiError } from '@/utils/policyTemplateErrorHandling';

interface ComprehensiveErrorHandlerProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Comprehensive error boundary component with network status monitoring
 */
export function ComprehensiveErrorHandler({
  children,
  fallback,
  onError
}: ComprehensiveErrorHandlerProps) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [errorInfo, setErrorInfo] = useState<React.ErrorInfo | null>(null);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const { networkState, clearError } = useNetworkErrorHandling();

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Error boundary functionality
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true);
      setError(new Error(event.message));
      onError?.(new Error(event.message), { componentStack: event.filename || '' });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setHasError(true);
      setError(new Error(event.reason?.message || 'Unhandled promise rejection'));
      onError?.(new Error(event.reason?.message || 'Unhandled promise rejection'), { componentStack: '' });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [onError]);

  const handleRetry = () => {
    setHasError(false);
    setError(null);
    setErrorInfo(null);
    clearError();
    window.location.reload();
  };

  const handleDismiss = () => {
    setHasError(false);
    setError(null);
    setErrorInfo(null);
  };

  // Show network status indicator
  if (!isOnline) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <WifiOff className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle>No Internet Connection</CardTitle>
            <CardDescription>
              Please check your internet connection and try again.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => window.location.reload()} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error boundary fallback
  if (hasError && error) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle>Something went wrong</CardTitle>
            <CardDescription>
              An unexpected error occurred. Please try refreshing the page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-1">Error Details:</div>
                <div className="text-sm">{error.message}</div>
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <Button onClick={handleRetry} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Page
              </Button>
              <Button variant="outline" onClick={handleDismiss}>
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {children}
      <NetworkStatusIndicator isOnline={isOnline} />
    </>
  );
}

interface NetworkStatusIndicatorProps {
  isOnline: boolean;
}

/**
 * Network status indicator component
 */
function NetworkStatusIndicator({ isOnline }: NetworkStatusIndicatorProps) {
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowIndicator(true);
    } else {
      // Show "back online" message briefly
      setShowIndicator(true);
      const timer = setTimeout(() => setShowIndicator(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!showIndicator) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Alert className={cn(
        "w-80",
        isOnline ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
      )}>
        {isOnline ? (
          <Wifi className="h-4 w-4 text-green-600" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-600" />
        )}
        <AlertDescription className={isOnline ? "text-green-800" : "text-red-800"}>
          {isOnline ? "Connection restored" : "No internet connection"}
        </AlertDescription>
      </Alert>
    </div>
  );
}

interface GlobalErrorDisplayProps {
  errors: Array<{
    id: string;
    message: string;
    type: 'error' | 'warning' | 'info';
    retryable?: boolean;
    onRetry?: () => void;
    onDismiss?: () => void;
  }>;
  className?: string;
}

/**
 * Global error display component for showing multiple errors
 */
export function GlobalErrorDisplay({ errors, className }: GlobalErrorDisplayProps) {
  if (errors.length === 0) return null;

  return (
    <div className={cn("fixed top-4 right-4 z-50 space-y-2 w-80", className)}>
      {errors.map((error) => (
        <Alert
          key={error.id}
          variant={error.type === 'error' ? 'destructive' : 'default'}
          className={cn(
            error.type === 'warning' && "border-amber-200 bg-amber-50",
            error.type === 'info' && "border-blue-200 bg-blue-50"
          )}
        >
          {error.type === 'error' && <AlertCircle className="h-4 w-4" />}
          {error.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-600" />}
          {error.type === 'info' && <Info className="h-4 w-4 text-blue-600" />}
          
          <AlertDescription>
            <div className="flex items-start justify-between">
              <div className="flex-1 text-sm">{error.message}</div>
              <div className="flex items-center gap-1 ml-2">
                {error.retryable && error.onRetry && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={error.onRetry}
                    className="h-6 w-6 p-0"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                )}
                {error.onDismiss && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={error.onDismiss}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}

interface ProgressErrorDisplayProps {
  isLoading: boolean;
  progress?: number;
  error?: string;
  onRetry?: () => void;
  onCancel?: () => void;
  className?: string;
}

/**
 * Progress error display component for long-running operations
 */
export function ProgressErrorDisplay({
  isLoading,
  progress,
  error,
  onRetry,
  onCancel,
  className
}: ProgressErrorDisplayProps) {
  if (!isLoading && !error) return null;

  return (
    <Card className={cn("w-full max-w-md", className)}>
      <CardContent className="pt-6">
        {isLoading && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Processing...</span>
              {progress !== undefined && <span>{Math.round(progress)}%</span>}
            </div>
            {progress !== undefined && (
              <Progress value={progress} className="w-full" />
            )}
            {onCancel && (
              <Button variant="outline" onClick={onCancel} className="w-full">
                Cancel
              </Button>
            )}
          </div>
        )}
        
        {error && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            {onRetry && (
              <Button onClick={onRetry} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ValidationSummaryProps {
  validationResults: Array<{
    field: string;
    message: string;
    type: 'error' | 'warning';
  }>;
  onFieldFocus?: (field: string) => void;
  className?: string;
}

/**
 * Validation summary component for forms
 */
export function ValidationSummary({
  validationResults,
  onFieldFocus,
  className
}: ValidationSummaryProps) {
  const errors = validationResults.filter(r => r.type === 'error');
  const warnings = validationResults.filter(r => r.type === 'warning');

  if (validationResults.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">
                {errors.length === 1 ? '1 error found:' : `${errors.length} errors found:`}
              </div>
              <div className="space-y-1">
                {errors.map((error, index) => (
                  <div
                    key={index}
                    className={cn(
                      "text-sm cursor-pointer hover:underline",
                      onFieldFocus && "text-red-700 hover:text-red-800"
                    )}
                    onClick={() => onFieldFocus?.(error.field)}
                  >
                    <span className="font-medium capitalize">
                      {error.field.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                    </span>{' '}
                    {error.message}
                  </div>
                ))}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {warnings.length > 0 && (
        <Alert variant="default" className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium text-amber-800">
                {warnings.length === 1 ? '1 warning:' : `${warnings.length} warnings:`}
              </div>
              <div className="space-y-1">
                {warnings.map((warning, index) => (
                  <div
                    key={index}
                    className={cn(
                      "text-sm text-amber-700 cursor-pointer hover:underline",
                      onFieldFocus && "hover:text-amber-800"
                    )}
                    onClick={() => onFieldFocus?.(warning.field)}
                  >
                    <span className="font-medium capitalize">
                      {warning.field.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                    </span>{' '}
                    {warning.message}
                  </div>
                ))}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}