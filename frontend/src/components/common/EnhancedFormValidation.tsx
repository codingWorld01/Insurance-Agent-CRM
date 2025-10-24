"use client";

import { useState, useCallback, useEffect } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  usePolicyTemplateValidation, 
  usePolicyInstanceValidation,
  usePolicyNumberValidation,
  useAssociationValidation 
} from '@/hooks/usePolicyTemplateValidation';
import { useNetworkErrorHandling } from '@/hooks/useNetworkErrorHandling';

interface ValidationState {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
  isValidating: boolean;
}

interface EnhancedFormValidationProps {
  children: React.ReactNode;
  onValidationChange?: (isValid: boolean, errors: Record<string, string>) => void;
  className?: string;
}

/**
 * Enhanced form validation wrapper component
 */
export function EnhancedFormValidation({
  children,
  onValidationChange,
  className
}: EnhancedFormValidationProps) {
  const [validationState, setValidationState] = useState<ValidationState>({
    isValid: true,
    errors: {},
    warnings: {},
    isValidating: false
  });

  const { networkState, clearError } = useNetworkErrorHandling();

  // Notify parent of validation changes
  useEffect(() => {
    onValidationChange?.(validationState.isValid, validationState.errors);
  }, [validationState.isValid, validationState.errors, onValidationChange]);

  const updateValidation = useCallback((
    errors: Record<string, string> = {},
    warnings: Record<string, string> = {},
    isValidating = false
  ) => {
    setValidationState({
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings,
      isValidating
    });
  }, []);

  const clearValidation = useCallback(() => {
    setValidationState({
      isValid: true,
      errors: {},
      warnings: {},
      isValidating: false
    });
  }, []);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Network Error Display */}
      {networkState.lastError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-medium mb-1">Connection Error</div>
                <div className="text-sm">
                  Unable to connect to the server. Please check your internet connection.
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearError}
                  className="h-8"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearError}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Validation Summary */}
      <ValidationSummary
        errors={validationState.errors}
        warnings={validationState.warnings}
        isValidating={validationState.isValidating}
      />

      {/* Form Content */}
      {children}
    </div>
  );
}

interface ValidationSummaryProps {
  errors: Record<string, string>;
  warnings: Record<string, string>;
  isValidating?: boolean;
  onFieldFocus?: (field: string) => void;
  className?: string;
}

/**
 * Validation summary component for displaying errors and warnings
 */
