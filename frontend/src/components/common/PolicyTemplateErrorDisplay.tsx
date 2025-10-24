"use client";

import { AlertCircle, AlertTriangle, CheckCircle2, Info, X, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ErrorDisplayProps {
  errors?: Record<string, string>;
  warnings?: Record<string, string>;
  className?: string;
  showFieldNames?: boolean;
  onRetry?: () => void;
  retryable?: boolean;
  loading?: boolean;
}

/**
 * Enhanced error display component for policy template validation errors
 */
export function PolicyTemplateErrorDisplay({
  errors = {},
  warnings = {},
  className,
  showFieldNames = false,
  onRetry,
  retryable = false,
  loading = false
}: ErrorDisplayProps) {
  const hasErrors = Object.keys(errors).length > 0;
  const hasWarnings = Object.keys(warnings).length > 0;

  if (!hasErrors && !hasWarnings) {
    return null;
  }

  const formatFieldName = (field: string): string => {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/Id$/, ' ID');
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Error Messages */}
      {hasErrors && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium">Please fix the following errors:</div>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {Object.entries(errors).map(([field, message]) => (
                  <li key={field}>
                    {showFieldNames && (
                      <span className="font-medium">{formatFieldName(field)}: </span>
                    )}
                    {message}
                  </li>
                ))}
              </ul>
              {retryable && onRetry && (
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRetry}
                    disabled={loading}
                    className="h-8"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Retry
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Warning Messages */}
      {hasWarnings && (
        <Alert variant="default" className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium text-amber-800">Please review the following:</div>
              <ul className="list-disc list-inside space-y-1 text-sm text-amber-700">
                {Object.entries(warnings).map(([field, message]) => (
                  <li key={field}>
                    {showFieldNames && (
                      <span className="font-medium">{formatFieldName(field)}: </span>
                    )}
                    {message}
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

interface FieldErrorProps {
  error?: string;
  warning?: string;
  className?: string;
  showIcon?: boolean;
}

/**
 * Individual field error display component
 */
export function FieldErrorDisplay({
  error,
  warning,
  className,
  showIcon = true
}: FieldErrorProps) {
  if (!error && !warning) {
    return null;
  }

  return (
    <div className={cn("space-y-1", className)}>
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          {showIcon && <AlertCircle className="h-3 w-3 flex-shrink-0" />}
          <span>{error}</span>
        </p>
      )}
      {warning && !error && (
        <p className="text-sm text-amber-600 flex items-center gap-1">
          {showIcon && <AlertTriangle className="h-3 w-3 flex-shrink-0" />}
          <span>{warning}</span>
        </p>
      )}
    </div>
  );
}

interface ValidationStatusProps {
  isValid?: boolean | null;
  isChecking?: boolean;
  message?: string;
  error?: string;
  className?: string;
}

/**
 * Validation status indicator component
 */
export function ValidationStatusIndicator({
  isValid,
  isChecking,
  message,
  error,
  className
}: ValidationStatusProps) {
  if (isChecking) {
    return (
      <div className={cn("flex items-center gap-1 text-sm text-gray-500", className)}>
        <RefreshCw className="h-3 w-3 animate-spin" />
        <span>Checking...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex items-center gap-1 text-sm text-red-600", className)}>
        <AlertCircle className="h-3 w-3" />
        <span>{error}</span>
      </div>
    );
  }

  if (isValid === true && message) {
    return (
      <div className={cn("flex items-center gap-1 text-sm text-green-600", className)}>
        <CheckCircle2 className="h-3 w-3" />
        <span>{message}</span>
      </div>
    );
  }

  if (isValid === false && message) {
    return (
      <div className={cn("flex items-center gap-1 text-sm text-red-600", className)}>
        <AlertCircle className="h-3 w-3" />
        <span>{message}</span>
      </div>
    );
  }

  return null;
}

interface NetworkErrorProps {
  error: unknown;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

/**
 * Network error display component with retry functionality
 */
export function NetworkErrorDisplay({
  error,
  onRetry,
  onDismiss,
  className
}: NetworkErrorProps) {
  const errorObj = error as Record<string, unknown>;
  const isNetworkError = errorObj?.code === 'NETWORK_ERROR' || 
                        (typeof errorObj?.message === 'string' && errorObj.message.includes('network')) ||
                        (typeof errorObj?.message === 'string' && errorObj.message.includes('fetch'));
  
  const isServerError = (typeof errorObj?.status === 'number' && errorObj.status >= 500) || 
                       (typeof errorObj?.code === 'string' && errorObj.code.startsWith('HTTP_5'));
  const isRetryable = errorObj?.retryable || isNetworkError || isServerError;

  return (
    <Alert variant="destructive" className={cn("", className)}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="font-medium mb-1">
              {isNetworkError ? 'Connection Error' : 'Error'}
            </div>
            <div className="text-sm">
              {(typeof errorObj?.message === 'string' ? errorObj.message : null) || 'An unexpected error occurred'}
            </div>
            {errorObj?.code && typeof errorObj.code === 'string' && (
              <Badge variant="outline" className="mt-2 text-xs">
                {errorObj.code}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 ml-4">
            {isRetryable && onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="h-8"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="h-8 w-8 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}

interface FormValidationSummaryProps {
  errors: Record<string, string>;
  warnings: Record<string, string>;
  isSubmitting?: boolean;
  onFieldFocus?: (field: string) => void;
  className?: string;
}

/**
 * Form validation summary component
 */
export function FormValidationSummary({
  errors,
  warnings,
  isSubmitting,
  onFieldFocus,
  className
}: FormValidationSummaryProps) {
  const errorCount = Object.keys(errors).length;
  const warningCount = Object.keys(warnings).length;

  if (errorCount === 0 && warningCount === 0) {
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
      {errorCount > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">
                {errorCount === 1 ? '1 error' : `${errorCount} errors`} found:
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

      {warningCount > 0 && (
        <Alert variant="default" className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium text-amber-800">
                {warningCount === 1 ? '1 warning' : `${warningCount} warnings`}:
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

      {isSubmitting && errorCount > 0 && (
        <Alert variant="default" className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Please fix the errors above before submitting the form.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}