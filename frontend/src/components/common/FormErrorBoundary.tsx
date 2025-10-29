'use client';

import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Save } from 'lucide-react';
import { useToastNotifications } from '@/hooks/useToastNotifications';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  sectionName?: string;
  onRetry?: () => void;
  onSaveProgress?: () => void;
  formData?: any;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class FormErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`FormErrorBoundary caught an error in ${this.props.sectionName || 'form section'}:`, error, errorInfo);
    this.setState({ errorInfo });
    
    // Log error to monitoring service if available
    if (typeof window !== 'undefined' && (window as any).errorLogger) {
      (window as any).errorLogger.logError(error, {
        component: 'FormErrorBoundary',
        section: this.props.sectionName,
        errorInfo,
        formData: this.props.formData
      });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    this.props.onRetry?.();
  };

  handleSaveProgress = () => {
    this.props.onSaveProgress?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center p-6">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">
                Form Section Error
              </CardTitle>
              <CardDescription className="text-gray-600">
                {this.props.sectionName 
                  ? `The ${this.props.sectionName} section encountered an error.`
                  : 'This form section encountered an error.'
                } Your progress has been preserved.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="text-left bg-gray-100 p-3 rounded-md text-sm text-gray-700 max-h-32 overflow-y-auto">
                  <strong>Error:</strong> {this.state.error.message}
                  {this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="cursor-pointer font-medium">Stack Trace</summary>
                      <pre className="mt-1 text-xs whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
              
              <div className="space-y-2">
                <Button 
                  onClick={this.handleRetry}
                  className="w-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Section
                </Button>
                
                {this.props.onSaveProgress && (
                  <Button 
                    variant="outline" 
                    onClick={this.handleSaveProgress}
                    className="w-full"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Current Progress
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                  className="w-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function withFormErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    sectionName?: string;
    fallback?: ReactNode;
    onRetry?: () => void;
    onSaveProgress?: () => void;
  } = {}
) {
  return function WrappedComponent(props: P & { formData?: any }) {
    return (
      <FormErrorBoundary 
        sectionName={options.sectionName}
        fallback={options.fallback}
        onRetry={options.onRetry}
        onSaveProgress={options.onSaveProgress}
        formData={props.formData}
      >
        <Component {...props} />
      </FormErrorBoundary>
    );
  };
}

// Higher-order component for form sections
export function FormSection({ 
  children, 
  sectionName, 
  onRetry, 
  onSaveProgress,
  formData 
}: {
  children: ReactNode;
  sectionName: string;
  onRetry?: () => void;
  onSaveProgress?: () => void;
  formData?: any;
}) {
  return (
    <FormErrorBoundary 
      sectionName={sectionName}
      onRetry={onRetry}
      onSaveProgress={onSaveProgress}
      formData={formData}
    >
      {children}
    </FormErrorBoundary>
  );
}