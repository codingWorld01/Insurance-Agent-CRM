'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Breadcrumb, createBreadcrumbs } from '@/components/common/Breadcrumb';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PolicyTemplatesError({ error, reset }: ErrorProps) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Policy Templates page error:', error);
  }, [error]);

  const handleGoBack = () => {
    router.push('/dashboard');
  };

  const handleRetry = () => {
    reset();
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={[
        createBreadcrumbs.dashboard(),
        { label: "Policy Templates", current: true }
      ]} />

      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl text-red-600">
            Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            We encountered an error while loading the policy templates page. 
            This might be a temporary issue.
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-50 p-4 rounded-lg text-left">
              <h4 className="font-medium text-gray-900 mb-2">Error Details:</h4>
              <p className="text-sm text-gray-700 font-mono break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-gray-500 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleRetry} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button variant="outline" onClick={handleGoBack} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>

          <div className="text-sm text-gray-500">
            If this problem persists, please contact support.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}