export function ValidationSummary({
  errors,
  warnings,
  isValidating,
  onFieldFocus,
  className
}: ValidationSummaryProps) {
  const errorCount = Object.keys(errors).length;
  const warningCount = Object.keys(warnings).length;

  if (errorCount === 0 && warningCount === 0 && !isValidating) {
    return null;
  }

  const formatFieldName = (field: string): string => {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/Id$/, ' ID');
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Validation in progress */}
      {isValidating && (
        <Alert variant="default" className="border-blue-200 bg-blue-50">
          <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
          <AlertDescription className="text-blue-800">
            Validating form data...
          </AlertDescription>
        </Alert>
      )}

      {/* Errors */}
      {errorCount > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">
                {errorCount === 1 ? '1 error found:' : `${errorCount} errors found:`}
              </div>
              <div className="space-y-1">
                {Object.entries(errors).map(([field, message]) => (
                  <div
                    key={field}
                    className={cn(
                      "text-sm cursor-pointer hover:underline",
                      onFieldFocus && "text-red-700 hover:text-red-800"
                    )}
                    onClick={() => onFieldFocus?.(field)}
                  >
                    <span className="font-medium">{formatFieldName(field)}:</span> {message}
                  </div>
                ))}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Warnings */}
      {warningCount > 0 && (
        <Alert variant="default" className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium text-amber-800">
                {warningCount === 1 ? '1 warning:' : `${warningCount} warnings:`}
              </div>
              <div className="space-y-1">
                {Object.entries(warnings).map(([field, message]) => (
                  <div
                    key={field}
                    className={cn(
                      "text-sm text-amber-700 cursor-pointer hover:underline",
                      onFieldFocus && "hover:text-amber-800"
                    )}
                    onClick={() => onFieldFocus?.(field)}
                  >
                    <span className="font-medium">{formatFieldName(field)}:</span> {message}
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

interface FieldValidationProps {
  field: string;
  value: unknown;
  validationType: 'policyTemplate' | 'policyInstance' | 'policyNumber' | 'association';
  validationOptions?: {
    excludeTemplateId?: string;
    clientId?: string;
    policyTemplateId?: string;
    excludeInstanceId?: string;
  };
  onValidationChange?: (field: string, isValid: boolean, error?: string, warning?: string) => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * Field-level validation component with real-time feedback
 */
export function FieldValidation({
  field,
  value,
  validationType,
  validationOptions = {},
  onValidationChange,
  children,
  className
}: FieldValidationProps) {
  const [validationState, setValidationState] = useState<{
    isValid: boolean | null;
    error?: string;
    warning?: string;
    isValidating: boolean;
  }>({
    isValid: null,
    isValidating: false
  });

  const policyTemplateValidation = usePolicyTemplateValidation();
  const policyInstanceValidation = usePolicyInstanceValidation();
  const policyNumberValidation = usePolicyNumberValidation(validationOptions.excludeTemplateId);
  const associationValidation = useAssociationValidation();

  // Perform validation based on type
  const performValidation = useCallback(async () => {
    if (!value) {
      setValidationState({ isValid: null, isValidating: false });
      onValidationChange?.(field, true);
      return;
    }

    setValidationState(prev => ({ ...prev, isValidating: true }));

    try {
      switch (validationType) {
        case 'policyNumber':
          if (typeof value === 'string') {
            const result = await policyNumberValidation.validateUniqueness(value);
            setValidationState({
              isValid: result,
              error: result === false ? 'Policy number already exists' : undefined,
              isValidating: false
            });
            onValidationChange?.(field, result !== false, result === false ? 'Policy number already exists' : undefined);
          }
          break;

        case 'association':
          if (validationOptions.clientId && validationOptions.policyTemplateId) {
            const result = await associationValidation.validateAssociation(
              validationOptions.clientId,
              validationOptions.policyTemplateId,
              validationOptions.excludeInstanceId
            );
            setValidationState({
              isValid: result,
              error: result === false ? 'Client already has this policy template' : undefined,
              isValidating: false
            });
            onValidationChange?.(field, result !== false, result === false ? 'Client already has this policy template' : undefined);
          }
          break;

        default:
          setValidationState({ isValid: true, isValidating: false });
          onValidationChange?.(field, true);
      }
    } catch (error) {
      console.error('Validation error:', error);
      setValidationState({
        isValid: null,
        error: 'Unable to validate',
        isValidating: false
      });
      onValidationChange?.(field, true, 'Unable to validate');
    }
  }, [
    value,
    validationType,
    field,
    validationOptions,
    onValidationChange,
    policyNumberValidation,
    associationValidation
  ]);

  // Debounced validation
  useEffect(() => {
    const timeoutId = setTimeout(performValidation, 500);
    return () => clearTimeout(timeoutId);
  }, [performValidation]);

  return (
    <div className={cn("space-y-2", className)}>
      {children}
      
      {/* Validation Status */}
      {validationState.isValidating && (
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <RefreshCw className="h-3 w-3 animate-spin" />
          <span>Validating...</span>
        </div>
      )}
      
      {validationState.error && !validationState.isValidating && (
        <div className="flex items-center gap-1 text-sm text-red-600">
          <AlertCircle className="h-3 w-3" />
          <span>{validationState.error}</span>
        </div>
      )}
      
      {validationState.warning && !validationState.error && !validationState.isValidating && (
        <div className="flex items-center gap-1 text-sm text-amber-600">
          <AlertTriangle className="h-3 w-3" />
          <span>{validationState.warning}</span>
        </div>
      )}
      
      {validationState.isValid === true && !validationState.isValidating && !validationState.error && (
        <div className="flex items-center gap-1 text-sm text-green-600">
          <CheckCircle2 className="h-3 w-3" />
          <span>Valid</span>
        </div>
      )}
    </div>
  );
}

interface FormErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
}

/**
 * Error boundary specifically for form validation errors
 */
export function FormErrorBoundary({
  children,
  fallback,
  onError
}: FormErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true);
      setError(new Error(event.message));
      onError?.(new Error(event.message));
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setHasError(true);
      setError(new Error(event.reason?.message || 'Unhandled promise rejection'));
      onError?.(new Error(event.reason?.message || 'Unhandled promise rejection'));
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
  };

  if (hasError) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <div className="font-medium">Form Validation Error</div>
            <div className="text-sm">{error?.message || 'An unexpected error occurred'}</div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="h-8"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Try Again
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}

interface ValidationTooltipProps {
  isValid?: boolean | null;
  error?: string;
  warning?: string;
  isValidating?: boolean;
  children: React.ReactNode;
}

/**
 * Tooltip component for showing validation status
 */
export function ValidationTooltip({
  isValid,
  error,
  warning,
  isValidating,
  children
}: ValidationTooltipProps) {
  const getStatusIcon = () => {
    if (isValidating) {
      return <RefreshCw className="h-3 w-3 animate-spin text-gray-400" />;
    }
    if (error) {
      return <AlertCircle className="h-3 w-3 text-red-500" />;
    }
    if (warning) {
      return <AlertTriangle className="h-3 w-3 text-amber-500" />;
    }
    if (isValid === true) {
      return <CheckCircle2 className="h-3 w-3 text-green-500" />;
    }
    return null;
  };

  const getStatusMessage = () => {
    if (isValidating) return 'Validating...';
    if (error) return error;
    if (warning) return warning;
    if (isValid === true) return 'Valid';
    return null;
  };

  const statusIcon = getStatusIcon();
  const statusMessage = getStatusMessage();

  if (!statusIcon || !statusMessage) {
    return <>{children}</>;
  }

  return (
    <div className="relative group">
      {children}
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
        {statusIcon}
      </div>
      <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-10">
        <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
          {statusMessage}
        </div>
      </div>
    </div>
  );
}