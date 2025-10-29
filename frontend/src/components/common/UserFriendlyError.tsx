import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Clock, 
  Shield, 
  FileX, 
  Server,
  Bug,
  HelpCircle
} from 'lucide-react';

export interface UserFriendlyErrorProps {
  error: Error | string;
  title?: string;
  onRetry?: () => void;
  onReport?: () => void;
  showRetry?: boolean;
  showReport?: boolean;
  className?: string;
  variant?: 'card' | 'alert' | 'inline';
  size?: 'sm' | 'md' | 'lg';
}

interface ErrorInfo {
  title: string;
  message: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  retryable: boolean;
  reportable: boolean;
  suggestions?: string[];
}

const getErrorInfo = (error: Error | string): ErrorInfo => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorCode = typeof error === 'object' && 'code' in error ? (error as any).code : undefined;
  const errorStatus = typeof error === 'object' && 'status' in error ? (error as any).status : undefined;

  // Network errors
  if (errorCode === 'NETWORK_ERROR' || errorMessage.toLowerCase().includes('network')) {
    return {
      title: 'Connection Problem',
      message: 'Unable to connect to the server. Please check your internet connection.',
      icon: Wifi,
      color: 'text-orange-600',
      retryable: true,
      reportable: false,
      suggestions: [
        'Check your internet connection',
        'Try refreshing the page',
        'Contact support if the problem persists'
      ]
    };
  }

  // Offline errors
  if (errorCode === 'OFFLINE_ERROR' || !navigator.onLine) {
    return {
      title: 'You\'re Offline',
      message: 'No internet connection detected. Please check your connection and try again.',
      icon: WifiOff,
      color: 'text-gray-600',
      retryable: true,
      reportable: false,
      suggestions: [
        'Check your Wi-Fi or mobile data connection',
        'Try moving to an area with better signal',
        'Your changes will be saved when connection is restored'
      ]
    };
  }

  // Timeout errors
  if (errorCode === 'TIMEOUT_ERROR' || errorMessage.toLowerCase().includes('timeout')) {
    return {
      title: 'Request Timed Out',
      message: 'The request took too long to complete. This might be due to a slow connection.',
      icon: Clock,
      color: 'text-yellow-600',
      retryable: true,
      reportable: true,
      suggestions: [
        'Try again with a better internet connection',
        'Large files may take longer to upload',
        'Contact support if timeouts persist'
      ]
    };
  }

  // Authentication/Permission errors
  if (errorStatus === 401 || errorStatus === 403 || errorCode === 'PERMISSION_ERROR') {
    return {
      title: 'Access Denied',
      message: errorStatus === 401 
        ? 'Your session has expired. Please log in again.'
        : 'You don\'t have permission to perform this action.',
      icon: Shield,
      color: 'text-red-600',
      retryable: false,
      reportable: false,
      suggestions: [
        'Try logging out and logging back in',
        'Contact your administrator for access',
        'Refresh the page and try again'
      ]
    };
  }

  // File upload errors
  if (errorCode === 'FILE_TOO_LARGE' || errorMessage.toLowerCase().includes('file size')) {
    return {
      title: 'File Too Large',
      message: 'The selected file exceeds the maximum allowed size.',
      icon: FileX,
      color: 'text-orange-600',
      retryable: false,
      reportable: false,
      suggestions: [
        'Try compressing the file',
        'Use a smaller file (max 10MB)',
        'Contact support for larger file limits'
      ]
    };
  }

  if (errorCode === 'UNSUPPORTED_FILE_TYPE' || errorMessage.toLowerCase().includes('file type')) {
    return {
      title: 'Unsupported File Type',
      message: 'This file type is not supported. Please use PDF, DOC, DOCX, JPG, PNG, or GIF files.',
      icon: FileX,
      color: 'text-orange-600',
      retryable: false,
      reportable: false,
      suggestions: [
        'Convert your file to a supported format',
        'Supported formats: PDF, DOC, DOCX, JPG, PNG, GIF',
        'Contact support if you need other formats'
      ]
    };
  }

  // Validation errors
  if (errorCode === 'VALIDATION_ERROR' || errorMessage.toLowerCase().includes('validation')) {
    return {
      title: 'Invalid Information',
      message: 'Please check your input and correct any errors.',
      icon: AlertTriangle,
      color: 'text-yellow-600',
      retryable: false,
      reportable: false,
      suggestions: [
        'Review the highlighted fields',
        'Make sure all required fields are filled',
        'Check that dates and numbers are in the correct format'
      ]
    };
  }

  // Server errors
  if (errorStatus && errorStatus >= 500) {
    return {
      title: 'Server Error',
      message: 'Something went wrong on our end. Our team has been notified.',
      icon: Server,
      color: 'text-red-600',
      retryable: true,
      reportable: true,
      suggestions: [
        'Try again in a few minutes',
        'The issue is likely temporary',
        'Contact support if the problem persists'
      ]
    };
  }

  // Rate limiting
  if (errorStatus === 429 || errorCode === 'RATE_LIMITED') {
    return {
      title: 'Too Many Requests',
      message: 'You\'re doing that too quickly. Please wait a moment and try again.',
      icon: Clock,
      color: 'text-orange-600',
      retryable: true,
      reportable: false,
      suggestions: [
        'Wait a few seconds before trying again',
        'Avoid rapid repeated actions',
        'Contact support if you need higher limits'
      ]
    };
  }

  // Generic error
  return {
    title: 'Something Went Wrong',
    message: errorMessage || 'An unexpected error occurred. Please try again.',
    icon: Bug,
    color: 'text-red-600',
    retryable: true,
    reportable: true,
    suggestions: [
      'Try refreshing the page',
      'Check your internet connection',
      'Contact support if the problem continues'
    ]
  };
};

export function UserFriendlyError({
  error,
  title,
  onRetry,
  onReport,
  showRetry = true,
  showReport = true,
  className = '',
  variant = 'card',
  size = 'md',
}: UserFriendlyErrorProps) {
  const errorInfo = getErrorInfo(error);
  const Icon = errorInfo.icon;
  
  const displayTitle = title || errorInfo.title;
  const canRetry = showRetry && onRetry && errorInfo.retryable;
  const canReport = showReport && onReport && errorInfo.reportable;

  const sizeClasses = {
    sm: {
      icon: 'h-4 w-4',
      title: 'text-sm font-medium',
      message: 'text-xs',
      button: 'text-xs px-2 py-1',
    },
    md: {
      icon: 'h-5 w-5',
      title: 'text-base font-medium',
      message: 'text-sm',
      button: 'text-sm px-3 py-2',
    },
    lg: {
      icon: 'h-6 w-6',
      title: 'text-lg font-semibold',
      message: 'text-base',
      button: 'text-base px-4 py-2',
    },
  };

  const classes = sizeClasses[size];

  if (variant === 'alert') {
    return (
      <Alert variant="destructive" className={className}>
        <Icon className={`${classes.icon} ${errorInfo.color}`} />
        <div className="flex-1">
          <div className={classes.title}>{displayTitle}</div>
          <AlertDescription className={classes.message}>
            {errorInfo.message}
          </AlertDescription>
          {(canRetry || canReport) && (
            <div className="flex gap-2 mt-3">
              {canRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className={classes.button}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Try Again
                </Button>
              )}
              {canReport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onReport}
                  className={classes.button}
                >
                  <Bug className="h-3 w-3 mr-1" />
                  Report
                </Button>
              )}
            </div>
          )}
        </div>
      </Alert>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200 ${className}`}>
        <Icon className={`${classes.icon} ${errorInfo.color} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <div className={`${classes.title} text-red-900`}>{displayTitle}</div>
          <div className={`${classes.message} text-red-700 mt-1`}>
            {errorInfo.message}
          </div>
          {(canRetry || canReport) && (
            <div className="flex gap-2 mt-2">
              {canRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className={`${classes.button} border-red-300 text-red-700 hover:bg-red-100`}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              )}
              {canReport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onReport}
                  className={`${classes.button} border-red-300 text-red-700 hover:bg-red-100`}
                >
                  <Bug className="h-3 w-3 mr-1" />
                  Report
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Card variant (default)
  return (
    <Card className={`${className}`}>
      <CardHeader className="text-center pb-4">
        <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
          errorInfo.color.includes('red') ? 'bg-red-100' :
          errorInfo.color.includes('orange') ? 'bg-orange-100' :
          errorInfo.color.includes('yellow') ? 'bg-yellow-100' :
          'bg-gray-100'
        }`}>
          <Icon className={`${classes.icon} ${errorInfo.color}`} />
        </div>
        <CardTitle className={classes.title}>{displayTitle}</CardTitle>
        <CardDescription className={classes.message}>
          {errorInfo.message}
        </CardDescription>
      </CardHeader>
      
      {(errorInfo.suggestions || canRetry || canReport) && (
        <CardContent className="space-y-4">
          {errorInfo.suggestions && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">What you can try:</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                {errorInfo.suggestions.map((suggestion, index) => (
                  <li key={index} className="list-disc">
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {(canRetry || canReport) && (
            <div className="flex gap-2 justify-center">
              {canRetry && (
                <Button onClick={onRetry} className={classes.button}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}
              {canReport && (
                <Button 
                  variant="outline" 
                  onClick={onReport}
                  className={classes.button}
                >
                  <Bug className="h-4 w-4 mr-2" />
                  Report Issue
                </Button>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}